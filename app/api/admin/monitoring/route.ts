// File Path: app/api/admin/monitoring/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyPayload, COOKIE_NAME } from "@/lib/session";
import { getAllAdminUsers } from "@/lib/adminUsersStorage";
import {
  recordSubAdminActivity,
  getSubAdminMonitoringSnapshot,
  MonitorEventType,
} from "@/lib/subAdminMonitor";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

async function resolveCurrentSessionUser(req: NextRequest) {
  try {
    const token =
      req.cookies.get(COOKIE_NAME)?.value ||
      req.cookies.get("axon_admin_session")?.value;
    if (!token) return null;
    const session = await verifyPayload(token);
    if (!session) return null;

    const sessionAny = session as any;
    const allUsers = await getAllAdminUsers();
    const uname = String(sessionAny.username || "").trim().toLowerCase();
    const uid = String(sessionAny.userId || sessionAny.id || "").trim();

    let found = allUsers.find(
      (u) =>
        (uname && u.username.toLowerCase() === uname) ||
        (uid && String(u.id) === uid)
    );
    if (!found && sessionAny.role === "superadmin") {
      found = allUsers.find((u) => u.role === "superadmin");
    }

    return {
      username: found?.username || sessionAny.username || "admin",
      full_name: found?.full_name || sessionAny.username || "مدیر سیستم",
      role: found?.role || sessionAny.role || "superadmin",
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const currentUser = await resolveCurrentSessionUser(req);
  if (!currentUser || currentUser.role !== "superadmin") {
    return NextResponse.json(
      {
        success: false,
        message: "⛔ دسترسی غیرمجاز! بخش نظارت زنده بر مدیران منحصراً در اختیار مدیر ارشد است.",
      },
      { status: 403 }
    );
  }

  try {
    const [allUsers, snapshot] = await Promise.all([
      getAllAdminUsers(),
      getSubAdminMonitoringSnapshot(),
    ]);

    const nowMs = Date.now();

    const monitoredUsers = allUsers.map((u) => {
      const key = u.username.toLowerCase();
      const p = snapshot.presenceMap[key];
      const lastActiveMs = p?.lastActiveAt ? new Date(p.lastActiveAt).getTime() : 0;
      const secondsAgo = lastActiveMs > 0 ? Math.max(0, Math.floor((nowMs - lastActiveMs) / 1000)) : null;
      const isOnline = secondsAgo !== null && secondsAgo < 45;

      const sectionVisitsObj = p?.sectionVisits || {};
      const topSections = Object.entries(sectionVisitsObj)
        .map(([title, count]) => ({ title, count: Number(count || 0) }))
        .sort((a, b) => b.count - a.count);

      return {
        id: u.id,
        username: u.username,
        full_name: u.full_name || u.username,
        role: u.role,
        permissions: u.permissions || [],
        ui_theme: u.ui_theme || "dark",
        isOnline,
        secondsAgo,
        currentPath: p?.currentPath || "—",
        currentSectionTitle: p?.currentSectionTitle || "هنوز وارد نشده",
        currentSubTab: p?.currentSubTab || "—",
        lastActionDetails: p?.lastActionDetails || "بدون فعالیت ثبت‌شده",
        ip: p?.ip || "—",
        os: p?.os || "—",
        browser: p?.browser || "—",
        deviceType: p?.deviceType || "—",
        screenResolution: p?.screenResolution || "—",
        lastActiveAt: p?.lastActiveAt || null,
        lastLoginAt: p?.lastLoginAt || null,
        totalLogins: Number(p?.totalLogins || 0),
        totalPageViews: Number(p?.totalPageViews || 0),
        totalClicks: Number(p?.totalClicks || 0),
        totalActions: Number(p?.totalActions || 0),
        totalBlocked: Number(p?.totalBlocked || 0),
        topSections,
      };
    });

    const onlineCount = monitoredUsers.filter((u) => u.isOnline).length;
    const subAdminsCount = monitoredUsers.filter((u) => u.role !== "superadmin").length;
    const totalEventsCount = snapshot.events.length;
    const totalBlockedCount = snapshot.events.filter(
      (e) => e.eventType === "action_blocked"
    ).length;

    return NextResponse.json(
      {
        success: true,
        serverTime: new Date().toISOString(),
        summary: {
          totalUsers: monitoredUsers.length,
          subAdminsCount,
          onlineCount,
          totalEventsCount,
          totalBlockedCount,
        },
        users: monitoredUsers,
        events: snapshot.events,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const currentUser = await resolveCurrentSessionUser(req);
  if (!currentUser) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    if (body.action === "clear_logs") {
      if (currentUser.role !== "superadmin") {
        return NextResponse.json({ success: false }, { status: 403 });
      }
      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          subadmin_monitoring_ledger: {
            presenceMap: layoutCfg.subadmin_monitoring_ledger?.presenceMap || {},
            events: [],
            updatedAt: new Date().toISOString(),
          },
        },
        {}
      );
      return NextResponse.json({
        success: true,
        message: "✓ تاریخچه ریز فعالیت‌ها پاکسازی شد.",
      });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const ua = req.headers.get("user-agent") || "";

    const eventType: MonitorEventType = body.eventType || "page_view";
    const targetPath = String(body.path || "/admin/dashboard");
    const details = String(body.details || "");

    await recordSubAdminActivity({
      username: currentUser.username,
      full_name: currentUser.full_name,
      role: currentUser.role,
      eventType,
      path: targetPath,
      subTab: body.subTab ? String(body.subTab) : undefined,
      method: body.method || "VIEW",
      details,
      ip,
      screenResolution: body.screenResolution ? String(body.screenResolution) : undefined,
      userAgent: ua,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

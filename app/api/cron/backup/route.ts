// File Path: app/api/cron/backup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { buildFullSiteSnapshot } from "@/app/api/admin/backup/route";
import { logAuditEvent } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET;
    const isCronAuthorized = Boolean(
      cronSecret && authHeader === "Bearer " + cronSecret
    );
    const adminSession = await verifyAdminSession(req);

    if (!adminSession && !isCronAuthorized) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز." },
        { status: 401 }
      );
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const [snapshot, siteRow] = await Promise.all([
      buildFullSiteSnapshot(),
      getMasterSiteInfoRow(),
    ]);

    const layoutCfg = siteRow?.homepage_layout_config || {};
    const authCfg = layoutCfg.auth_security_config || {};
    const history = Array.isArray(authCfg.backup_history)
      ? [...authCfg.backup_history]
      : [];
    const existsToday = history.some((h: any) => h.dateKey === todayKey);

    let latestNum =
      history.length > 0
        ? Math.max(...history.map((h: any) => Number(h.backupNumber || 100)))
        : 100;

    if (!existsToday) {
      latestNum += 1;
      const entry = {
        backupNumber: latestNum,
        id: "BKP-" + latestNum + "-" + todayKey,
        dateKey: todayKey,
        createdAt: new Date().toISOString(),
        type: "auto_daily" as const,
        totalRecords: snapshot.totalRecords,
        counts: snapshot.counts,
      };
      const updatedHistory = [entry, ...history].slice(0, 30);

      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          auth_security_config: {
            ...authCfg,
            backup_history: updatedHistory,
            latest_backup_number: latestNum,
            latest_backup_at: entry.createdAt,
          },
        },
        {}
      );

      await logAuditEvent({
        action: "AUTO_DAILY_BACKUP_CREATED",
        target_resource: "cron:backup",
        target_id: entry.id,
        admin_username: "system_cron",
        details: {
          backupNumber: latestNum,
          totalRecords: snapshot.totalRecords,
        },
      });
    }

    return NextResponse.json({
      success: true,
      backupNumber: latestNum,
      dateKey: todayKey,
      totalRecords: snapshot.totalRecords,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
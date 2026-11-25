// File Path: app/api/admin/change-pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { authSecurity } from "@/lib/authSecurity";
import { rateLimiter } from "@/lib/rateLimiter";
import {
  getAllAdminUsers,
  saveAdminUsersRegistry,
  hashAdminPassword,
  verifyAdminPassword,
} from "@/lib/adminUsersStorage";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateCheck = await rateLimiter.checkLimit(
      clientIp,
      "admin_change_pin",
      8,
      15
    );
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "تعداد تلاش‌های تغییر رمز بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.",
        },
        { status: 429 }
      );
    }

    const session: any = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز. لطفاً مجدداً وارد شوید." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const currentPassword = String(body.currentPin || body.currentPassword || "").trim();
    const newPassword = String(body.newPin || body.newPassword || "").trim();
    const sessionUsername = String(session.username || "admin").trim().toLowerCase();
    const targetUsername = body.targetUsername
      ? String(body.targetUsername).trim().toLowerCase()
      : sessionUsername;

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        {
          success: false,
          message: "رمز عبور یا پین جدید باید حداقل ۴ کاراکتر باشد.",
        },
        { status: 400 }
      );
    }

    const isChangingOtherUser = targetUsername !== sessionUsername;
    if (isChangingOtherUser && session.role !== "superadmin") {
      return NextResponse.json(
        {
          success: false,
          message: "⛔ تغییر رمز سایر مدیران منحصراً در اختیار مدیر ارشد کل سیستم است.",
        },
        { status: 403 }
      );
    }

    const allUsers = await getAllAdminUsers();
    const registryIdx = allUsers.findIndex(
      (u) => u.username.toLowerCase() === targetUsername
    );

    const { data: dbUserRecord } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .ilike("username", targetUsername)
      .maybeSingle();

    const siteRow = await getMasterSiteInfoRow();
    const secCfg = siteRow?.homepage_layout_config?.auth_security_config || {};
    const configuredMasterPin = String(
      secCfg.adminPin ||
        secCfg.adminDeck?.pin ||
        process.env.ADMIN_MASTER_PIN ||
        ""
    ).trim();
    const configuredMasterPass = String(
      secCfg.adminPassword || process.env.ADMIN_PASSWORD || ""
    ).trim();

    const hasExistingCredential = Boolean(
      (registryIdx !== -1 && allUsers[registryIdx].password_hash) ||
        dbUserRecord?.password_hash ||
        dbUserRecord?.password ||
        (session.role === "superadmin" && (configuredMasterPin || configuredMasterPass))
    );

    if (!isChangingOtherUser && hasExistingCredential) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: "وارد کردن رمز عبور یا پین فعلی الزامی است." },
          { status: 400 }
        );
      }

      let currentValid = false;

      if (registryIdx !== -1 && allUsers[registryIdx].password_hash) {
        if (verifyAdminPassword(currentPassword, allUsers[registryIdx].password_hash)) {
          currentValid = true;
        }
      }

      if (!currentValid && dbUserRecord) {
        const storedDbHash = dbUserRecord.password_hash || dbUserRecord.password;
        if (
          storedDbHash &&
          (authSecurity.verifyPassword(currentPassword, storedDbHash) ||
            currentPassword === storedDbHash)
        ) {
          currentValid = true;
        }
      }

      if (!currentValid && session.role === "superadmin") {
        if (
          (configuredMasterPin && currentPassword === configuredMasterPin) ||
          (configuredMasterPass && currentPassword === configuredMasterPass)
        ) {
          currentValid = true;
        }
      }

      if (!currentValid) {
        return NextResponse.json(
          { success: false, message: "رمز عبور یا پین فعلی وارد شده صحیح نیست." },
          { status: 400 }
        );
      }
    }

    const pbkdf2Hash = hashAdminPassword(newPassword);
    const legacyHash = authSecurity.hashPassword(newPassword);
    const nowIso = new Date().toISOString();

    if (registryIdx !== -1) {
      allUsers[registryIdx] = {
        ...allUsers[registryIdx],
        password_hash: pbkdf2Hash,
        updated_at: nowIso,
      };
    } else {
      allUsers.push({
        id: dbUserRecord?.id || "admin-" + Date.now(),
        username: targetUsername,
        full_name: dbUserRecord?.full_name || session.full_name || targetUsername,
        role: dbUserRecord?.role || session.role || "superadmin",
        permissions:
          (dbUserRecord?.role || session.role) === "superadmin" ? ["all"] : ["dashboard"],
        ui_theme: "dark",
        password_hash: pbkdf2Hash,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }
    await saveAdminUsersRegistry(allUsers);

    if (
      targetUsername === "admin" ||
      (registryIdx !== -1 && allUsers[registryIdx].role === "superadmin")
    ) {
      try {
        const latestSiteRow = await getMasterSiteInfoRow();
        const layoutCfg = latestSiteRow?.homepage_layout_config || {};
        const prevSec = layoutCfg.auth_security_config || {};
        await saveMasterSiteInfoRow(
          latestSiteRow,
          {
            ...layoutCfg,
            auth_security_config: {
              ...prevSec,
              adminPassword: newPassword,
              adminPin: newPassword,
              adminDeck: {
                ...(prevSec.adminDeck || {}),
                pin: newPassword,
              },
            },
          },
          {}
        );
      } catch {}
    }

    try {
      if (dbUserRecord && dbUserRecord.id) {
        const { error: uErr } = await supabaseAdmin
          .from("admin_users")
          .update({ password: legacyHash, password_hash: pbkdf2Hash })
          .eq("id", dbUserRecord.id);
        if (uErr) {
          await supabaseAdmin
            .from("admin_users")
            .update({ password: legacyHash })
            .eq("id", dbUserRecord.id);
        }
      } else {
        await supabaseAdmin.from("admin_users").insert([
          {
            username: targetUsername,
            password: legacyHash,
            full_name: session.full_name || targetUsername,
            role: session.role || "superadmin",
            created_at: nowIso,
          },
        ]);
      }
    } catch {}

    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: "CHANGE_ADMIN_PASSWORD",
          user_id: session.username || "admin",
          details: { role: session.role, target: targetUsername },
          ip_address: clientIp,
          severity: "info",
          created_at: nowIso,
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      message:
        "✓ رمز عبور / پین جدید برای حساب «@" +
        targetUsername +
        "» به صورت رمزنگاری‌شده در تمامی لایه‌های دیتابیس ذخیره و فعال گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در تغییر رمز عبور." },
      { status: 500 }
    );
  }
}
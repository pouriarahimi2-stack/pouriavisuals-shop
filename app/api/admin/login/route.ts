// File Path: app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload, COOKIE_NAME } from "@/lib/session";
import { authSecurity } from "@/lib/authSecurity";
import { rateLimiter } from "@/lib/rateLimiter";
import {
  getAllAdminUsers,
  verifySubAdminCredentials,
} from "@/lib/adminUsersStorage";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { recordSubAdminActivity } from "@/lib/subAdminMonitor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "";

  try {
    const rateStatus = authSecurity.checkRateLimit(clientIp);
    const dbRate = await rateLimiter.checkLimit(
      clientIp,
      "admin_login_attempt",
      12,
      15
    );

    if (!rateStatus.allowed || !dbRate.allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً " +
            (rateStatus.waitMinutes || 15) +
            " دقیقه دیگر تلاش کنید.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const cleanUsername = String(body.username || body.email || "")
      .trim()
      .toLowerCase();
    const cleanPassword = String(body.password || body.pin || "").trim();

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, message: "نام کاربری و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    // ۱. بررسی در رجیستری مرکزی مدیران و زیرمجموعه‌ها
    const subUserMatch = await verifySubAdminCredentials(
      cleanUsername,
      cleanPassword
    );

    if (subUserMatch) {
      authSecurity.resetAttempts(clientIp);

      recordSubAdminActivity({
        username: subUserMatch.username,
        full_name: subUserMatch.full_name,
        role: subUserMatch.role,
        eventType: "login",
        path: "/admin/login",
        method: "LOGIN",
        details: "🔑 ورود موفق به پنل مدیریت با نقش " + subUserMatch.role,
        ip: clientIp,
        userAgent,
      }).catch(() => {});

      const resolvedTheme = subUserMatch.ui_theme === "light" ? "light" : "dark";
      const token = await signPayload({
        id: String(subUserMatch.id),
        userId: String(subUserMatch.id),
        username: subUserMatch.username,
        full_name: subUserMatch.full_name || subUserMatch.username,
        role: subUserMatch.role,
        permissions: subUserMatch.permissions,
        ui_theme: resolvedTheme,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      });

      const res = NextResponse.json({
        success: true,
        authenticated: true,
        message: "ورود موفقیت‌آمیز بود.",
        token,
        user: {
          id: subUserMatch.id,
          username: subUserMatch.username,
          full_name: subUserMatch.full_name,
          role: subUserMatch.role,
          permissions: subUserMatch.permissions,
          ui_theme: resolvedTheme,
        },
      });

      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      res.cookies.set("admin_logged_in", "true", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      return res;
    }

    // ۲. بررسی در جدول admin_users دیتابیس
    const { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .ilike("username", cleanUsername)
      .maybeSingle();

    const allRegistryUsers = await getAllAdminUsers();
    const matchedRegUser = allRegistryUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );

    if (adminUser) {
      const storedHash = adminUser.password_hash || adminUser.password;
      const isValid =
        Boolean(storedHash) &&
        (authSecurity.verifyPassword(cleanPassword, storedHash) ||
          storedHash === cleanPassword);

      if (isValid) {
        authSecurity.resetAttempts(clientIp);
        const resolvedRole =
          matchedRegUser?.role || adminUser.role || "superadmin";
        const resolvedPerms =
          resolvedRole === "superadmin"
            ? ["all"]
            : matchedRegUser?.permissions || ["dashboard"];
        const resolvedTheme =
          matchedRegUser?.ui_theme === "light" ? "light" : "dark";

        recordSubAdminActivity({
          username: adminUser.username,
          full_name:
            matchedRegUser?.full_name ||
            adminUser.full_name ||
            adminUser.username,
          role: resolvedRole,
          eventType: "login",
          path: "/admin/login",
          method: "LOGIN",
          details: "🔑 ورود موفق به پنل مدیریت با نقش " + resolvedRole,
          ip: clientIp,
          userAgent,
        }).catch(() => {});

        const token = await signPayload({
          id: String(adminUser.id),
          userId: String(adminUser.id),
          username: adminUser.username,
          full_name:
            matchedRegUser?.full_name ||
            adminUser.full_name ||
            adminUser.username,
          role: resolvedRole,
          permissions: resolvedPerms,
          ui_theme: resolvedTheme,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        });

        const res = NextResponse.json({
          success: true,
          authenticated: true,
          message: "ورود موفقیت‌آمیز بود.",
          token,
          user: {
            id: adminUser.id,
            username: adminUser.username,
            full_name:
              matchedRegUser?.full_name ||
              adminUser.full_name ||
              adminUser.username,
            role: resolvedRole,
            permissions: resolvedPerms,
            ui_theme: resolvedTheme,
          },
        });

        res.cookies.set(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
        res.cookies.set("admin_logged_in", "true", {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
        return res;
      }
    }

    // ۳. بررسی پین/رمز تنظیم‌شده در تنظیمات امنیت پنل یا متغیرهای محیطی (بدون رمز پشتیبان هاردکد)
    if (cleanUsername === "admin" || cleanUsername === "superadmin") {
      const siteRow = await getMasterSiteInfoRow();
      const secCfg =
        siteRow?.homepage_layout_config?.auth_security_config || {};
      const configuredPin = String(
        secCfg.adminPin ||
          secCfg.adminDeck?.pin ||
          process.env.ADMIN_MASTER_PIN ||
          ""
      ).trim();
      const configuredPass = String(
        secCfg.adminPassword || process.env.ADMIN_PASSWORD || ""
      ).trim();

      const matchesConfiguredSecret =
        (configuredPin.length >= 4 && cleanPassword === configuredPin) ||
        (configuredPass.length >= 6 && cleanPassword === configuredPass);

      if (matchesConfiguredSecret) {
        authSecurity.resetAttempts(clientIp);
        const superRecord = allRegistryUsers.find(
          (u) => u.role === "superadmin" || u.username.toLowerCase() === "admin"
        );
        const superTheme = superRecord?.ui_theme === "light" ? "light" : "dark";

        const token = await signPayload({
          id: superRecord?.id || "master-superadmin",
          userId: superRecord?.id || "master-superadmin",
          username: superRecord?.username || "admin",
          full_name: superRecord?.full_name || "مدیر ارشد کل سیستم",
          role: "superadmin",
          permissions: ["all"],
          ui_theme: superTheme,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        });

        const res = NextResponse.json({
          success: true,
          authenticated: true,
          message: "ورود مدیر ارشد موفقیت‌آمیز بود.",
          token,
          user: {
            id: superRecord?.id || "master-superadmin",
            username: superRecord?.username || "admin",
            full_name: superRecord?.full_name || "مدیر ارشد کل سیستم",
            role: "superadmin",
            permissions: ["all"],
            ui_theme: superTheme,
          },
        });

        res.cookies.set(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
        res.cookies.set("admin_logged_in", "true", {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
        return res;
      }
    }

    authSecurity.recordFailedAttempt(clientIp);
    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: "ADMIN_LOGIN_FAILED",
          user_id: cleanUsername,
          details: { resource: "admin:auth", ip: clientIp },
          ip_address: clientIp,
          severity: "warning",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json(
      { success: false, message: "نام کاربری یا رمز عبور اشتباه است." },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور در احراز هویت." },
      { status: 500 }
    );
  }
}
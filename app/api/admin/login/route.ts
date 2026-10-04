import { verifySubAdminCredentials } from "@/lib/adminUsersStorage";
// File Path: app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload, COOKIE_NAME } from "@/lib/session";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  try {
    const rateStatus = authSecurity.checkRateLimit(clientIp);
    if (!rateStatus.allowed) {
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
    const subUserMatch = await verifySubAdminCredentials(
      body.username || body.email || "",
      body.password || body.pin || ""
    );
    if (subUserMatch) {
      const token = await signPayload({
        userId: subUserMatch.id,
        username: subUserMatch.username,
        role: subUserMatch.role as any,
        permissions: subUserMatch.permissions,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
      } as any);
      const res = NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: subUserMatch.id,
          username: subUserMatch.username,
          full_name: subUserMatch.full_name,
          role: subUserMatch.role,
          permissions: subUserMatch.permissions,
        },
      });
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 12,
      });
      return res;
    }
    const cleanUsername = String(body.username || "").trim().toLowerCase();
    const cleanPassword = String(body.password || "").trim();

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, message: "نام کاربری و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    const { data: adminUser, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (error || !adminUser) {
      authSecurity.recordFailedAttempt(clientIp);
      return NextResponse.json(
        { success: false, message: "نام کاربری یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    const storedHash = adminUser.password_hash || adminUser.password;
    const isValid =
      authSecurity.verifyPassword(cleanPassword, storedHash) ||
      storedHash === cleanPassword;

    if (!isValid) {
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
    }

    authSecurity.resetAttempts(clientIp);

    const token = await signPayload({
      id: String(adminUser.id),
      username: adminUser.username,
      full_name: adminUser.full_name || adminUser.username,
      role: adminUser.role || "superadmin",
    });

    const res = NextResponse.json({
      success: true,
      message: "ورود موفقیت‌آمیز بود.",
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role || "superadmin",
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور در احراز هویت." },
      { status: 500 }
    );
  }
}

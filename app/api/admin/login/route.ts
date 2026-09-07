// File Path: app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload } from "@/lib/session";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "local_admin";
    const rateCheck = authSecurity.checkRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `به دلیل تلاش‌های ناموفق متعدد، دسترسی شما به مدت ${rateCheck.waitMinutes} دقیقه مسدود شد.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const pinOrPassword = String(body.password || body.pin || "").trim();
    const username = String(body.username || "admin").trim().toLowerCase();

    if (!pinOrPassword) {
      return NextResponse.json({ success: false, message: "کلمه عبور یا پین امنیتی الزامی است." }, { status: 400 });
    }

    let adminUser: any = null;

    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      adminUser = data;

      // در صورتی که جدول ادمین در اولین راه‌اندازی خالی بود:
      if (!adminUser && username === "admin") {
        const { data: allAdmins } = await supabaseAdmin.from("admin_users").select("id").limit(1);
        if (!allAdmins || allAdmins.length === 0) {
          const defaultPassword = pinOrPassword.length >= 4 ? pinOrPassword : "admin";
          const { data: created } = await supabaseAdmin
            .from("admin_users")
            .insert({
              username: "admin",
              password: authSecurity.hashPassword(defaultPassword),
              full_name: "مدیر ارشد آکسون",
              role: "superadmin",
            })
            .select()
            .single();
          adminUser = created;
        }
      }
    }

    if (!adminUser) {
      authSecurity.recordFailedAttempt(clientIp);
      return NextResponse.json({ success: false, message: "کاربری با این مشخصات یافت نشد." }, { status: 401 });
    }

    const isMatched = authSecurity.verifyPassword(pinOrPassword, adminUser.password || adminUser.password_hash || "");

    if (!isMatched) {
      authSecurity.recordFailedAttempt(clientIp);
      return NextResponse.json({ success: false, message: "کلمه عبور یا پین‌کد وارد شده نادرست است." }, { status: 401 });
    }

    authSecurity.resetAttempts(clientIp);

    const token = signPayload({
      id: String(adminUser.id),
      username: adminUser.username,
      role: adminUser.role || "superadmin",
      full_name: adminUser.full_name || adminUser.username,
    });

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
      redirectUrl: "/admin",
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role || "superadmin",
        full_name: adminUser.full_name || "مدیر سیستم",
      },
    });

    response.cookies.set("admin_session_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set("pv_admin_session", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای پردازش سرور." }, { status: 500 });
  }
}

// File Path: app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload } from "@/lib/session";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "local-ip";
    
    // ۱. بررسی امنیتی بروت‌فورس
    const rateCheck = authSecurity.checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ${rateCheck.waitMinutes} دقیقه دیگر تلاش کنید.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "نام کاربری و کلمه عبور الزامی است." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();

    let isValid = false;
    let userPayload: any = null;

    // ۲. استعلام امن از جدول admin_users در Supabase
    if (supabaseAdmin) {
      const { data: dbAdmin } = await supabaseAdmin
        .from("admin_users")
        .select("id, username, password, full_name, role")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (dbAdmin && dbAdmin.password) {
        isValid = authSecurity.verifyPassword(cleanPassword, dbAdmin.password);
        if (isValid) {
          userPayload = {
            id: String(dbAdmin.id),
            username: dbAdmin.username,
            full_name: dbAdmin.full_name || dbAdmin.username,
            role: dbAdmin.role || "superadmin",
          };

          // ارتقای خودکار پسورد متنی قدیمی به هش امن در صورت نیاز
          if (!String(dbAdmin.password).includes(":")) {
            const upgradedHash = authSecurity.hashPassword(cleanPassword);
            supabaseAdmin.from("admin_users").update({ password: upgradedHash }).eq("id", dbAdmin.id).catch(() => {});
          }
        }
      }
    }

    // ۳. بررسی متغیرهای محیطی با پسورد امن .env در صورت ست شدن
    if (!isValid) {
      const envAdminUser = process.env.ADMIN_USERNAME;
      const envAdminPass = process.env.ADMIN_PASSWORD;

      if (envAdminUser && envAdminPass && cleanUsername === envAdminUser && cleanPassword === envAdminPass) {
        isValid = true;
        userPayload = {
          id: "admin_master",
          username: cleanUsername,
          full_name: "مدیر ارشد سیستم",
          role: "superadmin",
        };
      }
    }

    // ۴. نتیجه احراز هویت
    if (isValid && userPayload) {
      authSecurity.resetAttempts(clientIp);

      const sessionToken = signPayload({
        ...userPayload,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // انقضای معتبر ۷ روزه
        timestamp: Date.now(),
      });

      const response = NextResponse.json({
        success: true,
        user: userPayload,
        message: "ورود امن با موفقیت انجام شد.",
      });

      response.cookies.set("admin_session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      response.cookies.set("pv_admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // ثبت تلاش ناموفق برای جلوگیری از حدس پسورد
    authSecurity.recordFailedAttempt(clientIp);

    return NextResponse.json(
      { success: false, message: "نام کاربری یا کلمه عبور وارد شده نادرست است." },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Login Route Security Error:", error);
    return NextResponse.json(
      { success: false, message: "خطای امنیتی در اعتبارسنجی ورود." },
      { status: 500 }
    );
  }
}
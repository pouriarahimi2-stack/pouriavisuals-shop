import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload, COOKIE_NAME } from "@/lib/session";
import { authSecurity } from "@/lib/authSecurity";
import { checkRateLimit } from "@/lib/rateLimiter";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : (req.headers.get("x-real-ip") || "127.0.0.1");

    // محافظت در برابر حملات Brute-force با استفاده از Rate Limiter دیتابیس
    const rateCheck = await checkRateLimit(clientIp, "admin_login", 5, 15);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        success: false,
        message: "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.",
      }, { status: 429 });
    }

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: "نام کاربری و کلمه عبور الزامی است.",
      }, { status: 400 });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // استعلام کاربر ادمین از دیتابیس
    const { data: adminUser, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (error || !adminUser) {
      return NextResponse.json({
        success: false,
        message: "نام کاربری یا رمز عبور اشتباه است.",
      }, { status: 401 });
    }

    // اعتبارسنجی رمز عبور (پشتیبانی از هش و مقایسه امن)
    const storedHash = adminUser.password_hash || adminUser.password;
    const isPasswordValid = authSecurity.verifyPassword(cleanPassword, storedHash);

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: "نام کاربری یا رمز عبور اشتباه است.",
      }, { status: 401 });
    }

    // صدور توکن امن نشست ادمین
    const token = await signPayload({
      id: adminUser.id,
      username: adminUser.username,
      full_name: adminUser.full_name || adminUser.username,
      role: adminUser.role || "superadmin",
    });

    const res = NextResponse.json({
      success: true,
      message: "ورود موفقیت‌آمیز بود.",
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
      maxAge: 60 * 60 * 24 * 7, // ۷ روز
      path: "/",
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message || "خطای سرور در فرآیند احراز هویت.",
    }, { status: 500 });
  }
}

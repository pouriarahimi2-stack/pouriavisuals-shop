import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function logAudit(req: NextRequest, action: string, username: string, status: "SUCCESS" | "FAILED", reason?: string) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "local";

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_username: username || "unknown",
      action,
      target_resource: "auth:session",
      details: {
        status,
        reason,
        userAgent: req.headers.get("user-agent")?.slice(0, 100),
      },
      ip_address: clientIp,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[AUDIT_AUTH_LOG_ERROR]:", err);
  }
}

// ۱. بررسی وضعیت سشن کنونی ادمین (GET)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_session_token")?.value;
    if (!token || token.length < 20) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: "admin",
        role: "superadmin",
        permissions: ["all"],
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// ۲. ورود به پنل و ایجاد سشن امن (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "نام کاربری و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    const expectedUser = process.env.ADMIN_USERNAME || "admin";
    const expectedPass = process.env.ADMIN_PASSWORD || "admin123";

    // بررسی تطابق اطلاعات کاربری
    const isUserValid = cleanUsername === expectedUser;
    const isPassValid = String(password) === expectedPass;

    if (!isUserValid || !isPassValid) {
      await logAudit(req, "ADMIN_LOGIN_FAILED", cleanUsername, "FAILED", "Invalid credentials");
      return NextResponse.json(
        { success: false, message: "نام کاربری یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    // تولید توکن تصادفی با امضای زمانی
    const sessionToken = `axon_sec_${Date.now()}_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;

    await logAudit(req, "ADMIN_LOGIN_SUCCESS", cleanUsername, "SUCCESS");

    const response = NextResponse.json({
      success: true,
      user: {
        username: cleanUsername,
        role: "superadmin",
      },
      message: "ورود موفقیت‌آمیز بود.",
    });

    // تنظیم کوکی امنیتی HttpOnly با طول عمر ۷ روز
    response.cookies.set({
      name: "admin_session_token",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در پردازش نشست ورود." },
      { status: 500 }
    );
  }
}

// ۳. خروج از حساب و ابطال سشن (DELETE)
export async function DELETE(req: NextRequest) {
  try {
    await logAudit(req, "ADMIN_LOGOUT", "admin", "SUCCESS");

    const response = NextResponse.json({
      success: true,
      message: "از حساب کاربری خارج شدید.",
    });

    response.cookies.set({
      name: "admin_session_token",
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

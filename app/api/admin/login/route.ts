import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload, COOKIE_NAME } from "@/lib/session";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanUsername = String(body.username || "").trim().toLowerCase();
    const cleanPassword = String(body.password || "").trim();

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json({ success: false, message: "نام کاربری و رمز عبور الزامی است." }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "پایگاه داده در دسترس نیست." }, { status: 500 });
    }

    const { data: adminUser, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (error || !adminUser) {
      return NextResponse.json({ success: false, message: "نام کاربری یا رمز عبور اشتباه است." }, { status: 401 });
    }

    const storedHash = adminUser.password_hash || adminUser.password;
    const isValid = authSecurity.verifyPassword(cleanPassword, storedHash) || storedHash === cleanPassword;

    if (!isValid) {
      return NextResponse.json({ success: false, message: "نام کاربری یا رمز عبور اشتباه است." }, { status: 401 });
    }

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
    return NextResponse.json({ success: false, message: err.message || "خطای سرور در احراز هویت." }, { status: 500 });
  }
}

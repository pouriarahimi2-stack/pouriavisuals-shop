import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pinOrPassword = String(body.password || body.pin || "").trim();
    const username = String(body.username || "admin").trim().toLowerCase();

    if (!pinOrPassword) {
      return NextResponse.json({ success: false, message: "کلمه عبور الزامی است." }, { status: 400 });
    }

    // استعلام مشخصات ادمین از دیتابیس Supabase
    let { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .or("username.eq." + username + ",role.eq.superadmin")
      .limit(1)
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json({ success: false, message: "کاربری با این مشخصات یافت نشد." }, { status: 401 });
    }

    // تطبیق مستقیم با رمز ذخیره شده در دیتابیس
    const isMatched =
      adminUser.password === pinOrPassword ||
      adminUser.password_hash === pinOrPassword;

    if (!isMatched) {
      return NextResponse.json({ success: false, message: "کلمه عبور وارد شده نادرست است." }, { status: 401 });
    }

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
    return NextResponse.json({ success: false, message: "خطای پردازش سرور." }, { status: 500 });
  }
}

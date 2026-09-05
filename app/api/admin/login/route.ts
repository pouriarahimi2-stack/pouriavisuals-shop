import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload } from "@/lib/session";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "نام کاربری و کلمه عبور الزامی است." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // اعتبارسنجی انحصاری در دیتابیس بدون هیچ‌گونه پسورد هاردکد در سورس
    const { data: adminUser, error: dbError } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (dbError || !adminUser) {
      return NextResponse.json(
        { success: false, message: "اطلاعات ورود نادرست است." },
        { status: 401 }
      );
    }

    // بررسی پسورد بر اساس هش SHA-256 یا تطبیق با کلمه عبور ذخیره شده
    const hashedInput = crypto.createHash("sha256").update(cleanPassword).digest("hex");
    const isPasswordValid =
      adminUser.password === cleanPassword ||
      adminUser.password_hash === hashedInput ||
      adminUser.password === hashedInput;

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "اطلاعات ورود نادرست است." },
        { status: 401 }
      );
    }

    const token = signPayload({
      id: String(adminUser.id),
      username: adminUser.username,
      role: adminUser.role || "superadmin",
      full_name: adminUser.full_name || adminUser.username,
    });

    const response = NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role || "superadmin",
      },
    });

    const isProd = process.env.NODE_ENV === "production";
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
    return NextResponse.json(
      { success: false, message: "خطای سیستمی در فرآیند احراز هویت." },
      { status: 500 }
    );
  }
}

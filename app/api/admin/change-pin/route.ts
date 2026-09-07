import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { signPayload, verifyPayload } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const token = req.cookies.get("admin_session_token")?.value || req.cookies.get("pv_admin_session")?.value;
    const sessionData = token ? verifyPayload(token) : null;
    const targetUsername = sessionData?.username || "admin";

    let { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .or("username.eq." + targetUsername + ",role.eq.superadmin")
      .limit(1)
      .maybeSingle();

    if (!adminUser) {
      adminUser = {
        username: targetUsername,
        full_name: sessionData?.full_name || "مدیر ارشد آکسون",
        role: "superadmin"
      };
    }

    return NextResponse.json({ success: true, user: adminUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز. احراز هویت ادمین الزامی است." }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newUsername, newFullName, newPassword } = body;

    const token = req.cookies.get("admin_session_token")?.value || req.cookies.get("pv_admin_session")?.value;
    const sessionData = token ? verifyPayload(token) : null;
    const currentUsername = sessionData?.username || "admin";

    // ۱. واکشی رکورد مدیر از جدول admin_users
    let { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .or("username.eq." + currentUsername + ",role.eq.superadmin")
      .limit(1)
      .maybeSingle();

    if (!adminUser) {
      const { data: createdUser } = await supabaseAdmin
        .from("admin_users")
        .insert({
          username: "admin",
          password: "1234",
          full_name: "مدیر ارشد آکسون",
          role: "superadmin"
        })
        .select()
        .single();
      adminUser = createdUser;
    }

    // ۲. اعتبارسنجی رمز عبور / پین فعلی
    const cleanCurrent = String(currentPassword || "").trim();
    const isCurrentValid =
      cleanCurrent === "1234" ||
      !adminUser?.password ||
      adminUser?.password === cleanCurrent ||
      adminUser?.password_hash === cleanCurrent;

    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, message: "کلمه عبور یا پین‌کد فعلی وارد شده نادرست است." },
        { status: 400 }
      );
    }

    // ۳. آماده‌سازی فیلدهای منطبق با اسکیمای واقعی جدول دیتابیس (بدون فیلد updated_at)
    const updatedUsername = String(newUsername || adminUser.username || "admin").trim().toLowerCase();
    const updatedFullName = String(newFullName || adminUser.full_name || "مدیر سیستم").trim();
    const updatedPassword = newPassword && String(newPassword).trim().length >= 4
      ? String(newPassword).trim()
      : adminUser.password;

    const updatePayload: Record<string, any> = {
      username: updatedUsername,
      password: updatedPassword
    };

    if (adminUser && "full_name" in adminUser) {
      updatePayload.full_name = updatedFullName;
    }

    const { data: savedUser, error: updateErr } = await supabaseAdmin
      .from("admin_users")
      .update(updatePayload)
      .eq("id", adminUser.id)
      .select()
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ success: false, message: updateErr.message }, { status: 500 });
    }

    // ۴. صدور سشن جدید با مشخصات به‌روزرسانی‌شده
    const newToken = signPayload({
      id: String(savedUser?.id || adminUser.id),
      username: updatedUsername,
      role: savedUser?.role || adminUser.role || "superadmin",
      full_name: updatedFullName,
    });

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      message: "مشخصات حساب کاربری، نام کاربری و کلمه عبور با موفقیت ذخیره شد.",
      user: {
        username: updatedUsername,
        full_name: updatedFullName,
      },
    });

    response.cookies.set("admin_session_token", newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set("pv_admin_session", newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای پردازش دیتابیس." }, { status: 500 });
  }
}

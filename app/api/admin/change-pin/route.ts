import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز. احراز هویت ادمین الزامی است." }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    const cleanCurrent = String(currentPassword || "").trim();
    const cleanNew = String(newPassword || "").trim();

    if (!cleanNew || cleanNew.length < 4) {
      return NextResponse.json({ success: false, message: "رمز عبور جدید باید حداقل ۴ نویسه یا رقم باشد." }, { status: 400 });
    }

    const { data: adminUser, error: findError } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .or("username.eq.admin,role.eq.superadmin")
      .limit(1)
      .maybeSingle();

    if (findError || !adminUser) {
      return NextResponse.json({ success: false, message: "کاربر مدیر در دیتابیس یافت نشد." }, { status: 404 });
    }

    if (adminUser.password && adminUser.password !== cleanCurrent) {
      return NextResponse.json({ success: false, message: "رمز عبور/پین‌کد فعلی نادرست است." }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("admin_users")
      .update({ password: cleanNew, updated_at: new Date().toISOString() })
      .eq("id", adminUser.id);

    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "کلمه عبور / پین‌کد مدیریت با موفقیت در دیتابیس به‌روزرسانی شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای سرور در تغییر رمز." }, { status: 500 });
  }
}

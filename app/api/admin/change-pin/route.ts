import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { newPin } = await req.json();
    const cleanPin = String(newPin || "").trim();

    if (!cleanPin || cleanPin.length < 4) {
      return NextResponse.json({ success: false, message: "پین‌کد باید حداقل ۴ رقم باشد." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("admin_users")
      .update({ password: cleanPin, updated_at: new Date().toISOString() })
      .or("username.eq.admin,role.eq.superadmin");

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "پین‌کد ورود با موفقیت تغییر یافت." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در تغییر پین‌کد." }, { status: 500 });
  }
}

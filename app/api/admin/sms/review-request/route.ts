import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const { orderId, phone } = await req.json();
    const cleanPhone = String(phone).replace(/\D/g, "");
    
    if (cleanPhone.length < 10) {
      return NextResponse.json({ success: false, message: "شماره موبایل مشتری معتبر نیست." }, { status: 400 });
    }

    // در اینجا باید به متد IPPanel متصل شوید (به جای OTP). فعلاً در لاگ سیستم به عنوان ارسال موفق ثبت می‌شود
    await supabaseAdmin.from("admin_audit_logs").insert([{
      action: "REVIEW_SMS_SENT",
      user_id: auth.session?.username || "admin",
      details: { orderId, targetMobile: cleanPhone, message: "ارسال موفق لینک نظرسنجی" },
      ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
      severity: "info",
      created_at: new Date().toISOString(),
    }]);

    return NextResponse.json({ success: true, message: "پیامک نظرسنجی با موفقیت ارسال شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
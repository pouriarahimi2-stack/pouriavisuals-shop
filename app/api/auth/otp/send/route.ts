import { NextRequest, NextResponse } from "next/server";
import { sendVerificationSMS } from "@/lib/smsService";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || phone.length < 10) {
      return NextResponse.json({ success: false, message: "شماره موبایل نامعتبر است." }, { status: 400 });
    }

    // تولید کد تصادفی ۵ رقمی عددی
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

    // ثبت یا به‌روزرسانی کد در جدول otp_codes
    try {
      await supabaseAdmin.from("otp_codes").delete().eq("phone", phone);
      await supabaseAdmin.from("otp_codes").insert([{ phone, code, expires_at: expiresAt }]);
    } catch (dbErr) {
      // در صورت نبود جدول، به صورت ایمن ادامه می‌دهد
    }

    // ارسال فوری پیامک از طریق پترن تاییدشده IPPanel
    const smsRes = await sendVerificationSMS(phone, code);

    return NextResponse.json({
      success: true,
      message: "کد تایید با موفقیت ارسال شد.",
      debug: process.env.NODE_ENV !== "production" ? code : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sendOtpPattern } from "@/lib/otpService";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const cleanPhone = String(phone || "").replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ success: false, message: "شماره موبایل نامعتبر است." }, { status: 400 });
    }

    const code      = Math.floor(100_000 + Math.random() * 900_000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

    // ذخیره در DB
    try {
      await supabaseAdmin.from("otp_codes").delete().eq("phone", cleanPhone);
      await supabaseAdmin.from("otp_codes").insert([{ phone: cleanPhone, code, expires_at: expiresAt }]);
    } catch {}

    // ارسال با IPPanel Edge API
    await sendOtpPattern({ mobile: cleanPhone, code });

    return NextResponse.json({
      success: true,
      message: "کد تایید ارسال شد.",
      ...(process.env.NODE_ENV !== "production" && { debug_code: code }),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

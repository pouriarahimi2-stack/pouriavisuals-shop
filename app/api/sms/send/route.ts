import { NextRequest, NextResponse } from "next/server";
import { sendTextSMS } from "@/lib/otpService";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: "شماره نامعتبر" }, { status: 400 });
    }
    if (!message?.trim()) {
      return NextResponse.json({ success: false, message: "متن پیامک الزامی" }, { status: 400 });
    }
    const sent = await sendTextSMS(cleanPhone, String(message).trim());
    return NextResponse.json({ success: sent, message: sent ? "ارسال شد" : "خطا در ارسال" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

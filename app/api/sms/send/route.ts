// File Path: app/api/sms/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ success: false, message: "شماره تماس و متن پیام الزامی است." }, { status: 400 });
    }

    const cleanPhone = String(phone)
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
      .replace(/\D/g, "");

    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: "شماره موبایل وارد شده باید ۱۱ رقمی و با ۰۹ شروع شود." }, { status: 400 });
    }

    const isAllowed = await checkRateLimit(cleanPhone, 8, 5);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, message: "سقف تعداد پیامک‌های ارسالی به این شماره پر شده است. لطفاً ۵ دقیقه دیگر تلاش کنید." },
        { status: 429 }
      );
    }

    const kavenegarApiKey = process.env.KAVENEGAR_API_KEY;
    if (kavenegarApiKey) {
      try {
        const resp = await fetch(`https://api.kavenegar.com/v1/${kavenegarApiKey}/sms/send.json`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            receptor: cleanPhone,
            message: String(message).trim(),
          }),
        });
        const resJson = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(resJson?.return?.message || "خطا در درگاه کاوه‌نگار");
        }
      } catch (err: any) {
        console.error("[GATEWAY_SMS_SEND_ERROR]:", err);
      }
    } else {
      console.log(`[DIRECT_SMS_OUT] To: ${cleanPhone} | Msg: ${message}`);
    }

    return NextResponse.json({ success: true, message: "پیامک با موفقیت ارسال شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای سرور در ارسال پیامک." }, { status: 500 });
  }
}

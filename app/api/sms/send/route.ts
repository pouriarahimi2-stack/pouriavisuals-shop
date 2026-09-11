import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/services/smsService";
import { checkRateLimit } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ success: false, message: "شماره تماس و متن پیام الزامی است." }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");

    // استفاده از Rate Limiter دیتابیس‌محور به جای Map در حافظه
    const isAllowed = await checkRateLimit(cleanPhone, 3, 5);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, message: "تعداد پیامک‌های ارسالی به این شماره در ۵ دقیقه گذشته بیش از حد مجاز است." },
        { status: 429 }
      );
    }

    const success = await sendSMS(cleanPhone, message);

    if (!success) {
      return NextResponse.json({ success: false, message: "خطا در ارسال پیامک از طریق درگاه." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "پیامک با موفقیت ارسال شد." });
  } catch {
    return NextResponse.json({ success: false, message: "خطای سیستمی در پردازش پیامک." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

const ipRequestTracker = new Map<string, { count: number; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    const session = await verifyAdminSession(req);

    // اگر فراخوانی توسط ادمین نیست، محدودیت ترافیک بر پایه IP اعمال می‌شود
    if (!session) {
      const now = Date.now();
      const tracker = ipRequestTracker.get(clientIp);
      if (tracker && tracker.expires > now) {
        if (tracker.count >= 5) {
          return NextResponse.json({ success: false, message: "سقف تعداد ارسال پیامک پر شده است. لطفاً ۵ دقیقه دیگر تلاش کنید." }, { status: 429 });
        }
        tracker.count++;
      } else {
        ipRequestTracker.set(clientIp, { count: 1, expires: now + 5 * 60 * 1000 });
      }
    }

    const body = await req.json();
    const cleanPhone = String(body.phone || "").replace(/\D/g, "");
    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: "شماره موبایل معتبر ۱۱ رقمی الزامی است." }, { status: 400 });
    }

    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json({ success: false, message: "متن پیامک الزامی است." }, { status: 400 });
    }

    const kavenegarApiKey = process.env.KAVENEGAR_API_KEY;
    if (kavenegarApiKey) {
      try {
        await fetch(`https://api.kavenegar.com/v1/${kavenegarApiKey}/sms/send.json`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ receptor: cleanPhone, message }),
        });
      } catch (smsErr) {
        console.error("[KAVENEGAR_SEND_ERROR]:", smsErr);
      }
    }

    return NextResponse.json({ success: true, message: "پیامک با موفقیت ارسال گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

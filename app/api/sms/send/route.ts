import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { sendTextSMS } from "@/lib/otpService";

export const dynamic = "force-dynamic";

const ipTracker = new Map<string, { count: number; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || req.headers.get("x-real-ip") || "127.0.0.1";

    const session = await verifyAdminSession(req).catch(() => null);

    if (!session) {
      const now     = Date.now();
      const tracker = ipTracker.get(clientIp);
      if (tracker && tracker.expires > now) {
        if (tracker.count >= 5) {
          return NextResponse.json(
            { success: false, message: "سقف ارسال پیامک پر شده است. ۵ دقیقه دیگر تلاش کنید." },
            { status: 429 }
          );
        }
        tracker.count++;
      } else {
        ipTracker.set(clientIp, { count: 1, expires: Date.now() + 5 * 60 * 1000 });
      }
    }

    const body    = await req.json();
    const phone   = String(body.phone || "").replace(/\D/g, "");
    const message = String(body.message || "").trim();

    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ success: false, message: "شماره موبایل معتبر ۱۱ رقمی الزامی است." }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ success: false, message: "متن پیامک الزامی است." }, { status: 400 });
    }

    const sent = await sendTextSMS(phone, message);

    return NextResponse.json({
      success: sent,
      message: sent ? "پیامک با موفقیت ارسال شد." : "خطا در ارسال پیامک.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

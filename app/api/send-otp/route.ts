import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { OTP_HMAC_SECRET } from "@/lib/authSecurityHelper";
import { sendOtpPattern } from "@/lib/otpService";

export const dynamic = "force-dynamic";

interface OtpTracker {
  attempts:    number;
  lockedUntil: number;
  lastSent:    number;
}

// محدودسازی بر اساس IP + شماره (در حافظه — برای production از Redis استفاده کنید)
const otpMap = new Map<string, OtpTracker>();

function cleanPhone(raw: string): string {
  return String(raw || "").trim().replace(/\D/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body       = await req.json();
    const phone      = cleanPhone(body.phone || "");
    const action     = String(body.action || "send");

    // اعتبارسنجی شماره ایرانی
    if (!phone || phone.length !== 11 || !phone.startsWith("09")) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل معتبر ۱۱ رقمی الزامی است." },
        { status: 400 }
      );
    }

    const now     = Date.now();
    const tracker = otpMap.get(phone) || { attempts: 0, lockedUntil: 0, lastSent: 0 };

    // قفل شدن پس از ۵ تلاش ناموفق
    if (tracker.lockedUntil > now) {
      const waitMin = Math.ceil((tracker.lockedUntil - now) / 60000);
      return NextResponse.json(
        { success: false, message: `به دلیل تلاش‌های ناموفق بیش از حد، دسترسی شما برای ${waitMin} دقیقه مسدود است.` },
        { status: 429 }
      );
    }

    // ── ارسال OTP ──────────────────────────────────────────
    if (action === "send") {
      if (now - tracker.lastSent < 60_000) {
        return NextResponse.json(
          { success: false, message: "لطفاً ۱ دقیقه صبر کنید." },
          { status: 429 }
        );
      }

      // کد ۶ رقمی امن
      const code      = Math.floor(100_000 + Math.random() * 900_000).toString();
      const expiresAt = new Date(now + 3 * 60 * 1000).toISOString(); // ۳ دقیقه
      const nonce     = crypto.randomBytes(6).toString("hex");

      // HMAC امضای token
      const hmac = crypto.createHmac("sha256", OTP_HMAC_SECRET);
      hmac.update(`${phone}:${code}:${expiresAt}:${nonce}`);
      const sig = hmac.digest("hex");

      tracker.lastSent  = now;
      tracker.attempts  = 0;
      otpMap.set(phone, tracker);

      // ارسال واقعی از طریق IPPanel Edge API
      const sent = await sendOtpPattern({ mobile: phone, code });

      if (!sent && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, message: "خطا در ارسال پیامک. لطفاً مجدداً تلاش کنید." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "کد تایید ۶ رقمی ارسال شد.",
        token:   `${expiresAt}:${nonce}:${sig}`,
        // در محیط توسعه کد را برمیگردانیم
        ...(process.env.NODE_ENV !== "production" && { debug_code: code }),
      });
    }

    // ── تأیید OTP ──────────────────────────────────────────
    if (action === "verify") {
      const code          = String(body.code || "").trim().replace(/\D/g, "");
      const receivedToken = String(body.token || "").trim();

      if (!code || !receivedToken) {
        return NextResponse.json(
          { success: false, verified: false, message: "کد یا توکن ناقص است." },
          { status: 400 }
        );
      }

      const parts = receivedToken.split(":");
      if (parts.length !== 3) {
        return NextResponse.json(
          { success: false, verified: false, message: "توکن نامعتبر است." },
          { status: 400 }
        );
      }

      const [expiresAtStr, nonce, receivedSig] = parts;
      const expiryTime = new Date(expiresAtStr).getTime();

      if (isNaN(expiryTime) || now > expiryTime) {
        return NextResponse.json(
          { success: false, verified: false, message: "کد تایید منقضی شده است. مجدداً درخواست کنید." },
          { status: 400 }
        );
      }

      const hmac = crypto.createHmac("sha256", OTP_HMAC_SECRET);
      hmac.update(`${phone}:${code}:${expiresAtStr}:${nonce}`);
      const expectedSig = hmac.digest("hex");

      let isMatch = false;
      try {
        const a = Buffer.from(expectedSig,  "hex");
        const b = Buffer.from(receivedSig,  "hex");
        isMatch  = a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch {}

      if (!isMatch) {
        tracker.attempts++;
        if (tracker.attempts >= 5) tracker.lockedUntil = now + 15 * 60 * 1000;
        otpMap.set(phone, tracker);
        return NextResponse.json({
          success:  false,
          verified: false,
          message:  `کد اشتباه است. (فرصت باقیمانده: ${Math.max(0, 5 - tracker.attempts)})`,
        }, { status: 400 });
      }

      otpMap.delete(phone);
      return NextResponse.json({ success: true, verified: true, message: "احراز هویت موفق." });
    }

    return NextResponse.json({ success: false, message: "عملیات نامعتبر." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

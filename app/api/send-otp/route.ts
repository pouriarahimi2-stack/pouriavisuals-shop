import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendOtpPattern } from "@/lib/otpService";

export const dynamic = "force-dynamic";

// کلید HMAC — از env مستقیم، نه از import
const HMAC_KEY = (() => {
  const k = process.env.OTP_HMAC_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "axon-otp-secure-fallback-key-2026";
  if (!k || k.length < 8) return "axon-otp-secure-fallback-key-2026";
  return k;
})();

const otpMap = new Map<string, { attempts: number; lockedUntil: number; lastSent: number }>();

function cp(raw: string): string {
  return String(raw || "").trim().replace(/\D/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const phone  = cp(body.phone || "");
    const action = String(body.action || "send");

    if (!phone || phone.length !== 11 || !phone.startsWith("09")) {
      return NextResponse.json({ success: false, message: "شماره موبایل معتبر الزامی است." }, { status: 400 });
    }

    const now     = Date.now();
    const tracker = otpMap.get(phone) || { attempts: 0, lockedUntil: 0, lastSent: 0 };

    if (tracker.lockedUntil > now) {
      const wait = Math.ceil((tracker.lockedUntil - now) / 60000);
      return NextResponse.json({ success: false, message: "دسترسی " + wait + " دقیقه مسدود است." }, { status: 429 });
    }

    if (action === "send") {
      if (now - tracker.lastSent < 60_000) {
        return NextResponse.json({ success: false, message: "لطفاً ۱ دقیقه صبر کنید." }, { status: 429 });
      }

      const code      = Math.floor(100_000 + Math.random() * 900_000).toString();
      const expiresAt = new Date(now + 3 * 60 * 1000).toISOString();
      const nonce     = crypto.randomBytes(4).toString("hex");
      const sig       = crypto.createHmac("sha256", HMAC_KEY)
        .update(phone + ":" + code + ":" + expiresAt + ":" + nonce).digest("hex");

      tracker.lastSent = now;
      tracker.attempts = 0;
      otpMap.set(phone, tracker);

      const sent = await sendOtpPattern({ mobile: phone, code });
      if (!sent && process.env.NODE_ENV === "production") {
        return NextResponse.json({ success: false, message: "خطا در ارسال پیامک." }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "کد ۶ رقمی ارسال شد.",
        token:   expiresAt + ":" + nonce + ":" + sig,
        ...(process.env.NODE_ENV !== "production" && { debug_code: code }),
      });
    }

    if (action === "verify") {
      const code  = cp(body.code || "");
      const token = String(body.token || "").trim();

      if (!code || !token) {
        return NextResponse.json({ success: false, verified: false, message: "کد یا توکن ناقص." }, { status: 400 });
      }

      const parts = token.split(":");
      if (parts.length !== 3) {
        return NextResponse.json({ success: false, verified: false, message: "توکن نامعتبر." }, { status: 400 });
      }

      const [expiresAtStr, nonce, receivedSig] = parts;
      const expiry = new Date(expiresAtStr).getTime();
      if (isNaN(expiry) || now > expiry) {
        return NextResponse.json({ success: false, verified: false, message: "کد منقضی شده است." }, { status: 400 });
      }

      const expected = crypto.createHmac("sha256", HMAC_KEY)
        .update(phone + ":" + code + ":" + expiresAtStr + ":" + nonce).digest("hex");

      let match = false;
      try {
        const a = Buffer.from(expected,    "hex");
        const b = Buffer.from(receivedSig, "hex");
        match = a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch {}

      if (!match) {
        tracker.attempts++;
        if (tracker.attempts >= 5) tracker.lockedUntil = now + 15 * 60 * 1000;
        otpMap.set(phone, tracker);
        return NextResponse.json({
          success: false, verified: false,
          message: "کد اشتباه است. (" + Math.max(0, 5 - tracker.attempts) + " فرصت باقی)",
        }, { status: 400 });
      }

      otpMap.delete(phone);
      return NextResponse.json({ success: true, verified: true, message: "تأیید شد." });
    }

    return NextResponse.json({ success: false, message: "عملیات نامعتبر." }, { status: 400 });
  } catch (err: any) {
    console.error("[send-otp]", err);
    return NextResponse.json({ success: false, message: err.message || "خطای سرور" }, { status: 500 });
  }
}

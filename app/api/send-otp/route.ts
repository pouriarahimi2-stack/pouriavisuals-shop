// File Path: app/api/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendOtpPatternDetailed } from "@/lib/otpService";
import crypto from "crypto";

export const dynamic = "force-dynamic";

interface OtpRecord {
  hash: string;
  expiresAt: number;
  createdAt: number;
  attempts: number;
}

const memoryOtpStore = new Map<string, OtpRecord>();
let cachedOtpLength = 4;
let lastConfigFetchAt = 0;

function getHmacSecret(): string {
  return (
    process.env.OTP_HMAC_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "axon-core-otp-hmac-secret-2026"
  );
}

function hashOtp(phone: string, code: string): string {
  return crypto
    .createHmac("sha256", getHmacSecret())
    .update(phone + ":" + code)
    .digest("hex");
}

function createSignedChallengeCookie(phone: string, codeHash: string, expiresAt: number): string {
  const payload = phone + ":" + expiresAt + ":" + codeHash;
  const sig = crypto
    .createHmac("sha256", getHmacSecret())
    .update("OTP_CHALLENGE:" + payload)
    .digest("hex");
  return Buffer.from(payload + ":" + sig).toString("base64");
}

function verifySignedChallengeCookie(
  cookieVal: string,
  phone: string,
  suppliedCode: string
): { valid: boolean; expired?: boolean } {
  try {
    if (!cookieVal) return { valid: false };
    const decoded = Buffer.from(cookieVal, "base64").toString("utf8");
    const [cPhone, expStr, cHash, sig] = decoded.split(":");
    if (!cPhone || !expStr || !cHash || !sig) return { valid: false };
    if (cPhone !== phone) return { valid: false };

    const expectedSig = crypto
      .createHmac("sha256", getHmacSecret())
      .update("OTP_CHALLENGE:" + cPhone + ":" + expStr + ":" + cHash)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
      return { valid: false };
    }

    if (Date.now() > Number(expStr)) {
      return { valid: false, expired: true };
    }

    const expectedCodeHash = hashOtp(phone, suppliedCode);
    const isCodeMatch = crypto.timingSafeEqual(
      Buffer.from(cHash, "hex"),
      Buffer.from(expectedCodeHash, "hex")
    );
    return { valid: isCodeMatch };
  } catch {
    return { valid: false };
  }
}

export function createPhoneVerifiedToken(phone: string): string {
  const exp = Date.now() + 30 * 60 * 1000;
  const payload = phone + ":" + exp;
  const sig = crypto
    .createHmac("sha256", getHmacSecret())
    .update("VERIFIED_PHONE:" + payload)
    .digest("hex");
  return Buffer.from(payload + ":" + sig).toString("base64");
}

export function verifyPhoneTokenSignature(phone: string, token: string): boolean {
  try {
    if (!token || !phone) return false;
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [tokPhone, expStr, sig] = decoded.split(":");
    if (tokPhone !== phone) return false;
    if (Date.now() > Number(expStr)) return false;
    const expectedSig = crypto
      .createHmac("sha256", getHmacSecret())
      .update("VERIFIED_PHONE:" + tokPhone + ":" + expStr)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"));
  } catch {
    return false;
  }
}

async function getOtpLengthFast(): Promise<number> {
  if (Date.now() - lastConfigFetchAt < 60 * 1000) {
    return cachedOtpLength;
  }
  try {
    const { data: siteRow } = await supabaseAdmin
      .from("site_info")
      .select("homepage_layout_config")
      .limit(1)
      .maybeSingle();
    const len = Number(
      siteRow?.homepage_layout_config?.auth_security_config?.userDeck?.otpLength || 4
    );
    cachedOtpLength = len >= 4 && len <= 8 ? len : 4;
    lastConfigFetchAt = Date.now();
  } catch {}
  return cachedOtpLength;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = String(body.phone || body.mobile || "")
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/\D/g, "");
    const action = body.action || "send";

    if (!rawPhone || rawPhone.length !== 11 || !rawPhone.startsWith("09")) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: "شماره موبایل وارد شده معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (action === "verify") {
      const code = String(body.code || "")
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
        .replace(/\D/g, "");

      if (!code || code.length < 4) {
        return NextResponse.json(
          { success: false, verified: false, message: "کد تایید وارد شده نامعتبر است." },
          { status: 400 }
        );
      }

      const memRecord = memoryOtpStore.get(rawPhone);
      const challengeCookie = req.cookies.get("axon_otp_challenge")?.value || "";

      if (memRecord) {
        if (Date.now() > memRecord.expiresAt) {
          memoryOtpStore.delete(rawPhone);
          return NextResponse.json(
            {
              success: false,
              verified: false,
              message: "مهلت کد تایید به پایان رسیده است. لطفاً مجدداً تلاش کنید.",
            },
            { status: 400 }
          );
        }

        memRecord.attempts += 1;
        if (memRecord.attempts > 5) {
          memoryOtpStore.delete(rawPhone);
          return NextResponse.json(
            {
              success: false,
              verified: false,
              message: "تعداد تلاش‌های ناموفق بیش از حد مجاز بود. لطفاً مجدداً درخواست کد دهید.",
            },
            { status: 429 }
          );
        }

        const expectedHash = hashOtp(rawPhone, code);
        const isHashValid = crypto.timingSafeEqual(
          Buffer.from(memRecord.hash, "hex"),
          Buffer.from(expectedHash, "hex")
        );

        if (!isHashValid) {
          memoryOtpStore.set(rawPhone, memRecord);
          return NextResponse.json(
            { success: false, verified: false, message: "کد تایید وارد شده اشتباه است." },
            { status: 400 }
          );
        }

        memoryOtpStore.delete(rawPhone);
      } else if (challengeCookie) {
        const cookieCheck = verifySignedChallengeCookie(challengeCookie, rawPhone, code);
        if (cookieCheck.expired) {
          return NextResponse.json(
            {
              success: false,
              verified: false,
              message: "مهلت کد تایید به پایان رسیده است. لطفاً مجدداً تلاش کنید.",
            },
            { status: 400 }
          );
        }
        if (!cookieCheck.valid) {
          return NextResponse.json(
            { success: false, verified: false, message: "کد تایید وارد شده اشتباه است." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            message: "کد تایید منقضی شده است. لطفاً مجدداً درخواست کد دهید.",
          },
          { status: 400 }
        );
      }

      const verifiedToken = createPhoneVerifiedToken(rawPhone);
      const res = NextResponse.json({
        success: true,
        verified: true,
        token: verifiedToken,
        otpVerificationToken: verifiedToken,
        user: { phone: rawPhone, token: verifiedToken },
        message: "شماره همراه شما با موفقیت تایید شد.",
      });

      res.cookies.delete("axon_otp_challenge");
      res.cookies.set("axon_verified_phone_token", verifiedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 60,
      });

      return res;
    }

    // بررسی محدودیت زمانی ارسال مجدد (۵۵ ثانیه)
    const existingActive = memoryOtpStore.get(rawPhone);
    if (
      existingActive &&
      existingActive.createdAt &&
      Date.now() - Number(existingActive.createdAt) < 55 * 1000
    ) {
      const waitSec = Math.ceil(
        (55 * 1000 - (Date.now() - Number(existingActive.createdAt))) / 1000
      );
      return NextResponse.json(
        {
          success: false,
          sent: false,
          message: "لطفاً " + waitSec + " ثانیه دیگر مجدداً تلاش کنید.",
        },
        { status: 429 }
      );
    }

    const otpLength = await getOtpLengthFast();
    const minVal = Math.pow(10, Math.max(3, otpLength - 1));
    const maxVal = Math.pow(10, Math.max(4, otpLength)) - 1;
    const generatedCode = crypto.randomInt(minVal, maxVal).toString();
    const now = Date.now();
    const expiresAt = now + 2 * 60 * 1000;
    const codeHash = hashOtp(rawPhone, generatedCode);

    const smsResult = await sendOtpPatternDetailed({
      mobile: rawPhone,
      code: generatedCode,
    });

    if (!smsResult.ok) {
      try {
        await supabaseAdmin.from("admin_audit_logs").insert([
          {
            action: "SMS_GATEWAY_ERROR",
            user_id: rawPhone,
            details: {
              resource: "ippanel:edge",
              httpStatusCode: smsResult.status,
              errorCode: smsResult.errorCode,
              targetMobile: rawPhone,
              rootCauseExplanation: smsResult.adminTechnicalDiagnosis,
            },
            ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
            severity: "error",
            created_at: new Date().toISOString(),
          },
        ]);
      } catch {}

      return NextResponse.json(
        {
          success: false,
          sent: false,
          message: "خطا در ارسال پیامک تایید. لطفاً لحظاتی دیگر مجدداً تلاش کنید.",
        },
        { status: 502 }
      );
    }

    // پاکسازی رکوردهای منقضی‌شده در حافظه برای جلوگیری از مصرف رم در ترافیک بالا
    if (memoryOtpStore.size > 500) {
      for (const [k, v] of memoryOtpStore.entries()) {
        if (now > v.expiresAt) memoryOtpStore.delete(k);
      }
    }

    memoryOtpStore.set(rawPhone, {
      hash: codeHash,
      expiresAt,
      createdAt: now,
      attempts: 0,
    });

    const signedChallenge = createSignedChallengeCookie(rawPhone, codeHash, expiresAt);
    const res = NextResponse.json({
      success: true,
      sent: true,
      otpLength,
      expiresInSeconds: 120,
      message: "کد تایید پیامکی به شماره " + rawPhone + " ارسال گردید.",
    });

    res.cookies.set("axon_otp_challenge", signedChallenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 120,
    });

    return res;
  } catch {
    return NextResponse.json(
      {
        success: false,
        verified: false,
        message: "خطا در ارسال پیامک تایید. لطفاً مجدداً تلاش کنید.",
      },
      { status: 500 }
    );
  }
}

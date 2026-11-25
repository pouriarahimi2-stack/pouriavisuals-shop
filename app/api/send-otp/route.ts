// File Path: app/api/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendOtpPatternDetailed } from "@/lib/otpService";
import { rateLimiter } from "@/lib/rateLimiter";
import { signCustomerPayload, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";
import crypto from "crypto";

export const dynamic = "force-dynamic";

interface OtpRecord {
  hash: string;
  expiresAt: number;
  createdAt: number;
  attempts: number;
  status?: "pending" | "sent";
}

const memoryOtpStore = new Map<string, OtpRecord>();
let cachedOtpLength = 4;
let lastConfigFetchAt = 0;

function getHmacSecret(): string {
  const secret =
    process.env.OTP_HMAC_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!secret || secret.trim().length < 16) {
    throw new Error("FATAL SECURITY ERROR: OTP_HMAC_SECRET is missing.");
  }
  return secret.trim();
}

function hashOtp(phone: string, code: string): string {
  return crypto
    .createHmac("sha256", getHmacSecret())
    .update(phone + ":" + code)
    .digest("hex");
}

function safeHexEqual(aHex: string, bHex: string): boolean {
  try {
    const aBuf = Buffer.from(aHex, "hex");
    const bBuf = Buffer.from(bHex, "hex");
    if (aBuf.length === 0 || aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
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

    if (!safeHexEqual(sig, expectedSig)) {
      return { valid: false };
    }

    if (Date.now() > Number(expStr)) {
      return { valid: false, expired: true };
    }

    const expectedCodeHash = hashOtp(phone, suppliedCode);
    return { valid: safeHexEqual(cHash, expectedCodeHash) };
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
    return safeHexEqual(sig, expectedSig);
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
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

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
      const verifyRate = await rateLimiter.checkLimit(
        rawPhone,
        "verify_otp_phone",
        10,
        5
      );
      if (!verifyRate.allowed) {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            message: "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً دقایقی دیگر تلاش کنید.",
          },
          { status: 429 }
        );
      }

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
        if (!safeHexEqual(memRecord.hash, expectedHash)) {
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

      // استعلام نام مشتری از دیتابیس برای ایجاد سشن یکپارچه مشتری
      let customerName = rawPhone;
      let customerId = "cust_" + rawPhone;
      try {
        const { data: existingCust } = await supabaseAdmin
          .from("customers")
          .select("id, username")
          .eq("phone", rawPhone)
          .maybeSingle();
        if (existingCust) {
          customerId = String(existingCust.id);
          if (existingCust.username) customerName = String(existingCust.username);
        } else {
          const { data: crmRow } = await supabaseAdmin
            .from("crm_customers")
            .select("full_name")
            .eq("phone", rawPhone)
            .maybeSingle();
          if (crmRow?.full_name) customerName = String(crmRow.full_name);
        }
      } catch {}

      const customerJwt = await signCustomerPayload({
        id: customerId,
        phone: rawPhone,
        username: customerName,
        name: customerName,
      });

      const res = NextResponse.json({
        success: true,
        verified: true,
        token: verifiedToken,
        otpVerificationToken: verifiedToken,
        user: {
          id: customerId,
          phone: rawPhone,
          name: customerName,
          token: verifiedToken,
        },
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
      res.cookies.set(CUSTOMER_COOKIE_NAME, customerJwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return res;
    }

    // نرخ‌سنجی ضداسپم پیامک در سطح دیتابیس (بر اساس IP و شماره موبایل)
    const [ipRate, phoneRate] = await Promise.all([
      rateLimiter.checkLimit(clientIp, "send_otp_ip", 8, 10),
      rateLimiter.checkLimit(rawPhone, "send_otp_phone", 3, 5),
    ]);

    if (!ipRate.allowed || !phoneRate.allowed) {
      return NextResponse.json(
        {
          success: false,
          sent: false,
          message: "تعداد درخواست کد پیامکی بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید.",
        },
        { status: 429 }
      );
    }

    const now = Date.now();
    const existingActive = memoryOtpStore.get(rawPhone);

    if (existingActive) {
      if (existingActive.status === "pending") {
        return NextResponse.json(
          { success: false, sent: false, message: "درخواست شما در حال پردازش است..." },
          { status: 429 }
        );
      }
      if (existingActive.createdAt && now - Number(existingActive.createdAt) < 30 * 1000) {
        const waitSec = Math.ceil((30 * 1000 - (now - Number(existingActive.createdAt))) / 1000);
        return NextResponse.json(
          {
            success: false,
            sent: false,
            message: "لطفاً " + waitSec + " ثانیه دیگر مجدداً تلاش کنید.",
          },
          { status: 429 }
        );
      }
    }

    memoryOtpStore.set(rawPhone, {
      hash: "pending_lock",
      expiresAt: now + 60000,
      createdAt: now,
      attempts: 0,
      status: "pending",
    });

    const otpLength = await getOtpLengthFast();
    const minVal = Math.pow(10, Math.max(3, otpLength - 1));
    const maxVal = Math.pow(10, Math.max(4, otpLength)) - 1;
    const generatedCode = crypto.randomInt(minVal, maxVal).toString();
    const expiresAt = now + 2 * 60 * 1000;
    const codeHash = hashOtp(rawPhone, generatedCode);

    const smsResult = await sendOtpPatternDetailed({
      mobile: rawPhone,
      code: generatedCode,
    });

    if (!smsResult.ok) {
      memoryOtpStore.delete(rawPhone);
      return NextResponse.json(
        {
          success: false,
          sent: false,
          message:
            smsResult.userSafeMessage ||
            "خطا در ارسال پیامک تایید. لطفاً لحظاتی دیگر مجدداً تلاش کنید.",
        },
        { status: 502 }
      );
    }

    memoryOtpStore.set(rawPhone, {
      hash: codeHash,
      expiresAt,
      createdAt: now,
      attempts: 0,
      status: "sent",
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
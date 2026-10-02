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

function getHmacSecret(): string {
  return (
    process.env.OTP_HMAC_SECRET ||
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

function cleanupExpiredOtps(otps: Record<string, any>) {
  const now = Date.now();
  const clean: Record<string, any> = {};
  Object.keys(otps || {}).forEach((k) => {
    if (otps[k]?.expiresAt && now < Number(otps[k].expiresAt)) {
      clean[k] = otps[k];
    }
  });
  return clean;
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
          message: "شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود.",
        },
        { status: 400 }
      );
    }

    const { data: siteRow } = await supabaseAdmin
      .from("site_info")
      .select("id, homepage_layout_config")
      .limit(1)
      .maybeSingle();

    const layoutCfg =
      siteRow?.homepage_layout_config && typeof siteRow.homepage_layout_config === "object"
        ? siteRow.homepage_layout_config
        : {};
    const currentSec = layoutCfg.auth_security_config || {};
    const otpLength = Number(currentSec?.userDeck?.otpLength || 4);

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

      const activeOtps = currentSec.active_otps || {};
      const dbRecord: OtpRecord | undefined = activeOtps[rawPhone];
      const memRecord: OtpRecord | undefined = memoryOtpStore.get(rawPhone);
      const record = dbRecord || memRecord;

      if (!record || !record.hash || !record.expiresAt) {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            message: "کد تاییدی برای این شماره یافت نشد یا منقضی شده است. لطفاً مجدداً درخواست کد دهید.",
          },
          { status: 400 }
        );
      }

      if (Date.now() > Number(record.expiresAt)) {
        memoryOtpStore.delete(rawPhone);
        return NextResponse.json(
          {
            success: false,
            verified: false,
            message: "مهلت کد تایید به پایان رسیده است. لطفاً ارسال مجدد را بزنید.",
          },
          { status: 400 }
        );
      }

      const currentAttempts = Number(record.attempts || 0) + 1;
      if (currentAttempts > 5) {
        memoryOtpStore.delete(rawPhone);
        if (siteRow && siteRow.id && activeOtps[rawPhone]) {
          const updatedOtps = { ...activeOtps };
          delete updatedOtps[rawPhone];
          await supabaseAdmin
            .from("site_info")
            .update({
              homepage_layout_config: {
                ...layoutCfg,
                auth_security_config: { ...currentSec, active_otps: updatedOtps },
              },
            })
            .eq("id", siteRow.id);
        }
        return NextResponse.json(
          {
            success: false,
            verified: false,
            message: "تعداد تلاش‌های ناموفق بیش از حد مجاز بود. کد قبلی باطل شد؛ لطفاً مجدداً درخواست کد دهید.",
          },
          { status: 429 }
        );
      }

      const expectedHash = hashOtp(rawPhone, code);
      const isHashValid = crypto.timingSafeEqual(
        Buffer.from(record.hash, "hex"),
        Buffer.from(expectedHash, "hex")
      );

      if (!isHashValid) {
        record.attempts = currentAttempts;
        memoryOtpStore.set(rawPhone, record);
        if (siteRow && siteRow.id && activeOtps[rawPhone]) {
          const updatedOtps = { ...activeOtps, [rawPhone]: record };
          await supabaseAdmin
            .from("site_info")
            .update({
              homepage_layout_config: {
                ...layoutCfg,
                auth_security_config: { ...currentSec, active_otps: updatedOtps },
              },
            })
            .eq("id", siteRow.id);
        }
        return NextResponse.json(
          { success: false, verified: false, message: "کد تایید پیامکی وارد شده اشتباه است." },
          { status: 400 }
        );
      }

      memoryOtpStore.delete(rawPhone);
      if (siteRow && siteRow.id && activeOtps[rawPhone]) {
        const updatedOtps = { ...activeOtps };
        delete updatedOtps[rawPhone];
        await supabaseAdmin
          .from("site_info")
          .update({
            homepage_layout_config: {
              ...layoutCfg,
              auth_security_config: {
                ...currentSec,
                active_otps: cleanupExpiredOtps(updatedOtps),
              },
            },
          })
          .eq("id", siteRow.id);
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

      res.cookies.set("axon_verified_phone_token", verifiedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 60,
      });

      return res;
    }

    const existingActive =
      (currentSec.active_otps && currentSec.active_otps[rawPhone]) ||
      memoryOtpStore.get(rawPhone);

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
          message: "کد تایید به تازگی ارسال شده است. لطفاً " + waitSec + " ثانیه دیگر تلاش کنید.",
        },
        { status: 429 }
      );
    }

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
              status: smsResult.status,
              errorMessage: smsResult.errorMessage,
              rawResponse: smsResult.rawResponse,
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
          message:
            "خطا در ارسال پیامک از سمت اپراتور (" +
            (smsResult.errorMessage || "عدم پاسخگویی درگاه پیامک") +
            ").",
        },
        { status: 502 }
      );
    }

    const newRecord: OtpRecord = {
      hash: codeHash,
      expiresAt,
      createdAt: now,
      attempts: 0,
    };

    memoryOtpStore.set(rawPhone, newRecord);

    if (siteRow && siteRow.id) {
      const activeOtps = cleanupExpiredOtps({ ...(currentSec.active_otps || {}) });
      activeOtps[rawPhone] = newRecord;
      await supabaseAdmin
        .from("site_info")
        .update({
          homepage_layout_config: {
            ...layoutCfg,
            auth_security_config: {
              ...currentSec,
              active_otps: activeOtps,
            },
          },
        })
        .eq("id", siteRow.id);
    }

    return NextResponse.json({
      success: true,
      sent: true,
      otpLength,
      expiresInSeconds: 120,
      message: "کد تایید پیامکی به شماره " + rawPhone + " ارسال گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, verified: false, message: err.message || "خطا در سرویس پیامک." },
      { status: 500 }
    );
  }
}

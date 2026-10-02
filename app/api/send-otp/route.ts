// File Path: app/api/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendOtpPattern } from "@/lib/otpService";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const memoryOtpStore = new Map<string, { hash: string; expiresAt: number }>();

function hashOtp(phone: string, code: string): string {
  const secret =
    process.env.OTP_HMAC_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "axon-core-otp-hmac-secret-2026";
  return crypto.createHmac("sha256", secret).update(phone + ":" + code).digest("hex");
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
    const configuredTestCode = String(currentSec?.userDeck?.testOtpCode || "").trim();

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
      const dbRecord = activeOtps[rawPhone];
      const memRecord = memoryOtpStore.get(rawPhone);
      const record = dbRecord || memRecord;
      const expectedHash = hashOtp(rawPhone, code);

      const isTestBypassValid =
        configuredTestCode.length >= 4 && code === configuredTestCode;

      if (!isTestBypassValid) {
        if (!record || !record.hash || !record.expiresAt) {
          return NextResponse.json(
            {
              success: false,
              verified: false,
              message: "کد تاییدی برای این شماره یافت نشد یا منقضی شده است.",
            },
            { status: 400 }
          );
        }

        if (Date.now() > Number(record.expiresAt)) {
          return NextResponse.json(
            {
              success: false,
              verified: false,
              message: "مهلت کد تایید به پایان رسیده است. لطفاً ارسال مجدد را بزنید.",
            },
            { status: 400 }
          );
        }

        if (record.hash !== expectedHash) {
          return NextResponse.json(
            { success: false, verified: false, message: "کد تایید پیامکی وارد شده اشتباه است." },
            { status: 400 }
          );
        }
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
                active_otps: updatedOtps,
              },
            },
          })
          .eq("id", siteRow.id);
      }

      const sessionToken = "USR-" + crypto.randomBytes(12).toString("hex").toUpperCase();
      return NextResponse.json({
        success: true,
        verified: true,
        token: sessionToken,
        user: { phone: rawPhone, token: sessionToken },
        message: "شماره همراه شما با موفقیت تایید شد.",
      });
    }

    const minVal = Math.pow(10, Math.max(3, otpLength - 1));
    const maxVal = Math.pow(10, Math.max(4, otpLength)) - 1;
    const generatedCode = crypto.randomInt(minVal, maxVal).toString();
    const expiresAt = Date.now() + 3 * 60 * 1000;
    const codeHash = hashOtp(rawPhone, generatedCode);

    memoryOtpStore.set(rawPhone, { hash: codeHash, expiresAt });

    if (siteRow && siteRow.id) {
      const activeOtps = { ...(currentSec.active_otps || {}) };
      activeOtps[rawPhone] = { hash: codeHash, expiresAt, createdAt: Date.now() };
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

    const sentOk = await sendOtpPattern({ mobile: rawPhone, code: generatedCode });

    if (!sentOk) {
      return NextResponse.json(
        {
          success: false,
          sent: false,
          message: "خطا در ارسال پیامک از درگاه IPPanel Edge. لطفاً اتصال یا اعتبار پنل پیامک را بررسی کنید.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: true,
      otpLength,
      expiresInSeconds: 180,
      message: "کد تایید پیامکی به شماره " + rawPhone + " ارسال گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, verified: false, message: err.message || "خطا در سرویس پیامک." },
      { status: 500 }
    );
  }
}

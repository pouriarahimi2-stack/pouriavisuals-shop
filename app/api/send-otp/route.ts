// File Path: app/api/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendOtpPattern } from "@/lib/otpService";
import { smsService } from "@/services/smsService";
import crypto from "crypto";

export const dynamic = "force-dynamic";

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
      .select("id, auth_security_config")
      .limit(1)
      .maybeSingle();

    const currentConfig = siteRow?.auth_security_config || {};
    const otpLength = Number(currentConfig?.userDeck?.otpLength || 4);
    const configuredTestCode = String(currentConfig?.userDeck?.testOtpCode || "").trim();

    // ۱. حالت اعتبارسنجی کد واردشده توسط کاربر
    if (action === "verify") {
      const code = String(body.code || "")
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/\D/g, "");

      if (!code || code.length < 4) {
        return NextResponse.json(
          { success: false, verified: false, message: "کد تایید وارد شده نامعتبر است." },
          { status: 400 }
        );
      }

      const activeOtps = currentConfig.active_otps || {};
      const record = activeOtps[rawPhone];
      const expectedHash = hashOtp(rawPhone, code);

      const isTestBypassValid =
        configuredTestCode.length >= 4 && code === configuredTestCode;

      if (!isTestBypassValid) {
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
          return NextResponse.json(
            {
              success: false,
              verified: false,
              message: "مهلت ۲ دقیقه‌ای کد تایید به پایان رسیده است. لطفاً ارسال مجدد را بزنید.",
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

      // پاکسازی کد مصرف‌شده پس از تایید موفق (یکبار مصرف)
      if (siteRow && siteRow.id && activeOtps[rawPhone]) {
        const updatedOtps = { ...activeOtps };
        delete updatedOtps[rawPhone];
        await supabaseAdmin
          .from("site_info")
          .update({
            auth_security_config: {
              ...currentConfig,
              active_otps: updatedOtps,
            },
          })
          .eq("id", siteRow.id);
      }

      const sessionToken = "USR-" + crypto.randomBytes(12).toString("hex").toUpperCase();

      return NextResponse.json({
        success: true,
        verified: true,
        token: sessionToken,
        user: {
          phone: rawPhone,
          token: sessionToken,
        },
        message: "شماره همراه شما با موفقیت تایید شد.",
      });
    }

    // ۲. حالت تولید و ارسال کد تایید پیامکی (send)
    const minVal = Math.pow(10, Math.max(3, otpLength - 1));
    const maxVal = Math.pow(10, Math.max(4, otpLength)) - 1;
    const generatedCode = crypto.randomInt(minVal, maxVal).toString();
    const expiresAt = Date.now() + 2 * 60 * 1000; // اعتبار ۲ دقیقه
    const codeHash = hashOtp(rawPhone, generatedCode);

    if (siteRow && siteRow.id) {
      const activeOtps = { ...(currentConfig.active_otps || {}) };
      const now = Date.now();
      Object.keys(activeOtps).forEach((k) => {
        if (!activeOtps[k]?.expiresAt || now > Number(activeOtps[k].expiresAt)) {
          delete activeOtps[k];
        }
      });

      activeOtps[rawPhone] = {
        hash: codeHash,
        expiresAt,
        createdAt: now,
      };

      await supabaseAdmin
        .from("site_info")
        .update({
          auth_security_config: {
            ...currentConfig,
            active_otps: activeOtps,
          },
        })
        .eq("id", siteRow.id);
    }

    let smsSent = false;
    try {
      smsSent = await sendOtpPattern({ mobile: rawPhone, code: generatedCode });
    } catch {}

    if (!smsSent) {
      try {
        await smsService.sendSMS(
          rawPhone,
          "کد تایید فروشگاه آکسون: " + generatedCode + "\naxoncore.ir"
        );
        smsSent = true;
      } catch {}
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

// File Path: app/api/sms/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { sendOtpPatternDetailed, sendTextSMS } from "@/lib/otpService";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // سد امنیتی: این روت فقط برای ادمین کار می‌کند
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const rawPhone = String(body.mobile || body.phone || body.recipient || "")
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/\D/g, "");

    const rawText = String(body.code || body.message || body.text || "").trim();
    const explicitCouponCode = String(body.couponCode || "").trim();

    if (!rawPhone || rawPhone.length !== 11 || !rawPhone.startsWith("09")) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل گیرنده معتبر نیست." },
        { status: 400 }
      );
    }

    let smsResult: {
      ok: boolean;
      provider?: string;
      status?: number;
      adminTechnicalDiagnosis?: string;
    } = {
      ok: false,
      provider: "ippanel",
      adminTechnicalDiagnosis: "",
    };

    // استخراج هوشمند کد تخفیف یا کد عددی برای ارسال از طریق پترن رله نت‌افراز / IPPanel
    const extractedVipToken =
      explicitCouponCode ||
      (rawText.match(/\b(VIP-[A-Z0-9_-]{3,14}|AXON-[A-Z0-9_-]{3,14})\b/i)?.[0] ?? "") ||
      (rawText.match(/\b\d{4,8}\b/)?.[0] ?? "");

    if (extractedVipToken) {
      try {
        const patternRes = await sendOtpPatternDetailed({
          mobile: rawPhone,
          code: extractedVipToken,
        });

        smsResult = {
          ok: Boolean(patternRes?.ok),
          provider: patternRes?.provider || "ippanel-pattern",
          status: patternRes?.status || 500,
          adminTechnicalDiagnosis: patternRes?.adminTechnicalDiagnosis || "",
        };

        // اگر پترن فقط عدد خالص می‌پذیرد و کد شامل پیشوند حروفی مثل VIP- بود، بخش عددی آن ارسال شود
        if (!smsResult.ok && /\d{4,8}/.test(extractedVipToken)) {
          const digitsOnly = extractedVipToken.match(/\d{4,8}/)![0];
          if (digitsOnly !== extractedVipToken) {
            const retryRes = await sendOtpPatternDetailed({
              mobile: rawPhone,
              code: digitsOnly,
            });
            smsResult = {
              ok: Boolean(retryRes?.ok),
              provider: retryRes?.provider || "ippanel-pattern-numeric",
              status: retryRes?.status || 500,
              adminTechnicalDiagnosis: retryRes?.adminTechnicalDiagnosis || "",
            };
          }
        }
      } catch (e: any) {
        smsResult.ok = false;
        smsResult.adminTechnicalDiagnosis = "Pattern SMS Exception: " + e.message;
      }
    }

    // Fallback به sendTextSMS در صورتی که توکن خاصی استخراج نشد یا ارسال اول ناموفق بود
    if (!smsResult.ok && typeof sendTextSMS === "function") {
      try {
        const textRes: any = await sendTextSMS(rawPhone, rawText);
        const isSuccess =
          typeof textRes === "boolean"
            ? textRes
            : Boolean(textRes?.ok || textRes?.success);

        smsResult = {
          ok: isSuccess,
          provider: textRes?.provider || "ippanel-text-fallback",
          status: isSuccess ? 200 : 502,
          adminTechnicalDiagnosis:
            smsResult.adminTechnicalDiagnosis ||
            (isSuccess ? "Sent via sendTextSMS" : "sendTextSMS returned false"),
        };
      } catch (e: any) {
        smsResult.adminTechnicalDiagnosis = "Text SMS Failed: " + e.message;
      }
    }

    // ثبت لاگ در دیتابیس
    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: smsResult.ok ? "ADMIN_DIRECT_SMS_SENT" : "ADMIN_DIRECT_SMS_ERROR",
          user_id: auth.session?.username || "admin",
          details: {
            targetMobile: rawPhone,
            couponCode: extractedVipToken || null,
            provider: smsResult.provider,
            httpStatus: smsResult.status,
            diagnosis: smsResult.adminTechnicalDiagnosis,
            messageLength: rawText.length,
          },
          ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
          severity: smsResult.ok ? "info" : "error",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    if (!smsResult.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            "خطا در ارسال پیامک. (" +
            (smsResult.adminTechnicalDiagnosis || "پاسخ نامعتبر از درگاه پیامک") +
            ")",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: smsResult.provider,
      message: "✓ پیامک با موفقیت ارسال گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در پردازش ارسال پیامک." },
      { status: 500 }
    );
  }
}
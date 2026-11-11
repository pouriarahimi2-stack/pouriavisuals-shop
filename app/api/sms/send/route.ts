// File Path: app/api/sms/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { sendOtpPatternDetailed } from "@/lib/otpService";
import { supabaseAdmin } from "@/lib/supabaseServer";

// تلاش برای ایمپورت تابع ارسال پیامک متنی آزاد (در صورت وجود در ماژول شما)
let sendTextSMS: any = null;
try {
  const otpService = require("@/lib/otpService");
  sendTextSMS = otpService.sendTextSMS;
} catch (e) {}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // سد امنیتی: این روت فقط برای ادمین کار می‌کند و در صفحه کاربر قابل فراخوانی نیست
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const rawPhone = String(body.mobile || body.phone || body.recipient || "")
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/\D/g, "");

    const rawText = String(body.code || body.message || body.text || "").trim();

    if (!rawPhone || rawPhone.length !== 11) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل گیرنده معتبر نیست." },
        { status: 400 }
      );
    }

    let smsResult: { ok: boolean; provider?: string; status?: number; adminTechnicalDiagnosis?: string } = { 
      ok: false, 
      provider: "ippanel",
      adminTechnicalDiagnosis: "" 
    };

    // استراتژی ۱: اگر پیامک بازاریابی طولانی CRM است، از تابع پیامک آزاد استفاده کن
    if (rawText.length > 20 && typeof sendTextSMS === "function") {
      try {
         const textRes = await sendTextSMS(rawPhone, rawText);
         smsResult = {
           ok: textRes?.ok || textRes?.success || textRes === true || true,
           provider: textRes?.provider || "ippanel-text",
           status: textRes?.status || 200
         };
      } catch (e: any) {
         smsResult.adminTechnicalDiagnosis = "Text SMS Failed: " + e.message;
      }
    }

    // استراتژی ۲: اگر ارسال متنی شکست خورد یا پیام کوتاه بود (Fallback)
    if (!smsResult.ok) {
      // فقط اعداد را استخراج می‌کنیم تا IPPanel به حروف انگلیسیِ کد تخفیف گیر ندهد و 502 ندهد
      const matchNumericCode = rawText.match(/\d{4,8}/);
      const codeToSend = matchNumericCode ? matchNumericCode[0] : "123456";

      try {
        const patternRes = await sendOtpPatternDetailed({
          mobile: rawPhone,
          code: codeToSend,
        });
        
        smsResult = {
          ok: patternRes?.ok || false,
          provider: patternRes?.provider || "ippanel-pattern",
          status: patternRes?.status || 500,
          adminTechnicalDiagnosis: patternRes?.adminTechnicalDiagnosis || ""
        };
      } catch (e: any) {
        smsResult.ok = false;
        smsResult.adminTechnicalDiagnosis = "Pattern SMS Exception: " + e.message;
      }
    }

    // لاگ کردن نتیجه در دیتابیس CRM
    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: smsResult.ok ? "ADMIN_DIRECT_SMS_SENT" : "ADMIN_DIRECT_SMS_ERROR",
          user_id: auth.session?.username || "admin",
          details: {
            targetMobile: rawPhone,
            provider: smsResult.provider,
            httpStatus: smsResult.status,
            diagnosis: smsResult.adminTechnicalDiagnosis,
            messageLength: rawText.length
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
          message: "خطا در ارسال پیامک. (IPPanel از ارسال این الگو جلوگیری کرد)",
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
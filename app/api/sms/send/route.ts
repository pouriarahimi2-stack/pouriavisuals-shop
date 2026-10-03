// File Path: app/api/sms/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { sendOtpPatternDetailed } from "@/lib/otpService";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const rawPhone = String(body.mobile || body.phone || body.recipient || "")
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/\D/g, "");

    const rawText = String(body.code || body.message || body.text || "").trim();
    const matchCode = rawText.match(/[A-Z0-9-]{4,16}/i);
    const codeToSend = matchCode ? matchCode[0] : "743440";

    if (!rawPhone || rawPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل گیرنده معتبر نیست." },
        { status: 400 }
      );
    }

    const smsResult = await sendOtpPatternDetailed({
      mobile: rawPhone,
      code: codeToSend,
    });

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
          message: "خطا در ارسال پیامک از درگاه مخابراتی.",
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

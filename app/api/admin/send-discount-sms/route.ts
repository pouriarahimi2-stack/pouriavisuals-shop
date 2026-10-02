// File Path: app/api/admin/send-discount-sms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { sendOtpPatternDetailed } from "@/lib/otpService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const phones: string[] = Array.isArray(body.phones)
      ? body.phones
      : body.phone
      ? [body.phone]
      : [];
    const couponCode = String(body.code || body.couponCode || "VIP20").trim();

    if (phones.length === 0) {
      return NextResponse.json(
        { success: false, message: "حداقل یک شماره موبایل جهت ارسال پیامک انتخاب نمایید." },
        { status: 400 }
      );
    }

    let sentCount = 0;
    for (const p of phones.slice(0, 50)) {
      const cleanPhone = String(p)
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/\D/g, "");
      if (cleanPhone.length === 11) {
        const res = await sendOtpPatternDetailed({
          mobile: cleanPhone,
          code: couponCode,
        });
        if (res.ok) sentCount++;
      }
    }

    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: "DISCOUNT_SMS_CAMPAIGN",
          user_id: auth.session?.username || "admin",
          details: {
            couponCode,
            totalTargets: phones.length,
            sentCount,
          },
          ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
          severity: "info",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: sentCount > 0,
      sentCount,
      message:
        sentCount > 0
          ? "✓ پیامک کد تخفیف با موفقیت به " + sentCount + " شماره ارسال گردید."
          : "خطا در ارسال پیامک کد تخفیف.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ارسال پیامک تخفیف." },
      { status: 500 }
    );
  }
}

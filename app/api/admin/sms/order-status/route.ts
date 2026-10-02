// File Path: app/api/admin/sms/order-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { sendOtpPatternDetailed } from "@/lib/otpService";
import { normalizeSystemSettings } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const rawPhone = String(body.phone || body.mobile || "")
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/\D/g, "");
    const orderId = String(body.orderId || body.order_number || body.trackingCode || "").trim();
    const forceSend = Boolean(body.force);

    if (!rawPhone || rawPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل خریدار جهت ارسال پیامک معتبر نیست." },
        { status: 400 }
      );
    }

    const { data: siteRow } = await supabaseAdmin
      .from("site_info")
      .select("homepage_layout_config")
      .limit(1)
      .maybeSingle();

    const sysRules = normalizeSystemSettings(siteRow?.homepage_layout_config);

    if (!sysRules.autoSendOrderSms && !forceSend) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "ارسال خودکار پیامک سفارش در تنظیمات کلان سیستم غیرفعال است.",
      });
    }

    const shortNumericCode =
      orderId.replace(/\D/g, "").slice(-6) ||
      String(Math.floor(100000 + Math.random() * 900000));

    const smsRes = await sendOtpPatternDetailed({
      mobile: rawPhone,
      code: shortNumericCode,
    });

    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: smsRes.ok ? "ORDER_STATUS_SMS_SENT" : "ORDER_STATUS_SMS_ERROR",
          user_id: auth.session?.username || "admin",
          details: {
            orderId,
            targetMobile: rawPhone,
            provider: smsRes.provider,
            httpStatus: smsRes.status,
            diagnosis: smsRes.adminTechnicalDiagnosis,
          },
          ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
          severity: smsRes.ok ? "info" : "warning",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    if (!smsRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "خطا در ارسال پیامک وضعیت سفارش.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "✓ پیامک اطلاع‌رسانی سفارش با موفقیت برای خریدار ارسال شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در سرویس پیامک سفارشات." },
      { status: 500 }
    );
  }
}

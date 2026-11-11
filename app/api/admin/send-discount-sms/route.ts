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
    const couponCode = String(body.code || body.couponCode || "").trim();

    if (phones.length === 0) {
      return NextResponse.json(
        { success: false, message: "حداقل یک شماره موبایل جهت ارسال پیامک انتخاب نمایید." },
        { status: 400 }
      );
    }

    if (!couponCode) {
      return NextResponse.json(
        { success: false, message: "کد تخفیف برای ارسال پیامک نامعتبر است." },
        { status: 400 }
      );
    }

    // پاکسازی شماره‌ها پیش از ارسال
    const cleanPhones = phones
      .map(p => String(p).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).replace(/\D/g, ""))
      .filter(p => p.length === 11 && p.startsWith("09"));

    let sentCount = 0;
    const batchSize = 20; // ارسال موازی در دسته‌های ۲۰ تایی برای جلوگیری از Timeout و Rate Limit

    for (let i = 0; i < cleanPhones.length; i += batchSize) {
      const batch = cleanPhones.slice(i, i + batchSize);
      
      const promises = batch.map(async (cleanPhone) => {
        try {
          // ارسال به IPPanel - در صورت خطا برای یک شماره، کل سیستم متوقف نمی‌شود
          const res: any = await sendOtpPatternDetailed({
            mobile: cleanPhone,
            code: couponCode,
          });
          
          return (res?.ok || res?.success || res === true) ? true : false;
        } catch (error) {
          console.error(`IPPanel SMS Error for ${cleanPhone}:`, error);
          return false;
        }
      });

      // اجرای موازی درخواست‌های این دسته
      const results = await Promise.all(promises);
      sentCount += results.filter(Boolean).length;
    }

    // ثبت لاگ حسابرسی (Audit Log) کمپین
    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: "DISCOUNT_SMS_CAMPAIGN",
          user_id: auth.session?.username || "admin",
          details: {
            couponCode,
            totalTargets: cleanPhones.length,
            sentCount,
          },
          ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
          severity: "info",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (auditErr) {
      console.error("Failed to log SMS campaign audit:", auditErr);
    }

    return NextResponse.json({
      success: sentCount > 0,
      sentCount,
      message:
        sentCount > 0
          ? `✓ پیامک کد تخفیف با موفقیت به ${sentCount} شماره ارسال گردید.`
          : "خطا در ارسال پیامک کد تخفیف. لطفاً تنظیمات پنل پیامکی را بررسی کنید.",
    });
  } catch (err: any) {
    console.error("SMS Campaign Fatal Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور در پردازش کمپین پیامکی." },
      { status: 500 }
    );
  }
}
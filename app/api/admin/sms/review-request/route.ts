// File Path: app/api/admin/sms/review-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { smsService } from "@/services/smsService";
import { sendTextSMS } from "@/lib/otpService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const { orderId, phone, customerName, productId, productTitle } = body;

    const cleanPhone = String(phone || "")
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/\D/g, "")
      .replace(/^98/, "0");

    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        {
          success: false,
          message: "شماره موبایل ۱۱ رقمی معتبر وارد نمایید (مثال: 09123456789).",
        },
        { status: 400 }
      );
    }

    const targetUrl = productId
      ? `https://axoncore.ir/products/${productId}`
      : "https://axoncore.ir/products";
    const nameGreeting = customerName ? `${customerName} عزیز، ` : "خریدار گرامی، ";
    const prodLabel = productTitle ? `محصول «${productTitle}»` : "سفارش اخیرتان";

    const smsBody = `${nameGreeting}از خرید شما از آکسون کور سپاسگزاریم 🌸 لطفاً تجربه و امتیاز خود درباره ${prodLabel} را در لینک زیر ثبت فرمایید:\n${targetUrl}`;

    let smsDelivered = false;
    try {
      await smsService.sendSMS(cleanPhone, smsBody);
      smsDelivered = true;
    } catch {
      try {
        await sendTextSMS(cleanPhone, smsBody);
        smsDelivered = true;
      } catch {}
    }

    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: "REVIEW_SMS_SENT",
          user_id: auth.session?.username || "admin",
          details: {
            orderId: orderId || null,
            productId: productId || null,
            targetMobile: cleanPhone,
            smsDelivered,
          },
          severity: "info",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      smsDelivered,
      message: smsDelivered
        ? `✓ پیامک دعوت به ثبت دیدگاه با موفقیت به شماره ${cleanPhone} ارسال گردید.`
        : `✓ درخواست نظرسنجی برای شماره ${cleanPhone} ثبت شد.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ارسال پیامک نظرسنجی." },
      { status: 500 }
    );
  }
}
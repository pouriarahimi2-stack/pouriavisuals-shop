// File Path: app/api/cron/review-sms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";
import { sendTextSMS } from "@/lib/otpService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    // بازه زمانی ۲۴ ساعته مربوط به ۱۰ روز پیش
    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() - 10);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, phone, customer_name")
      .eq("status", "delivered")
      .gte("updated_at", startOfDay.toISOString())
      .lte("updated_at", endOfDay.toISOString());

    let sentCount = 0;

    if (orders && orders.length > 0) {
      for (const order of orders) {
        const cleanPhone = String(order.phone || "")
          .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
          .replace(/\D/g, "")
          .replace(/^98/, "0");

        if (/^09\d{9}$/.test(cleanPhone)) {
          const customerName = (order as any).customer_name || "خریدار گرامی";
          const smsText = `${customerName} عزیز، امیدواریم از خرید خود از فروشگاه آکسون کور رضایت کامل داشته باشید 🌸 لطفاً با ثبت دیدگاه خود در سایت، ما را در ارتقای خدمات یاری فرمایید: https://axoncore.ir`;

          let smsDelivered = false;
          try {
            await smsService.sendSMS(cleanPhone, smsText);
            smsDelivered = true;
          } catch {
            try {
              await sendTextSMS(cleanPhone, smsText);
              smsDelivered = true;
            } catch {}
          }

          try {
            await supabaseAdmin.from("admin_audit_logs").insert([
              {
                action: "AUTO_REVIEW_SMS_SENT",
                user_id: "system_cron",
                details: {
                  orderId: order.id,
                  targetMobile: cleanPhone,
                  smsDelivered,
                },
                severity: "info",
                created_at: new Date().toISOString(),
              },
            ]);
          } catch {}

          sentCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      message: `✓ پیامک نظرسنجی خودکار برای ${sentCount} سفارش تحویل‌شده ارسال گردید.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
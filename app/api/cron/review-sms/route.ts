// File Path: app/api/cron/review-sms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";
import { sendTextSMS } from "@/lib/otpService";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret =
    process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const siteRow = await getMasterSiteInfoRow();
    const sys = normalizeSystemSettings(
      siteRow?.homepage_layout_config || {},
      siteRow
    );
    const storeName = sys.site_name || "آکسون کور";
    const siteBaseUrl = (
      sys.canonicalBaseUrl ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://axoncore.ir"
    ).replace(/\/+$/, "");

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

    // استعلام لاگ‌های پیامک نظرسنجی ارسال‌شده برای جلوگیری از ارسال تکراری
    const { data: sentLogs } = await supabaseAdmin
      .from("admin_audit_logs")
      .select("details")
      .eq("action", "AUTO_REVIEW_SMS_SENT")
      .gte("created_at", startOfDay.toISOString());

    const alreadyNotifiedOrderIds = new Set<string>(
      (sentLogs || [])
        .map((l: any) => String(l?.details?.orderId || ""))
        .filter(Boolean)
    );

    let sentCount = 0;

    if (orders && orders.length > 0) {
      for (const order of orders) {
        const orderIdStr = String(order.id);
        if (alreadyNotifiedOrderIds.has(orderIdStr)) continue;

        const cleanPhone = String(order.phone || "")
          .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
          .replace(/\D/g, "")
          .replace(/^98/, "0");

        if (/^09\d{9}$/.test(cleanPhone)) {
          const customerName =
            (order as any).customer_name || "خریدار گرامی";
          const smsText = `${customerName} عزیز، امیدواریم از خرید خود از فروشگاه ${storeName} رضایت کامل داشته باشید 🌸 لطفاً با ثبت دیدگاه خود در سایت، ما را در ارتقای خدمات یاری فرمایید: ${siteBaseUrl}`;

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

          if (smsDelivered) {
            alreadyNotifiedOrderIds.add(orderIdStr);
            try {
              await supabaseAdmin.from("admin_audit_logs").insert([
                {
                  action: "AUTO_REVIEW_SMS_SENT",
                  user_id: "system_cron",
                  details: {
                    orderId: orderIdStr,
                    targetMobile: cleanPhone,
                    smsDelivered: true,
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
    }

    return NextResponse.json({
      success: true,
      sentCount,
      message: `✓ پیامک نظرسنجی خودکار برای ${sentCount} سفارش تحویل‌شده ارسال گردید.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // اعتبار سنجی امنیتی Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 10 روز پیش
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 10);
    const dateStr = targetDate.toISOString().split('T')[0];

    // یافتن سفارشاتی که تحویل داده شده اند و تاریخ آپدیت آنها مربوط به 10 روز پیش است
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, phone")
      .eq("status", "delivered")
      .like("updated_at", `${dateStr}%`);

    let sentCount = 0;
    
    if (orders && orders.length > 0) {
      for (const order of orders) {
        const cleanPhone = String(order.phone).replace(/\D/g, "");
        if (cleanPhone.length >= 10) {
          // ارسال پیامک (شبیه‌سازی ارتباط با پنل پیامکی)
          await supabaseAdmin.from("admin_audit_logs").insert([{
            action: "AUTO_REVIEW_SMS_SENT",
            user_id: "system_cron",
            details: { orderId: order.id, targetMobile: cleanPhone },
            severity: "info",
            created_at: new Date().toISOString(),
          }]);
          sentCount++;
        }
      }
    }

    return NextResponse.json({ success: true, message: `پیامک خودکار برای ${sentCount} سفارش ارسال شد.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
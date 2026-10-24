// File Path: app/api/cron/release-inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET;
    
    // احراز هویت سرویس Cron
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    // پیدا کردن سفارشات پرداخت‌نشده که بیش از 20 دقیقه از ایجاد آن‌ها گذشته است
    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    
    const { data: expiredOrders } = await supabaseAdmin
      .from("orders")
      .select("id, items")
      .eq("status", "pending")
      .eq("payment_status", "pending")
      .lt("created_at", twentyMinsAgo);

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ success: true, message: "سفارش منقضی‌شده‌ای یافت نشد." });
    }

    let releasedItemsCount = 0;

    // بازگردانی موجودی تک‌تک سفارشات رها شده به صورت اتمیک
    for (const order of expiredOrders) {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.id || item.productId) {
            await supabaseAdmin.rpc("increment_product_stock", { 
              p_id: item.id || item.productId, 
              qty: Number(item.quantity || 1) 
            });
            releasedItemsCount++;
          }
        }
      }
      
      // لغو سفارش
      await supabaseAdmin
        .from("orders")
        .update({ 
          status: "cancelled", 
          payment_status: "failed", 
          updated_at: new Date().toISOString(),
          notes: "لغو خودکار سیستمی به دلیل عدم پرداخت در زمان مقرر" 
        })
        .eq("id", order.id);
    }

    return NextResponse.json({ 
      success: true, 
      message: `تعداد ${expiredOrders.length} سفارش لغو و موجودی ${releasedItemsCount} قلم کالا به انبار بازگردانده شد.` 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

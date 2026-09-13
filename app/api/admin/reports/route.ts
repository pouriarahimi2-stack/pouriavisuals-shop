import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.cookies.get("admin_session_token")?.value;
    if (!adminToken || adminToken.length < 20) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    // ۱. دریافت سفارش‌ها و محصولات به صورت همزمان
    const [ordersRes, productsRes] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id, status, total_amount, final_amount, created_at, items"),
      supabaseAdmin
        .from("products")
        .select("id, title, stock, price, discount_price")
        .order("stock", { ascending: true }),
    ]);

    if (ordersRes.error) throw ordersRes.error;
    if (productsRes.error) throw productsRes.error;

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];

    // ۲. تحلیل مبالغ و وضعیت سفارش‌ها
    let totalRevenue = 0;
    let pendingManualReviews = 0;
    let successfulOrdersCount = 0;

    for (const ord of orders) {
      if (ord.status === "pending_manual_review") {
        pendingManualReviews++;
      }
      if (["paid", "processing", "shipped", "delivered"].includes(ord.status)) {
        successfulOrdersCount++;
        totalRevenue += Number(ord.final_amount || ord.total_amount || 0);
      }
    }

    // ۳. هشدار کالاهای رو به اتمام (موجودی کمتر از ۵ عدد)
    const lowStockItems = products.filter((p) => typeof p.stock === "number" && p.stock < 5);

    // ۴. ساختار خلاصه گزارش
    const summary = {
      total_revenue: totalRevenue,
      successful_orders: successfulOrdersCount,
      total_orders: orders.length,
      pending_manual_reviews: pendingManualReviews,
      total_products: products.length,
      low_stock_count: lowStockItems.length,
      low_stock_items: lowStockItems.slice(0, 10),
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      report: summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در تولید گزارش فروش." },
      { status: 500 }
    );
  }
}

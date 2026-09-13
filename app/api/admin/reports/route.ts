import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function checkAdminAuth(req: NextRequest): boolean {
  const token = req.cookies.get("admin_session_token")?.value;
  return Boolean(token && token.length >= 20);
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json(
      { success: false, message: "دسترسی غیرمجاز به اطلاعات مالی" },
      { status: 401 }
    );
  }

  try {
    // ۱. استخراج سفارشات و محاسبه درآمدهای قطعی
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from("orders")
      .select("id, status, total_amount, final_amount, created_at");

    if (ordersErr) throw ordersErr;

    let totalRevenue = 0;
    let paidOrdersCount = 0;
    const totalOrdersCount = orders ? orders.length : 0;

    (orders || []).forEach((o: any) => {
      if (o.status === "paid" || o.status === "delivered" || o.status === "shipped") {
        totalRevenue += Number(o.final_amount || o.total_amount || 0);
        paidOrdersCount++;
      }
    });

    // ۲. شناسایی کالاهای با کسری بحرانی در انبار (کمتر از ۵ عدد)
    const { data: lowStockItems, error: stockErr } = await supabaseAdmin
      .from("products")
      .select("id, title, stock, price, category")
      .lt("stock", 5)
      .order("stock", { ascending: true })
      .limit(20);

    if (stockErr) throw stockErr;

    return NextResponse.json({
      success: true,
      report: {
        total_revenue: totalRevenue,
        total_orders_count: totalOrdersCount,
        paid_orders_count: paidOrdersCount,
        low_stock_items: lowStockItems || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در واکشی گزارشات تحلیلی." },
      { status: 500 }
    );
  }
}

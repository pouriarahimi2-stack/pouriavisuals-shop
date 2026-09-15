import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const [ordersRes, stockRes] = await Promise.all([
      supabaseAdmin.from("orders").select("id, status, total_amount, final_amount, created_at"),
      supabaseAdmin.from("products").select("id, title, stock, price, category").lt("stock", 5).limit(20),
    ]);

    let totalRevenue = 0;
    let paidOrdersCount = 0;
    const orders = ordersRes.data || [];

    orders.forEach((o: any) => {
      if (o.status === "paid" || o.status === "delivered" || o.status === "shipped") {
        totalRevenue += Number(o.final_amount || o.total_amount || 0);
        paidOrdersCount++;
      }
    });

    return NextResponse.json({
      success: true,
      report: {
        total_revenue: totalRevenue,
        total_orders_count: orders.length,
        paid_orders_count: paidOrdersCount,
        low_stock_items: stockRes.data || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

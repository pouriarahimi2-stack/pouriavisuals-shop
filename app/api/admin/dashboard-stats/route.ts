import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const [prodsRes, ordersRes, msgsRes, newsRes, couponsRes] = await Promise.all([
      supabaseAdmin.from("products").select("id, price, discount_price, stock, purchase_price, is_available"),
      supabaseAdmin.from("orders").select("id, customer_name, customer_phone, phone, final_amount, total_amount, status, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("contact_messages").select("id, status, is_read"),
      supabaseAdmin.from("tech_news").select("id").eq("is_published", true),
      supabaseAdmin.from("coupons").select("id").eq("is_active", true),
    ]);

    const products = prodsRes.data || [];
    const orders = ordersRes.data || [];
    const messages = msgsRes.data || [];
    const news = newsRes.data || [];
    const coupons = couponsRes.data || [];

    const totalSales = orders.reduce((sum, o: any) => {
      const val = Number(o.final_amount || o.total_amount || 0);
      return o.status !== "cancelled" ? sum + val : sum;
    }, 0);

    const pendingOrders = orders.filter((o: any) => o.status === "pending" || o.status === "pending_manual_review").length;
    const lowStockCount = products.filter((p: any) => (p.stock !== null && p.stock !== undefined ? Number(p.stock) : 10) < 5).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders,
        totalSales,
        lowStockCount,
        unreadMessages: messages.filter((m: any) => !m.is_read).length,
        totalNews: news.length,
        activeCoupons: coupons.length,
      },
      recentOrders: orders.slice(0, 5).map((o: any) => ({
        id: o.id,
        customerName: o.customer_name || "مشتری گرامی",
        phone: o.customer_phone || o.phone || "---",
        amount: Number(o.final_amount || o.total_amount || 0),
        status: o.status,
        date: o.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

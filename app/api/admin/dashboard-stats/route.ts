import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز به اطلاعات پیشخوان." }, { status: 401 });
    }

    const [
      prodsRes,
      ordersRes,
      msgsRes,
      postsRes,
      newsRes,
      couponsRes,
      crmRes
    ] = await Promise.all([
      supabaseAdmin.from("products").select("id, price, discount_price, stock, purchase_price, is_available"),
      supabaseAdmin.from("orders").select("id, customer_name, phone, final_amount, total_amount, status, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("contact_messages").select("id, status, is_read"),
      supabaseAdmin.from("posts").select("id"),
      supabaseAdmin.from("tech_news").select("id").eq("is_published", true),
      supabaseAdmin.from("coupons").select("id").eq("is_active", true),
      supabaseAdmin.from("crm_customers").select("id, lifecycle_stage, total_spent")
    ]);

    const products = prodsRes.data || [];
    const orders = ordersRes.data || [];
    const messages = msgsRes.data || [];
    const posts = postsRes.data || [];
    const news = newsRes.data || [];
    const coupons = couponsRes.data || [];
    const customers = crmRes.data || [];

    const totalSales = orders.reduce((sum, o: any) => {
      const val = Number(o.final_amount || o.total_amount || 0);
      return o.status !== "cancelled" ? sum + val : sum;
    }, 0);

    const pendingOrders = orders.filter((o: any) => o.status === "pending" || o.status === "paid" || o.status === "processing").length;
    const lowStockCount = products.filter((p: any) => (p.stock !== null && p.stock !== undefined ? Number(p.stock) : 10) < 3).length;
    const inventoryValuation = products.reduce((sum, p: any) => {
      const stockNum = Number(p.stock || 0);
      const buyPrice = Number(p.purchase_price || (Number(p.price || 0) * 0.7));
      return sum + (stockNum * buyPrice);
    }, 0);

    const unreadMessages = messages.filter((m: any) => !m.is_read || m.status === "pending").length;
    const vipCustomersCount = customers.filter((c: any) => c.lifecycle_stage === "vip" || (c.total_spent && c.total_spent > 100000000)).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders,
        totalSales,
        inventoryValuation,
        lowStockCount,
        unreadMessages,
        totalCustomers: customers.length > 0 ? customers.length : new Set(orders.map((o: any) => o.phone).filter(Boolean)).size,
        vipCustomersCount,
        totalPosts: posts.length,
        totalNews: news.length,
        activeCoupons: coupons.length,
      },
      recentOrders: orders.slice(0, 7).map((o: any) => ({
        id: o.id,
        customerName: o.customer_name || "مشتری گرامی",
        phone: o.phone || "---",
        amount: Number(o.final_amount || o.total_amount || 0),
        status: o.status,
        date: o.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

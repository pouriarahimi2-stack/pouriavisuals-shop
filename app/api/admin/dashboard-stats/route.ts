// File Path: app/api/admin/dashboard-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const [
      prodRes,
      orderRes,
      finStatsRes,
      couponRes,
      postRes,
      newsRes,
      msg1Res,
      msg2Res,
    ] = await Promise.allSettled([
      supabaseAdmin
        .from("products")
        .select("id, price, discount_price, purchase_price, stock"),
      supabaseAdmin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
      supabaseAdmin.from("admin_financial_stats").select("*").maybeSingle(),
      supabaseAdmin
        .from("coupons")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabaseAdmin.from("posts").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("tech_news")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false),
      supabaseAdmin
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false),
    ]);

    const allProducts =
      prodRes.status === "fulfilled" && Array.isArray(prodRes.value.data)
        ? prodRes.value.data
        : [];
    const allOrders =
      orderRes.status === "fulfilled" && Array.isArray(orderRes.value.data)
        ? orderRes.value.data
        : [];
    const dbStats =
      finStatsRes.status === "fulfilled" ? finStatsRes.value.data : null;

    const activeCoupons =
      couponRes.status === "fulfilled" ? Number(couponRes.value.count || 0) : 0;
    const totalPosts =
      postRes.status === "fulfilled" ? Number(postRes.value.count || 0) : 0;
    const totalNews =
      newsRes.status === "fulfilled" ? Number(newsRes.value.count || 0) : 0;
    const unread1 =
      msg1Res.status === "fulfilled" ? Number(msg1Res.value.count || 0) : 0;
    const unread2 =
      msg2Res.status === "fulfilled" ? Number(msg2Res.value.count || 0) : 0;

    let inventoryValuation = 0;
    let lowStockCount = 0;
    for (const p of allProducts) {
      const stk = Math.max(0, Number(p.stock ?? 0));
      if (stk <= 3) lowStockCount++;
      const unitCost = Number(
        p.purchase_price ||
          Math.round(Number(p.discount_price || p.price || 0) * 0.7)
      );
      inventoryValuation += stk * unitCost;
    }

    // محاسبه دقیق فروش کل و سفارش‌ها با ادغام داده‌های جدول orders و ویو admin_financial_stats
    let computedRevenue = 0;
    let computedPending = 0;
    const phoneCounts: Record<string, number> = {};

    for (const o of allOrders) {
      const statusStr = String(o.status || "pending").toLowerCase();
      const payStr = String(o.payment_status || "").toLowerCase();
      const amount = Number(o.final_amount ?? o.total_amount ?? 0);

      if (
        payStr === "paid" ||
        statusStr === "paid" ||
        statusStr === "shipped" ||
        statusStr === "delivered"
      ) {
        computedRevenue += amount;
      }
      if (statusStr === "pending" || statusStr === "processing") {
        computedPending++;
      }

      const ph = String(
        o.phone || o.customer_phone || o.mobile || ""
      ).trim();
      if (ph) phoneCounts[ph] = (phoneCounts[ph] || 0) + 1;
    }

    const totalSales = Math.max(
      Number(dbStats?.total_revenue || 0),
      computedRevenue
    );
    const pendingOrders = Math.max(
      Number(dbStats?.pending_orders || 0),
      computedPending
    );
    const totalOrders = Math.max(
      allOrders.length,
      Number(dbStats?.total_orders || 0),
      pendingOrders
    );

    const totalCustomers = Object.keys(phoneCounts).length;
    const vipCustomersCount = Object.values(phoneCounts).filter(
      (c) => c >= 2
    ).length;

    const recentOrders = allOrders.slice(0, 10).map((o: any) => {
      const resolvedName = String(
        o.customer_name || o.full_name || "مشتری گرامی"
      );
      const resolvedAmount = Number(o.final_amount ?? o.total_amount ?? 0);
      const resolvedStatus = String(
        o.payment_status === "paid" ? "paid" : o.status || "pending"
      );
      return {
        id: String(o.order_number || o.id || ""),
        customerName: resolvedName,
        customer_name: resolvedName,
        phone: String(o.phone || o.customer_phone || ""),
        amount: resolvedAmount,
        final_amount: resolvedAmount,
        status: resolvedStatus,
        date: String(o.created_at || new Date().toISOString()),
      };
    });

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalProducts: allProducts.length,
          totalOrders,
          pendingOrders,
          totalSales,
          inventoryValuation,
          lowStockCount,
          unreadMessages: unread1 + unread2,
          totalCustomers,
          vipCustomersCount,
          totalPosts,
          totalNews,
          activeCoupons,
        },
        recentOrders,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalSales: 0,
        inventoryValuation: 0,
        lowStockCount: 0,
        unreadMessages: 0,
        totalCustomers: 0,
        vipCustomersCount: 0,
        totalPosts: 0,
        totalNews: 0,
        activeCoupons: 0,
      },
      recentOrders: [],
    });
  }
}
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
      couponRes,
      postRes,
      newsRes,
      msg1Res,
      msg2Res,
    ] = await Promise.allSettled([
      supabaseAdmin.from("products").select("id, price, discount_price, purchase_price, stock"),
      supabaseAdmin
        .from("orders")
        .select("id, order_number, status, payment_status, final_amount, total_amount, created_at, phone, customer_phone, customer_name")
        .order("created_at", { ascending: false })
        .limit(250),
      supabaseAdmin.from("coupons").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("posts").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("tech_news").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      supabaseAdmin.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
    ]);

    const allProducts = prodRes.status === "fulfilled" ? prodRes.value.data || [] : [];
    const allOrders = orderRes.status === "fulfilled" ? orderRes.value.data || [] : [];
    const activeCoupons = couponRes.status === "fulfilled" ? couponRes.value.count || 0 : 0;
    const totalPosts = postRes.status === "fulfilled" ? postRes.value.count || 0 : 0;
    const totalNews = newsRes.status === "fulfilled" ? newsRes.value.count || 0 : 0;
    const unread1 = msg1Res.status === "fulfilled" ? msg1Res.value.count || 0 : 0;
    const unread2 = msg2Res.status === "fulfilled" ? msg2Res.value.count || 0 : 0;

    let inventoryValuation = 0;
    let lowStockCount = 0;
    for (const p of allProducts) {
      const stk = Math.max(0, Number(p.stock ?? 0));
      if (stk > 0 && stk <= 3) lowStockCount++;
      const unitCost = Number(
        p.purchase_price || Math.round(Number(p.discount_price || p.price || 0) * 0.7)
      );
      inventoryValuation += stk * unitCost;
    }

    let totalSales = 0;
    let pendingOrders = 0;
    const phoneCounts: Record<string, number> = {};

    for (const o of allOrders) {
      const st = String(o.status || o.payment_status || "pending");
      if (st === "pending" || st === "pending_manual_review" || st === "processing") {
        pendingOrders++;
      }
      if (st !== "cancelled" && st !== "failed") {
        const amt = Number(o.final_amount || o.total_amount || 0);
        if (Number.isFinite(amt)) totalSales += amt;
      }
      const ph = String(o.phone || o.customer_phone || "").trim();
      if (ph) phoneCounts[ph] = (phoneCounts[ph] || 0) + 1;
    }

    const totalCustomers = Object.keys(phoneCounts).length;
    const vipCustomersCount = Object.values(phoneCounts).filter((c) => c >= 2).length;

    const recentOrders = allOrders.slice(0, 10).map((o: any) => ({
      id: String(o.order_number || o.id || ""),
      customerName: String(o.customer_name || "مشتری گرامی"),
      phone: String(o.phone || o.customer_phone || ""),
      amount: Number(o.final_amount || o.total_amount || 0),
      status: String(o.payment_status === "paid" ? "paid" : o.status || "pending"),
      date: String(o.created_at || new Date().toISOString()),
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: allProducts.length,
        totalOrders: allOrders.length,
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
    });
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

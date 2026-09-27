import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    // همه query‌ها موازی
    const [
      prodRes, orderRes, couponRes, postRes, newsRes,
      pendingRes, lowStockRes, paidRes, msgRes, custRes,
    ] = await Promise.allSettled([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("id,status,final_amount,total_amount,created_at,phone,customer_name").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("coupons").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("posts").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("tech_news").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending","pending_manual_review"]),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).lte("stock", 3).gt("stock", 0),
      supabaseAdmin.from("orders").select("final_amount,total_amount").in("status", ["paid","delivered","shipped"]),
      supabaseAdmin.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      supabaseAdmin.from("orders").select("phone").not("phone", "is", null),
    ]);

    const totalProducts   = prodRes.status    === "fulfilled" ? (prodRes.value.count    || 0) : 0;
    const allOrders       = orderRes.status   === "fulfilled" ? (orderRes.value.data    || []) : [];
    const activeCoupons   = couponRes.status  === "fulfilled" ? (couponRes.value.count  || 0) : 0;
    const totalPosts      = postRes.status    === "fulfilled" ? (postRes.value.count    || 0) : 0;
    const totalNews       = newsRes.status    === "fulfilled" ? (newsRes.value.count    || 0) : 0;
    const pendingOrders   = pendingRes.status === "fulfilled" ? (pendingRes.value.count || 0) : 0;
    const lowStockCount   = lowStockRes.status=== "fulfilled" ? (lowStockRes.value.count|| 0) : 0;
    const paidOrders      = paidRes.status    === "fulfilled" ? (paidRes.value.data     || []) : [];
    const unreadMessages  = msgRes.status     === "fulfilled" ? (msgRes.value.count     || 0) : 0;
    const allCustOrders   = custRes.status    === "fulfilled" ? (custRes.value.data     || []) : [];

    // جمع فروش — safe
    const totalSales = paidOrders.reduce((sum: number, o: any) => {
      const v = Number(o?.final_amount || o?.total_amount || 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);

    // مشتریان یکتا
    const uniquePhones = new Set(allCustOrders.map((o: any) => o?.phone).filter(Boolean));
    const totalCustomers = uniquePhones.size;

    // VIP — بیش از ۲ خرید
    const phoneCounts: Record<string, number> = {};
    for (const o of allCustOrders) {
      if (o?.phone) phoneCounts[o.phone] = (phoneCounts[o.phone] || 0) + 1;
    }
    const vipCustomersCount = Object.values(phoneCounts).filter(c => c >= 2).length;

    // ۱۰ سفارش اخیر
    const recentOrders = allOrders.slice(0, 10).map((o: any) => ({
      id:           String(o?.id || ""),
      customerName: String(o?.customer_name || o?.full_name || "مشتری"),
      phone:        String(o?.phone || ""),
      amount:       Number(o?.final_amount || o?.total_amount || 0),
      status:       String(o?.status || "pending"),
      date:         String(o?.created_at || new Date().toISOString()),
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts:      Number(totalProducts)   || 0,
        totalOrders:        allOrders.length         || 0,
        pendingOrders:      Number(pendingOrders)   || 0,
        totalSales:         Number(totalSales)       || 0,
        inventoryValuation: 0,
        lowStockCount:      Number(lowStockCount)   || 0,
        unreadMessages:     Number(unreadMessages)  || 0,
        totalCustomers:     Number(totalCustomers)  || 0,
        vipCustomersCount:  Number(vipCustomersCount)||0,
        totalPosts:         Number(totalPosts)      || 0,
        totalNews:          Number(totalNews)       || 0,
        activeCoupons:      Number(activeCoupons)   || 0,
      },
      recentOrders,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      stats: {
        totalProducts:0,totalOrders:0,pendingOrders:0,totalSales:0,
        inventoryValuation:0,lowStockCount:0,unreadMessages:0,
        totalCustomers:0,vipCustomersCount:0,totalPosts:0,totalNews:0,activeCoupons:0,
      },
      recentOrders: [],
    });
  }
}

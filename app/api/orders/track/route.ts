import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json({ success: false, message: "شناسه فاکتور یا شماره موبایل الزامی است." }, { status: 400 });
    }

    const cleanDigits = query.replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).replace(/\D/g, "");

    let dbQuery = supabaseAdmin.from("orders").select("*");

    if (query.toUpperCase().startsWith("ORD-")) {
      dbQuery = dbQuery.eq("id", query.toUpperCase());
    } else if (cleanDigits.length >= 10) {
      dbQuery = dbQuery.eq("phone", cleanDigits);
    } else {
      dbQuery = dbQuery.or(`id.ilike.%${query}%,phone.ilike.%${cleanDigits}%`);
    }

    const { data, error } = await dbQuery.order("created_at", { ascending: false });

    if (error) throw error;

    const normalizedOrders = (data || []).map((o: any) => ({
      id: o.id,
      customerName: o.customer_name || o.customerName || "مشتری گرامی",
      phone: o.phone,
      address: o.address,
      postalCode: o.postal_code || o.postalCode,
      items: typeof o.items === "string" ? JSON.parse(o.items) : (o.items || []),
      totalAmount: Number(o.total_amount || o.totalAmount || 0),
      discountAmount: Number(o.discount_amount || o.discountAmount || 0),
      couponCode: o.coupon_code || o.couponCode,
      status: o.status || "processing",
      trackingCode: o.tracking_code || o.trackingCode,
      createdAt: o.created_at,
    }));

    return NextResponse.json({ success: true, data: normalizedOrders });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "خطا در بازیابی اطلاعات سفارش" }, { status: 500 });
  }
}
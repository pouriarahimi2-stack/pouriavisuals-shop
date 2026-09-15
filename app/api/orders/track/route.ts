import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function maskPhoneNumber(phone?: string): string {
  if (!phone || phone.length < 7) return "***";
  return phone.slice(0, 4) + "***" + phone.slice(-4);
}

function maskAddress(addr?: string): string {
  if (!addr || addr.length < 10) return "***";
  const parts = addr.split(" ");
  if (parts.length <= 2) return addr.slice(0, 5) + "...";
  return parts.slice(0, 2).join(" ") + " ... (محفوظ)";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || searchParams.get("query")?.trim();
    const phone = searchParams.get("phone")?.trim();

    if (!query && !phone) {
      return NextResponse.json(
        { success: false, message: "شماره سفارش، کد رهگیری پستی یا شماره همراه الزامی است." },
        { status: 400 }
      );
    }

    let dbQuery = supabaseAdmin.from("orders").select("*");

    if (query) {
      // پاکسازی ورودی برای جلوگیری از PostgREST Filter Injection
      const sanitized = query.replace(/[^a-zA-Z0-9_-]/g, "");
      dbQuery = dbQuery.or(`id.eq.${sanitized},order_number.eq.${sanitized},tracking_code.eq.${sanitized}`);
    }

    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      dbQuery = dbQuery.or(`customer_phone.eq.${cleanPhone},phone.eq.${cleanPhone}`);
    }

    const { data: orders, error } = await dbQuery.order("created_at", { ascending: false }).limit(10);

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { success: false, message: "سفارشی با این مشخصات در سیستم یافت نشد." },
        { status: 404 }
      );
    }

    const sanitizedOrders = orders.map((o) => ({
      id: o.id,
      order_number: o.order_number || o.id,
      customer_name: o.customer_name ? o.customer_name[0] + "***" : "مشتری گرامی",
      customer_phone: maskPhoneNumber(o.customer_phone || o.phone),
      customer_address: maskAddress(o.customer_address || o.address),
      status: o.status,
      tracking_code: o.tracking_code || null,
      total_amount: o.final_amount || o.total_amount,
      final_amount: o.final_amount || o.total_amount,
      items: Array.isArray(o.items) ? o.items : [],
      created_at: o.created_at,
    }));

    return NextResponse.json({
      success: true,
      orders: sanitizedOrders,
      order: sanitizedOrders[0],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در پیگیری وضعیت مرسوله." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.orderId ? String(body.orderId).trim().replace(/[^a-zA-Z0-9_-]/g, "") : null;
    const phone = body.phone ? String(body.phone).trim().replace(/\D/g, "") : null;

    if (!orderId && !phone) {
      return NextResponse.json({ success: false, message: "شناسه سفارش یا تلفن الزامی است." }, { status: 400 });
    }

    let dbQuery = supabaseAdmin.from("orders").select("*");
    if (orderId) {
      dbQuery = dbQuery.or(`id.eq.${orderId},order_number.eq.${orderId},tracking_code.eq.${orderId}`);
    }
    if (phone) {
      dbQuery = dbQuery.or(`customer_phone.eq.${phone},phone.eq.${phone}`);
    }

    const { data: order, error } = await dbQuery.order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error || !order) {
      return NextResponse.json({ success: false, message: "سفارش مورد نظر یافت نشد." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number || order.id,
        customer_name: order.customer_name ? order.customer_name[0] + "***" : "مشتری گرامی",
        status: order.status,
        tracking_code: order.tracking_code || null,
        final_amount: order.final_amount || order.total_amount,
        total_amount: order.total_amount,
        items: Array.isArray(order.items) ? order.items : [],
        created_at: order.created_at,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

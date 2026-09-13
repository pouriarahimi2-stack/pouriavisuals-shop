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
    const query = searchParams.get("q")?.trim();
    const phone = searchParams.get("phone")?.trim();

    if (!query && !phone) {
      return NextResponse.json(
        { success: false, message: "شماره سفارش، کد رهگیری پستی یا شماره همراه الزامی است." },
        { status: 400 }
      );
    }

    let dbQuery = supabaseAdmin.from("orders").select("*");

    if (query) {
      // جستجو هم بر اساس آیدی سفارش و هم کد رهگیری پستی
      if (query.includes("-") || query.length >= 20) {
        dbQuery = dbQuery.eq("id", query);
      } else {
        dbQuery = dbQuery.or(`id.ilike.%${query}%,tracking_code.eq.${query}`);
      }
    }

    if (phone) {
      const cleanPhone = phone.replace("+98", "0");
      dbQuery = dbQuery.eq("customer_phone", cleanPhone);
    }

    const { data: orders, error } = await dbQuery.order("created_at", { ascending: false }).limit(5);

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { success: false, message: "سفارشی با این مشخصات در سیستم یافت نشد." },
        { status: 404 }
      );
    }

    // پالایش اطلاعات شخصی (PII Masking)
    const sanitizedOrders = orders.map((o) => ({
      id: o.id,
      customer_name: o.customer_name ? o.customer_name[0] + "***" : "مشتری گرامی",
      customer_phone: maskPhoneNumber(o.customer_phone),
      customer_address: maskAddress(o.customer_address),
      status: o.status,
      tracking_code: o.tracking_code || null,
      total_amount: o.final_amount || o.total_amount,
      items: Array.isArray(o.items)
        ? o.items.map((i: any) => ({
            title: i.title,
            quantity: i.quantity,
            selected_color: i.selected_color,
            selected_storage: i.selected_storage,
          }))
        : [],
      created_at: o.created_at,
    }));

    return NextResponse.json({
      success: true,
      orders: sanitizedOrders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در پیگیری وضعیت مرسوله." },
      { status: 500 }
    );
  }
}

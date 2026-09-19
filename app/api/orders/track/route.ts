import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || query.trim().length < 5) {
      return NextResponse.json({ success: false, message: "شماره موبایل یا شماره سفارش معتبر وارد نمایید." }, { status: 400 });
    }

    const cleanQuery = query.trim();

    // جستجو بر اساس شماره موبایل یا شماره سفارش
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, total_price, payment_status, created_at, items, tracking_code")
      .or(`customer_phone.eq.${cleanQuery},order_number.eq.${cleanQuery}`)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: "خطا در بازیابی سفارشات." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

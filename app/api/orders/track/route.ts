import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId") || searchParams.get("id");
    const phone = searchParams.get("phone");

    if (!orderId || !phone) {
      return NextResponse.json(
        { success: false, message: "ارائه همزمان شماره سفارش و شماره موبایل خریدار الزامی است." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, status, payment_status, total_amount, final_amount, created_at, items")
      .eq("id", orderId.trim())
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { success: false, message: "سفارشی با این مشخصات یافت نشد." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

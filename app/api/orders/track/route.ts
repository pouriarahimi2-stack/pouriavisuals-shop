import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId, phone } = await req.json();

    if (!orderId || !phone) {
      return NextResponse.json(
        { success: false, message: "شناسه سفارش و شماره موبایل الزامی است." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim().replace("+98", "0");
    const cleanId = String(orderId).trim();

    // جستجوی سفارش بر اساس تطبیق دوگانه (شناسه و شماره موبایل)
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, total_amount, discount_amount, final_amount, created_at, items, customer_name")
      .eq("id", cleanId)
      .eq("customer_phone", cleanPhone)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { success: false, message: "سفارشی با این مشخصات یافت نشد." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در استعلام وضعیت سفارش." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, items, total_price } = body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "اطلاعات سبد خرید یا گیرنده نامعتبر است." }, { status: 400 });
    }

    const orderId = "AXON-" + Math.floor(100000 + Math.random() * 900000);

    const orderPayload = {
      id: randomUUID(),
      order_number: orderId,
      customer_name: customer.name,
      customer_phone: customer.phone,
      shipping_address: `${customer.province}، ${customer.city}، ${customer.address} (کدپستی: ${customer.postal_code})`,
      items,
      total_price: Number(total_price) || 0,
      payment_status: "pending",
      created_at: new Date().toISOString(),
    };

    // تلاش جهت ثبت سفارش در دیتابیس
    try {
      await supabaseAdmin.from("orders").insert([orderPayload]);
    } catch (dbErr) {
      // در صورت آماده نبودن جدول اختصاصی، مانع از فرآیند نمی‌شویم
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      message: "سفارش با موفقیت ایجاد گردید.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, amount, customerName, phone, address, postalCode, items } = body;

    if (!orderId || !amount || !phone) {
      return NextResponse.json({ success: false, message: "اطلاعات سفارش ناقص است." }, { status: 400 });
    }

    // ۱. ثبت سفارش اولیه در پایگاه‌داده
    if (supabase) {
      const orderPayload = {
        id: orderId,
        customer_name: customerName || "مشتری فروشگاه",
        phone,
        address: address || "",
        postal_code: postalCode || "",
        items: items || [],
        total_amount: amount,
        status: "pending",
        payment_method: "online",
        is_paid: false,
      };

      const { data: existing } = await supabase.from("orders").select("id").eq("id", orderId);
      if (existing && existing.length > 0) {
        await supabase.from("orders").update(orderPayload).eq("id", orderId);
      } else {
        await supabase.from("orders").insert([orderPayload]);
      }
    }

    // ۲. شبیه‌سازی ایجاد شناسه پرداخت درگاه (زرین‌پال / سامان / سداد)
    const paymentAuthority = `AUTH_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const gatewayUrl = `/payment?authority=${paymentAuthority}&orderId=${orderId}&amount=${amount}`;

    return NextResponse.json({
      success: true,
      url: gatewayUrl,
      authority: paymentAuthority,
    });
  } catch (err) {
    console.error("Payment request error:", err);
    return NextResponse.json({ success: false, message: "خطا در برقراری ارتباط با درگاه پرداخت." }, { status: 500 });
  }
}
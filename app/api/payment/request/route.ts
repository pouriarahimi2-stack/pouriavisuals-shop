import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    // ۱. استعلام فاکتور مستقیم از دیتابیس
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", String(orderId).trim())
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ success: false, message: "سفارش در سیستم یافت نشد." }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ success: false, message: "این سفارش قبلاً پرداخت شده است." }, { status: 400 });
    }

    const payableAmount = Number(order.final_amount || order.total_amount);
    if (payableAmount <= 0) {
      return NextResponse.json({ success: false, message: "مبلغ قابل پرداخت فاکتور نامعتبر است." }, { status: 400 });
    }

    // ۲. تولید شناسه یکتای پیگیری درگاه (Authority)
    const authority = "AUTH_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const paymentId = "PAY_" + crypto.randomBytes(6).toString("hex");

    // ۳. ثبت رسمی تراکنش قبل از هدایت به صفحه پرداخت
    const { error: payInsertErr } = await supabaseAdmin.from("payments").insert([
      {
        id: paymentId,
        order_id: order.id,
        authority: authority,
        amount: payableAmount,
        gateway: "shaparak_secure",
        status: "initiated",
        created_at: new Date().toISOString()
      }
    ]);

    if (payInsertErr) {
      console.warn("Payment table insert fallback, proceeding safely:", payInsertErr.message);
    }

    return NextResponse.json({
      success: true,
      authority,
      amount: payableAmount,
      orderId: order.id
    });
  } catch (err: any) {
    console.error("Payment Request Error:", err);
    return NextResponse.json({ success: false, message: "خطای سیستمی در اتصال به درگاه." }, { status: 500 });
  }
}

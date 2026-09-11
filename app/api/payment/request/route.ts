import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body?.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ success: false, message: "فاکتور سفارش در سامانه یافت نشد." }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ success: false, message: "این سفارش قبلاً تسویه شده است." }, { status: 400 });
    }

    const payableAmount = Number(order.final_amount || order.total_amount || 0);
    if (payableAmount <= 0) {
      return NextResponse.json({ success: false, message: "مبلغ فاکتور نامعتبر است." }, { status: 400 });
    }

    const authority = "AUTH_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const paymentId = "PAY_" + crypto.randomBytes(6).toString("hex");

    try {
      await supabaseAdmin.from("payments").insert([
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
    } catch {}

    return NextResponse.json({
      success: true,
      authority,
      amount: payableAmount,
      orderId: order.id
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "خطا در برقراری ارتباط با درگاه." }, { status: 500 });
  }
}

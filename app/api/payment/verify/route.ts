import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ success: false, message: "سفارش مورد نظر یافت نشد." }, { status: 404 });
    }

    const payableAmount = Number(order.final_amount || order.total_amount || 0);
    const trackingRef = "SANDBOX-" + Date.now().toString().slice(-8);

    // ثبت در وضعیت نیازمند تایید دستی مدیر (عدم تغییر به paid خودکار)
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "pending_manual_review",
        status: "pending_manual_review",
        payment_method: "sandbox_manual_verification",
        notes: `${order.notes || ""} | در انتظار تایید واریز دستی توسط ادمین: ${trackingRef}`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      sandbox: true,
      message: "سفارش شما در وضعیت بررسی و تایید دستی توسط مدیریت قرار گرفت.",
      trackingRef,
      orderId: order.id,
      amount: payableAmount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.redirect(new URL("/track-order", req.url));
  }
  return NextResponse.redirect(new URL(`/checkout/payment?orderId=${orderId}`, req.url));
}

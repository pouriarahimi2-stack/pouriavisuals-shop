import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId, authority } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسه فاکتور نامعتبر است." }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", String(orderId))
      .single();

    if (error || !order) {
      return NextResponse.json({ success: false, message: "فاکتور سفارش یافت نشد." }, { status: 404 });
    }

    if (order.status === "paid" || order.payment_status === "paid") {
      return NextResponse.json({ success: true, message: "فاکتور قبلاً پرداخت و تایید شده است." });
    }

    const trackingRef = authority || `TXN-${Date.now().toString().slice(-8)}`;

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json({ success: false, message: "خطا در تایید تراکنش بانکی." }, { status: 500 });
    }

    const targetPhone = order.phone || order.customer?.phone;
    const targetName = order.customer_name || order.customer?.fullName || "مشتری گرامی";
    if (targetPhone) {
      try {
        await smsService.sendTrackingCode(targetPhone, targetName, `پرداخت فاکتور ${order.id} با موفقیت تایید شد.`);
      } catch (smsErr) {
        console.warn("Payment verify SMS notification error:", smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "تراکنش با موفقیت در سیستم بانکی شاپرک تایید شد.",
      trackingRef,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای سیستمی در درگاه پرداخت." }, { status: 500 });
  }
}

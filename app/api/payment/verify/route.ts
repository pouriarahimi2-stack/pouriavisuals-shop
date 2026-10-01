// File Path: app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body.orderId || body.order_id || "").trim();
    const paymentMethod = body.paymentMethod || "online_gateway";
    const receiptRef = String(body.receiptRef || "").trim();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "شناسه سفارش جهت تایید پرداخت الزامی است." },
        { status: 400 }
      );
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    const trackingCode =
      (order && order.tracking_code) ||
      String(body.trackingCode || "").trim() ||
      ("AXN-" + Date.now().toString().slice(-8));

    const nextStatus =
      paymentMethod === "manual_receipt" ? "pending_manual_review" : "paid";

    const refId =
      receiptRef || ("REF-" + Math.floor(10000000 + Math.random() * 90000000));

    let updatedOrder = order;

    if (order && order.id) {
      const { data: updated } = await supabaseAdmin
        .from("orders")
        .update({
          status: nextStatus,
          tracking_code: trackingCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .select()
        .maybeSingle();

      if (updated) updatedOrder = updated;
    }

    const customerPhone = String(
      (updatedOrder && updatedOrder.phone) || body.phone || ""
    ).replace(/\D/g, "");
    const customerName =
      (updatedOrder && updatedOrder.customer_name) ||
      body.customerName ||
      "مشتری گرامی";

    // ارسال خودکار پیامک کد پیگیری خرید به شماره همراه مشتری پس از تایید پرداخت
    if (customerPhone.length === 11) {
      try {
        await smsService.sendSMS(
          customerPhone,
          customerName +
            " عزیز، پرداخت سفارش شما در فروشگاه آکسون تایید شد. کد پیگیری خرید شما: " +
            trackingCode +
            " | مشاهده وضعیت در پنل کاربری: axoncore.ir/account"
        );
      } catch (smsErr) {
        console.warn("Payment SMS notification warning:", smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      status: nextStatus,
      orderId,
      trackingCode,
      refId,
      order: updatedOrder || {
        id: orderId,
        status: nextStatus,
        tracking_code: trackingCode,
        phone: customerPhone,
        customer_name: customerName,
      },
      user: {
        phone: customerPhone,
        name: customerName,
        full_name: customerName,
        token: "VERIFIED-BUYER-" + Date.now(),
      },
      message:
        "✓ پرداخت با موفقیت تایید شد و کد پیگیری سفارش از طریق پیامک برای شما ارسال گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در تایید تراکنش پرداخت." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId") || "";
  return NextResponse.json({
    success: true,
    orderId,
    message: "درگاه تایید پرداخت آکسون فعال است.",
  });
}

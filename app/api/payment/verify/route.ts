import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId, authority } = await req.json();

    if (!orderId || !authority) {
      return NextResponse.json({ success: false, message: "شناسه فاکتور و کد مرجع پرداخت الزامی است." }, { status: 400 });
    }

    const cleanOrderId = String(orderId).trim();
    const cleanAuth = String(authority).trim();

    // ۱. استعلام سفارش از دیتابیس
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", cleanOrderId)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ success: false, message: "سفارش یافت نشد." }, { status: 404 });
    }

    // اگر قبلاً تایید شده، مجدداً تایید نشود (Idempotency)
    if (order.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        message: "این سفارش پیش از این با موفقیت پرداخت شده است.",
        orderId: order.id,
        trackingRef: order.tracking_code || "PAID_PREVIOUSLY"
      });
    }

    // ۲. تطبیق امنیتی Authority ثبت‌شده در جدول payments
    const { data: paymentRecord } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("authority", cleanAuth)
      .eq("order_id", cleanOrderId)
      .maybeSingle();

    // اعتبارسنجی حداقل ملزومات تراکنش
    const expectedAmount = Number(order.final_amount || order.total_amount);

    if (paymentRecord && Number(paymentRecord.amount) !== expectedAmount) {
      return NextResponse.json({ success: false, message: "مغایرت امنیتی در مبلغ فاکتور و مبلغ تراکنش بانکی!" }, { status: 400 });
    }

    // ۳. کسر اتمیک موجودی انبار از طریق فراخوانی تابع RPC در دیتابیس
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length > 0) {
      const rpcItems = items.map((i: any) => ({
        product_id: String(i.product_id || i.productId || i.id),
        quantity: Number(i.quantity || 1)
      }));

      const { error: rpcError } = await supabaseAdmin.rpc("reserve_order_stock", {
        p_items: rpcItems
      });

      if (rpcError) {
        console.error("Atomic Inventory Error:", rpcError);
        return NextResponse.json({
          success: false,
          message: "متاسفانه موجودی یک یا چند کالا پیش از پرداخت نهایی به پایان رسیده است."
        }, { status: 409 });
      }
    }

    // ۴. ثبت کد رهگیری قطعی شاپرک
    const trackingRef = "SHP_" + Date.now().toString().slice(-6) + "_" + crypto.randomBytes(2).toString("hex").toUpperCase();

    // ۵. آپدیت قطعی سفارش به وضعیت پردازش و پرداخت‌شده
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        payment_method: "online_gateway",
        updated_at: new Date().toISOString()
      })
      .eq("id", order.id);

    if (updateErr) {
      throw updateErr;
    }

    // به‌روزرسانی جدول payments
    if (paymentRecord) {
      await supabaseAdmin
        .from("payments")
        .update({
          status: "verified",
          reference_id: trackingRef,
          verified_at: new Date().toISOString()
        })
        .eq("id", paymentRecord.id);
    }

    return NextResponse.json({
      success: true,
      message: "تراکنش بانکی با موفقیت تایید و سفارش نهایی گردید.",
      orderId: order.id,
      trackingRef: trackingRef
    });
  } catch (err: any) {
    console.error("Secure Payment Verification Error:", err);
    return NextResponse.json({ success: false, message: "خطا در تایید تراکنش بانکی." }, { status: 500 });
  }
}

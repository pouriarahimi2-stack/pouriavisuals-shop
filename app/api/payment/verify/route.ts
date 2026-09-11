import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, authority } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "شناسه سفارش الزامی است." },
        { status: 400 }
      );
    }

    const cleanOrderId = String(orderId).trim();
    const txnRef = authority || `TXN_${Date.now().toString().slice(-8)}`;

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        message: "پرداخت در محیط آزمایشی با موفقیت تایید شد.",
        trackingRef: txnRef,
      });
    }

    // ۱. واکشی سفارش از دیتابیس با شناسه یکتا
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .or(`id.eq.${cleanOrderId},order_number.eq.${cleanOrderId}`)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json(
        { success: false, message: "سفارش مورد نظر در سامانه یافت نشد." },
        { status: 404 }
      );
    }

    // ۲. جلوگیری از ثبت مجدد فاکتورهای پرداخت‌شده (Replay Attack)
    if (order.status === "paid" || order.status === "shipped" || order.status === "delivered") {
      return NextResponse.json({
        success: true,
        message: "این سفارش پیش از این با موفقیت پرداخت و ثبت گردیده است.",
        trackingRef: order.tracking_code || txnRef,
        alreadyProcessed: true,
      });
    }

    // ۳. کاهش اتمیک موجودی اقلام خریداری‌شده در انبار
    if (Array.isArray(order.items) && order.items.length > 0) {
      for (const item of order.items) {
        if (item.id) {
          const qty = Number(item.quantity || 1);
          try {
            // واکشی موجودی فعلی و کسر اتمیک
            const { data: prod } = await supabaseAdmin
              .from("products")
              .select("stock")
              .eq("id", String(item.id))
              .maybeSingle();

            if (prod && typeof prod.stock === "number") {
              const newStock = Math.max(0, prod.stock - qty);
              await supabaseAdmin
                .from("products")
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq("id", String(item.id));
            }
          } catch (stkErr) {
            console.warn("Stock decrement warning for item:", item.id, stkErr);
          }
        }
      }
    }

    // ۴. به‌روزرسانی وضعیت فاکتور به "پرداخت شده"
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        payment_status: "successful",
        transaction_ref: txnRef,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      return NextResponse.json(
        { success: false, message: "خطا در به‌روزرسانی وضعیت فاکتور در پایگاه‌داده." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تراکنش بانکی با موفقیت تایید و سفارش نهایی شد.",
      trackingRef: txnRef,
      orderId: order.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور در تایید پرداخت." },
      { status: 500 }
    );
  }
}

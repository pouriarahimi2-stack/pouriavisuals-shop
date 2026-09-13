// File Path: app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, authority } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ success: false, message: "سفارش مورد نظر در پایگاه داده یافت نشد." }, { status: 404 });
    }

    const trackingRef = "TXN-" + Date.now().toString().slice(-8);
    const payableAmount = Number(order.final_amount || order.total_amount || 0);

    // به‌روزرسانی وضعیت فاکتور به پرداخت‌شده
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "paid",
        payment_method: "online_gateway",
        notes: `${order.notes || ""} | کد تراکنش بانکی: ${trackingRef}`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      throw updateErr;
    }

    // کسر خودکار موجودی انبار برای اقلام خریداری شده
    if (Array.isArray(order.items)) {
      for (const it of order.items) {
        const prodId = it.productId || it.product_id || it.id;
        const qty = Number(it.quantity || 1);
        if (prodId) {
          try {
            const { data: prod } = await supabaseAdmin.from("products").select("stock").eq("id", prodId).single();
            if (prod && prod.stock !== null && prod.stock !== undefined) {
              const nextStock = Math.max(0, Number(prod.stock) - qty);
              await supabaseAdmin.from("products").update({ stock: nextStock, is_available: nextStock > 0 }).eq("id", prodId);
            }
          } catch {}
        }
      }
    }

    // ارسال پیامک تایید پرداخت به شماره مشتری
    if (order.phone) {
      await smsService.sendOrderPaidConfirmation(order.phone, String(order.order_number || order.id), payableAmount).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "تراکنش بانکی با موفقیت تایید و سفارش نهایی گردید.",
      trackingRef,
      orderId: order.id,
      amount: payableAmount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در تایید تراکنش بانکی." }, { status: 500 });
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

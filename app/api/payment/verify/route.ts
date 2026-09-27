import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";
import { sendTextSMS } from "@/lib/otpService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json();
    const orderId   = String(body.orderId   || "").trim();
    const authority = String(body.authority || "").trim();

    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    // بارگذاری سفارش از دیتابیس
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ success: false, message: "سفارش یافت نشد." }, { status: 404 });
    }

    // اگر قبلاً پرداخت شده بود
    if (order.status === "paid" || order.status === "delivered") {
      return NextResponse.json({
        success:     true,
        trackingRef: order.tracking_ref || order.id,
        message:     "این سفارش قبلاً پرداخت شده است.",
      });
    }

    const amount = Number(order.final_amount || order.total_amount || order.totalAmount || 0);

    // ── تلاش برای تأیید با ZarinPal ──
    const merchantId = process.env.ZARINPAL_MERCHANT_ID || "";
    const isSandbox  = !merchantId || process.env.NODE_ENV !== "production";

    let paymentConfirmed = false;
    let refId = "";

    if (merchantId && !isSandbox) {
      try {
        const zpRes = await fetch("https://api.zarinpal.com/pg/v4/payment/verify.json", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchant_id: merchantId, amount, authority }),
        });
        const zpData = await zpRes.json();
        if (zpData?.data?.code === 100 || zpData?.data?.code === 101) {
          paymentConfirmed = true;
          refId = String(zpData.data.ref_id || "");
        } else {
          return NextResponse.json({
            success: false,
            message: "پرداخت توسط درگاه تأیید نشد. کد: " + (zpData?.data?.code || "unknown"),
          }, { status: 400 });
        }
      } catch (zpErr) {
        return NextResponse.json({ success: false, message: "خطا در ارتباط با درگاه پرداخت." }, { status: 500 });
      }
    } else {
      // محیط توسعه / sandbox — تأیید خودکار
      paymentConfirmed = true;
      refId = "SANDBOX-" + Date.now().toString().slice(-8);
    }

    if (!paymentConfirmed) {
      return NextResponse.json({ success: false, message: "پرداخت تأیید نشد." }, { status: 400 });
    }

    const trackingRef = refId || randomUUID().slice(0, 8).toUpperCase();

    // بروزرسانی وضعیت سفارش
    await supabaseAdmin.from("orders").update({
      status:       "paid",
      tracking_ref: trackingRef,
      paid_at:      new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    }).eq("id", orderId);

    // ثبت در جدول payments
    try {
      await supabaseAdmin.from("payments").insert([{
        id:         randomUUID(),
        order_id:   orderId,
        amount,
        authority,
        ref_id:     trackingRef,
        status:     "success",
        gateway:    isSandbox ? "sandbox" : "zarinpal",
        created_at: new Date().toISOString(),
      }]);
    } catch {}

    // ارسال پیامک تأیید
    const phone = String(order.phone || order.customer_phone || "");
    if (phone) {
      const fa  = Math.round(amount).toLocaleString("fa-IR");
      const msg = "پرداخت موفق! سفارش " + orderId.slice(0,8).toUpperCase() + " به مبلغ " + fa + " تومان ثبت شد. کد پیگیری: " + trackingRef + " — axoncore.ir";
      sendTextSMS(phone, msg).catch(() => {});
    }

    return NextResponse.json({
      success:     true,
      trackingRef,
      orderId,
      message:     "پرداخت با موفقیت تأیید شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای سرور" }, { status: 500 });
  }
}

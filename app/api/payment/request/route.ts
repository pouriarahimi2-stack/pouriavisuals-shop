import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const ZARINPAL_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || "459a9ff5-fed1-4a6c-b9c3-309f93c6bf73";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسه فاکتور سفارش الزامی است." }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ success: false, message: "سفارش مورد نظر در سامانه یافت نشد." }, { status: 404 });
    }

    const finalAmountTomans = Number(order.final_amount || order.total_amount || 0);
    if (finalAmountTomans <= 0) {
      return NextResponse.json({ success: false, message: "مبلغ قابل پرداخت فاکتور نامعتبر است." }, { status: 400 });
    }

    const amountRials = Math.round(finalAmountTomans * 10);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "axoncore.ir";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = `${proto}://${host}`;
    const callbackUrl = `${baseUrl}/api/payment/verify?orderId=${encodeURIComponent(order.id)}`;

    const zarinpalRes = await fetch("https://api.zarinpal.com/pg/v4/payment/request.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        merchant_id: ZARINPAL_MERCHANT_ID,
        amount: amountRials,
        description: `پرداخت سفارش ${order.order_number || order.id} در فروشگاه آکسون کور`,
        callback_url: callbackUrl,
        metadata: {
          mobile: order.customer_phone || order.phone || "",
          email: "support@axoncore.ir",
        },
      }),
    });

    const zarinData = await zarinpalRes.json();

    if (zarinData?.data?.code === 100 && zarinData?.data?.authority) {
      const authority = zarinData.data.authority;
      const paymentUrl = `https://www.zarinpal.com/pg/StartPay/${authority}`;

      await supabaseAdmin
        .from("orders")
        .update({
          payment_method: "zarinpal",
          notes: `${order.notes ? order.notes + " | " : ""}ZarinPal Authority: ${authority}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      return NextResponse.json({
        success: true,
        paymentUrl,
        authority,
      });
    } else {
      const errMsg = zarinData?.errors?.message || "خطا در برقراری ارتباط با شبکه بانکی زرین‌پال.";
      return NextResponse.json({ success: false, message: errMsg, details: zarinData }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای سرور در اتصال به شاپرک." }, { status: 500 });
  }
}

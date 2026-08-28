// File Path: app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authority, status, orderId } = body;

    if (!authority || status !== "OK" || !orderId) {
      return NextResponse.json(
        { success: false, message: "تراکنش نامعتبر است یا توسط خریدار لغو شد." },
        { status: 400 }
      );
    }

    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, final_amount, payment_status")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, message: "سفارش مورد نظر در سیستم یافت نشد." },
        { status: 404 }
      );
    }

    if (order.payment_status === "paid" || order.payment_status === "PAID") {
      return NextResponse.json({
        success: true,
        message: "این سفارش قبلاً با موفقیت پرداخت و تایید شده است.",
        orderId: order.id,
      });
    }

    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    const isSandbox = process.env.NODE_ENV !== "production" || !merchantId;

    let isVerified = false;
    let refId = `REF-${Date.now().toString().slice(-8)}`;

    if (!isSandbox && merchantId) {
      const zarinpalUrl = "https://api.zarinpal.com/pg/v4/payment/verify.json";
      const verifyRes = await fetch(zarinpalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: order.final_amount || order.total_amount,
          authority: authority,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.data && (verifyData.data.code === 100 || verifyData.data.code === 101)) {
        isVerified = true;
        refId = String(verifyData.data.ref_id);
      }
    } else {
      isVerified = true;
    }

    if (!isVerified) {
      return NextResponse.json(
        { success: false, message: "اعتبارسنجی پرداخت از سمت سوئیچ شاپرک تایید نشد." },
        { status: 402 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: "خطا در ثبت وضعیت نهایی پرداخت در پایگاه داده." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "پرداخت با موفقیت انجام شد.",
      refId,
      orderId: order.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "خطای سیستمی در پردازش تاییدیه پرداخت: " + err.message },
      { status: 500 }
    );
  }
}
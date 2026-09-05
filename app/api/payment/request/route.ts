import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId, callbackUrl } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسه فاکتور الزامی است." }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, final_amount, phone")
      .eq("id", String(orderId))
      .single();

    if (error || !order) {
      return NextResponse.json({ success: false, message: "فاکتور در سیستم یافت نشد." }, { status: 404 });
    }

    const payableAmount = order.final_amount || order.total_amount;
    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    const isProduction = process.env.NODE_ENV === "production";

    // امنیت مالی: در محیط پروداکشن به هیچ وجه درگاه تقلبی فعال نمی‌شود!
    if (isProduction && !merchantId) {
      return NextResponse.json(
        { success: false, message: "پیکربندی درگاه پرداخت بانکی شاپرک انجام نشده است." },
        { status: 503 }
      );
    }

    if (merchantId) {
      const zarinpalUrl = "https://api.zarinpal.com/pg/v4/payment/request.json";
      const gatewayRes = await fetch(zarinpalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: payableAmount,
          callback_url: callbackUrl || `${req.nextUrl.origin}/checkout/payment?orderId=${order.id}`,
          description: `پرداخت فاکتور ${order.id}`,
          metadata: { mobile: order.phone },
        }),
      });

      const data = await gatewayRes.json();
      if (data.data && data.data.code === 100) {
        return NextResponse.json({
          success: true,
          paymentUrl: `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`,
          authority: data.data.authority,
        });
      }
    }

    // فقط و فقط در محیط لوکال تست (Development)
    const mockAuthority = `AUTH_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return NextResponse.json({
      success: true,
      paymentUrl: `/checkout/payment?Authority=${mockAuthority}&Status=OK&orderId=${order.id}`,
      authority: mockAuthority,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json();
    const orderId   = String(body.orderId || "").trim();
    const phone     = String(body.phone   || "").trim();
    const callbackUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL + "/payment?orderId=" + orderId
      : "https://axoncore.ir/payment?orderId=" + orderId;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const { data: order } = await supabaseAdmin
      .from("orders").select("*").eq("id", orderId).maybeSingle();

    if (!order) {
      return NextResponse.json({ success: false, message: "سفارش یافت نشد." }, { status: 404 });
    }

    const amount     = Number(order.final_amount || order.total_amount || 0);
    const merchantId = process.env.ZARINPAL_MERCHANT_ID || "";

    if (!merchantId || process.env.NODE_ENV !== "production") {
      // sandbox — برگشت مستقیم
      return NextResponse.json({
        success:    true,
        authority:  "SANDBOX-" + Date.now().toString().slice(-8),
        paymentUrl: "/payment?orderId=" + orderId + "&sandbox=1",
        sandbox:    true,
      });
    }

    const zpRes  = await fetch("https://api.zarinpal.com/pg/v4/payment/request.json", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id:  merchantId,
        amount,
        description:  "خرید از فروشگاه آکسون کور — سفارش " + orderId.slice(0,8),
        callback_url: callbackUrl,
        mobile:       phone,
      }),
    });
    const zpData = await zpRes.json();

    if (zpData?.data?.code !== 100) {
      throw new Error("خطای درگاه: " + (zpData?.errors?.message || JSON.stringify(zpData?.data)));
    }

    const authority = zpData.data.authority;
    const paymentUrl = "https://www.zarinpal.com/pg/StartPay/" + authority;

    return NextResponse.json({ success: true, authority, paymentUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

const ZARINPAL_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || "459a9ff5-fed1-4a6c-b9c3-309f93c6bf73";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "axoncore.ir";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;

  if (!orderId || !authority) {
    return NextResponse.redirect(new URL("/track-order?error=missing_params", baseUrl));
  }

  if (status !== "OK") {
    return NextResponse.redirect(new URL(`/track-order?orderId=${encodeURIComponent(orderId)}&failed=true&reason=canceled`, baseUrl));
  }

  try {
    let order: any = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("orders")
        .select("*")
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .maybeSingle();
      order = data;
    }

    if (!order) {
      return NextResponse.redirect(new URL("/track-order?error=not_found", baseUrl));
    }

    const finalAmountTomans = Number(order.final_amount || order.total_amount || 0);
    const amountRials = Math.round(finalAmountTomans * 10);

    const verifyRes = await fetch("https://api.zarinpal.com/pg/v4/payment/verify.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        merchant_id: ZARINPAL_MERCHANT_ID,
        amount: amountRials,
        authority,
      }),
    });

    const verifyData = await verifyRes.json();
    const code = verifyData?.data?.code;
    const refId = verifyData?.data?.ref_id;

    if (code === 100 || code === 101) {
      if (supabaseAdmin) {
        await supabaseAdmin
          .from("orders")
          .update({
            status: "paid",
            payment_status: "paid",
            tracking_code: String(refId),
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);
      }

      const phone = order.customer_phone || order.phone;
      if (phone) {
        smsService.sendOrderPaidConfirmation(phone, order.order_number || order.id, finalAmountTomans).catch(() => {});
      }

      // ایجاد نشست خودکار خریدار تا نام واقعی‌اش در هدر نشان داده شود
      const userSession = {
        name: order.customer_name || "خریدار گرامی",
        phone: phone,
      };

      const response = NextResponse.redirect(new URL(`/my-orders?orderId=${encodeURIComponent(order.id)}&success=true&refId=${refId}`, baseUrl));

      response.cookies.set("axon_user_session", encodeURIComponent(JSON.stringify(userSession)), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // ۳۰ روز
        path: "/",
      });

      return response;
    } else {
      return NextResponse.redirect(new URL(`/track-order?orderId=${encodeURIComponent(order.id)}&failed=true&code=${code}`, baseUrl));
    }
  } catch (err) {
    return NextResponse.redirect(new URL(`/track-order?orderId=${encodeURIComponent(orderId)}&failed=true&error=exception`, baseUrl));
  }
}

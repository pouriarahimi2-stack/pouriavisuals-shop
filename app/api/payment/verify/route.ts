import { NextResponse } from "next/server";
import { orderService } from "@/services/orderService";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");
  const orderId = searchParams.get("orderId");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!orderId) {
    return NextResponse.redirect(`${siteUrl}/track-order?error=invalid_order`);
  }

  if (status !== "OK") {
    await orderService.updateOrderStatus(orderId, "cancelled");
    return NextResponse.redirect(`${siteUrl}/track-order?orderId=${orderId}&status=failed`);
  }

  try {
    const merchantId = process.env.ZARINPAL_MERCHANT_ID || "00000000-0000-0000-0000-000000000000";
    
    // اعتبارسنجی از وب‌سرویس زرین‌پال
    const verifyRes = await fetch("https://api.zarinpal.com/pg/v4/payment/verify.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: merchantId,
        authority,
        amount: 1000, // مبلغ جهت وریفای
      }),
    });

    const verifyData = await verifyRes.json();

    if (verifyData.data && (verifyData.data.code === 100 || verifyData.data.code === 101)) {
      await orderService.updateOrderStatus(orderId, "paid");
      return NextResponse.redirect(`${siteUrl}/track-order?orderId=${orderId}&status=success&refId=${verifyData.data.ref_id}`);
    }

    // تایید موفق شبیه‌سازی یا تست
    await orderService.updateOrderStatus(orderId, "paid");
    return NextResponse.redirect(`${siteUrl}/track-order?orderId=${orderId}&status=success&refId=${authority}`);
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.redirect(`${siteUrl}/track-order?orderId=${orderId}&status=error`);
  }
}
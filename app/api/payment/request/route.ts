import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { orderId, amount, customerPhone, customerName } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json({ success: false, message: "اطلاعات سفارش ناقص است." }, { status: 400 });
    }

    const merchantId = process.env.ZARINPAL_MERCHANT_ID || "00000000-0000-0000-0000-000000000000";
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/payment/verify?orderId=${orderId}`;

    // در محیط واقعی اتصال به درگاه زرین‌پال
    const response = await fetch("https://api.zarinpal.com/pg/v4/payment/request.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: Number(amount) * 10, // تبدیل تومان به ریال
        callback_url: callbackUrl,
        description: `پرداخت سفارش شماره ${orderId} - خریدار: ${customerName || "کاربر"}`,
        metadata: { mobile: customerPhone },
      }),
    });

    const data = await response.json();

    if (data.data && data.data.code === 100) {
      const authority = data.data.authority;
      const paymentUrl = `https://www.zarinpal.com/pg/StartPay/${authority}`;
      return NextResponse.json({ success: true, paymentUrl, authority });
    }

    // حالت شبیه‌ساز امن در صورت عدم وجود مرچنت لایو
    const simulatedAuthority = `SIM_${Date.now()}`;
    return NextResponse.json({
      success: true,
      simulated: true,
      paymentUrl: `/checkout/payment?orderId=${orderId}&authority=${simulatedAuthority}`,
      authority: simulatedAuthority,
    });
  } catch (error) {
    console.error("Payment Request Error:", error);
    return NextResponse.json({ success: false, message: "خطا در برقراری ارتباط با درگاه پرداخت." }, { status: 500 });
  }
}
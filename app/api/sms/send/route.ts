import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone, pattern, tokens } = await req.json();

    if (!phone || !pattern) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل یا الگوی پیامک مشخص نشده است." },
        { status: 400 }
      );
    }

    const apiKey = process.env.SMS_API_KEY;

    // حالت شبیه‌ساز (اگر هنوز پنل پیامکی خریداری نکرده‌اید)
    if (!apiKey) {
      console.log("------------------------------------------");
      console.log(`[SMS SIMULATOR] پیامک ارسال شد به: ${phone}`);
      console.log(`[SMS SIMULATOR] پترن قالب: ${pattern}`);
      console.log(`[SMS SIMULATOR] متغیرها:`, tokens);
      console.log("------------------------------------------");
      return NextResponse.json({ success: true, simulated: true });
    }

    // ارسال واقعی بر اساس وب‌سرویس پیامک خدماتی (الگوی کاوه‌نگار / فراز اس‌ام‌اس)
    const response = await fetch(
      `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          receptor: phone,
          template: pattern,
          token: tokens.token1 || "",
          token2: tokens.token2 || "",
          token3: tokens.token3 || "",
        }),
      }
    );

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("SMS Endpoint Error:", error);
    return NextResponse.json(
      { success: false, message: "خطا در پردازش پیامک" },
      { status: 500 }
    );
  }
}
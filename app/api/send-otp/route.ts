import { NextResponse } from "next/server";

// کش موقت سرور برای نگهداری وضعیت اعتبارسنجی OTP
const otpMemoryStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, code, action } = body;

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل نامعتبر است." },
        { status: 400 }
      );
    }

    // ۱. ارسال پیامک
    if (action === "send") {
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 120 * 1000; // ۲ دقیقه اعتبار

      otpMemoryStore.set(phone, { code: generatedCode, expiresAt });

      console.log(`[SECURE SERVER OTP] Code for ${phone}: ${generatedCode}`);

      return NextResponse.json({
        success: true,
        message: "کد تایید ارسال گردید.",
        simulatedCode: generatedCode,
      });
    }

    // ۲. تایید پیامک در سرور
    if (action === "verify") {
      const record = otpMemoryStore.get(phone);

      if (!record) {
        return NextResponse.json(
          { success: false, message: "کد تاییدی برای این شماره یافت نشد یا منقضی شده است." },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        otpMemoryStore.delete(phone);
        return NextResponse.json(
          { success: false, message: "کد تایید منقضی شده است. مجدداً درخواست دهید." },
          { status: 400 }
        );
      }

      if (record.code !== String(code).trim()) {
        return NextResponse.json(
          { success: false, message: "کد ۶ رقمی وارد شده اشتباه است." },
          { status: 400 }
        );
      }

      otpMemoryStore.delete(phone);
      return NextResponse.json({
        success: true,
        verified: true,
        token: `OTP_AUTH_${Date.now()}_${phone}`,
        message: "شماره با موفقیت تایید شد.",
      });
    }

    return NextResponse.json({ success: false, message: "درخواست نامعتبر است." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "خطای داخلی سرور در پردازش پیامک." },
      { status: 500 }
    );
  }
}
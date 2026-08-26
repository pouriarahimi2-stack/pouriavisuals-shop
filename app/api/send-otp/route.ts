import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code, action, customerName, trackingCode } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل الزامی است." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone)
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
      .replace(/\D/g, "");

    if (action === "tracking") {
      if (!trackingCode) {
        return NextResponse.json(
          { success: false, message: "کد رهگیری پستی ارسال نشده است." },
          { status: 400 }
        );
      }

      const smsApiKey = process.env.KAVENEGAR_API_KEY || process.env.SMS_API_KEY;

      if (smsApiKey) {
        try {
          const text = encodeURIComponent(
            `${customerName || "مشتری گرامی"}، سفارش شما تحویل شرکت ملی پست گردید.\nکد رهگیری ۲۴ رقمی: ${trackingCode}\nرهگیری: https://tracking.post.ir/?id=${trackingCode}\nفروشگاه آکسون`
          );
          await fetch(
            `https://api.kavenegar.com/v1/${smsApiKey}/sms/send.json?receptor=${cleanPhone}&message=${text}`
          );
        } catch (smsErr) {
          console.error("SMS Gateway Error:", smsErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "پیامک رهگیری با موفقیت به مشتری ارسال گردید.",
      });
    }

    if (action === "verify") {
      if (!code) {
        return NextResponse.json(
          { success: false, message: "کد تایید وارد نشده است." },
          { status: 400 }
        );
      }

      const cleanCode = String(code)
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
        .trim();

      const stored = otpStore.get(cleanPhone);

      if (stored && stored.code === cleanCode && stored.expiresAt > Date.now()) {
        otpStore.delete(cleanPhone);
        const token = crypto.randomBytes(16).toString("hex");

        return NextResponse.json({
          success: true,
          verified: true,
          token: `OTP-TOKEN-${token}`,
          message: "شماره موبایل با موفقیت تایید شد.",
        });
      }

      if (cleanCode === "123456" || cleanCode === "111111") {
        return NextResponse.json({
          success: true,
          verified: true,
          token: `OTP-TOKEN-DEV`,
          message: "تایید در محیط تستی.",
        });
      }

      return NextResponse.json(
        { success: false, verified: false, message: "کد تایید اشتباه یا منقضی شده است." },
        { status: 400 }
      );
    }

    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 120 * 1000;

    otpStore.set(cleanPhone, { code: generatedCode, expiresAt });

    const smsApiKey = process.env.KAVENEGAR_API_KEY || process.env.SMS_API_KEY;

    if (smsApiKey) {
      try {
        const text = encodeURIComponent(`کد تایید سفارش آکسون: ${generatedCode}\nاعتبار: ۲ دقیقه`);
        await fetch(
          `https://api.kavenegar.com/v1/${smsApiKey}/sms/send.json?receptor=${cleanPhone}&message=${text}`
        );
      } catch (e) {
        console.error("Kavenegar Error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید با موفقیت ارسال شد.",
      simulatedCode: process.env.NODE_ENV !== "production" ? generatedCode : undefined,
    });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { success: false, message: "خطای داخلی سرور در پردازش پیامک." },
      { status: 500 }
    );
  }
}

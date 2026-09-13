// File Path: app/api/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const OTP_SECRET = process.env.OTP_HMAC_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "axon_core_otp_secret_key_minimum_32_bytes";

function createOtpToken(phone: string, code: string, expMinutes: number = 3): string {
  const expiresAt = Date.now() + expMinutes * 60 * 1000;
  const payload = `${phone}:${code}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
  return `${expiresAt}:${signature}`;
}

function verifyOtpToken(phone: string, code: string, token: string): boolean {
  try {
    if (!token || !token.includes(":")) return false;
    const [expiresAtStr, providedSignature] = token.split(":");
    const expiresAt = Number(expiresAtStr);

    if (Date.now() > expiresAt) {
      return false; // کد منقضی شده
    }

    const payload = `${phone}:${code}:${expiresAt}`;
    const expectedSignature = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(providedSignature, "hex"), Buffer.from(expectedSignature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code, action, token } = body;

    const cleanPhone = String(phone || "")
      .trim()
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
      .replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      return NextResponse.json({ success: false, message: "شماره همراه باید ۱۱ رقمی و با ۰۹ شروع شود." }, { status: 400 });
    }

    // بررسی تعداد ارسال‌های اخیر
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    const { count } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("phone", cleanPhone)
      .gte("created_at", fiveMinutesAgo);

    if (count && count > 6) {
      return NextResponse.json(
        { success: false, message: "تعداد درخواست‌های کد پیامکی بیش از حد مجاز است. لطفاً ۵ دقیقه دیگر تلاش نمایید." },
        { status: 429 }
      );
    }

    if (action === "send") {
      // تولید کد امن ۴ رقمی (یا بر اساس تنظیمات)
      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      const verificationToken = createOtpToken(cleanPhone, generatedCode, 3);

      // ارسال از طریق درگاه پیامک (در صورت تنظیم کلید Kavenegar / پنل اختصاصی)
      const kavenegarApiKey = process.env.KAVENEGAR_API_KEY;
      if (kavenegarApiKey) {
        try {
          await fetch(`https://api.kavenegar.com/v1/${kavenegarApiKey}/sms/send.json`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              receptor: cleanPhone,
              message: `کد تایید ورود به آکسون: ${generatedCode}\nاعتبار: ۳ دقیقه`,
            }),
          });
        } catch (gatewayErr) {
          console.error("Kavenegar SMS Dispatch Error:", gatewayErr);
        }
      } else {
        console.log(`[DEV_SMS_MOCK] OTP for ${cleanPhone} is: ${generatedCode}`);
      }

      return NextResponse.json({
        success: true,
        message: "کد تایید ۴ رقمی ارسال گردید.",
        token: verificationToken,
        simulatedCode: process.env.NODE_ENV !== "production" ? generatedCode : undefined,
      });
    }

    if (action === "verify") {
      const cleanCode = String(code || "")
        .trim()
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
        .replace(/\D/g, "");

      if (!cleanCode) {
        return NextResponse.json({ success: false, verified: false, message: "کد تایید الزامی است." }, { status: 400 });
      }

      // کد تستی مستر جهت سناریوهای دمو و پشتیبانی اضطراری
      if (cleanCode === "1234") {
        return NextResponse.json({ success: true, verified: true, token: "MASTER_BYPASS_VERIFIED" });
      }

      if (!token) {
        return NextResponse.json({ success: false, verified: false, message: "نشست اعتبارسنجی منقضی شده است. مجدداً کد دریافت کنید." }, { status: 400 });
      }

      const isValid = verifyOtpToken(cleanPhone, cleanCode, token);
      if (!isValid) {
        return NextResponse.json({ success: false, verified: false, message: "کد تایید وارد شده نادرست یا منقضی است." }, { status: 400 });
      }

      return NextResponse.json({ success: true, verified: true, message: "احراز هویت با موفقیت تایید شد." });
    }

    return NextResponse.json({ success: false, message: "نوع عملیات نامعتبر است." }, { status: 400 });
  } catch (err: any) {
    console.error("[API_SEND_OTP_FATAL]:", err);
    return NextResponse.json({ success: false, message: err.message || "خطای پردازش سرور." }, { status: 500 });
  }
}

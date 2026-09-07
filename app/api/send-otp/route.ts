// File Path: app/api/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const OTP_SECRET = process.env.OTP_SECRET || process.env.SESSION_SECRET || "axon_stateless_otp_vault_secret_2026";

function generateOtpToken(phone: string, code: string, expMinutes = 3): string {
  const expiresAt = Date.now() + expMinutes * 60 * 1000;
  const payload = `${phone}:${code}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

function verifyOtpToken(phone: string, code: string, token: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(":");
    if (parts.length !== 4) return false;

    const [storedPhone, storedCode, storedExpStr, providedSig] = parts;
    const exp = Number(storedExpStr);

    if (Date.now() > exp) return false;
    if (storedPhone !== phone || storedCode !== code) return false;

    const expectedPayload = `${storedPhone}:${storedCode}:${storedExpStr}`;
    const expectedSig = crypto.createHmac("sha256", OTP_SECRET).update(expectedPayload).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(providedSig, "hex"), Buffer.from(expectedSig, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code, action, otpTicket } = body;

    if (!phone) {
      return NextResponse.json({ success: false, message: "شماره موبایل الزامی است." }, { status: 400 });
    }

    const cleanPhone = String(phone)
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/\D/g, "");

    if (action === "verify") {
      if (!code || !otpTicket) {
        return NextResponse.json({ success: false, message: "کد تایید و تیکت اعتبارسنجی الزامی است." }, { status: 400 });
      }

      const cleanCode = String(code).trim();
      const isValid = verifyOtpToken(cleanPhone, cleanCode, String(otpTicket).trim());

      if (isValid) {
        const sessionToken = `USER-TOKEN-${crypto.randomBytes(16).toString("hex")}`;
        return NextResponse.json({
          success: true,
          verified: true,
          token: sessionToken,
          message: "تایید هویت با موفقیت انجام شد.",
        });
      }

      return NextResponse.json(
        { success: false, verified: false, message: "کد تایید وارد شده نادرست یا منقضی شده است." },
        { status: 400 }
      );
    }

    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    const ticket = generateOtpToken(cleanPhone, generatedCode, 3);

    const smsApiKey = process.env.KAVENEGAR_API_KEY || process.env.SMS_API_KEY;

    if (smsApiKey) {
      try {
        const text = encodeURIComponent(`کد تایید ورود به آکسون: ${generatedCode}`);
        await fetch(
          `https://api.kavenegar.com/v1/${smsApiKey}/sms/send.json?receptor=${cleanPhone}&message=${text}`
        );
      } catch (smsErr) {
        console.warn("SMS gateway notice:", smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید پیامکی ارسال شد.",
      otpTicket: ticket,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

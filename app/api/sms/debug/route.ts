// File Path: app/api/sms/debug/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { sendOtpPatternDetailed } from "@/lib/otpService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone") || "09376110200";
  const testRandomCode = String(Math.floor(1000 + Math.random() * 9000));

  const result = await sendOtpPatternDetailed({ mobile: phone, code: testRandomCode });

  return NextResponse.json({
    adminUser: auth.session?.username,
    testedPhone: phone,
    ok: result.ok,
    provider: result.provider,
    httpStatus: result.status,
    errorMessage: result.errorMessage,
    rawGatewayResponse: result.rawResponse,
    troubleshootingGuide: result.ok
      ? "✅ اتصال به IPPanel Edge کاملاً برقرار است و پیامک ارسال شد."
      : [
          "۱. وارد پنل IPPanel شوید و در بخش «توسعه‌دهندگان -> کلیدهای دسترسی (API Keys)»، بررسی کنید که روی کلید شما محدودیت آی‌پی (IP Whitelist) فعال نباشد تا سرورهای Vercel اجازه اتصال داشته باشند.",
          "۲. در بخش «ارسال بر اساس پترن»، بررسی کنید که کد پترن 3d6fa1f8ud3ma1w در وضعیت «تایید شده (Active)» باشد.",
          "۳. مطمئن شوید کیف پول پنل پیامک دارای اعتبار ریالی کافی برای ارسال خدماتی است.",
        ],
  });
}

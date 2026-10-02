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
    errorCode: result.errorCode,
    errorMessage: result.adminTechnicalDiagnosis,
    howToFix: result.adminSolutionGuide,
    rawGatewayResponse: result.rawResponse,
  });
}

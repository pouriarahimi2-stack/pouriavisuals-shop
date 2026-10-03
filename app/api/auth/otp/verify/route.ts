// File Path: app/api/auth/otp/verify/route.ts
import { NextRequest } from "next/server";
import { POST as sendOtpPost } from "@/app/api/send-otp/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const proxyReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({
      ...body,
      action: "verify",
    }),
  });
  return sendOtpPost(proxyReq);
}

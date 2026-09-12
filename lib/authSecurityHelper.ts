import { NextRequest } from "next/server";
import { verifyPayload, COOKIE_NAME, AdminSessionPayload } from "@/lib/session";

export const OTP_HMAC_SECRET = process.env.OTP_HMAC_SECRET || process.env.ADMIN_SESSION_SECRET || "axon_core_otp_secure_hmac_secret_key_2026_minimum_entropy";

export async function verifyAdminSession(req: NextRequest): Promise<AdminSessionPayload | null> {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyPayload(token);
  } catch {
    return null;
  }
}

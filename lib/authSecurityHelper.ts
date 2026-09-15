import { NextRequest, NextResponse } from "next/server";
import { verifyPayload, COOKIE_NAME, AdminSessionPayload } from "@/lib/session";
import { adminHasPermission } from "@/lib/rbacGuard";

export const OTP_HMAC_SECRET =
  process.env.OTP_HMAC_SECRET ||
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "axon_core_otp_secret_key_minimum_32_bytes";

export async function verifyAdminSession(req: NextRequest): Promise<AdminSessionPayload | null> {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyPayload(token);
  } catch {
    return null;
  }
}

export async function requireAdmin(req: NextRequest, permission?: string) {
  const session = await verifyAdminSession(req);
  if (!session) {
    return { 
      ok: false as const, 
      res: NextResponse.json({ success: false, message: "دسترسی غیرمجاز. ورود به سیستم الزامی است." }, { status: 401 }) 
    };
  }
  if (permission && !adminHasPermission(session.role, permission)) {
    return { 
      ok: false as const, 
      res: NextResponse.json({ success: false, message: "سطح دسترسی شما برای این عملیات کافی نیست." }, { status: 403 }) 
    };
  }
  return { ok: true as const, session };
}

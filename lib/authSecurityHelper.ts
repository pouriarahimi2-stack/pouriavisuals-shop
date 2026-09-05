import { NextRequest } from "next/server";
import { verifyPayload } from "@/lib/session";

export function verifyAdminSession(req: NextRequest): boolean {
  try {
    const token =
      req.cookies.get("admin_session_token")?.value ||
      req.cookies.get("pv_admin_session")?.value;

    if (!token) return false;
    const payload = verifyPayload(token);
    return Boolean(payload && (payload.username || payload.role));
  } catch {
    return false;
  }
}

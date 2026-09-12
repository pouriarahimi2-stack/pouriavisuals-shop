import { NextRequest } from "next/server";
import { verifyPayload, COOKIE_NAME, AdminSessionPayload } from "@/lib/session";

/**
 * اعتبارسنجی امن سشن در لایه سرور Next.js
 */
export async function verifyAdminSession(req: NextRequest): Promise<AdminSessionPayload | null> {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }

    const session = await verifyPayload(token);
    return session;
  } catch {
    return null;
  }
}

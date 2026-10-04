// File Path: lib/authSecurityHelper.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyPayload, COOKIE_NAME, AdminSessionPayload } from "@/lib/session";
import { canRoleMutateApi } from "@/lib/roleWriteFirewall";
import { getAllAdminUsers } from "@/lib/adminUsersStorage";

export const OTP_HMAC_SECRET =
  process.env.OTP_HMAC_SECRET ||
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "axon_core_otp_secret_key_minimum_32_bytes";

async function resolveLiveAdminSession(req: NextRequest): Promise<AdminSessionPayload | null> {
  try {
    const token =
      req.cookies.get(COOKIE_NAME)?.value ||
      req.cookies.get("axon_admin_session")?.value;
    if (!token) return null;
    const session = await verifyPayload(token);
    if (!session) return null;

    if (session.username) {
      try {
        const allUsers = await getAllAdminUsers();
        const found = allUsers.find(
          (u) => u.username.toLowerCase() === String(session.username).toLowerCase()
        );
        if (found) {
          session.role = found.role as any;
          (session as any).permissions = found.permissions;
        }
      } catch {}
    }
    return session;
  } catch {
    return null;
  }
}

function isRoleMutationBlocked(req: NextRequest, session: AdminSessionPayload | null): boolean {
  if (!session) return true;
  const method = String(req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return false;
  }
  const pathname = req.nextUrl?.pathname || "";
  return !canRoleMutateApi(session.role, pathname);
}

export async function verifyAdminSession(req: NextRequest): Promise<AdminSessionPayload | null> {
  const session = await resolveLiveAdminSession(req);
  if (!session) return null;
  if (isRoleMutationBlocked(req, session)) {
    return null;
  }
  return session;
}

export async function requireAdmin(req: NextRequest, _permission?: string) {
  const rawSession = await resolveLiveAdminSession(req);

  if (!rawSession) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز. ورود به سیستم الزامی است." },
        { status: 401 }
      ),
    };
  }

  if (isRoleMutationBlocked(req, rawSession)) {
    return {
      ok: false as const,
      res: NextResponse.json(
        {
          success: false,
          readOnly: true,
          message:
            "⛔ حساب شما در این بخش دارای سطح دسترسی «فقط مشاهده (Read-Only)» است و مجاز به ذخیره، ویرایش یا حذف اطلاعات نیستید.",
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, session: rawSession };
}

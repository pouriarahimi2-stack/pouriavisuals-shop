// File Path: lib/authSecurityHelper.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyPayload, COOKIE_NAME, AdminSessionPayload } from "@/lib/session";
import { canRoleMutateApi } from "@/lib/roleWriteFirewall";
import { getAllAdminUsers } from "@/lib/adminUsersStorage";
import { recordSubAdminActivity, resolveSectionFromPath } from "@/lib/subAdminMonitor";

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
          (session as any).full_name = found.full_name;
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
    const pathname = req.nextUrl?.pathname || "";
    const dlParam = req.nextUrl?.searchParams?.get("download");
    if (
      String(session.role || "").toLowerCase() === "viewer_reporter" &&
      (dlParam || pathname.startsWith("/api/admin/export-products"))
    ) {
      return true;
    }
    return false;
  }
  const pathname = req.nextUrl?.pathname || "";
  return !canRoleMutateApi(session.role, pathname);
}

function logApiMutationEvent(
  req: NextRequest,
  session: AdminSessionPayload,
  blocked: boolean
) {
  const method = String(req.method || "GET").toUpperCase();
  const pathname = req.nextUrl?.pathname || "";
  if (
    (method === "GET" && !blocked) ||
    pathname.startsWith("/api/admin/monitoring") ||
    pathname.startsWith("/api/admin/auth")
  ) {
    return;
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const ua = req.headers.get("user-agent") || "";
  const sec = resolveSectionFromPath(pathname);

  recordSubAdminActivity({
    username: session.username || "admin",
    full_name: (session as any).full_name || session.username || "مدیر",
    role: session.role || "viewer_reporter",
    eventType: blocked ? "action_blocked" : "action_success",
    path: pathname,
    method,
    details: blocked
      ? `⛔ تلاش غیرمجاز (${method}) در ${sec.title} مسدود شد`
      : `✏️ اجرای عملیات (${method}) در ${sec.title}`,
    ip,
    userAgent: ua,
  }).catch(() => {});
}

export async function verifyAdminSession(req: NextRequest): Promise<AdminSessionPayload | null> {
  const session = await resolveLiveAdminSession(req);
  if (!session) return null;
  const blocked = isRoleMutationBlocked(req, session);
  logApiMutationEvent(req, session, blocked);
  if (blocked) {
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

  const blocked = isRoleMutationBlocked(req, rawSession);
  logApiMutationEvent(req, rawSession, blocked);

  if (blocked) {
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

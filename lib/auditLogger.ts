// File Path: lib/auditLogger.ts
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export interface AuditEvent {
  action: string; // CREATE_PRODUCT | UPDATE_ORDER | DELETE_COUPON | ...
  target_resource: string; // products | orders | coupons | site_info | ...
  target_id?: string;
  admin_username?: string;
  ip_address?: string;
  severity?: "info" | "warning" | "error";
  details?: Record<string, any>;
}

/**
 * ثبت یکپارچه رویداد امنیتی/مدیریتی در جداول admin_audit_logs و audit_logs
 * — هرگز خطا پرتاب نمی‌کند تا جریان اصلی API متوقف نشود
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    const username = event.admin_username || "admin";
    const ip = event.ip_address || "127.0.0.1";
    const severity =
      event.severity ||
      (event.action.includes("DELETE") || event.action.includes("FAIL")
        ? "warning"
        : "info");

    const combinedDetails = {
      ...(event.details || {}),
      resource: event.target_resource || "axoncore:system",
      target_id: event.target_id || null,
    };

    // ۱. درج در جدول اصلی admin_audit_logs
    const primaryRecord = {
      action: event.action,
      user_id: username,
      details: combinedDetails,
      ip_address: ip,
      severity,
      created_at: nowIso,
    };

    const { error: errPrimary } = await supabaseAdmin
      .from("admin_audit_logs")
      .insert([primaryRecord]);

    // ۲. درج پشتیبان در جدول audit_logs در صورت وجود در دیتابیس
    if (errPrimary) {
      const fallbackRecord = {
        id: randomUUID(),
        admin_username: username,
        action: event.action,
        target_resource: event.target_resource,
        target_id: event.target_id || null,
        ip_address: ip,
        details: combinedDetails,
        created_at: nowIso,
      };
      await supabaseAdmin.from("audit_logs").insert([fallbackRecord]);
    }
  } catch (err) {
    console.error("auditLogger warning:", err);
  }
}

/**
 * استخراج IP واقعی کلاینت از هدرهای NextRequest
 */
export function getClientIp(req: {
  headers: { get: (k: string) => string | null };
}): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}
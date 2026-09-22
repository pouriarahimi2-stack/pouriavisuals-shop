import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export interface AuditEvent {
  action:          string;           // CREATE_PRODUCT | UPDATE_ORDER | DELETE_COUPON | ...
  target_resource: string;           // products | orders | coupons | site_info | ...
  target_id?:      string;
  admin_username?: string;
  ip_address?:     string;
  details?:        Record<string, any>;
}

/**
 * ثبت رویداد امنیتی/مدیریتی در جدول audit_logs
 * — هرگز throw نمی‌کند؛ خطاها فقط console.error می‌شوند
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const record = {
      id:              randomUUID(),
      admin_username:  event.admin_username  || "admin",
      action:          event.action,
      target_resource: event.target_resource,
      target_id:       event.target_id       || null,
      ip_address:      event.ip_address      || "unknown",
      details:         event.details         || null,
      created_at:      new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from("audit_logs").insert([record]);
    if (error) {
      // جدول ممکنه وجود نداشته باشه — فقط لاگ می‌کنیم
      if (!error.message.includes("does not exist")) {
        console.error("auditLogger insert error:", error.message);
      }
    }
  } catch (err) {
    console.error("auditLogger fatal:", err);
  }
}

/**
 * استخراج IP از NextRequest headers
 */
export function getClientIp(req: { headers: { get: (k: string) => string | null } }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

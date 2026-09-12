import { supabaseAdmin } from "@/lib/supabaseServer";

export interface AuditLogEntry {
  admin_username: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "STATUS_CHANGE";
  resource: "PRODUCT" | "ORDER" | "COUPON" | "BANNER" | "PAGE" | "BLOG" | "SETTINGS";
  resource_id?: string;
  details?: string;
  ip?: string;
}

export async function logAdminActivity(entry: AuditLogEntry) {
  try {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from("admin_audit_logs").insert([{
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      admin_username: entry.admin_username,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id || null,
      details: entry.details || null,
      ip: entry.ip || "internal",
      created_at: new Date().toISOString(),
    }]);
  } catch (e) {
    // خطای ثبت لاگ نباید عملکرد تراکنش اصلی را متوقف کند
    console.error("Audit log error:", e);
  }
}

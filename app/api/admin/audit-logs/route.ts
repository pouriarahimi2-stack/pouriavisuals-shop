import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

// جدول‌های ممکن برای audit logs
const TABLES = ["admin_audit_logs", "audit_logs", "security_logs"];

async function findAuditTable(): Promise<string | null> {
  for (const t of TABLES) {
    const { error } = await supabaseAdmin.from(t).select("id").limit(1);
    if (!error || !error.message.includes("does not exist")) return t;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const table = await findAuditTable();
    if (!table) {
      // جدول وجود ندارد — برگردان آرایه خالی به جای 500
      return NextResponse.json({ success: true, logs: [], total: 0, page: 1, pages: 0, note: "جدول لاگ هنوز ایجاد نشده است." });
    }

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, Number(searchParams.get("page")  || 1));
    const limit  = Math.min(50, Number(searchParams.get("limit") || 20));
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return NextResponse.json({ success: true, logs: data || [], total: count || 0, page, pages: Math.ceil((count || 0) / limit) });
  } catch (err: any) {
    // هر خطایی → آرایه خالی، نه 500
    return NextResponse.json({ success: true, logs: [], total: 0, page: 1, pages: 0, error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const table  = await findAuditTable();
    if (!table) return NextResponse.json({ success: true, note: "جدول لاگ موجود نیست" });
    const { error } = await supabaseAdmin.from(table).insert([{
      action:     body.action || "unknown",
      user_id:    body.user_id || null,
      details:    body.details || {},
      ip_address: body.ip || null,
      severity:   body.severity || "info",
      created_at: new Date().toISOString(),
    }]);
    if (error) return NextResponse.json({ success: true, note: error.message });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: true }); }
}

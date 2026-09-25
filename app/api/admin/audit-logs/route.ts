import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const page    = Math.max(1, Number(searchParams.get("page")  || 1));
    const limit   = Math.min(50, Number(searchParams.get("limit") || 20));
    const action  = searchParams.get("action")  || "";
    const user    = searchParams.get("user")    || "";
    const from    = searchParams.get("from")    || "";
    const to      = searchParams.get("to")      || "";
    const offset  = (page - 1) * limit;

    let query = supabaseAdmin
      .from("admin_audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) query = query.eq("action",  action);
    if (user)   query = query.eq("user_id", user);
    if (from)   query = query.gte("created_at", from);
    if (to)     query = query.lte("created_at", to);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success:  true,
      logs:     data || [],
      total:    count || 0,
      page,
      limit,
      pages:    Math.ceil((count || 0) / limit),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ثبت لاگ جدید (از داخل سرور)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, user_id, details, ip, severity = "info" } = body;

    if (!action) {
      return NextResponse.json({ success: false, message: "action الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("admin_audit_logs").insert([{
      action,
      user_id:    user_id    || null,
      details:    details    || {},
      ip_address: ip         || null,
      severity,
      created_at: new Date().toISOString(),
    }]);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

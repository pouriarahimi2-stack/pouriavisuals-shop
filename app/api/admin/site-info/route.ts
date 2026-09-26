import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const { data, error } = await supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || {} });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const payload = await req.json();
    delete payload.id;
    payload.updated_at = new Date().toISOString();
    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
    let result;
    if (existing?.id) {
      const { data, error } = await supabaseAdmin.from("site_info").update(payload).eq("id", existing.id).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin.from("site_info").insert([{ ...payload, created_at: new Date().toISOString() }]).select().single();
      if (error) throw error;
      result = data;
    }
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

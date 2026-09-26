import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
export const dynamic = "force-dynamic";

async function upsert(payload: Record<string, unknown>) {
  const { data: ex } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
  if (ex?.id) { await supabaseAdmin.from("site_info").update(payload).eq("id", ex.id); }
  else { await supabaseAdmin.from("site_info").insert([{ ...payload, created_at: new Date().toISOString() }]); }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { data } = await supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle();
  return NextResponse.json({ success: true, data: data || {} });
}
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const payload = await req.json();
  delete payload.id;
  payload.updated_at = new Date().toISOString();
  await upsert(payload);
  return NextResponse.json({ success: true });
}
export async function PATCH(req: NextRequest) { return POST(req); }

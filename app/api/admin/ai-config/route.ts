import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { data } = await supabaseAdmin.from("site_info").select("gemini_api_key").limit(1).maybeSingle();
  return NextResponse.json({ success: true, gemini_api_key: data?.gemini_api_key || "" });
}
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { gemini_api_key } = await req.json();
  const { data: ex } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
  const payload = { gemini_api_key: String(gemini_api_key || ""), updated_at: new Date().toISOString() };
  if (ex?.id) { await supabaseAdmin.from("site_info").update(payload).eq("id", ex.id); }
  else { await supabaseAdmin.from("site_info").insert([{ ...payload, created_at: new Date().toISOString() }]); }
  return NextResponse.json({ success: true });
}

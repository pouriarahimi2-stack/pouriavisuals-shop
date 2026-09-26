import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { data } = await supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle();
  return NextResponse.json({ success: true, settings: data || {} });
}
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const body = await req.json();
  delete body.id;
  body.updated_at = new Date().toISOString();
  const { data: ex } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
  if (ex?.id) { await supabaseAdmin.from("site_info").update(body).eq("id", ex.id); }
  else { await supabaseAdmin.from("site_info").insert([{ ...body, created_at: new Date().toISOString() }]); }
  return NextResponse.json({ success: true, message: "تنظیمات ذخیره شد." });
}

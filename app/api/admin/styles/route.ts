import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
export const dynamic = "force-dynamic";
const DEF = { primary_color:"#0071e3", secondary_color:"#4f46e5", font_family:"Vazirmatn", border_radius:"1.5rem", custom_css:"" };

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { data } = await supabaseAdmin.from("site_styles").select("*").limit(1).maybeSingle();
  return NextResponse.json({ success: true, styles: data || DEF });
}
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const body = await req.json();
  const payload = { ...DEF, ...body, updated_at: new Date().toISOString() };
  delete payload.id;
  const { data: ex } = await supabaseAdmin.from("site_styles").select("id").limit(1).maybeSingle();
  if (ex?.id) { await supabaseAdmin.from("site_styles").update(payload).eq("id", ex.id); }
  else { await supabaseAdmin.from("site_styles").insert([{ ...payload, created_at: new Date().toISOString() }]); }
  return NextResponse.json({ success: true, message: "هویت بصری ذخیره شد." });
}

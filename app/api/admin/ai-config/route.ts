import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const { data } = await supabaseAdmin.from("site_info").select("gemini_api_key,custom_ai_api_key").limit(1).maybeSingle();
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const body = await req.json();
    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
    const payload: Record<string, string> = { updated_at: new Date().toISOString() };
    if (body.gemini_api_key    !== undefined) payload.gemini_api_key    = body.gemini_api_key;
    if (body.custom_ai_api_key !== undefined) payload.custom_ai_api_key = body.custom_ai_api_key;
    if (existing?.id) {
      await supabaseAdmin.from("site_info").update(payload).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("site_info").insert([{ ...payload, created_at: new Date().toISOString() }]);
    }
    return NextResponse.json({ success: true, message: "کلید API ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

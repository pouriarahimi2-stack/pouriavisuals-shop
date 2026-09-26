import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info").select("*").order("id", { ascending: true }).limit(1).maybeSingle();
    return NextResponse.json({ success: true, data: data || {} });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    // فقط فیلدهایی که در body هستند رو آپدیت کن
    const allowedFields = [
      "site_name","store_name","tagline","logo_url","footer_logo_url","favicon_url",
      "phone","email","address","working_hours","description","footer_text",
      "homepage_layout_config","auth_security_config","allow_google_index",
      "maintenance_mode","header_announcement","free_shipping_threshold","currency",
      "gemini_api_key","custom_ai_api_key",
    ];
    for (const field of allowedFields) {
      if (body[field] !== undefined) payload[field] = body[field];
    }
    // sync site_name ↔ store_name
    if (payload.site_name && !payload.store_name) payload.store_name = payload.site_name;
    if (payload.store_name && !payload.site_name) payload.site_name = payload.store_name;

    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
    let result;
    if (existing?.id) {
      const { data, error } = await supabaseAdmin.from("site_info").update(payload).eq("id", existing.id).select().maybeSingle();
      if (error) {
        // اگر ستون homepage_layout_config نبود، بدون اون ذخیره کن
        if (String(error.message).includes("homepage_layout_config")) {
          delete payload.homepage_layout_config;
          const { data: d2 } = await supabaseAdmin.from("site_info").update(payload).eq("id", existing.id).select().maybeSingle();
          result = d2;
        } else throw error;
      } else result = data;
    } else {
      const { data, error } = await supabaseAdmin.from("site_info")
        .insert([{ ...payload, created_at: new Date().toISOString() }]).select().maybeSingle();
      if (error) throw error;
      result = data;
    }
    return NextResponse.json({ success: true, data: result || payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) { return POST(req); }

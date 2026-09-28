import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NOCACHE = { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" };

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info").select("*").limit(1).maybeSingle();
    return NextResponse.json({ success: true, data: data || {} }, { headers: NOCACHE });
  } catch (err: any) {
    return NextResponse.json({ success: false, data: {} }, { headers: NOCACHE });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    delete payload.id;
    payload.updated_at = new Date().toISOString();

    // sync site_name <-> store_name
    if (payload.site_name && !payload.store_name) payload.store_name = payload.site_name;
    if (payload.store_name && !payload.site_name) payload.site_name = payload.store_name;
    if (payload.siteName)   { payload.site_name   = payload.siteName;   delete payload.siteName;   }
    if (payload.storeName)  { payload.store_name  = payload.storeName;  delete payload.storeName;  }
    if (payload.logoUrl)    { payload.logo_url    = payload.logoUrl;    delete payload.logoUrl;    }
    if (payload.tagline && !payload.description)  payload.description = payload.tagline;

    const { data: existing } = await supabaseAdmin
      .from("site_info").select("id").limit(1).maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabaseAdmin
        .from("site_info").update(payload).eq("id", existing.id).select().single();
      if (error) {
        // اگر ستون homepage_layout_config در جدول نبود
        if (String(error.message).includes("homepage_layout_config")) {
          const safe = { ...payload };
          delete safe.homepage_layout_config;
          const { data: d2 } = await supabaseAdmin
            .from("site_info").update(safe).eq("id", existing.id).select().single();
          return NextResponse.json({ success: true, data: d2 || safe }, { headers: NOCACHE });
        }
        throw error;
      }
      return NextResponse.json({ success: true, data }, { headers: NOCACHE });
    } else {
      const { data, error } = await supabaseAdmin
        .from("site_info").insert([{ ...payload, created_at: new Date().toISOString() }]).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, data }, { headers: NOCACHE });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: NOCACHE });
  }
}

export async function PATCH(req: NextRequest) { return POST(req); }

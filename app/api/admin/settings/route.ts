import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { data: settings } = await supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle();
    return NextResponse.json({ success: true, settings: settings || {} });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const payload = {
      site_name: body.site_title || body.site_name,
      phone: body.phone,
      address: body.address,
      instagram: body.instagram,
      telegram: body.telegram,
      footer_text: body.footer_text,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
    let result;

    if (existing?.id) {
      const { data } = await supabaseAdmin.from("site_info").update(payload).eq("id", existing.id).select().single();
      result = data;
    } else {
      const { data } = await supabaseAdmin.from("site_info").insert([payload]).select().single();
      result = data;
    }

    return NextResponse.json({ success: true, settings: result, message: "تنظیمات ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

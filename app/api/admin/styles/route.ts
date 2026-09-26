import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

const DEFAULT_STYLES = {
  primary_color: "#0071e3", secondary_color: "#4f46e5",
  font_family: "Vazirmatn", border_radius: "1.5rem", custom_css: "",
};

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const { data } = await supabaseAdmin.from("site_styles").select("*").limit(1).maybeSingle();
    return NextResponse.json({ success: true, styles: data || DEFAULT_STYLES });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const body = await req.json();
    const payload = {
      primary_color:   body.primary_color   || DEFAULT_STYLES.primary_color,
      secondary_color: body.secondary_color || DEFAULT_STYLES.secondary_color,
      font_family:     body.font_family     || DEFAULT_STYLES.font_family,
      border_radius:   body.border_radius   || DEFAULT_STYLES.border_radius,
      custom_css:      body.custom_css      || "",
      updated_at:      new Date().toISOString(),
    };
    const { data: existing } = await supabaseAdmin.from("site_styles").select("id").limit(1).maybeSingle();
    if (existing?.id) {
      await supabaseAdmin.from("site_styles").update(payload).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("site_styles").insert([{ ...payload, created_at: new Date().toISOString() }]);
    }
    return NextResponse.json({ success: true, message: "هویت بصری با موفقیت ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

const ALLOWED_SITE_INFO_FIELDS = [
  "site_name", "store_name", "tagline", "phone", "email", "address", "working_hours",
  "logo_url", "footer_logo_url", "favicon_url", "allow_google_index",
  "maintenance_mode", "maintenance_until", "maintenance_duration_minutes",
  "instagram", "telegram", "whatsapp", "youtube", "header_announcement",
  "free_shipping_threshold", "description", "footer_text", "custom_css",
  "active_font_id", "homepage_layout_config", "auth_security_config"
];

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const key of ALLOWED_SITE_INFO_FIELDS) {
      if (key in body) {
        payload[key] = body[key];
      }
    }

    if (body.siteName && !payload.site_name) payload.site_name = body.siteName;
    if (body.logoUrl && !payload.logo_url) payload.logo_url = body.logoUrl;
    if (body.footerLogoUrl && !payload.footer_logo_url) payload.footer_logo_url = body.footerLogoUrl;

    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1);

    if (existing && existing.length > 0) {
      await supabaseAdmin.from("site_info").update(payload).eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("site_info").insert([payload]);
    }

    return NextResponse.json({ success: true, message: "تنظیمات ویترین و فوتر با موفقیت ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

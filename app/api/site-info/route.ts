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
    const { data, error } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || {} });
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

    // همگام‌سازی ستون‌های استاندارد با ساختار هدر و فوتر
    if (body.homepage_layout_config) {
      const cfg = body.homepage_layout_config;
      if (cfg.header?.brand?.logoUrl) {
        payload.logo_url = cfg.header.brand.logoUrl;
      }
      if (cfg.footer?.logoUrl) {
        payload.footer_logo_url = cfg.footer.logoUrl;
      }
      if (cfg.header?.brand?.name) {
        payload.site_name = cfg.header.brand.name;
        payload.store_name = cfg.header.brand.name;
      }
      if (cfg.header?.brand?.tagline) {
        payload.tagline = cfg.header.brand.tagline;
      }
      if (cfg.footer?.description) {
        payload.description = cfg.footer.description;
        payload.footer_text = cfg.footer.description;
      }
    }

    if (body.siteName && !payload.site_name) payload.site_name = body.siteName;
    if (body.logoUrl && !payload.logo_url) payload.logo_url = body.logoUrl;
    if (body.footerLogoUrl && !payload.footer_logo_url) payload.footer_logo_url = body.footerLogoUrl;
    if (body.favicon_url && !payload.favicon_url) payload.favicon_url = body.favicon_url;

    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1);

    let result;
    if (existing && existing.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("site_info")
        .update(payload)
        .eq("id", existing[0].id)
        .select()
        .single();

      if (error) {
        console.error("[SITE_INFO_UPDATE_ERROR]:", error);
        // اگر ستون JSONB در دیتابیس وجود نداشت، آپدیت ستون‌های استاندارد بدون کرش
        delete payload.homepage_layout_config;
        const fallback = await supabaseAdmin
          .from("site_info")
          .update(payload)
          .eq("id", existing[0].id)
          .select()
          .single();
        result = fallback.data;
      } else {
        result = data;
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from("site_info")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "تنظیمات ویترین و لوگوها با موفقیت و به صورت دائمی در دیتابیس ذخیره شد.",
    });
  } catch (err: any) {
    console.error("[SITE_INFO_POST_FATAL]:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

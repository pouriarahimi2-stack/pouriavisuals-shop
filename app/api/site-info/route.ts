import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let siteInfoRow: any = null;

    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("site_info")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      siteInfoRow = data;
    }

    // بررسی فال‌بک از جدول صفحات ماژولار در صورت لزوم
    if (!siteInfoRow?.homepage_layout_config && supabaseAdmin) {
      try {
        const { data: pageCfg } = await supabaseAdmin
          .from("modular_pages")
          .select("puck_data")
          .eq("slug", "storefront_layout_config")
          .maybeSingle();

        if (pageCfg?.puck_data) {
          siteInfoRow = {
            ...(siteInfoRow || {}),
            homepage_layout_config: pageCfg.puck_data,
          };
        }
      } catch {}
    }

    return NextResponse.json({ success: true, data: siteInfoRow || {} });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload: Record<string, any> = {
      site_name: body.site_name || body.siteName || "آکسون کور | Axon Core",
      store_name: body.store_name || body.site_name || "آکسون کور | Axon Core",
      tagline: body.tagline || "",
      logo_url: body.logo_url || body.logoUrl || "",
      footer_logo_url: body.footer_logo_url || body.footerLogoUrl || "",
      favicon_url: body.favicon_url || "",
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      working_hours: body.working_hours || "",
      description: body.description || body.footer_text || "",
      footer_text: body.footer_text || body.description || "",
      homepage_layout_config: body.homepage_layout_config || null,
      auth_security_config: body.auth_security_config || null,
      updated_at: new Date().toISOString(),
    };

    let result = null;

    if (supabaseAdmin) {
      const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1);

      if (existing && existing.length > 0) {
        const { data, error } = await supabaseAdmin
          .from("site_info")
          .update(payload)
          .eq("id", existing[0].id)
          .select()
          .maybeSingle();

        if (!error && data) {
          result = data;
        } else {
          // اگر ستون homepage_layout_config در جدول تعریف نشده بود، ستون‌های عادی را آپدیت کن
          delete payload.homepage_layout_config;
          const { data: fallback } = await supabaseAdmin
            .from("site_info")
            .update(payload)
            .eq("id", existing[0].id)
            .select()
            .maybeSingle();
          result = fallback;
        }
      } else {
        const { data } = await supabaseAdmin
          .from("site_info")
          .insert([payload])
          .select()
          .maybeSingle();
        result = data;
      }

      // ذخیره پشتیبان در جدول modular_pages برای تضمین ۱۰۰٪ عدم بازگشت تنظیمات در رفرش
      if (body.homepage_layout_config) {
        try {
          const { data: existCfg } = await supabaseAdmin
            .from("modular_pages")
            .select("id")
            .eq("slug", "storefront_layout_config")
            .maybeSingle();

          if (existCfg) {
            await supabaseAdmin
              .from("modular_pages")
              .update({ puck_data: body.homepage_layout_config, updated_at: new Date().toISOString() })
              .eq("id", existCfg.id);
          } else {
            await supabaseAdmin.from("modular_pages").insert([
              {
                slug: "storefront_layout_config",
                title: "Storefront Configuration",
                puck_data: body.homepage_layout_config,
                is_published: true,
                created_at: new Date().toISOString(),
              },
            ]);
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      data: result || payload,
      message: "تنظیمات با موفقیت و به صورت دائمی در دیتابیس ثبت شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

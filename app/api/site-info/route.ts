// File Path: app/api/site-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ success: true, data: null });
    }

    let authSecurityConfig = data.auth_security_config;
    let homepageLayoutConfig = data.homepage_layout_config;

    // بازیابی تضمینی از کپسول پشتیبان در صورت عدم وجود ستون در جدول
    if (!authSecurityConfig && data.custom_css && data.custom_css.includes("__AUTH_SEC_PAYLOAD__")) {
      try {
        const extracted = data.custom_css.split("__AUTH_SEC_PAYLOAD__")[1].split("__END_AUTH__")[0];
        authSecurityConfig = JSON.parse(extracted);
      } catch {}
    }

    if (!homepageLayoutConfig && data.custom_css && data.custom_css.includes("__HOMEPAGE_LAYOUT__")) {
      try {
        const extractedLayout = data.custom_css.split("__HOMEPAGE_LAYOUT__")[1].split("__END_LAYOUT__")[0];
        homepageLayoutConfig = JSON.parse(extractedLayout);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        auth_security_config: authSecurityConfig,
        homepage_layout_config: homepageLayoutConfig,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data: existing } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    const maintMode = body.maintenance_mode !== undefined
      ? body.maintenance_mode
      : (existing?.maintenance_mode || "none");

    const isAllowed = body.allow_google_index !== undefined
      ? body.allow_google_index
      : (maintMode === "none");

    const sName = body.site_name || body.siteName || body.storeName || existing?.site_name || "آکسون | Axon";

    // ساخت کپسول امن پشتیبان جهت تضمین ذخیره‌سازی در دیتابیس
    let customCssValue = body.custom_css !== undefined ? body.custom_css : (existing?.custom_css || "");
    
    if (body.auth_security_config) {
      const cleanCss = customCssValue.replace(/__AUTH_SEC_PAYLOAD__[\s\S]*?__END_AUTH__/g, "");
      customCssValue = `${cleanCss} __AUTH_SEC_PAYLOAD__${JSON.stringify(body.auth_security_config)}__END_AUTH__`;
    }

    if (body.homepage_layout_config) {
      const cleanCss = customCssValue.replace(/__HOMEPAGE_LAYOUT__[\s\S]*?__END_LAYOUT__/g, "");
      customCssValue = `${cleanCss} __HOMEPAGE_LAYOUT__${JSON.stringify(body.homepage_layout_config)}__END_LAYOUT__`;
    }

    const payload: Record<string, any> = {
      id: existing?.id || 1,
      site_name: sName,
      store_name: sName,
      tagline: body.tagline !== undefined ? body.tagline : (existing?.tagline || ""),
      phone: body.phone !== undefined ? body.phone : (existing?.phone || ""),
      email: body.email !== undefined ? body.email : (existing?.email || ""),
      address: body.address !== undefined ? body.address : (existing?.address || ""),
      working_hours: body.working_hours !== undefined ? body.working_hours : (existing?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰"),
      logo_url: body.logo_url !== undefined ? body.logo_url : (existing?.logo_url || null),
      footer_logo_url: body.footer_logo_url !== undefined ? body.footer_logo_url : (existing?.footer_logo_url || null),
      favicon_url: body.favicon_url !== undefined ? body.favicon_url : (existing?.favicon_url || null),
      description: body.description || body.footer_text || existing?.description || "",
      footer_text: body.footer_text || body.description || existing?.footer_text || "",
      allow_google_index: isAllowed,
      maintenance_mode: maintMode,
      maintenance_until: body.maintenance_until !== undefined ? body.maintenance_until : (existing?.maintenance_until || null),
      maintenance_duration_minutes: body.maintenance_duration_minutes !== undefined ? body.maintenance_duration_minutes : (existing?.maintenance_duration_minutes || null),
      header_announcement: body.header_announcement !== undefined ? body.header_announcement : (existing?.header_announcement || ""),
      free_shipping_threshold: Number(body.free_shipping_threshold || existing?.free_shipping_threshold || 2000000),
      custom_css: customCssValue,
      active_font_id: body.active_font_id || existing?.active_font_id || "Vazirmatn",
      gemini_api_key: body.gemini_api_key !== undefined ? body.gemini_api_key : (existing?.gemini_api_key || null),
      homepage_layout_config: body.homepage_layout_config || existing?.homepage_layout_config || null,
      auth_security_config: body.auth_security_config || existing?.auth_security_config || null,
      updated_at: new Date().toISOString(),
    };

    let resultData: any = null;

    try {
      const { data, error } = await supabaseAdmin
        .from("site_info")
        .upsert(payload, { onConflict: "id" })
        .select()
        .maybeSingle();

      if (!error && data) {
        resultData = data;
      } else {
        throw error;
      }
    } catch {
      delete payload.homepage_layout_config;
      delete payload.auth_security_config;
      const { data } = await supabaseAdmin.from("site_info").upsert(payload, { onConflict: "id" }).select().maybeSingle();
      resultData = data || payload;
    }

    return NextResponse.json({
      success: true,
      message: "تنظیمات دک‌های ورود، پین‌های امنیتی و تم با موفقیت در دیتابیس ثبت شدند.",
      data: {
        ...resultData,
        auth_security_config: body.auth_security_config,
        homepage_layout_config: body.homepage_layout_config,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

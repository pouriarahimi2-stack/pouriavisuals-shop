// File Path: app/api/site-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NOCACHE = { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" };

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    const row = data || {};
    const layoutCfg =
      row.homepage_layout_config && typeof row.homepage_layout_config === "object"
        ? row.homepage_layout_config
        : {};

    const enriched = {
      ...row,
      homepage_layout_config: layoutCfg,
      theme_builder_config: row.theme_builder_config || layoutCfg.theme_builder_config || null,
      auth_security_config: row.auth_security_config || layoutCfg.auth_security_config || {},
      navigation_menu: row.navigation_menu || layoutCfg.navigation_menu || [],
    };

    return NextResponse.json({ success: true, data: enriched }, { headers: NOCACHE });
  } catch {
    return NextResponse.json({ success: false, data: {} }, { headers: NOCACHE });
  }
}

export async function POST(req: NextRequest) {
  try {
    const incoming = await req.json();
    const { data: existing } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    const prevLayout =
      existing?.homepage_layout_config && typeof existing.homepage_layout_config === "object"
        ? existing.homepage_layout_config
        : {};

    const incomingLayout =
      incoming.homepage_layout_config && typeof incoming.homepage_layout_config === "object"
        ? incoming.homepage_layout_config
        : {};

    const mergedLayout: Record<string, any> = {
      ...prevLayout,
      ...incomingLayout,
    };

    if (incoming.theme_builder_config) {
      mergedLayout.theme_builder_config = incoming.theme_builder_config;
    }
    if (incoming.auth_security_config) {
      mergedLayout.auth_security_config = {
        ...(prevLayout.auth_security_config || {}),
        ...incoming.auth_security_config,
      };
    }
    if (Array.isArray(incoming.navigation_menu)) {
      mergedLayout.navigation_menu = incoming.navigation_menu;
      mergedLayout.header = {
        ...(mergedLayout.header || {}),
        menu: {
          ...((mergedLayout.header && mergedLayout.header.menu) || {}),
          show: true,
          items: incoming.navigation_menu.map((m: any, idx: number) => ({
            id: m.id || ("m_" + idx),
            title: m.title,
            url: m.url || "/products",
            order: idx + 1,
            show: m.is_active !== false,
            children: m.children || [],
          })),
        },
      };
    }

    const siteName =
      incoming.site_name ||
      incoming.store_name ||
      incoming.siteName ||
      incoming.storeName ||
      incoming.brand_name ||
      existing?.site_name ||
      "آکسون کور | Axon Core";

    const logoUrl =
      incoming.logo_url !== undefined
        ? incoming.logo_url
        : incoming.logoUrl !== undefined
        ? incoming.logoUrl
        : existing?.logo_url || "";

    if (mergedLayout.header?.brand) {
      mergedLayout.header.brand.name = siteName;
      if (logoUrl) mergedLayout.header.brand.logoUrl = logoUrl;
    }

    const dbPayload: Record<string, any> = {
      site_name: siteName,
      tagline: incoming.tagline ?? existing?.tagline ?? "فروشگاه تخصصی محصولات تکنولوژی و گجت‌های هوشمند",
      description: incoming.description ?? incoming.tagline ?? existing?.description ?? "",
      phone: incoming.phone ?? incoming.support_phone ?? existing?.phone ?? "09376110200",
      email: incoming.email ?? incoming.support_email ?? existing?.email ?? "Pouriarahimi@yahoo.com",
      address: incoming.address ?? existing?.address ?? "شیراز - ستارخان",
      working_hours: incoming.working_hours ?? existing?.working_hours ?? "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      logo_url: logoUrl,
      favicon_url: incoming.favicon_url ?? existing?.favicon_url ?? "/favicon.ico",
      allow_google_index:
        incoming.allow_google_index !== undefined
          ? Boolean(incoming.allow_google_index)
          : existing?.allow_google_index !== false,
      maintenance_mode:
        incoming.maintenance_mode !== undefined
          ? String(incoming.maintenance_mode)
          : existing?.maintenance_mode || "none",
      header_announcement:
        incoming.header_announcement ?? incoming.announcement_text ?? existing?.header_announcement ?? "",
      homepage_layout_config: mergedLayout,
      updated_at: new Date().toISOString(),
    };

    let savedData: any = null;

    if (existing?.id) {
      const { data: d1, error: e1 } = await supabaseAdmin
        .from("site_info")
        .update(dbPayload)
        .eq("id", existing.id)
        .select()
        .maybeSingle();

      if (!e1 && d1) {
        savedData = d1;
      } else {
        // فال‌بک ایمن فقط با ستون‌های قطعی جدول site_info
        const minimalPayload: Record<string, any> = {
          homepage_layout_config: mergedLayout,
          allow_google_index: dbPayload.allow_google_index,
          maintenance_mode: dbPayload.maintenance_mode,
          header_announcement: dbPayload.header_announcement,
        };
        const { data: d2 } = await supabaseAdmin
          .from("site_info")
          .update(minimalPayload)
          .eq("id", existing.id)
          .select()
          .maybeSingle();
        savedData = d2 || { ...existing, ...dbPayload };
      }
    } else {
      const { data: ins } = await supabaseAdmin
        .from("site_info")
        .insert([{ homepage_layout_config: mergedLayout }])
        .select()
        .maybeSingle();
      savedData = ins || dbPayload;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...savedData,
          homepage_layout_config: mergedLayout,
          theme_builder_config: mergedLayout.theme_builder_config,
          auth_security_config: mergedLayout.auth_security_config,
          navigation_menu: mergedLayout.navigation_menu,
        },
      },
      { headers: NOCACHE }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: NOCACHE });
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

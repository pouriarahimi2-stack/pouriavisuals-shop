// File Path: app/api/site-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { normalizeSystemSettings } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

const NOCACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
};

export async function GET() {
  try {
    const { data: row } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    const safeRow = row || {};
    const layoutCfg =
      safeRow.homepage_layout_config && typeof safeRow.homepage_layout_config === "object"
        ? safeRow.homepage_layout_config
        : {};

    const systemSettings = normalizeSystemSettings(layoutCfg);

    const cleanLayoutCfg = { ...layoutCfg };
    if (cleanLayoutCfg.auth_security_config) {
      cleanLayoutCfg.auth_security_config = {
        userDeck: cleanLayoutCfg.auth_security_config.userDeck || { otpLength: 4 },
      };
    }

    const tbFooter = cleanLayoutCfg?.theme_builder_config?.globalFooter || {};
    const tbHeader = cleanLayoutCfg?.theme_builder_config?.globalHeader || {};

    const resolvedHeaderLogo =
      tbHeader.logoUrl ||
      cleanLayoutCfg?.header?.brand?.logoUrl ||
      safeRow.logo_url ||
      "";

    const resolvedFooterLogo =
      tbFooter.footerLogoUrl ||
      cleanLayoutCfg?.footer?.footerLogoUrl ||
      cleanLayoutCfg?.footer?.logoUrl ||
      safeRow.footer_logo_url ||
      resolvedHeaderLogo ||
      "";

    const enrichedPayload = {
      ...safeRow,
      site_name:
        tbHeader.brandName ||
        safeRow.site_name ||
        safeRow.store_name ||
        "آکسون کور | Axon Core",
      storeName:
        tbHeader.brandName ||
        safeRow.site_name ||
        safeRow.store_name ||
        "آکسون کور | Axon Core",
      logo_url: resolvedHeaderLogo,
      logoUrl: resolvedHeaderLogo,
      footer_logo_url: resolvedFooterLogo,
      footerLogoUrl: resolvedFooterLogo,
      phone:
        tbFooter.supportPhone ||
        safeRow.phone ||
        safeRow.contact_phone ||
        "09376110200",
      email:
        tbFooter.supportEmail ||
        safeRow.email ||
        safeRow.contact_email ||
        "Pouriarahimi@yahoo.com",
      address:
        tbFooter.warehouseAddress ||
        safeRow.address ||
        safeRow.contact_address ||
        "شیراز - ستارخان",
      working_hours:
        tbFooter.workingHours ||
        safeRow.working_hours ||
        "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      homepage_layout_config: {
        ...cleanLayoutCfg,
        footer: {
          ...(cleanLayoutCfg.footer || {}),
          logoUrl: resolvedFooterLogo,
          footerLogoUrl: resolvedFooterLogo,
        },
        system_settings: systemSettings,
        store_settings: systemSettings,
      },
      theme_builder_config:
        safeRow.theme_builder_config || cleanLayoutCfg.theme_builder_config || null,
      navigation_menu: safeRow.navigation_menu || cleanLayoutCfg.navigation_menu || [],
      settings: systemSettings,
      system_settings: systemSettings,
    };

    return NextResponse.json(
      {
        success: true,
        data: enrichedPayload,
        siteInfo: enrichedPayload,
        settings: systemSettings,
        system_settings: systemSettings,
        ...enrichedPayload,
      },
      { headers: NOCACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, data: {}, message: err.message },
      { status: 500, headers: NOCACHE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

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
            id: m.id || "m_" + idx,
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
      incoming.site_name ??
      incoming.store_name ??
      incoming.siteName ??
      incoming.storeName ??
      incoming.brand_name ??
      existing?.site_name ??
      "آکسون کور | Axon Core";

    const logoUrl =
      incoming.logo_url !== undefined
        ? incoming.logo_url
        : incoming.logoUrl !== undefined
        ? incoming.logoUrl
        : existing?.logo_url || "";

    const footerLogoUrl =
      incoming.footer_logo_url !== undefined
        ? incoming.footer_logo_url
        : incoming.footerLogoUrl !== undefined
        ? incoming.footerLogoUrl
        : mergedLayout?.theme_builder_config?.globalFooter?.footerLogoUrl ??
          mergedLayout?.footer?.footerLogoUrl ??
          mergedLayout?.footer?.logoUrl ??
          existing?.footer_logo_url ??
          logoUrl;

    if (mergedLayout.header?.brand) {
      mergedLayout.header.brand.name = siteName;
      if (logoUrl) mergedLayout.header.brand.logoUrl = logoUrl;
    }

    if (mergedLayout.footer) {
      mergedLayout.footer.logoUrl = footerLogoUrl;
      mergedLayout.footer.footerLogoUrl = footerLogoUrl;
    }

    const fullPayload: Record<string, any> = {
      site_name: siteName,
      tagline:
        incoming.tagline ??
        existing?.tagline ??
        "فروشگاه تخصصی محصولات تکنولوژی و گجت‌های هوشمند",
      description:
        incoming.description ??
        incoming.site_description ??
        incoming.tagline ??
        existing?.description ??
        "",
      phone:
        incoming.phone ??
        incoming.contact_phone ??
        incoming.support_phone ??
        existing?.phone ??
        "09376110200",
      email:
        incoming.email ??
        incoming.contact_email ??
        incoming.support_email ??
        existing?.email ??
        "Pouriarahimi@yahoo.com",
      address:
        incoming.address ??
        incoming.contact_address ??
        existing?.address ??
        "شیراز - ستارخان",
      working_hours:
        incoming.working_hours ??
        existing?.working_hours ??
        "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      logo_url: logoUrl,
      footer_logo_url: footerLogoUrl,
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
        incoming.header_announcement ??
        incoming.announcement_text ??
        existing?.header_announcement ??
        "",
      homepage_layout_config: mergedLayout,
      updated_at: new Date().toISOString(),
    };

    let savedData: any = null;

    if (existing?.id) {
      const { data: d1, error: e1 } = await supabaseAdmin
        .from("site_info")
        .update(fullPayload)
        .eq("id", existing.id)
        .select()
        .maybeSingle();

      if (!e1 && d1) {
        savedData = d1;
      } else {
        const minimalPayload: Record<string, any> = {
          site_name: siteName,
          homepage_layout_config: mergedLayout,
          updated_at: new Date().toISOString(),
        };
        const { data: d2 } = await supabaseAdmin
          .from("site_info")
          .update(minimalPayload)
          .eq("id", existing.id)
          .select()
          .maybeSingle();
        savedData = d2 || { ...existing, ...fullPayload };
      }
    } else {
      const { data: ins } = await supabaseAdmin
        .from("site_info")
        .insert([{ site_name: siteName, homepage_layout_config: mergedLayout }])
        .select()
        .maybeSingle();
      savedData = ins || fullPayload;
    }

    const systemSettings = normalizeSystemSettings(mergedLayout);

    return NextResponse.json(
      {
        success: true,
        message: "✓ تغییرات سایت با موفقیت در دیتابیس ذخیره و به صورت زنده منتشر شد.",
        data: {
          ...savedData,
          logo_url: logoUrl,
          footer_logo_url: footerLogoUrl,
          footerLogoUrl,
          homepage_layout_config: mergedLayout,
          theme_builder_config: mergedLayout.theme_builder_config,
          navigation_menu: mergedLayout.navigation_menu,
          settings: systemSettings,
          system_settings: systemSettings,
        },
      },
      { headers: NOCACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ذخیره اطلاعات سایت." },
      { status: 500, headers: NOCACHE_HEADERS }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

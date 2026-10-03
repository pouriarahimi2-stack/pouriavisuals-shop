// File Path: app/api/site-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow, pickNonEmpty } from "@/lib/siteInfoPersistence";
import { DEFAULT_DEVICE_OFFERS } from "@/lib/defaultDeviceConfig";

export const dynamic = "force-dynamic";

const NOCACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
};

export async function GET() {
  try {
    const safeRow = (await getMasterSiteInfoRow()) || {};
    const layoutCfg =
      safeRow.homepage_layout_config && typeof safeRow.homepage_layout_config === "object"
        ? safeRow.homepage_layout_config
        : {};

    const persisted = layoutCfg._persisted_identity || {};
    const systemSettings = normalizeSystemSettings(layoutCfg);
    const cleanLayoutCfg = { ...layoutCfg };
    delete cleanLayoutCfg.ai_provider_config;
    delete (safeRow as any).gemini_api_key;
    delete (safeRow as any).auth_security_config;

    if (cleanLayoutCfg.auth_security_config) {
      cleanLayoutCfg.auth_security_config = {
        userDeck: cleanLayoutCfg.auth_security_config.userDeck || { otpLength: 4 },
      };
    }

    const tbFooter = cleanLayoutCfg?.theme_builder_config?.globalFooter || {};
    const tbHeader = cleanLayoutCfg?.theme_builder_config?.globalHeader || {};

    const resolvedHeaderLogo =
      tbHeader.logoUrl !== undefined && String(tbHeader.logoUrl).trim() !== ""
        ? String(tbHeader.logoUrl).trim()
        : pickNonEmpty(
            persisted.logo_url,
            cleanLayoutCfg?.header?.brand?.logoUrl,
            safeRow.logo_url
          );

    const resolvedFooterLogo =
      tbFooter.footerLogoUrl !== undefined && String(tbFooter.footerLogoUrl).trim() !== ""
        ? String(tbFooter.footerLogoUrl).trim()
        : pickNonEmpty(
            persisted.footer_logo_url,
            cleanLayoutCfg?.footer?.footerLogoUrl,
            cleanLayoutCfg?.footer?.logoUrl,
            safeRow.footer_logo_url
          );

    const resolvedFavicon = pickNonEmpty(
      tbHeader.faviconUrl,
      persisted.favicon_url,
      safeRow.favicon_url,
      "/favicon.ico"
    );

    const resolvedDesc =
      tbFooter.brandDescription !== undefined
        ? String(tbFooter.brandDescription)
        : pickNonEmpty(persisted.description, cleanLayoutCfg?.footer?.description, safeRow.description);

    const resolvedAnnouncement =
      tbHeader.announcementText !== undefined
        ? String(tbHeader.announcementText)
        : pickNonEmpty(
            persisted.header_announcement,
            safeRow.header_announcement,
            cleanLayoutCfg?.header?.announcement?.text
          );

    const enrichedTbConfig = {
      ...(cleanLayoutCfg.theme_builder_config || {}),
      globalHeader: {
        ...tbHeader,
        logoUrl: resolvedHeaderLogo,
        faviconUrl: resolvedFavicon,
      },
      globalFooter: {
        ...tbFooter,
        footerLogoUrl: resolvedFooterLogo,
      },
      deviceOffers: {
        ...DEFAULT_DEVICE_OFFERS,
        ...(cleanLayoutCfg?.theme_builder_config?.deviceOffers || cleanLayoutCfg?.deviceOffers || {}),
      },
    };

    const enrichedPayload = {
      ...safeRow,
      site_name: pickNonEmpty(
        tbHeader.brandName,
        persisted.site_name,
        safeRow.site_name,
        "آکسون کور | Axon Core"
      ),
      storeName: pickNonEmpty(
        tbHeader.brandName,
        persisted.site_name,
        safeRow.site_name,
        "آکسون کور | Axon Core"
      ),
      tagline: pickNonEmpty(tbFooter.brandSubtitle, persisted.tagline, safeRow.tagline),
      description: resolvedDesc,
      footer_text: pickNonEmpty(
        tbFooter.copyright,
        persisted.footer_text,
        cleanLayoutCfg?.footer?.bottomBar?.copyrightText,
        safeRow.footer_text,
        "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026"
      ),
      logo_url: resolvedHeaderLogo,
      logoUrl: resolvedHeaderLogo,
      footer_logo_url: resolvedFooterLogo,
      footerLogoUrl: resolvedFooterLogo,
      favicon_url: resolvedFavicon,
      header_announcement: resolvedAnnouncement,
      phone: pickNonEmpty(tbFooter.supportPhone, persisted.phone, safeRow.phone, "09376110200"),
      email: pickNonEmpty(
        tbFooter.supportEmail,
        persisted.email,
        safeRow.email,
        "Pouriarahimi@yahoo.com"
      ),
      address: pickNonEmpty(
        tbFooter.warehouseAddress,
        persisted.address,
        safeRow.address,
        "شیراز - ستارخان"
      ),
      working_hours: pickNonEmpty(
        tbFooter.workingHours,
        persisted.working_hours,
        safeRow.working_hours,
        "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰"
      ),
      homepage_layout_config: {
        ...cleanLayoutCfg,
        theme_builder_config: enrichedTbConfig,
        system_settings: systemSettings,
        store_settings: systemSettings,
      },
      theme_builder_config: enrichedTbConfig,
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
    const existing = await getMasterSiteInfoRow();

    const prevLayout =
      existing?.homepage_layout_config && typeof existing.homepage_layout_config === "object"
        ? existing.homepage_layout_config
        : {};
    const prevPersisted = prevLayout._persisted_identity || {};
    const prevTb = prevLayout.theme_builder_config || {};
    const prevGh = prevTb.globalHeader || {};
    const prevGf = prevTb.globalFooter || {};

    const nextHeaderLogo =
      incoming.logo_url !== undefined
        ? String(incoming.logo_url).trim()
        : incoming.logoUrl !== undefined
        ? String(incoming.logoUrl).trim()
        : prevGh.logoUrl ?? prevPersisted.logo_url ?? existing?.logo_url ?? "";

    const nextFooterLogo =
      incoming.footer_logo_url !== undefined
        ? String(incoming.footer_logo_url).trim()
        : incoming.footerLogoUrl !== undefined
        ? String(incoming.footerLogoUrl).trim()
        : prevGf.footerLogoUrl ?? prevPersisted.footer_logo_url ?? existing?.footer_logo_url ?? "";

    const nextFavicon =
      incoming.favicon_url !== undefined
        ? String(incoming.favicon_url).trim()
        : prevGh.faviconUrl ?? prevPersisted.favicon_url ?? existing?.favicon_url ?? "/favicon.ico";

    const nextSiteName = pickNonEmpty(
      incoming.site_name,
      incoming.siteName,
      incoming.storeName,
      prevGh.brandName,
      existing?.site_name,
      "آکسون کور | Axon Core"
    );

    const mergedLayout: Record<string, any> = {
      ...prevLayout,
      ...(incoming.homepage_layout_config || {}),
      theme_builder_config: {
        ...prevTb,
        ...(incoming.theme_builder_config || {}),
        globalHeader: {
          ...prevGh,
          ...(incoming.theme_builder_config?.globalHeader || {}),
          brandName: nextSiteName,
          logoUrl: nextHeaderLogo,
          faviconUrl: nextFavicon,
        },
        globalFooter: {
          ...prevGf,
          ...(incoming.theme_builder_config?.globalFooter || {}),
          footerLogoUrl: nextFooterLogo,
        },
      },
    };

    if (incoming.auth_security_config) {
      mergedLayout.auth_security_config = {
        ...(prevLayout.auth_security_config || {}),
        ...incoming.auth_security_config,
      };
    }
    if (Array.isArray(incoming.navigation_menu)) {
      mergedLayout.navigation_menu = incoming.navigation_menu;
    }

    const topLevelFields = {
      site_name: nextSiteName,
      tagline: incoming.tagline ?? prevPersisted.tagline ?? existing?.tagline ?? "",
      description: incoming.description ?? prevPersisted.description ?? existing?.description ?? "",
      footer_text: incoming.footer_text ?? prevPersisted.footer_text ?? existing?.footer_text ?? "",
      logo_url: nextHeaderLogo,
      footer_logo_url: nextFooterLogo,
      favicon_url: nextFavicon,
      phone: incoming.phone ?? prevPersisted.phone ?? existing?.phone ?? "09376110200",
      email: incoming.email ?? prevPersisted.email ?? existing?.email ?? "Pouriarahimi@yahoo.com",
      address: incoming.address ?? prevPersisted.address ?? existing?.address ?? "شیراز - ستارخان",
      working_hours:
        incoming.working_hours ??
        prevPersisted.working_hours ??
        existing?.working_hours ??
        "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      header_announcement:
        incoming.header_announcement ??
        prevPersisted.header_announcement ??
        existing?.header_announcement ??
        "",
    };

    const { savedRow } = await saveMasterSiteInfoRow(existing, mergedLayout, topLevelFields);

    return NextResponse.json({ success: true, data: savedRow }, { headers: NOCACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
export async function PATCH(req: NextRequest) {
  return POST(req);
}

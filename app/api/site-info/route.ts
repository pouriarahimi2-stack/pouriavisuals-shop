// File Path: app/api/site-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
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

    // احترام ۱۰۰٪ به مقدار ذخیره شده در استودیوی ظاهر (حتی اگر رشته خالی "" باشد)
    const resolvedHeaderLogo =
      tbHeader.logoUrl !== undefined
        ? String(tbHeader.logoUrl).trim()
        : persisted.logo_url !== undefined
        ? String(persisted.logo_url).trim()
        : String(safeRow.logo_url || "").trim();

    const resolvedFooterLogo =
      tbFooter.footerLogoUrl !== undefined
        ? String(tbFooter.footerLogoUrl).trim()
        : persisted.footer_logo_url !== undefined
        ? String(persisted.footer_logo_url).trim()
        : String(safeRow.footer_logo_url || "").trim();

    const resolvedFavicon =
      tbHeader.faviconUrl !== undefined
        ? String(tbHeader.faviconUrl).trim()
        : String(persisted.favicon_url || safeRow.favicon_url || "/favicon.ico").trim();

    const resolvedSiteName =
      tbHeader.brandName !== undefined
        ? String(tbHeader.brandName)
        : String(persisted.site_name ?? safeRow.site_name ?? "");

    const resolvedTagline =
      tbFooter.brandSubtitle !== undefined
        ? String(tbFooter.brandSubtitle)
        : String(persisted.tagline ?? safeRow.tagline ?? "");

    const resolvedDesc =
      tbFooter.brandDescription !== undefined
        ? String(tbFooter.brandDescription)
        : String(persisted.description ?? safeRow.description ?? "");

    const resolvedFooterText =
      tbFooter.copyright !== undefined
        ? String(tbFooter.copyright)
        : String(persisted.footer_text ?? safeRow.footer_text ?? "");

    const resolvedAnnouncement =
      tbHeader.announcementText !== undefined
        ? String(tbHeader.announcementText)
        : String(persisted.header_announcement ?? safeRow.header_announcement ?? "");

    const enrichedTbConfig = {
      ...(cleanLayoutCfg.theme_builder_config || {}),
      globalHeader: {
        ...tbHeader,
        brandName: resolvedSiteName,
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
      site_name: resolvedSiteName,
      storeName: resolvedSiteName,
      tagline: resolvedTagline,
      description: resolvedDesc,
      footer_text: resolvedFooterText,
      logo_url: resolvedHeaderLogo,
      logoUrl: resolvedHeaderLogo,
      footer_logo_url: resolvedFooterLogo,
      footerLogoUrl: resolvedFooterLogo,
      favicon_url: resolvedFavicon,
      header_announcement: resolvedAnnouncement,
      phone:
        tbFooter.supportPhone !== undefined
          ? String(tbFooter.supportPhone)
          : String(persisted.phone ?? safeRow.phone ?? ""),
      email:
        tbFooter.supportEmail !== undefined
          ? String(tbFooter.supportEmail)
          : String(persisted.email ?? safeRow.email ?? ""),
      address:
        tbFooter.warehouseAddress !== undefined
          ? String(tbFooter.warehouseAddress)
          : String(persisted.address ?? safeRow.address ?? ""),
      working_hours:
        tbFooter.workingHours !== undefined
          ? String(tbFooter.workingHours)
          : String(persisted.working_hours ?? safeRow.working_hours ?? ""),
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
        : String(prevGh.logoUrl ?? prevPersisted.logo_url ?? "");

    const nextFooterLogo =
      incoming.footer_logo_url !== undefined
        ? String(incoming.footer_logo_url).trim()
        : incoming.footerLogoUrl !== undefined
        ? String(incoming.footerLogoUrl).trim()
        : String(prevGf.footerLogoUrl ?? prevPersisted.footer_logo_url ?? "");

    const nextFavicon =
      incoming.favicon_url !== undefined
        ? String(incoming.favicon_url).trim()
        : String(prevGh.faviconUrl ?? prevPersisted.favicon_url ?? "/favicon.ico");

    const nextSiteName =
      incoming.site_name !== undefined
        ? String(incoming.site_name)
        : incoming.siteName !== undefined
        ? String(incoming.siteName)
        : String(prevGh.brandName ?? prevPersisted.site_name ?? "");

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
      tagline: incoming.tagline ?? prevPersisted.tagline ?? "",
      description: incoming.description ?? prevPersisted.description ?? "",
      footer_text: incoming.footer_text ?? prevPersisted.footer_text ?? "",
      logo_url: nextHeaderLogo,
      footer_logo_url: nextFooterLogo,
      favicon_url: nextFavicon,
      phone: incoming.phone ?? prevPersisted.phone ?? "",
      email: incoming.email ?? prevPersisted.email ?? "",
      address: incoming.address ?? prevPersisted.address ?? "",
      working_hours: incoming.working_hours ?? prevPersisted.working_hours ?? "",
      header_announcement: incoming.header_announcement ?? prevPersisted.header_announcement ?? "",
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

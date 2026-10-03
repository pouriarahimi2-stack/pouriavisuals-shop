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
    const { data: rows } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(5);

    const safeRow = rows && rows.length > 0 ? rows[0] : {};
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
      tbHeader.logoUrl !== undefined
        ? tbHeader.logoUrl
        : cleanLayoutCfg?.header?.brand?.logoUrl || safeRow.logo_url || "";

    const resolvedFooterLogo =
      tbFooter.footerLogoUrl !== undefined
        ? tbFooter.footerLogoUrl
        : cleanLayoutCfg?.footer?.footerLogoUrl ?? safeRow.footer_logo_url ?? "";

    const resolvedFavicon = tbHeader.faviconUrl || safeRow.favicon_url || "/favicon.ico";
    const resolvedDesc =
      tbFooter.brandDescription !== undefined
        ? tbFooter.brandDescription
        : cleanLayoutCfg?.footer?.description ?? safeRow.description ?? "";

    const resolvedAnnouncement =
      tbHeader.announcementText !== undefined
        ? tbHeader.announcementText
        : safeRow.header_announcement || cleanLayoutCfg?.header?.announcement?.text || "";

    const enrichedPayload = {
      ...safeRow,
      site_name: tbHeader.brandName || safeRow.site_name || "آکسون کور | Axon Core",
      storeName: tbHeader.brandName || safeRow.site_name || "آکسون کور | Axon Core",
      tagline: tbFooter.brandSubtitle || safeRow.tagline || "",
      description: resolvedDesc,
      footer_text:
        tbFooter.copyright ||
        cleanLayoutCfg?.footer?.bottomBar?.copyrightText ||
        safeRow.footer_text ||
        "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
      logo_url: resolvedHeaderLogo,
      logoUrl: resolvedHeaderLogo,
      footer_logo_url: resolvedFooterLogo,
      footerLogoUrl: resolvedFooterLogo,
      favicon_url: resolvedFavicon,
      header_announcement: resolvedAnnouncement,
      phone: tbFooter.supportPhone || safeRow.phone || "09376110200",
      email: tbFooter.supportEmail || safeRow.email || "Pouriarahimi@yahoo.com",
      address: tbFooter.warehouseAddress || safeRow.address || "شیراز - ستارخان",
      working_hours: tbFooter.workingHours || safeRow.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      homepage_layout_config: {
        ...cleanLayoutCfg,
        system_settings: systemSettings,
        store_settings: systemSettings,
      },
      theme_builder_config: cleanLayoutCfg.theme_builder_config || null,
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
    const { data: allRows } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("updated_at", { ascending: false });

    const existing = allRows && allRows.length > 0 ? allRows[0] : null;

    const prevLayout =
      existing?.homepage_layout_config && typeof existing.homepage_layout_config === "object"
        ? existing.homepage_layout_config
        : {};

    const mergedLayout: Record<string, any> = {
      ...prevLayout,
      ...(incoming.homepage_layout_config || {}),
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
    }

    const updatePayload: Record<string, any> = {
      site_name: incoming.site_name ?? existing?.site_name ?? "آکسون کور | Axon Core",
      homepage_layout_config: mergedLayout,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabaseAdmin.from("site_info").update(updatePayload).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("site_info").insert([updatePayload]);
    }

    return NextResponse.json({ success: true, data: updatePayload }, { headers: NOCACHE_HEADERS });
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

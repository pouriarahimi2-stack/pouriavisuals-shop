// File Path: app/api/theme-builder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    const layoutCfg =
      data?.homepage_layout_config && typeof data.homepage_layout_config === "object"
        ? data.homepage_layout_config
        : DEFAULT_HOMEPAGE_LAYOUT_CONFIG;

    const existingTb = layoutCfg.theme_builder_config || {};
    const existingGh = existingTb.globalHeader || {};
    const existingGf = existingTb.globalFooter || {};

    const resolvedFooterLogo =
      existingGf.footerLogoUrl ??
      layoutCfg?.footer?.footerLogoUrl ??
      layoutCfg?.footer?.logoUrl ??
      data?.footer_logo_url ??
      data?.logo_url ??
      "";

    const storedTheme = {
      ...existingTb,
      globalHeader: {
        brandName:
          existingGh.brandName ||
          layoutCfg?.header?.brand?.name ||
          data?.site_name ||
          "آکسون کور | Axon Core",
        logoText:
          existingGh.logoText ||
          layoutCfg?.header?.brand?.name ||
          data?.site_name ||
          "آکسون کور",
        logoUrl:
          existingGh.logoUrl !== undefined
            ? existingGh.logoUrl
            : layoutCfg?.header?.brand?.logoUrl || data?.logo_url || "",
        logoWidth: Number(existingGh.logoWidth || layoutCfg?.header?.brand?.logoWidth || 38),
        logoHeight: Number(existingGh.logoHeight || layoutCfg?.header?.brand?.logoHeight || 38),
        faviconUrl: existingGh.faviconUrl || data?.favicon_url || "/favicon.ico",
        announcementText:
          existingGh.announcementText !== undefined
            ? existingGh.announcementText
            : data?.header_announcement || layoutCfg?.header?.announcement?.text || "",
        announcementEnabled:
          existingGh.announcementEnabled !== undefined
            ? Boolean(existingGh.announcementEnabled)
            : Boolean(layoutCfg?.header?.announcement?.show),
        ctaText: existingGh.ctaText || "کاتالوگ محصولات",
        ctaUrl: existingGh.ctaUrl || "/products",
        bgColor: existingGh.bgColor || "#07090e",
        textColor: existingGh.textColor || "#ffffff",
      },
      globalFooter: {
        ...existingGf,
        footerLogoUrl: resolvedFooterLogo,
        brandTitle:
          existingGf.brandTitle ||
          layoutCfg?.footer?.brandTitle ||
          data?.site_name ||
          "آکسون کور | Axon Core",
        brandSubtitle:
          existingGf.brandSubtitle ||
          layoutCfg?.footer?.brandSubtitle ||
          "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال",
        supportPhone: existingGf.supportPhone || data?.phone || "09376110200",
        supportEmail: existingGf.supportEmail || data?.email || "Pouriarahimi@yahoo.com",
        warehouseAddress: existingGf.warehouseAddress || data?.address || "شیراز - ستارخان",
        workingHours:
          existingGf.workingHours || data?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: existingGf.enamadCode || "7434404",
        enamadLink:
          existingGf.enamadLink ||
          "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD",
        enamadEnabled:
          existingGf.enamadEnabled !== undefined ? Boolean(existingGf.enamadEnabled) : true,
        copyright:
          existingGf.copyright ||
          layoutCfg?.footer?.bottomBar?.copyrightText ||
          "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
        externalLinks: existingGf.externalLinks ||
          layoutCfg?.footer?.externalLinks || [
            { id: "ext_torob", title: "فید رسمی محصولات در ترب (Torob)", url: "/api/torob" },
            { id: "ext_sitemap", title: "نقشه سایت گوگل (Sitemap)", url: "/sitemap.xml" },
          ],
      },
      homeSections: Array.isArray(existingTb.homeSections)
        ? existingTb.homeSections
        : layoutCfg.homeSections || [],
    };

    return NextResponse.json(
      {
        success: true,
        config: storedTheme,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdminSession(req))) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { config } = body;

    const { data: existing } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    const prevLayout =
      existing?.homepage_layout_config && typeof existing.homepage_layout_config === "object"
        ? existing.homepage_layout_config
        : DEFAULT_HOMEPAGE_LAYOUT_CONFIG;

    const gh = config?.globalHeader || {};
    const gf = config?.globalFooter || {};
    const homeSections = Array.isArray(config?.homeSections) ? config.homeSections : [];

    const headerLogoUrl =
      gh.logoUrl !== undefined ? String(gh.logoUrl).trim() : existing?.logo_url || "";
    const dedicatedFooterLogoUrl =
      gf.footerLogoUrl !== undefined
        ? String(gf.footerLogoUrl).trim()
        : prevLayout?.footer?.footerLogoUrl || prevLayout?.footer?.logoUrl || headerLogoUrl;

    const heroSec = homeSections.find((s: any) => s.type === "NativeHero3D");
    const sliderSec = homeSections.find((s: any) => s.type === "NativePerspectiveSlider");
    const catalogSec = homeSections.find((s: any) => s.type === "NativeProductCatalog");

    const updatedLayout = {
      ...prevLayout,
      theme_builder_config: {
        ...config,
        globalHeader: {
          ...gh,
          logoUrl: headerLogoUrl,
        },
        globalFooter: {
          ...gf,
          footerLogoUrl: dedicatedFooterLogoUrl,
        },
      },
      homeSections,
      header: {
        ...(prevLayout.header || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.header),
        brand: {
          ...((prevLayout.header && prevLayout.header.brand) ||
            DEFAULT_HOMEPAGE_LAYOUT_CONFIG.header.brand),
          name: gh.brandName || "آکسون کور | Axon Core",
          logoUrl: headerLogoUrl,
          logoWidth: Number(gh.logoWidth || 38),
          logoHeight: Number(gh.logoHeight || 38),
          showLogo: true,
          showName: true,
        },
        announcement: {
          show: Boolean(gh.announcementEnabled),
          text: gh.announcementText || "",
          backgroundColor: "#0284c7",
          textColor: "#ffffff",
          dismissible: true,
        },
      },
      hero: heroSec
        ? {
            ...(prevLayout.hero || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.hero),
            show: heroSec.enabled !== false,
            title: heroSec.title,
            subtitle: heroSec.subtitle,
          }
        : prevLayout.hero || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.hero,
      showcase3D: sliderSec
        ? {
            ...(prevLayout.showcase3D || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.showcase3D),
            show: sliderSec.enabled !== false,
            title: sliderSec.title,
            subtitle: sliderSec.subtitle,
          }
        : prevLayout.showcase3D || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.showcase3D,
      productsSection: catalogSec
        ? {
            ...(prevLayout.productsSection || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.productsSection),
            show: catalogSec.enabled !== false,
            title: catalogSec.title,
            subtitle: catalogSec.subtitle,
          }
        : prevLayout.productsSection || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.productsSection,
      footer: {
        ...(prevLayout.footer || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer),
        logoUrl: dedicatedFooterLogoUrl || headerLogoUrl,
        footerLogoUrl: dedicatedFooterLogoUrl,
        brandTitle: gf.brandTitle || gh.brandName || "آکسون کور | Axon Core",
        brandSubtitle: gf.brandSubtitle || "",
        supportPhone: gf.supportPhone || "09376110200",
        supportEmail: gf.supportEmail || "Pouriarahimi@yahoo.com",
        warehouseAddress: gf.warehouseAddress || "شیراز - ستارخان",
        workingHours: gf.workingHours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: gf.enamadCode || "7434404",
        enamadLink:
          gf.enamadLink ||
          "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD",
        enamadEnabled: gf.enamadEnabled !== false,
        externalLinks: gf.externalLinks || [],
        bottomBar: {
          ...((prevLayout.footer && prevLayout.footer.bottomBar) || {}),
          show: true,
          copyrightText:
            gf.copyright || "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
        },
      },
    };

    const fullUpdateObj: Record<string, any> = {
      site_name: gh.brandName || gf.brandTitle || existing?.site_name || "آکسون کور | Axon Core",
      logo_url: headerLogoUrl,
      footer_logo_url: dedicatedFooterLogoUrl,
      favicon_url: gh.faviconUrl || existing?.favicon_url || "/favicon.ico",
      phone: gf.supportPhone || existing?.phone || "09376110200",
      email: gf.supportEmail || existing?.email || "Pouriarahimi@yahoo.com",
      address: gf.warehouseAddress || existing?.address || "شیراز - ستارخان",
      working_hours: gf.workingHours || existing?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      homepage_layout_config: updatedLayout,
      header_announcement: gh.announcementText || "",
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error: uErr } = await supabaseAdmin
        .from("site_info")
        .update(fullUpdateObj)
        .eq("id", existing.id);

      if (uErr) {
        await supabaseAdmin
          .from("site_info")
          .update({
            homepage_layout_config: updatedLayout,
            header_announcement: gh.announcementText || "",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      }
    } else {
      await supabaseAdmin.from("site_info").insert([
        {
          homepage_layout_config: updatedLayout,
          header_announcement: gh.announcementText || "",
        },
      ]);
    }

    return NextResponse.json({
      success: true,
      config: updatedLayout.theme_builder_config,
      message: "✓ تنظیمات ظاهر، هدر، لوگوی اختصاصی فوتر و اطلاعات تماس با موفقیت ذخیره و منتشر شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

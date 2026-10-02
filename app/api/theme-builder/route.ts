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

    const storedTheme = layoutCfg.theme_builder_config || {
      globalHeader: {
        brandName: layoutCfg?.header?.brand?.name || data?.site_name || "آکسون کور | Axon Core",
        logoText: layoutCfg?.header?.brand?.name || data?.site_name || "آکسون کور",
        logoUrl: layoutCfg?.header?.brand?.logoUrl || data?.logo_url || "",
        logoWidth: layoutCfg?.header?.brand?.logoWidth || 38,
        logoHeight: layoutCfg?.header?.brand?.logoHeight || 38,
        faviconUrl: data?.favicon_url || "/favicon.ico",
        announcementText: data?.header_announcement || layoutCfg?.header?.announcement?.text || "",
        announcementEnabled: Boolean(layoutCfg?.header?.announcement?.show),
        ctaText: "کاتالوگ محصولات",
        ctaUrl: "/products",
        bgColor: "#07090e",
        textColor: "#ffffff",
      },
      globalFooter: {
        footerLogoUrl: layoutCfg?.footer?.logoUrl || data?.logo_url || "",
        brandTitle: layoutCfg?.footer?.brandTitle || data?.site_name || "آکسون کور | Axon Core",
        brandSubtitle:
          layoutCfg?.footer?.brandSubtitle ||
          "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال",
        supportPhone: data?.phone || "09376110200",
        supportEmail: data?.email || "Pouriarahimi@yahoo.com",
        warehouseAddress: data?.address || "شیراز - ستارخان",
        workingHours: data?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: "7434404",
        enamadLink:
          "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD",
        enamadEnabled: true,
        copyright:
          layoutCfg?.footer?.bottomBar?.copyrightText ||
          "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
        externalLinks: layoutCfg?.footer?.externalLinks || [
          { id: "ext_torob", title: "فید رسمی محصولات در ترب (Torob)", url: "/api/torob" },
          { id: "ext_sitemap", title: "نقشه سایت گوگل (Sitemap)", url: "/sitemap.xml" },
        ],
      },
      homeSections: layoutCfg.homeSections || [],
    };

    return NextResponse.json({
      success: true,
      config: storedTheme,
    });
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

    const heroSec = homeSections.find((s: any) => s.type === "NativeHero3D");
    const sliderSec = homeSections.find((s: any) => s.type === "NativePerspectiveSlider");
    const catalogSec = homeSections.find((s: any) => s.type === "NativeProductCatalog");

    const updatedLayout = {
      ...prevLayout,
      theme_builder_config: config,
      homeSections,
      header: {
        ...(prevLayout.header || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.header),
        brand: {
          ...((prevLayout.header && prevLayout.header.brand) || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.header.brand),
          name: gh.brandName || "آکسون کور | Axon Core",
          logoUrl: gh.logoUrl !== undefined ? gh.logoUrl : "",
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
        logoUrl: gf.footerLogoUrl || gh.logoUrl || "",
        brandTitle: gf.brandTitle || gh.brandName || "آکسون کور | Axon Core",
        brandSubtitle: gf.brandSubtitle || "",
        externalLinks: gf.externalLinks || [],
        bottomBar: {
          ...((prevLayout.footer && prevLayout.footer.bottomBar) || {}),
          show: true,
          copyrightText: gf.copyright || "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
        },
      },
    };

    if (existing?.id) {
      await supabaseAdmin
        .from("site_info")
        .update({
          homepage_layout_config: updatedLayout,
          header_announcement: gh.announcementText || "",
        })
        .eq("id", existing.id);
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
      config,
      message: "✓ تنظیمات ظاهر، هدر، لوگو و فوتر با موفقیت در دیتابیس ذخیره و منتشر شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

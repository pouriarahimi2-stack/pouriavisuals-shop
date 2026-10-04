// File Path: app/api/theme-builder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow, pickNonEmpty } from "@/lib/siteInfoPersistence";
import { DEFAULT_DEVICE_OFFERS } from "@/lib/defaultDeviceConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getMasterSiteInfoRow();
    const layoutCfg =
      data?.homepage_layout_config && typeof data.homepage_layout_config === "object"
        ? data.homepage_layout_config
        : DEFAULT_HOMEPAGE_LAYOUT_CONFIG;

    const persisted = layoutCfg._persisted_identity || {};
    const existingTb = layoutCfg.theme_builder_config || {};
    const existingGh = existingTb.globalHeader || {};
    const existingGf = existingTb.globalFooter || {};

    const resolvedHeaderLogo =
      existingGh.logoUrl !== undefined
        ? String(existingGh.logoUrl)
        : pickNonEmpty(persisted.logo_url, layoutCfg?.header?.brand?.logoUrl, data?.logo_url);

    const resolvedFooterLogo =
      existingGf.footerLogoUrl !== undefined
        ? String(existingGf.footerLogoUrl)
        : pickNonEmpty(persisted.footer_logo_url, layoutCfg?.footer?.footerLogoUrl, data?.footer_logo_url);

    const resolvedFavicon = pickNonEmpty(
      existingGh.faviconUrl,
      persisted.favicon_url,
      data?.favicon_url,
      "/favicon.ico"
    );

    const storedTheme = {
      ...existingTb,
      globalHeader: {
        brandName:
          existingGh.brandName !== undefined
            ? String(existingGh.brandName)
            : pickNonEmpty(persisted.site_name, data?.site_name, "آکسون کور | Axon Core"),
        logoText:
          existingGh.logoText !== undefined
            ? String(existingGh.logoText)
            : pickNonEmpty(data?.site_name, "آکسون کور"),
        logoUrl: resolvedHeaderLogo,
        logoWidth: Number(existingGh.logoWidth || 44),
        logoHeight: Number(existingGh.logoHeight || 44),
        logoRadius: existingGh.logoRadius || "12px",
        logoObjectFit: existingGh.logoObjectFit || "contain",
        faviconUrl: resolvedFavicon,
        variant: existingGh.variant || "capsule",
        height: Number(existingGh.height || 64),
        menuFontSize: Number(existingGh.menuFontSize || 12),
        announcementText:
          existingGh.announcementText !== undefined
            ? String(existingGh.announcementText)
            : pickNonEmpty(persisted.header_announcement, data?.header_announcement),
        announcementEnabled: Boolean(
          existingGh.announcementEnabled ?? layoutCfg?.header?.announcement?.show ?? false
        ),
        ctaText: existingGh.ctaText !== undefined ? String(existingGh.ctaText) : "کاتالوگ محصولات",
        ctaUrl: existingGh.ctaUrl || "/products",
        bgColor: existingGh.bgColor || "",
      },
      globalFooter: {
        ...existingGf,
        footerLogoUrl: resolvedFooterLogo,
        footerLogoWidth: Number(existingGf.footerLogoWidth || 140),
        footerLogoHeight: Number(existingGf.footerLogoHeight || 56),
        footerLogoRadius: existingGf.footerLogoRadius || "12px",
        showFooterLogoBox:
          existingGf.showFooterLogoBox !== undefined
            ? Boolean(existingGf.showFooterLogoBox)
            : false,
        brandTitle:
          existingGf.brandTitle !== undefined
            ? String(existingGf.brandTitle)
            : "آکسون کور | Axon Core",
        brandSubtitle:
          existingGf.brandSubtitle !== undefined
            ? String(existingGf.brandSubtitle)
            : "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال",
        brandDescription:
          existingGf.brandDescription !== undefined
            ? String(existingGf.brandDescription)
            : pickNonEmpty(persisted.description, data?.description),
        showTrustBadges:
          existingGf.showTrustBadges !== undefined ? Boolean(existingGf.showTrustBadges) : true,
        badge1Text:
          existingGf.badge1Text !== undefined ? String(existingGf.badge1Text) : "ضمانت اصالت کالا",
        badge2Text:
          existingGf.badge2Text !== undefined ? String(existingGf.badge2Text) : "ارسال سریع سراسری",
        quickLinksTitle:
          existingGf.quickLinksTitle !== undefined
            ? String(existingGf.quickLinksTitle)
            : "دسترسی سریع",
        supportTitle:
          existingGf.supportTitle !== undefined
            ? String(existingGf.supportTitle)
            : "مرکز ارتباط و پشتیبانی",
        scaleMode: existingGf.scaleMode || "normal",
        paddingMode: existingGf.paddingMode || "normal",
        bgColor: existingGf.bgColor || "",
        columnOrder:
          Array.isArray(existingGf.columnOrder) && existingGf.columnOrder.length === 4
            ? existingGf.columnOrder
            : ["brand", "quick_links", "support", "enamad"],
        supportPhone:
          existingGf.supportPhone !== undefined
            ? String(existingGf.supportPhone)
            : pickNonEmpty(persisted.phone, data?.phone, "09376110200"),
        supportEmail:
          existingGf.supportEmail !== undefined
            ? String(existingGf.supportEmail)
            : pickNonEmpty(persisted.email, data?.email, "Pouriarahimi@yahoo.com"),
        warehouseAddress:
          existingGf.warehouseAddress !== undefined
            ? String(existingGf.warehouseAddress)
            : pickNonEmpty(persisted.address, data?.address, "شیراز - ستارخان"),
        workingHours:
          existingGf.workingHours !== undefined
            ? String(existingGf.workingHours)
            : pickNonEmpty(
                persisted.working_hours,
                data?.working_hours,
                "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰"
              ),
        enamadCode: existingGf.enamadCode !== undefined ? String(existingGf.enamadCode) : "7434404",
        enamadLink:
          existingGf.enamadLink ||
          "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD",
        enamadEnabled: existingGf.enamadEnabled !== false,
        copyright:
          existingGf.copyright !== undefined
            ? String(existingGf.copyright)
            : "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
        quickLinks: Array.isArray(existingGf.quickLinks)
          ? existingGf.quickLinks
          : [
              { id: "q1", title: "🛍 کاتالوگ محصولات دیجیتال", url: "/products", show: true },
              { id: "q2", title: "📡 رادار اخبار تکنولوژی", url: "/news", show: true },
              { id: "q3", title: "📚 مجله تخصصی و راهنمای خرید", url: "/blog", show: true },
              { id: "q4", title: "📦 پیگیری لحظه‌ای سفارشات", url: "/track-order", show: true },
            ],
        externalLinks: Array.isArray(existingGf.externalLinks)
          ? existingGf.externalLinks.filter(
              (x: any) => x.url !== "/api/torob" && x.url !== "/sitemap.xml"
            )
          : [],
      },
      bannerSizing: existingTb.bannerSizing ||
        layoutCfg.bannerSizing || {
          mobileHeight: 160,
          tabletHeight: 250,
          desktopHeight: 340,
          mobileImageSize: 90,
          desktopImageSize: 220,
          mobileLayout: "horizontal",
        },
      deviceOffers: {
        ...DEFAULT_DEVICE_OFFERS,
        ...(existingTb.deviceOffers || layoutCfg.deviceOffers || {}),
      },
      adminSidebarLabels: existingTb.adminSidebarLabels || layoutCfg.adminSidebarLabels || {},
      homeSections: Array.isArray(existingTb.homeSections)
        ? existingTb.homeSections
        : layoutCfg.homeSections || [],
    };

    return NextResponse.json(
      { success: true, config: storedTheme },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
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
    const existing = await getMasterSiteInfoRow();

    const prevLayout =
      existing?.homepage_layout_config && typeof existing.homepage_layout_config === "object"
        ? existing.homepage_layout_config
        : DEFAULT_HOMEPAGE_LAYOUT_CONFIG;

    const prevTb = prevLayout.theme_builder_config || {};
    const gh = { ...(prevTb.globalHeader || {}), ...(config?.globalHeader || {}) };
    const gf = { ...(prevTb.globalFooter || {}), ...(config?.globalFooter || {}) };

    const homeSections = Array.isArray(config?.homeSections)
      ? config.homeSections
      : prevTb.homeSections || prevLayout.homeSections || [];

    const bannerSizing = config?.bannerSizing ||
      prevTb.bannerSizing ||
      prevLayout.bannerSizing || {
        mobileHeight: 160,
        tabletHeight: 250,
        desktopHeight: 340,
        mobileImageSize: 90,
        desktopImageSize: 220,
        mobileLayout: "horizontal",
      };

    const deviceOffers = {
      ...DEFAULT_DEVICE_OFFERS,
      ...(prevTb.deviceOffers || {}),
      ...(config?.deviceOffers || {}),
    };

    const adminSidebarLabels = {
      ...(prevTb.adminSidebarLabels || {}),
      ...(config?.adminSidebarLabels || {}),
    };

    const headerLogoUrl = gh.logoUrl !== undefined ? String(gh.logoUrl).trim() : "";
    const footerLogoUrl = gf.footerLogoUrl !== undefined ? String(gf.footerLogoUrl).trim() : "";
    const faviconUrl = gh.faviconUrl !== undefined ? String(gh.faviconUrl).trim() : "/favicon.ico";

    // حفظ دقیق رشته‌های خالی (اگر ادمین عنوان برند در فوتر یا هدر را پاک کرد، دقیقاً "" ذخیره شود)
    const exactHeaderBrandName = gh.brandName !== undefined ? String(gh.brandName) : "آکسون کور | Axon Core";
    const exactFooterBrandTitle = gf.brandTitle !== undefined ? String(gf.brandTitle) : "";
    const exactFooterSubtitle = gf.brandSubtitle !== undefined ? String(gf.brandSubtitle) : "";

    const updatedLayout = {
      ...prevLayout,
      theme_builder_config: {
        ...prevTb,
        ...config,
        globalHeader: {
          ...gh,
          brandName: exactHeaderBrandName,
          logoUrl: headerLogoUrl,
          faviconUrl,
        },
        globalFooter: {
          ...gf,
          brandTitle: exactFooterBrandTitle,
          brandSubtitle: exactFooterSubtitle,
          footerLogoUrl,
        },
        bannerSizing,
        deviceOffers,
        adminSidebarLabels,
        homeSections,
      },
      bannerSizing,
      deviceOffers,
      adminSidebarLabels,
      homeSections,
      header: {
        ...(prevLayout.header || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.header),
        variant: gh.variant || "capsule",
        height: Number(gh.height || 64),
        brand: {
          name: exactHeaderBrandName,
          logoUrl: headerLogoUrl,
          logoWidth: Number(gh.logoWidth || 44),
          logoHeight: Number(gh.logoHeight || 44),
          showLogo: true,
          showName: exactHeaderBrandName.trim().length > 0,
        },
        announcement: {
          show: Boolean(gh.announcementEnabled),
          text: String(gh.announcementText || ""),
          backgroundColor: "#0284c7",
          textColor: "#ffffff",
          dismissible: true,
        },
      },
      footer: {
        ...(prevLayout.footer || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer),
        logoUrl: footerLogoUrl,
        footerLogoUrl,
        footerLogoWidth: Number(gf.footerLogoWidth || 140),
        footerLogoHeight: Number(gf.footerLogoHeight || 56),
        showFooterLogoBox: Boolean(gf.showFooterLogoBox),
        brandTitle: exactFooterBrandTitle,
        brandSubtitle: exactFooterSubtitle,
        description: String(gf.brandDescription ?? ""),
        scaleMode: gf.scaleMode || "normal",
        paddingMode: gf.paddingMode || "normal",
        bgColor: gf.bgColor || "",
        columnOrder: gf.columnOrder || ["brand", "quick_links", "support", "enamad"],
        supportPhone: gf.supportPhone !== undefined ? String(gf.supportPhone) : "09376110200",
        supportEmail: gf.supportEmail !== undefined ? String(gf.supportEmail) : "Pouriarahimi@yahoo.com",
        warehouseAddress: gf.warehouseAddress !== undefined ? String(gf.warehouseAddress) : "شیراز - ستارخان",
        workingHours: gf.workingHours !== undefined ? String(gf.workingHours) : "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: gf.enamadCode !== undefined ? String(gf.enamadCode) : "7434404",
        enamadLink: gf.enamadLink || "",
        enamadEnabled: gf.enamadEnabled !== false,
        quickLinks: { show: true, title: gf.quickLinksTitle || "دسترسی سریع", links: gf.quickLinks || [] },
        externalLinks: Array.isArray(gf.externalLinks) ? gf.externalLinks : [],
        bottomBar: {
          show: true,
          copyrightText: gf.copyright !== undefined ? String(gf.copyright) : "",
        },
      },
    };

    const topLevelFields = {
      site_name: exactHeaderBrandName || "آکسون کور | Axon Core",
      tagline: exactFooterSubtitle,
      description: String(gf.brandDescription ?? ""),
      footer_text: String(gf.copyright ?? ""),
      logo_url: headerLogoUrl,
      footer_logo_url: footerLogoUrl,
      favicon_url: faviconUrl,
      phone: String(gf.supportPhone ?? "09376110200"),
      email: String(gf.supportEmail ?? "Pouriarahimi@yahoo.com"),
      address: String(gf.warehouseAddress ?? "شیراز - ستارخان"),
      working_hours: String(gf.workingHours ?? "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰"),
      header_announcement: String(gh.announcementText ?? ""),
    };

    const { savedRow } = await saveMasterSiteInfoRow(existing, updatedLayout, topLevelFields);

    return NextResponse.json({
      success: true,
      config: savedRow.homepage_layout_config.theme_builder_config,
      siteInfo: {
        ...savedRow,
        logoUrl: headerLogoUrl,
        footerLogoUrl: footerLogoUrl,
        theme_builder_config: savedRow.homepage_layout_config.theme_builder_config,
      },
      message: "✓ تمامی تغییرات متون، ابعاد لوگوها، هدر و فوتر با موفقیت در دیتابیس ذخیره و در لحظه روی سایت اعمال شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

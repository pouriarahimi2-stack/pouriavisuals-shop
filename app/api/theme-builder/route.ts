// File Path: app/api/theme-builder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { DEFAULT_DEVICE_OFFERS } from "@/lib/defaultDeviceConfig";

export const dynamic = "force-dynamic";

const DEFAULT_HOME_SECTIONS = [
  {
    id: "sec_banners",
    type: "banners_slider",
    title: "اسلایدر بنرهای تبلیغاتی و محصولات ویژه (بالای صفحه)",
    subtitle: "نمایش بنرهای کلیک‌پذیر متصل به صفحات محصول در بالاترین بخش سایت",
    enabled: true,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true,
  },
  {
    id: "sec_perspective",
    type: "NativePerspectiveSlider",
    title: "نمایشگاه تعاملی سه‌بعدی محصولات پرچمدار (ویژه موبایل)",
    subtitle: "پیمایش لمسی محصولات در موبایل",
    enabled: true,
    showOnMobile: true,
    showOnTablet: false,
    showOnDesktop: false,
  },
  {
    id: "sec_catalog",
    type: "NativeProductCatalog",
    title: "کاتالوگ تجهیزات و محصولات (ویژه دسکتاپ و تبلت)",
    subtitle: "تمامی کالاها با گارانتی اصالت طلایی، تست سلامت فیزیکی و ارسال پیشتاز عرضه می‌شوند",
    enabled: true,
    showOnMobile: false,
    showOnTablet: true,
    showOnDesktop: true,
  },
];

export async function GET() {
  try {
    const siteInfo = (await getMasterSiteInfoRow()) || {};
    const layoutCfg = siteInfo.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
    const persisted = layoutCfg?._persisted_identity || {};
    const tbCfg = layoutCfg?.theme_builder_config || {};
    const savedGh = tbCfg?.globalHeader || {};
    const savedGf = tbCfg?.globalFooter || {};
    const savedBs = tbCfg?.bannerSizing || layoutCfg?.bannerSizing || {};

    const resolvedHeaderLogo =
      savedGh.logoUrl !== undefined
        ? String(savedGh.logoUrl).trim()
        : persisted.logo_url !== undefined
        ? String(persisted.logo_url).trim()
        : String(siteInfo.logo_url || "").trim();

    const resolvedFooterLogo =
      savedGf.footerLogoUrl !== undefined
        ? String(savedGf.footerLogoUrl).trim()
        : persisted.footer_logo_url !== undefined
        ? String(persisted.footer_logo_url).trim()
        : String(siteInfo.footer_logo_url || "").trim();

    const resolvedFavicon =
      savedGh.faviconUrl !== undefined
        ? String(savedGh.faviconUrl).trim()
        : String(persisted.favicon_url || siteInfo.favicon_url || "/favicon.ico").trim();

    const resolvedBrandName =
      savedGh.brandName !== undefined
        ? String(savedGh.brandName)
        : String(persisted.site_name ?? siteInfo.site_name ?? "آکسون کور | Axon Core");

    const resolvedCustomPageSections = Array.isArray(tbCfg.customPageSections)
      ? tbCfg.customPageSections
      : Array.isArray(layoutCfg.customPageSections)
      ? layoutCfg.customPageSections
      : [];

    const resolvedNavigationMenu = Array.isArray(siteInfo.navigation_menu)
      ? siteInfo.navigation_menu
      : Array.isArray(layoutCfg.navigation_menu)
      ? layoutCfg.navigation_menu
      : [];

    const normalizedConfig = {
      ...tbCfg,
      globalHeader: {
        brandName: resolvedBrandName,
        logoText: resolvedBrandName,
        logoUrl: resolvedHeaderLogo,
        logoWidth: Number(savedGh.logoWidth || 44),
        logoHeight: Number(savedGh.logoHeight || 44),
        logoRadius: savedGh.logoRadius || "12px",
        logoObjectFit: savedGh.logoObjectFit || "contain",
        faviconUrl: resolvedFavicon,
        variant: savedGh.variant || "capsule",
        height: Number(savedGh.height || 64),
        menuFontSize: Number(savedGh.menuFontSize || 12),
        announcementText:
          savedGh.announcementText !== undefined
            ? String(savedGh.announcementText)
            : String(persisted.header_announcement ?? siteInfo.header_announcement ?? ""),
        announcementEnabled: Boolean(savedGh.announcementEnabled ?? false),
        ctaText: savedGh.ctaText !== undefined ? String(savedGh.ctaText) : "کاتالوگ محصولات",
        ctaUrl: savedGh.ctaUrl || "/products",
        bgColor: savedGh.bgColor || "",
      },
      globalFooter: {
        footerLogoUrl: resolvedFooterLogo,
        footerLogoWidth: Number(savedGf.footerLogoWidth || 140),
        footerLogoHeight: Number(savedGf.footerLogoHeight || 56),
        footerLogoRadius: savedGf.footerLogoRadius || "12px",
        showFooterLogoBox: Boolean(savedGf.showFooterLogoBox ?? false),
        brandTitle: savedGf.brandTitle !== undefined ? String(savedGf.brandTitle) : "",
        brandSubtitle:
          savedGf.brandSubtitle !== undefined
            ? String(savedGf.brandSubtitle)
            : String(persisted.tagline ?? siteInfo.tagline ?? ""),
        brandDescription:
          savedGf.brandDescription !== undefined
            ? String(savedGf.brandDescription)
            : String(persisted.description ?? siteInfo.description ?? ""),
        showTrustBadges: savedGf.showTrustBadges !== false,
        badge1Text:
          savedGf.badge1Text !== undefined ? String(savedGf.badge1Text) : "ضمانت اصالت کالا",
        badge2Text:
          savedGf.badge2Text !== undefined ? String(savedGf.badge2Text) : "ارسال سریع سراسری",
        quickLinksTitle:
          savedGf.quickLinksTitle !== undefined ? String(savedGf.quickLinksTitle) : "دسترسی سریع",
        supportTitle:
          savedGf.supportTitle !== undefined
            ? String(savedGf.supportTitle)
            : "مرکز ارتباط و پشتیبانی",
        scaleMode: savedGf.scaleMode || "normal",
        paddingMode: savedGf.paddingMode || "normal",
        bgColor: savedGf.bgColor || "",
        columnOrder:
          Array.isArray(savedGf.columnOrder) && savedGf.columnOrder.length === 4
            ? savedGf.columnOrder
            : ["brand", "quick_links", "support", "enamad"],
        supportPhone:
          savedGf.supportPhone !== undefined
            ? String(savedGf.supportPhone)
            : String(persisted.phone ?? siteInfo.phone ?? "09376110200"),
        supportEmail:
          savedGf.supportEmail !== undefined
            ? String(savedGf.supportEmail)
            : String(persisted.email ?? siteInfo.email ?? "Pouriarahimi@yahoo.com"),
        warehouseAddress:
          savedGf.warehouseAddress !== undefined
            ? String(savedGf.warehouseAddress)
            : String(persisted.address ?? siteInfo.address ?? "شیراز - ستارخان"),
        workingHours:
          savedGf.workingHours !== undefined
            ? String(savedGf.workingHours)
            : String(
                persisted.working_hours ??
                  siteInfo.working_hours ??
                  "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰"
              ),
        enamadCode: savedGf.enamadCode !== undefined ? String(savedGf.enamadCode) : "7434404",
        enamadLink:
          savedGf.enamadLink ||
          "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD",
        enamadEnabled: savedGf.enamadEnabled !== false,
        quickLinks: Array.isArray(savedGf.quickLinks)
          ? savedGf.quickLinks
          : [
              { id: "q1", title: "🛍️ کاتالوگ محصولات دیجیتال", url: "/products", show: true },
              { id: "q2", title: "📡 رادار اخبار تکنولوژی", url: "/news", show: true },
              { id: "q3", title: "📚 مجله تخصصی و راهنمای خرید", url: "/blog", show: true },
              { id: "q4", title: "📦 پیگیری لحظه‌ای سفارشات", url: "/track-order", show: true },
            ],
        externalLinks: Array.isArray(savedGf.externalLinks) ? savedGf.externalLinks : [],
        copyright:
          savedGf.copyright !== undefined
            ? String(savedGf.copyright)
            : String(
                persisted.footer_text ??
                  siteInfo.footer_text ??
                  "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026"
              ),
      },
      bannerSizing: {
        mobileHeight: Number(savedBs.mobileHeight || 160),
        tabletHeight: Number(savedBs.tabletHeight || 250),
        desktopHeight: Number(savedBs.desktopHeight || 340),
        mobileImageSize: Number(savedBs.mobileImageSize || 90),
        desktopImageSize: Number(savedBs.desktopImageSize || 220),
        mobileLayout: savedBs.mobileLayout || "horizontal",
      },
      deviceOffers: {
        ...DEFAULT_DEVICE_OFFERS,
        ...(tbCfg.deviceOffers || layoutCfg.deviceOffers || {}),
      },
      homeSections:
        Array.isArray(tbCfg.homeSections) && tbCfg.homeSections.length > 0
          ? tbCfg.homeSections
          : Array.isArray(layoutCfg.homeSections) && layoutCfg.homeSections.length > 0
          ? layoutCfg.homeSections
          : DEFAULT_HOME_SECTIONS,
      customPageSections: resolvedCustomPageSections,
      navigation_menu: resolvedNavigationMenu,
    };

    return NextResponse.json(
      {
        success: true,
        config: normalizedConfig,
        data: normalizedConfig,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const incomingConfig = body.config || body.theme_builder_config || body;

    const existing = await getMasterSiteInfoRow();
    const prevLayout =
      existing?.homepage_layout_config && typeof existing.homepage_layout_config === "object"
        ? existing.homepage_layout_config
        : DEFAULT_HOMEPAGE_LAYOUT_CONFIG;

    const prevPersisted = prevLayout._persisted_identity || {};
    const prevTb = prevLayout.theme_builder_config || {};
    const prevGh = prevTb.globalHeader || {};
    const prevGf = prevTb.globalFooter || {};
    const prevBs = prevTb.bannerSizing || prevLayout.bannerSizing || {};

    const gh = { ...prevGh, ...(incomingConfig.globalHeader || {}) };
    const gf = { ...prevGf, ...(incomingConfig.globalFooter || {}) };
    const bs = { ...prevBs, ...(incomingConfig.bannerSizing || {}) };
    const devOffers = {
      ...DEFAULT_DEVICE_OFFERS,
      ...(prevTb.deviceOffers || prevLayout.deviceOffers || {}),
      ...(incomingConfig.deviceOffers || {}),
    };

    const nextHomeSections = Array.isArray(incomingConfig.homeSections)
      ? incomingConfig.homeSections
      : Array.isArray(prevTb.homeSections)
      ? prevTb.homeSections
      : Array.isArray(prevLayout.homeSections)
      ? prevLayout.homeSections
      : DEFAULT_HOME_SECTIONS;

    // حفظ تضمینی customPageSections در صورتی که در درخواست فعلی ارسال نشده باشد
    const nextCustomPageSections = Array.isArray(incomingConfig.customPageSections)
      ? incomingConfig.customPageSections
      : Array.isArray(prevTb.customPageSections)
      ? prevTb.customPageSections
      : Array.isArray(prevLayout.customPageSections)
      ? prevLayout.customPageSections
      : [];

    const nextNavigationMenu = Array.isArray(incomingConfig.navigation_menu)
      ? incomingConfig.navigation_menu
      : Array.isArray(prevLayout.navigation_menu)
      ? prevLayout.navigation_menu
      : [];

    const nextSiteName =
      gh.brandName !== undefined ? String(gh.brandName) : String(prevPersisted.site_name ?? "");
    const nextHeaderLogo =
      gh.logoUrl !== undefined ? String(gh.logoUrl).trim() : String(prevPersisted.logo_url ?? "");
    const nextFooterLogo =
      gf.footerLogoUrl !== undefined
        ? String(gf.footerLogoUrl).trim()
        : String(prevPersisted.footer_logo_url ?? "");
    const nextFavicon =
      gh.faviconUrl !== undefined
        ? String(gh.faviconUrl).trim()
        : String(prevPersisted.favicon_url ?? "/favicon.ico");

    const cleanThemeBuilderConfig = {
      ...prevTb,
      ...incomingConfig,
      globalHeader: {
        ...gh,
        brandName: nextSiteName,
        logoText: nextSiteName,
        logoUrl: nextHeaderLogo,
        faviconUrl: nextFavicon,
      },
      globalFooter: {
        ...gf,
        footerLogoUrl: nextFooterLogo,
      },
      bannerSizing: bs,
      deviceOffers: devOffers,
      homeSections: nextHomeSections,
      customPageSections: nextCustomPageSections,
    };

    const updatedLayout = {
      ...prevLayout,
      theme_builder_config: cleanThemeBuilderConfig,
      homeSections: nextHomeSections,
      customPageSections: nextCustomPageSections,
      navigation_menu: nextNavigationMenu,
      bannerSizing: bs,
      deviceOffers: devOffers,
    };

    const topLevelFields = {
      site_name: nextSiteName,
      tagline:
        gf.brandSubtitle !== undefined
          ? String(gf.brandSubtitle)
          : String(prevPersisted.tagline ?? ""),
      description:
        gf.brandDescription !== undefined
          ? String(gf.brandDescription)
          : String(prevPersisted.description ?? ""),
      footer_text:
        gf.copyright !== undefined
          ? String(gf.copyright)
          : String(prevPersisted.footer_text ?? ""),
      logo_url: nextHeaderLogo,
      footer_logo_url: nextFooterLogo,
      favicon_url: nextFavicon,
      phone:
        gf.supportPhone !== undefined
          ? String(gf.supportPhone)
          : String(prevPersisted.phone ?? ""),
      email:
        gf.supportEmail !== undefined
          ? String(gf.supportEmail)
          : String(prevPersisted.email ?? ""),
      address:
        gf.warehouseAddress !== undefined
          ? String(gf.warehouseAddress)
          : String(prevPersisted.address ?? ""),
      working_hours:
        gf.workingHours !== undefined
          ? String(gf.workingHours)
          : String(prevPersisted.working_hours ?? ""),
      header_announcement:
        gh.announcementText !== undefined
          ? String(gh.announcementText)
          : String(prevPersisted.header_announcement ?? ""),
    };

    const { savedRow } = await saveMasterSiteInfoRow(existing, updatedLayout, topLevelFields);

    return NextResponse.json({
      success: true,
      message: "✓ تنظیمات ظاهر، لوگوها، فوتر و سکشن‌ها با موفقیت در دیتابیس ذخیره شد.",
      config: cleanThemeBuilderConfig,
      siteInfo: savedRow,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
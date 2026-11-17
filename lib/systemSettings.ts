// File Path: lib/systemSettings.ts

export interface SystemSettingsData {
  // لجستیک، مالیات و سبد خرید
  defaultShippingCost: number;
  postShippingCost: number;
  tipaxShippingCost: number;
  freeShippingThreshold: number;
  vatPercent: number;
  allowGuestCheckout: boolean;
  autoSendOrderSms: boolean;
  codEnabled: boolean;
  supportCardNumber: string;
  supportCardHolder: string;
  currencyLabel: string;

  // حالت تعمیرات هوشمند
  maintenanceMode: boolean;
  maintenanceAdminBypass: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceEndTime: string;

  // سئو، ایندکس و ربات‌های جستجو
  noIndex: boolean;
  disallowRobots: boolean;
  canonicalBaseUrl: string;
  googleSiteVerification: string;
  enamadCode: string;
  metaKeywords: string;

  // هویت برند، آیکون‌ها، لوگوها و خرده‌ریزهای سراسری
  site_name: string;
  tagline: string;
  description: string;
  meta_description: string;
  logo_url: string;
  footer_logo_url: string;
  favicon_url: string;
  apple_touch_icon_url: string;
  og_image_url: string;
  header_announcement: string;
  header_announcement_enabled: boolean;
  footer_text: string;

  // اطلاعات تماس و شبکه‌های اجتماعی
  phone: string;
  mobile_support: string;
  email: string;
  address: string;
  postal_code: string;
  working_hours: string;
  instagram_url: string;
  telegram_url: string;
  whatsapp_url: string;
  youtube_url: string;
  aparat_url: string;

  // اتوماسیون و ویجت‌ها
  smartSliderEnabled: boolean;
  floatingChatEnabled: boolean;
  updatedAt?: string;
}

export function parseExactNum(val: any, fallback: number): number {
  if (val === undefined || val === null || val === "") return fallback;
  const clean = String(val)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/,/g, "")
    .trim();
  if (clean === "") return fallback;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function normalizeSystemSettings(layoutCfg: any, rootRow?: any): SystemSettingsData {
  const cfg = layoutCfg && typeof layoutCfg === "object" ? layoutCfg : {};
  const row = rootRow && typeof rootRow === "object" ? rootRow : {};
  const sys =
    cfg.system_settings && typeof cfg.system_settings === "object"
      ? cfg.system_settings
      : cfg.store_settings && typeof cfg.store_settings === "object"
      ? cfg.store_settings
      : {};
  const persisted =
    cfg._persisted_identity && typeof cfg._persisted_identity === "object"
      ? cfg._persisted_identity
      : {};
  const tbHeader = cfg.theme_builder_config?.globalHeader || {};
  const tbFooter = cfg.theme_builder_config?.globalFooter || {};
  const techSeo = cfg.seo_technical_config || {};

  const resolvedNoIndex =
    typeof sys.noIndex === "boolean"
      ? sys.noIndex
      : typeof sys.disallowRobots === "boolean"
      ? sys.disallowRobots
      : typeof cfg.noIndex === "boolean"
      ? cfg.noIndex
      : row.allow_google_index === false || techSeo.allowGoogleIndex === false;

  return {
    defaultShippingCost: parseExactNum(
      sys.defaultShippingCost ?? cfg.defaultShippingCost ?? cfg.shipping_cost,
      0
    ),
    postShippingCost: parseExactNum(
      sys.postShippingCost ?? cfg.postShippingCost ?? sys.post_shipping_cost,
      120000
    ),
    tipaxShippingCost: parseExactNum(
      sys.tipaxShippingCost ?? cfg.tipaxShippingCost ?? sys.tipax_shipping_cost,
      150000
    ),
    freeShippingThreshold: parseExactNum(
      sys.freeShippingThreshold ??
        cfg.freeShippingThreshold ??
        row.free_shipping_threshold,
      0
    ),
    vatPercent: parseExactNum(
      sys.vatPercent ?? cfg.vatPercent ?? cfg.tax_percent,
      10
    ),
    allowGuestCheckout:
      typeof sys.allowGuestCheckout === "boolean"
        ? sys.allowGuestCheckout
        : typeof cfg.allowGuestCheckout === "boolean"
        ? cfg.allowGuestCheckout
        : true,
    autoSendOrderSms:
      typeof sys.autoSendOrderSms === "boolean"
        ? sys.autoSendOrderSms
        : typeof cfg.autoSendOrderSms === "boolean"
        ? cfg.autoSendOrderSms
        : true,
    codEnabled:
      typeof sys.codEnabled === "boolean" ? sys.codEnabled : false,
    supportCardNumber: String(sys.supportCardNumber ?? ""),
    supportCardHolder: String(sys.supportCardHolder ?? ""),
    currencyLabel: String(sys.currencyLabel || "تومان"),

    maintenanceMode:
      typeof sys.maintenanceMode === "boolean"
        ? sys.maintenanceMode
        : typeof cfg.maintenanceMode === "boolean"
        ? cfg.maintenanceMode
        : row.maintenance_mode === "indefinite" || row.maintenance_mode === "true",
    maintenanceAdminBypass:
      typeof sys.maintenanceAdminBypass === "boolean"
        ? sys.maintenanceAdminBypass
        : true,
    maintenanceTitle: String(
      sys.maintenanceTitle ||
        cfg.maintenanceTitle ||
        "بروزرسانی زیرساخت فنی آکسون کور"
    ),
    maintenanceMessage: String(
      sys.maintenanceMessage ??
        cfg.maintenanceMessage ??
        "فروشگاه آکسون در حال بروزرسانی زیرساخت‌های فنی است. به زودی باز می‌گردیم."
    ),
    maintenanceEndTime: String(sys.maintenanceEndTime ?? cfg.maintenanceEndTime ?? ""),

    noIndex: resolvedNoIndex,
    disallowRobots:
      typeof sys.disallowRobots === "boolean"
        ? sys.disallowRobots
        : resolvedNoIndex,
    canonicalBaseUrl: String(
      sys.canonicalBaseUrl || techSeo.canonicalBaseUrl || "https://axoncore.ir"
    ).replace(/\/+$/, ""),
    googleSiteVerification: String(
      sys.googleSiteVerification || techSeo.googleSiteVerification || ""
    ),
    enamadCode: String(sys.enamadCode || persisted.enamad_code || ""),
    metaKeywords: String(
      sys.metaKeywords ||
        persisted.meta_keywords ||
        "آکسون کور, خرید آیفون, لوازم جانبی اپل, کالای دیجیتال, گجت هوشمند"
    ),

    site_name: String(
      sys.site_name ??
        persisted.site_name ??
        tbHeader.brandName ??
        row.site_name ??
        "آکسون کور | Axon Core"
    ),
    tagline: String(
      sys.tagline ??
        persisted.tagline ??
        tbFooter.brandSubtitle ??
        row.tagline ??
        "مرجع تخصصی تجهیزات تکنولوژی و کالای دیجیتال"
    ),
    description: String(
      sys.description ??
        persisted.description ??
        tbFooter.brandDescription ??
        row.description ??
        "مرجع تخصصی خرید آنلاین جدیدترین کالاهای تکنولوژی با تضمین اصالت و ارسال سریع."
    ),
    meta_description: String(
      sys.meta_description ??
        persisted.meta_description ??
        row.meta_description ??
        sys.description ??
        persisted.description ??
        "خرید محصولات تکنولوژی، گوشی، لپ‌تاپ و لوازم جانبی با ضمانت اصالت کالا از آکسون کور"
    ),
    logo_url: String(
      sys.logo_url ?? persisted.logo_url ?? tbHeader.logoUrl ?? row.logo_url ?? ""
    ),
    footer_logo_url: String(
      sys.footer_logo_url ??
        persisted.footer_logo_url ??
        tbFooter.footerLogoUrl ??
        row.footer_logo_url ??
        ""
    ),
    favicon_url: String(
      sys.favicon_url ??
        persisted.favicon_url ??
        tbHeader.faviconUrl ??
        row.favicon_url ??
        "/favicon.ico"
    ),
    apple_touch_icon_url: String(
      sys.apple_touch_icon_url ??
        persisted.apple_touch_icon_url ??
        sys.favicon_url ??
        persisted.favicon_url ??
        "/favicon.ico"
    ),
    og_image_url: String(
      sys.og_image_url ?? persisted.og_image_url ?? sys.logo_url ?? ""
    ),
    header_announcement: String(
      sys.header_announcement ??
        persisted.header_announcement ??
        tbHeader.announcementText ??
        row.header_announcement ??
        ""
    ),
    header_announcement_enabled:
      typeof sys.header_announcement_enabled === "boolean"
        ? sys.header_announcement_enabled
        : tbHeader.showAnnouncement !== false,
    footer_text: String(
      sys.footer_text ??
        persisted.footer_text ??
        tbFooter.copyright ??
        row.footer_text ??
        "تمامی حقوق مادی و معنوی این وب‌سایت متعلق به فروشگاه آکسون کور (Axon Core) می‌باشد."
    ),

    phone: String(
      sys.phone ?? persisted.phone ?? tbFooter.supportPhone ?? row.phone ?? ""
    ),
    mobile_support: String(
      sys.mobile_support ?? persisted.mobile_support ?? ""
    ),
    email: String(
      sys.email ?? persisted.email ?? tbFooter.supportEmail ?? row.email ?? ""
    ),
    address: String(
      sys.address ??
        persisted.address ??
        tbFooter.warehouseAddress ??
        row.address ??
        ""
    ),
    postal_code: String(sys.postal_code ?? persisted.postal_code ?? ""),
    working_hours: String(
      sys.working_hours ??
        persisted.working_hours ??
        tbFooter.workingHours ??
        row.working_hours ??
        "شنبه تا پنج‌شنبه — ساعت ۹ الی ۲۱"
    ),
    instagram_url: String(sys.instagram_url ?? persisted.instagram_url ?? ""),
    telegram_url: String(sys.telegram_url ?? persisted.telegram_url ?? ""),
    whatsapp_url: String(sys.whatsapp_url ?? persisted.whatsapp_url ?? ""),
    youtube_url: String(sys.youtube_url ?? persisted.youtube_url ?? ""),
    aparat_url: String(sys.aparat_url ?? persisted.aparat_url ?? ""),

    smartSliderEnabled:
      typeof sys.smartSliderEnabled === "boolean"
        ? sys.smartSliderEnabled
        : false,
    floatingChatEnabled:
      typeof sys.floatingChatEnabled === "boolean"
        ? sys.floatingChatEnabled
        : true,
    updatedAt: sys.updatedAt || persisted.updated_at || undefined,
  };
}
import { supabase } from "@/lib/supabase";
import { realtimeEngine, applyFaviconToDOM, applyTitleToDOM } from "@/lib/realtimeSync";

export type MaintenanceMode = "none" | "timed" | "indefinite";

export interface HeaderMenuItem {
  id: string;
  title: string;
  url: string;
  order: number;
  show: boolean;
  openInNewTab?: boolean;
  badge?: string;
}

export interface HeaderActionConfig {
  show: boolean;
  label?: string;
  icon?: string;
  url?: string;
  order: number;
}

export interface HeaderConfig {
  show: boolean;
  variant: "capsule" | "full-width" | "bordered";
  position: "fixed" | "sticky" | "static";
  maxWidth: number;
  height: number;
  paddingX: number;
  borderRadius: number;
  backgroundColor?: string;
  borderColor?: string;
  blurIntensity: "none" | "sm" | "md" | "xl" | "2xl";
  shadow: "none" | "sm" | "md" | "xl";
  shrinkOnScroll: boolean;
  brand: {
    showLogo: boolean;
    logoUrl: string;
    logoWidth: number;
    logoHeight: number;
    logoRadius: number;
    showName: boolean;
    name: string;
    showTagline: boolean;
    tagline: string;
    href: string;
  };
  menu: {
    show: boolean;
    alignment: "start" | "center" | "end";
    fontSize: number;
    gap: number;
    items: HeaderMenuItem[];
  };
  actions: {
    search: HeaderActionConfig;
    themeToggle: HeaderActionConfig;
    account: HeaderActionConfig;
    cart: HeaderActionConfig & { showCount: boolean; style: "pill" | "icon" };
  };
  announcement: {
    show: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
    dismissible: boolean;
    link?: string;
  };
}

export interface FooterLinkItem {
  id: string;
  title: string;
  url: string;
}

export interface FooterContactItem {
  id: string;
  type: "phone" | "email" | "address" | "working_hours" | "custom";
  title: string;
  value: string;
  link?: string;
  show: boolean;
}

export interface FooterCertificateItem {
  id: string;
  title: string;
  imageUrl?: string;
  link?: string;
  show: boolean;
}

export interface AuthSecurityConfig {
  adminDeck: {
    pin: string;
    pinLength: 4 | 5 | 6 | 8;
    badgeText: string;
    title: string;
    subtitle: string;
    showQuickPinButton: boolean;
    quickPinLabel: string;
  };
  userDeck: {
    otpLength: 4 | 5 | 6 | 8;
    badgeText: string;
    title: string;
    subtitle: string;
    testOtpCode: string;
    showTestCodeHint: boolean;
  };
}

export interface HomepageLayoutConfig {
  header: HeaderConfig;
  hero: {
    show: boolean;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    show3DCanvas: boolean;
  };
  productsSection: {
    show: boolean;
    title: string;
    subtitle: string;
    showCategoryFilter: boolean;
  };
  trustBadges: {
    show: boolean;
  };
  showcase3D: {
    show: boolean;
    title: string;
    subtitle: string;
  };
  newsTicker: {
    show: boolean;
  };
  blogSection: {
    show: boolean;
    title: string;
    subtitle: string;
    count: number;
  };
  footer: {
    show: boolean;
    scaleMode: "compact" | "normal" | "large";
    paddingMode: "compact" | "normal" | "relaxed";
    brandTitle: string;
    brandSubtitle: string;
    description: string;
    logoUrl?: string;
    logoWidth?: number;
    logoHeight?: number;
    showBadges: boolean;
    badge1Text: string;
    badge2Text: string;
    quickLinks: {
      show: boolean;
      title: string;
      links: FooterLinkItem[];
    };
    customerServices: {
      show: boolean;
      title: string;
      links: FooterLinkItem[];
    };
    contactInfo: {
      show: boolean;
      title: string;
      items: FooterContactItem[];
    };
    certificates: {
      show: boolean;
      title: string;
      items: FooterCertificateItem[];
    };
    bottomBar: {
      show: boolean;
      copyrightText: string;
      designerText: string;
      enamadBadgeText: string;
    };
  };
  aiChat: {
    bottomDesktop: number;
    bottomMobile: number;
    autoHideNearFooter: boolean;
  };
}

export interface SiteInfo {
  id?: string | number;
  site_name?: string;
  siteName?: string;
  storeName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  working_hours?: string;
  logo_url?: string;
  logoUrl?: string;
  footer_logo_url?: string;
  footerLogoUrl?: string;
  favicon_url?: string;
  allow_google_index?: boolean;
  allowGoogleIndex?: boolean;
  maintenance_mode?: MaintenanceMode;
  maintenance_until?: string;
  maintenance_duration_minutes?: number;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  youtube?: string;
  header_announcement?: string;
  free_shipping_threshold?: number;
  description?: string;
  footer_text?: string;
  custom_css?: string;
  active_font_id?: string;
  homepage_layout_config?: HomepageLayoutConfig;
  auth_security_config?: AuthSecurityConfig;
  updated_at?: string;
}

const LOCAL_STORAGE_SITE_INFO = "axon_site_info_cache_permanent_v2026";

export const DEFAULT_AUTH_SECURITY_CONFIG: AuthSecurityConfig = {
  adminDeck: {
    pin: "1234",
    pinLength: 4,
    badgeText: "COMPONENT • 100",
    title: "Enter your code",
    subtitle: "پین امنیتی ورود ادمین را وارد نمایید",
    showQuickPinButton: true,
    quickPinLabel: "تکمیل و ورود خودکار با پین",
  },
  userDeck: {
    otpLength: 4,
    badgeText: "COMPONENT • 100",
    title: "Enter your code",
    subtitle: "کد تایید پیامکی را وارد نمایید",
    testOtpCode: "1234",
    showTestCodeHint: true,
  },
};

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  show: true,
  variant: "capsule",
  position: "fixed",
  maxWidth: 1280,
  height: 60,
  paddingX: 24,
  borderRadius: 9999,
  blurIntensity: "xl",
  shadow: "xl",
  shrinkOnScroll: true,
  brand: {
    showLogo: true,
    logoUrl: "",
    logoWidth: 38,
    logoHeight: 38,
    logoRadius: 9999,
    showName: true,
    name: "آکسون کور | Axon Core",
    showTagline: false,
    tagline: "فروشگاه تخصصی محصولات تکنولوژی و گجت‌های هوشمند",
    href: "/",
  },
  menu: {
    show: true,
    alignment: "center",
    fontSize: 12,
    gap: 24,
    items: [
      { id: "m1", title: "کاتالوگ کالاها", url: "/products", order: 1, show: true },
      { id: "m2", title: "رادار اخبار تکنولوژی", url: "/news", order: 2, show: true },
      { id: "m3", title: "مجله تخصصی دیجیتال", url: "/blog", order: 3, show: true },
      { id: "m4", title: "پیگیری سفارش", url: "/track-order", order: 4, show: true },
      { id: "m5", title: "درباره ما", url: "/about", order: 5, show: true },
      { id: "m6", title: "تماس با ما", url: "/contact", order: 6, show: true },
    ],
  },
  actions: {
    search: { show: true, label: "جستجو", order: 1 },
    themeToggle: { show: true, label: "تغییر تم", order: 2 },
    account: { show: true, label: "حساب کاربری", url: "/login", order: 3 },
    cart: { show: true, showCount: true, style: "pill", order: 4 },
  },
  announcement: {
    show: false,
    text: "⚡ ارسال رایگان سفارش‌های بالای ۲ میلیون تومان | گارانتی اصالت طلایی و سلامت فیزیکی",
    backgroundColor: "#0284c7",
    textColor: "#ffffff",
    dismissible: true,
  },
};

export const DEFAULT_HOMEPAGE_LAYOUT_CONFIG: HomepageLayoutConfig = {
  header: DEFAULT_HEADER_CONFIG,
  hero: {
    show: true,
    title: "دنیای نوآوری، تکنولوژی مدرن و ابزارهای هوشمند",
    subtitle: "مرجع تخصصی خرید جدیدترین گجت‌های هوشمند، لوازم الکترونیک، گجت‌های کاربردی و ابزارهای دیجیتال با تضمین اصالت و ارسال سریع به سراسر ایران.",
    buttonText: "مشاهده کاتالوگ محصولات",
    buttonLink: "/products",
    show3DCanvas: true,
  },
  productsSection: {
    show: true,
    title: "جدیدترین محصولات و گجت‌های دیجیتال",
    subtitle: "تضمین ۱۰۰٪ سلامت فیزیکی، بهترین قیمت بازار و ارسال سریع پیشتاز",
    showCategoryFilter: true,
  },
  trustBadges: {
    show: false,
  },
  showcase3D: {
    show: true,
    title: "نمایشگاه تعاملی سه‌بعدی محصولات پرچمدار",
    subtitle: "بررسی لایه‌به‌لایه و ساختار مهندسی قطعات با کنترل لمسی",
  },
  newsTicker: {
    show: true,
  },
  blogSection: {
    show: true,
    title: "مجله نقد و بررسی تخصصی گجت‌ها",
    subtitle: "بررسی‌های کاربردی، راهنمای خرید هوشمندانه و تازه‌های دنیای فناوری",
    count: 3,
  },
  footer: {
    show: true,
    scaleMode: "normal",
    paddingMode: "normal",
    brandTitle: "آکسون کور | Axon Core",
    brandSubtitle: "فروشگاه تخصصی تکنولوژی، گجت‌های هوشمند و کالای دیجیتال",
    description: "مجموعه آکسون کور مرجع عرضه مستقیم جدیدترین تجهیزات الکترونیک، ابزارهای هوشمند و گجت‌های کاربردی دیجیتال با ضمانت اصالت ۱۰۰٪ فیزیکی و پشتیبانی تخصصی در ایران.",
    logoUrl: "",
    logoWidth: 160,
    logoHeight: 56,
    showBadges: true,
    badge1Text: "گارانتی اصالت ۱۰۰٪ فیزیکی",
    badge2Text: "ارسال سریع پیشتاز سراسری",
    quickLinks: {
      show: true,
      title: "دسترسی سریع",
      links: [
        { id: "l1", title: "کاتالوگ کالاها", url: "/products" },
        { id: "l2", title: "سامانه رهگیری مرسولات", url: "/track-order" },
        { id: "l3", title: "جدیدترین اخبار تکنولوژی", url: "/news" },
        { id: "l4", title: "مجله مقالات تخصصی", url: "/blog" },
        { id: "l5", title: "درباره ما", url: "/about" },
      ],
    },
    customerServices: {
      show: true,
      title: "خدمات مشتریان",
      links: [
        { id: "s1", title: "ثبت تیکت مشاوره", url: "/contact" },
        { id: "s2", title: "شرایط گارانتی و اصالت", url: "/about" },
        { id: "s3", title: "ضمانت بازگشت وجه ۷ روزه", url: "/about" },
        { id: "s4", title: "روش‌های پرداخت امن شاپرک", url: "/track-order" },
      ],
    },
    contactInfo: {
      show: true,
      title: "اطلاعات تماس و دفتر",
      items: [
        { id: "c1", type: "phone", title: "تلفن تماس:", value: "09376110200", link: "tel:09376110200", show: true },
        { id: "c2", type: "email", title: "پست الکترونیک:", value: "Pouriarahimi@yahoo.com", link: "mailto:Pouriarahimi@yahoo.com", show: true },
        { id: "c3", type: "address", title: "نشانی:", value: "شیراز - ستارخان", show: true },
        { id: "c4", type: "working_hours", title: "ساعات پاسخگویی:", value: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰", show: true },
      ],
    },
    certificates: {
      show: true,
      title: "نماد اعتماد الکترونیکی رسمی",
      items: [
        {
          id: "cert-enamad",
          title: "نماد اعتماد الکترونیکی (کد ۷۴۳۴۴۰۴)",
          link: "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD",
          imageUrl: "https://trustseal.enamad.ir/logo.aspx?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD",
          show: true,
        },
      ],
    },
    bottomBar: {
      show: true,
      copyrightText: "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
      designerText: "طراحی مهندسی و پایدار",
      enamadBadgeText: "نماد اعتماد الکترونیکی فعال",
    },
  },
  aiChat: {
    bottomDesktop: 64,
    bottomMobile: 96,
    autoHideNearFooter: true,
  },
};

export const DEFAULT_SITE_INFO: SiteInfo = {
  site_name: "آکسون کور | Axon Core",
  siteName: "آکسون کور | Axon Core",
  storeName: "آکسون کور | Axon Core",
  tagline: "فروشگاه تخصصی محصولات تکنولوژی و گجت‌های هوشمند",
  allow_google_index: true,
  allowGoogleIndex: true,
  maintenance_mode: "none",
  phone: "09376110200",
  email: "Pouriarahimi@yahoo.com",
  address: "شیراز - ستارخان",
  working_hours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
  header_announcement: "⚡ ارسال سریع سفارش‌ها با گارانتی اصالت طلایی و سلامت فیزیکی",
  free_shipping_threshold: 2000000,
  description: "مرجع تخصصی خرید آنلاین جدیدترین کالاهای تکنولوژی، گجت‌های هوشمند و لوازم دیجیتال با تضمین اصالت فیزیکی و ارسال سریع به سراسر کشور.",
  footer_text: "تمامی حقوق محفوظ است © 2026 آکسون کور",
  homepage_layout_config: DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
};

export const siteInfoService = {
  getSiteInfoSync(): SiteInfo {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_SITE_INFO);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return DEFAULT_SITE_INFO;
  },

  async getSiteInfo(): Promise<SiteInfo | null> {
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const data = json.data;
          let parsedLayout: HomepageLayoutConfig = DEFAULT_HOMEPAGE_LAYOUT_CONFIG;

          if (data.homepage_layout_config) {
            try {
              const incoming = typeof data.homepage_layout_config === "string"
                ? JSON.parse(data.homepage_layout_config)
                : data.homepage_layout_config;
              parsedLayout = {
                ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
                ...incoming,
                header: { ...DEFAULT_HEADER_CONFIG, ...(incoming.header || {}) },
                footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(incoming.footer || {}) },
              };
            } catch (err) {
              console.error("[LAYOUT_PARSE_ERROR]:", err);
            }
          }

          const finalHeaderLogo = parsedLayout.header.brand.logoUrl || data.logo_url || "";
          const finalFooterLogo = parsedLayout.footer.logoUrl || data.footer_logo_url || "";
          const finalSiteName = parsedLayout.header.brand.name || data.site_name || data.store_name || "آکسون کور | Axon Core";
          const finalTagline = parsedLayout.header.brand.tagline || data.tagline || "فروشگاه تخصصی محصولات تکنولوژی و دیجیتال";
          const finalFavicon = data.favicon_url || "";

          parsedLayout.header.brand.logoUrl = finalHeaderLogo;
          parsedLayout.footer.logoUrl = finalFooterLogo;
          parsedLayout.header.brand.name = finalSiteName;
          parsedLayout.header.brand.tagline = finalTagline;

          const mapped: SiteInfo = {
            id: data.id,
            site_name: finalSiteName,
            siteName: finalSiteName,
            storeName: finalSiteName,
            tagline: finalTagline,
            phone: data.phone || "09376110200",
            email: data.email || "Pouriarahimi@yahoo.com",
            address: data.address || "شیراز - ستارخان",
            working_hours: data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
            logo_url: finalHeaderLogo,
            logoUrl: finalHeaderLogo,
            footer_logo_url: finalFooterLogo,
            footerLogoUrl: finalFooterLogo,
            favicon_url: finalFavicon,
            allow_google_index: data.allow_google_index !== false,
            allowGoogleIndex: data.allow_google_index !== false,
            maintenance_mode: (data.maintenance_mode as MaintenanceMode) || "none",
            header_announcement: data.header_announcement || "",
            free_shipping_threshold: Number(data.free_shipping_threshold || 2000000),
            description: data.description || data.footer_text || "",
            footer_text: data.footer_text || data.description || "",
            custom_css: data.custom_css || "",
            active_font_id: data.active_font_id || "Vazirmatn",
            homepage_layout_config: parsedLayout,
            updated_at: data.updated_at,
          };

          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(mapped));
            if (mapped.favicon_url) applyFaviconToDOM(mapped.favicon_url);
            if (mapped.tagline || mapped.site_name) applyTitleToDOM(mapped.tagline, mapped.site_name);
          }
          return mapped;
        }
      }
      return this.getSiteInfoSync();
    } catch {
      return this.getSiteInfoSync();
    }
  },

  async updateSiteInfo(payload: Partial<SiteInfo>): Promise<SiteInfo | null> {
    try {
      const current = await this.getSiteInfo();
      const sName = payload.site_name || payload.siteName || payload.storeName || current?.site_name || "آکسون کور | Axon Core";

      const mergedPayload: any = {
        ...current,
        ...payload,
        site_name: sName,
        store_name: sName,
        updated_at: new Date().toISOString(),
      };

      if (payload.homepage_layout_config) {
        if (payload.homepage_layout_config.header?.brand?.logoUrl) {
          mergedPayload.logo_url = payload.homepage_layout_config.header.brand.logoUrl;
        }
        if (payload.homepage_layout_config.footer?.logoUrl) {
          mergedPayload.footer_logo_url = payload.homepage_layout_config.footer.logoUrl;
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(mergedPayload));
        realtimeEngine.broadcastLocally("site_info_updated", mergedPayload);
      }

      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mergedPayload),
      });

      const json = await res.json();
      if (json.success) {
        const fresh = await this.getSiteInfo();
        return fresh || mergedPayload;
      }
      return mergedPayload;
    } catch (e) {
      console.error("siteInfoService.updateSiteInfo Error:", e);
      return null;
    }
  },
};

export default siteInfoService;

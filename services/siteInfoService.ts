// File Path: services/siteInfoService.ts
import { supabase } from "@/lib/supabase";
import { realtimeEngine, applyFaviconToDOM, applyTitleToDOM } from "@/lib/realtimeSync";

export type MaintenanceMode = "none" | "timed" | "indefinite";

export interface HomepageLayoutConfig {
  hero: {
    show: boolean;
    heightMode: "compact" | "standard" | "cinematic";
    verticalPadding: "compact" | "normal" | "relaxed";
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    show3DCanvas: boolean;
  };
  showcase3D: {
    show: boolean;
    cardScale: "compact" | "standard" | "large";
    title: string;
    subtitle: string;
    limit: number;
  };
  newsTicker: {
    show: boolean;
  };
  blogSection: {
    show: boolean;
    title: string;
    subtitle: string;
    count: number;
    showViewAll: boolean;
  };
  contactDock: {
    show: boolean;
  };
  footer: {
    showBadges: boolean;
    badge1Text: string;
    badge2Text: string;
    paddingMode: "compact" | "normal" | "relaxed";
  };
  aiChat: {
    bottomDesktop: number;
    bottomMobile: number;
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
  faviconUrl?: string;
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
  gemini_api_key?: string;
  homepage_layout_config?: HomepageLayoutConfig;
  updated_at?: string;
}

const LOCAL_STORAGE_SITE_INFO = "axon_site_info_cache_permanent_v2026";

export const DEFAULT_HOMEPAGE_LAYOUT_CONFIG: HomepageLayoutConfig = {
  hero: {
    show: true,
    heightMode: "compact",
    verticalPadding: "compact",
    title: "مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین",
    subtitle: "تامین مستقیم انواع مانیتورهای ۵K رتینا، لپ‌تاپ‌های حرفه‌ای M4 Max، ساعت‌های هوشمند اولترا و ابزارهای استودیو با ۱۸ ماه گارانتی اصالت طلایی و ارسال پیشتاز.",
    buttonText: "مشاهده کاتالوگ محصولات",
    buttonLink: "/#products",
    show3DCanvas: true,
  },
  showcase3D: {
    show: true,
    cardScale: "standard",
    title: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
    subtitle: "پیمایش با درگ یا کلیدهای کنترل جهت بررسی دقیق مشخصات متالورژی و نوری",
    limit: 7,
  },
  newsTicker: {
    show: true,
  },
  blogSection: {
    show: true,
    title: "مجله و مقالات تحلیلی فناوری",
    subtitle: "جدیدترین بررسی‌های تخصصی سخت‌افزار و راهنمای خرید گجت‌ها",
    count: 3,
    showViewAll: true,
  },
  contactDock: {
    show: true,
  },
  footer: {
    showBadges: true,
    badge1Text: "✓ گارانتی اصالت ۱۰۰٪ فیزیکی",
    badge2Text: "🚀 ارسال پیشتاز سراسری",
    paddingMode: "compact",
  },
  aiChat: {
    bottomDesktop: 64,
    bottomMobile: 96,
  },
};

export const DEFAULT_SITE_INFO: SiteInfo = {
  site_name: "آکسون | Axon",
  siteName: "آکسون | Axon",
  storeName: "آکسون | Axon",
  tagline: "مرجع تخصصی تجهیزات دیجیتال و تصویر",
  allow_google_index: true,
  allowGoogleIndex: true,
  maintenance_mode: "none",
  phone: "۰۲۱-۸۸۸۸۸۸۸۸",
  email: "info@axoncore.ir",
  address: "تهران، خیابان ولیعصر، تقاطع میرداماد",
  working_hours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
  header_announcement: "⚡ ارسال رایگان سفارش‌های بالای ۲ میلیون تومان | ۱۸ ماه گارانتی اصالت طلایی",
  free_shipping_threshold: 2000000,
  description: "مرجع تخصصی تجهیزات دیجیتال، مانیتورهای حرفه‌ای و استودیو با گارانتی اصالت طلایی",
  footer_text: "مرجع تخصصی تجهیزات دیجیتال، مانیتورهای حرفه‌ای و استودیو با گارانتی اصالت طلایی",
  homepage_layout_config: DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
};

export const siteInfoService = {
  getSiteInfoSync(): SiteInfo {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_SITE_INFO);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") {
            return {
              ...DEFAULT_SITE_INFO,
              ...parsed,
              homepage_layout_config: {
                ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
                ...(parsed.homepage_layout_config || {}),
                hero: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.hero, ...(parsed.homepage_layout_config?.hero || {}) },
                showcase3D: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.showcase3D, ...(parsed.homepage_layout_config?.showcase3D || {}) },
                newsTicker: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.newsTicker, ...(parsed.homepage_layout_config?.newsTicker || {}) },
                blogSection: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.blogSection, ...(parsed.homepage_layout_config?.blogSection || {}) },
                contactDock: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.contactDock, ...(parsed.homepage_layout_config?.contactDock || {}) },
                footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(parsed.homepage_layout_config?.footer || {}) },
                aiChat: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.aiChat, ...(parsed.homepage_layout_config?.aiChat || {}) },
              },
            };
          }
        }
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
          const isAllowed = data.allow_google_index !== false && data.allowGoogleIndex !== false;
          
          let parsedLayout: HomepageLayoutConfig = DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
          if (data.homepage_layout_config) {
            try {
              const incoming = typeof data.homepage_layout_config === "string"
                ? JSON.parse(data.homepage_layout_config)
                : data.homepage_layout_config;
              parsedLayout = {
                ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
                ...incoming,
                hero: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.hero, ...(incoming.hero || {}) },
                showcase3D: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.showcase3D, ...(incoming.showcase3D || {}) },
                newsTicker: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.newsTicker, ...(incoming.newsTicker || {}) },
                blogSection: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.blogSection, ...(incoming.blogSection || {}) },
                contactDock: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.contactDock, ...(incoming.contactDock || {}) },
                footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(incoming.footer || {}) },
                aiChat: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.aiChat, ...(incoming.aiChat || {}) },
              };
            } catch {}
          }

          const mapped: SiteInfo = {
            id: data.id,
            site_name: data.site_name || data.store_name || "آکسون | Axon",
            siteName: data.site_name || data.store_name || "آکسون | Axon",
            storeName: data.site_name || data.store_name || "آکسون | Axon",
            tagline: data.tagline || "مرجع تخصصی تجهیزات دیجیتال و تصویر",
            phone: data.phone || "۰۲۱-۸۸۸۸۸۸۸۸",
            email: data.email || "info@axoncore.ir",
            address: data.address || "تهران، خیابان ولیعصر، تقاطع میرداماد",
            working_hours: data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
            logo_url: data.logo_url || "",
            logoUrl: data.logo_url || "",
            footer_logo_url: data.footer_logo_url || "",
            footerLogoUrl: data.footer_logo_url || "",
            favicon_url: data.favicon_url || "",
            faviconUrl: data.favicon_url || "",
            allow_google_index: isAllowed,
            allowGoogleIndex: isAllowed,
            maintenance_mode: (data.maintenance_mode as MaintenanceMode) || (isAllowed ? "none" : "indefinite"),
            maintenance_until: data.maintenance_until || undefined,
            maintenance_duration_minutes: data.maintenance_duration_minutes ? Number(data.maintenance_duration_minutes) : undefined,
            header_announcement: data.header_announcement || "",
            free_shipping_threshold: Number(data.free_shipping_threshold || 2000000),
            description: data.description || data.footer_text || "",
            footer_text: data.footer_text || data.description || "",
            custom_css: data.custom_css || "",
            active_font_id: data.active_font_id || "Vazirmatn",
            gemini_api_key: data.gemini_api_key || "",
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
      const sName = payload.site_name || payload.siteName || payload.storeName || current?.site_name || "آکسون | Axon";

      const mergedConfig: HomepageLayoutConfig = {
        ...(current?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG),
        ...(payload.homepage_layout_config || {}),
      };

      const dbPayload: any = {
        site_name: sName,
        store_name: sName,
        tagline: payload.tagline !== undefined ? payload.tagline : current?.tagline,
        phone: payload.phone !== undefined ? payload.phone : current?.phone,
        email: payload.email !== undefined ? payload.email : current?.email,
        address: payload.address !== undefined ? payload.address : current?.address,
        working_hours: payload.working_hours !== undefined ? payload.working_hours : current?.working_hours,
        logo_url: payload.logo_url !== undefined ? payload.logo_url : current?.logo_url,
        footer_logo_url: payload.footer_logo_url !== undefined ? payload.footer_logo_url : current?.footer_logo_url,
        favicon_url: payload.favicon_url !== undefined ? payload.favicon_url : current?.favicon_url,
        allow_google_index: payload.allow_google_index !== undefined ? payload.allow_google_index : current?.allow_google_index,
        maintenance_mode: payload.maintenance_mode !== undefined ? payload.maintenance_mode : current?.maintenance_mode,
        maintenance_until: payload.maintenance_until !== undefined ? payload.maintenance_until : current?.maintenance_until,
        maintenance_duration_minutes: payload.maintenance_duration_minutes !== undefined ? payload.maintenance_duration_minutes : current?.maintenance_duration_minutes,
        header_announcement: payload.header_announcement !== undefined ? payload.header_announcement : current?.header_announcement,
        free_shipping_threshold: payload.free_shipping_threshold !== undefined ? payload.free_shipping_threshold : current?.free_shipping_threshold,
        footer_text: payload.footer_text !== undefined ? payload.footer_text : current?.footer_text,
        description: payload.description !== undefined ? payload.description : current?.description,
        custom_css: payload.custom_css !== undefined ? payload.custom_css : current?.custom_css,
        active_font_id: payload.active_font_id !== undefined ? payload.active_font_id : current?.active_font_id,
        gemini_api_key: payload.gemini_api_key !== undefined ? payload.gemini_api_key : current?.gemini_api_key,
        homepage_layout_config: mergedConfig,
        updated_at: new Date().toISOString(),
      };

      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      const json = await res.json();
      const finalData: SiteInfo = {
        ...(current || DEFAULT_SITE_INFO),
        ...(json.data || dbPayload),
        homepage_layout_config: mergedConfig,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(finalData));
        realtimeEngine.broadcastLocally("site_info_updated", finalData);
      }

      return finalData;
    } catch (e) {
      console.error("siteInfoService.updateSiteInfo Error:", e);
      return null;
    }
  },
};

export default siteInfoService;

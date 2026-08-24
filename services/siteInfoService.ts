import { supabase } from "@/lib/supabase";

export interface SiteInfo {
  id?: string | number;
  site_name?: string;
  siteName?: string;
  storeName?: string;
  site_title?: string;
  siteTitle?: string;
  name?: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  logoUrl?: string;
  favicon_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  youtube?: string;
  announcement?: string;
  allowGoogleIndex?: boolean;
  allow_google_index?: boolean;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = "axon_site_info_cache";

export function normalizeSiteInfo(raw: any): SiteInfo {
  if (!raw) return {} as SiteInfo;

  const storeName =
    raw.storeName ||
    raw.site_name ||
    raw.siteName ||
    raw.name ||
    raw.site_title ||
    "آکسون | Axon";
  const logoUrl = raw.logoUrl || raw.logo_url || "";
  const allowGoogleIndex =
    raw.allowGoogleIndex !== undefined
      ? Boolean(raw.allowGoogleIndex)
      : raw.allow_google_index !== undefined
      ? Boolean(raw.allow_google_index)
      : true;

  return {
    ...raw,
    id: raw.id || "1",
    storeName,
    site_name: storeName,
    siteName: storeName,
    site_title: raw.site_title || raw.siteTitle || storeName,
    siteTitle: raw.site_title || raw.siteTitle || storeName,
    name: storeName,
    tagline: raw.tagline || "فروشگاه تخصصی فناوری و تصویر",
    description: raw.description || "مرکز ارائه جدیدترین مانیتورها، تجهیزات سخت‌افزاری و تکنولوژی",
    logo_url: logoUrl,
    logoUrl: logoUrl,
    favicon_url: raw.favicon_url || raw.faviconUrl || "/favicon.ico",
    phone: raw.phone || "09376110200",
    email: raw.email || "info@axoncore.ir",
    address: raw.address || "تهران، خیابان ولیعصر، تقاطع انقلاب",
    instagram: raw.instagram || "https://instagram.com/bitbypouria",
    telegram: raw.telegram || "https://t.me/axoncore",
    youtube: raw.youtube || "https://youtube.com/@bitbypouria",
    announcement: raw.announcement || "",
    allowGoogleIndex,
    allow_google_index: allowGoogleIndex,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export const siteInfoService = {
  // دریافت اطلاعات سایت از Supabase با فال‌بک کش محلی
  async getSiteInfo(): Promise<SiteInfo> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("site_info")
          .select("*")
          .limit(1)
          .single();

        if (!error && data) {
          const normalized = normalizeSiteInfo(data);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
          }
          return normalized;
        }
      }

      // فال‌بک به حافظه لوکال در صورت در دسترس نبودن یا لود اولیه
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          return normalizeSiteInfo(JSON.parse(cached));
        }
      }

      return normalizeSiteInfo({});
    } catch (err) {
      console.error("getSiteInfo Exception:", err);
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) return normalizeSiteInfo(JSON.parse(cached));
      }
      return normalizeSiteInfo({});
    }
  },

  // به‌روزرسانی اطلاعات سایت در دیتابیس و انتشار رویداد به فرانت‌اند
  async updateSiteInfo(info: Partial<SiteInfo>): Promise<SiteInfo | null> {
    try {
      const current = await this.getSiteInfo();
      const payload: any = {
        ...current,
        ...info,
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        const { data, error } = await supabase
          .from("site_info")
          .upsert([payload])
          .select()
          .single();

        if (error) {
          console.error("Error updating site_info in database:", error.message);
        } else if (data) {
          const normalized = normalizeSiteInfo(data);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
            window.dispatchEvent(
              new CustomEvent("site_info_updated", { detail: normalized })
            );
          }
          return normalized;
        }
      }

      const localUpdated = normalizeSiteInfo(payload);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localUpdated));
        window.dispatchEvent(
          new CustomEvent("site_info_updated", { detail: localUpdated })
        );
      }
      return localUpdated;
    } catch (err) {
      console.error("updateSiteInfo Exception:", err);
      return null;
    }
  },
};
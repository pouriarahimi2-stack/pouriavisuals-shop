import { supabase } from "@/lib/supabase";
import { realtimeEngine, applyFaviconToDOM, applyTitleToDOM } from "@/lib/realtimeSync";

export type MaintenanceMode = "none" | "timed" | "indefinite";

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
  updated_at?: string;
}

const LOCAL_STORAGE_SITE_INFO = "axon_site_info_cache_permanent_v2026";

export const siteInfoService = {
  getSiteInfoSync(): SiteInfo {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_SITE_INFO);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.favicon_url) applyFaviconToDOM(parsed.favicon_url);
          return parsed;
        }
      } catch {}
    }
    return {
      site_name: "آکسون | Axon",
      siteName: "آکسون | Axon",
      storeName: "آکسون | Axon",
      tagline: "مرجع تخصصی تجهیزات دیجیتال، تصویر و استودیو",
      allow_google_index: true,
      allowGoogleIndex: true,
      maintenance_mode: "none",
      phone: "۰۲۱-۸۸۸۸۸۸۸۸",
      email: "info@axoncore.ir",
      address: "تهران، خیابان ولیعصر، تقاطع میرداماد",
      working_hours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      header_announcement: "⚡ ارسال رایگان خریدهای بالای ۲ میلیون تومان | گارانتی اصالت طلایی ۱۸ ماهه",
      free_shipping_threshold: 2000000,
    };
  },

  async getSiteInfo(): Promise<SiteInfo | null> {
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const data = json.data;
          const isAllowed = data.allow_google_index !== false && data.allowGoogleIndex !== false;
          const mapped: SiteInfo = {
            id: data.id,
            site_name: data.site_name || data.store_name || "آکسون | Axon",
            siteName: data.site_name || data.store_name || "آکسون | Axon",
            storeName: data.site_name || data.store_name || "آکسون | Axon",
            tagline: data.tagline || "مرجع تخصصی تجهیزات دیجیتال، تصویر و استودیو",
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
            instagram: data.instagram || "",
            telegram: data.telegram || "",
            whatsapp: data.whatsapp || "",
            youtube: data.youtube || "",
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
      const current = this.getSiteInfoSync();
      const maintMode = payload.maintenance_mode !== undefined 
        ? payload.maintenance_mode 
        : (current.maintenance_mode || "none");

      const isAllowed = payload.allow_google_index !== undefined
        ? payload.allow_google_index
        : (maintMode === "none");

      const sName = payload.site_name || payload.siteName || payload.storeName || current.site_name || "آکسون | Axon";

      const dbPayload: any = {
        site_name: sName,
        store_name: sName,
        tagline: payload.tagline !== undefined ? payload.tagline : current.tagline,
        phone: payload.phone !== undefined ? payload.phone : current.phone,
        email: payload.email !== undefined ? payload.email : current.email,
        address: payload.address !== undefined ? payload.address : current.address,
        working_hours: payload.working_hours !== undefined ? payload.working_hours : current.working_hours,
        logo_url: payload.logo_url || payload.logoUrl || current.logo_url || "",
        footer_logo_url: payload.footer_logo_url || payload.footerLogoUrl || current.footer_logo_url || "",
        favicon_url: payload.favicon_url || payload.faviconUrl || current.favicon_url || "",
        allow_google_index: isAllowed,
        maintenance_mode: maintMode,
        maintenance_until: payload.maintenance_until !== undefined ? payload.maintenance_until : current.maintenance_until,
        maintenance_duration_minutes: payload.maintenance_duration_minutes !== undefined ? payload.maintenance_duration_minutes : current.maintenance_duration_minutes,
        header_announcement: payload.header_announcement !== undefined ? payload.header_announcement : current.header_announcement,
        free_shipping_threshold: Number(payload.free_shipping_threshold || current.free_shipping_threshold || 2000000),
        footer_text: payload.footer_text || payload.description || current.footer_text || "",
        description: payload.description || payload.footer_text || current.description || "",
        custom_css: payload.custom_css !== undefined ? payload.custom_css : current.custom_css,
        active_font_id: payload.active_font_id || current.active_font_id || "Vazirmatn",
        updated_at: new Date().toISOString(),
      };

      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      const json = await res.json();
      const finalData = json.data || dbPayload;

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(finalData));
        realtimeEngine.broadcastLocally("site_info_updated", finalData);
      }

      return finalData;
    } catch {
      return null;
    }
  },
};

export default siteInfoService;

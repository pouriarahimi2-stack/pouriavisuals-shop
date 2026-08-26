// services/siteInfoService.ts
import { supabase } from "@/lib/supabase";

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
  allow_google_index?: boolean;
  allowGoogleIndex?: boolean;
  maintenance_mode?: MaintenanceMode;
  maintenance_until?: string;
  maintenance_duration_minutes?: number;
  maintenance_title?: string;
  maintenance_message?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  youtube?: string;
  header_announcement?: string;
  announcement_enabled?: boolean;
  free_shipping_threshold?: number;
  description?: string;
  footer_text?: string;
  aboutText?: string;
  custom_css?: string;
  active_font_id?: string;
  updated_at?: string;
}

export const siteInfoService = {
  getSiteInfoSync(): SiteInfo {
    return {
      site_name: "آکسون | Axon",
      siteName: "آکسون | Axon",
      storeName: "آکسون | Axon",
      tagline: "مرجع تخصصی تجهیزات تصویر، مانیتور و استودیو",
      allow_google_index: true,
      allowGoogleIndex: true,
      maintenance_mode: "none",
      phone: "۰۲۱-۸۸۸۸۸۸۸۸",
      email: "info@axoncore.ir",
      address: "تهران، خیابان ولیعصر، تقاطع میرداماد",
      working_hours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      header_announcement: "⚡ ارسال رایگان خریدهای بالای ۲ میلیون تومان | گارانتی تعویض طلایی ۱۸ ماهه",
      announcement_enabled: true,
      free_shipping_threshold: 2000000,
    };
  },

  async getSiteInfo(): Promise<SiteInfo | null> {
    try {
      if (supabase) {
        const { data } = await supabase
          .from("site_info")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (data) {
          const isAllowed = data.allow_google_index !== false && data.allowGoogleIndex !== false;
          return {
            id: data.id,
            site_name: data.site_name || data.store_name || "آکسون | Axon",
            siteName: data.site_name || data.store_name || "آکسون | Axon",
            storeName: data.site_name || data.store_name || "آکسون | Axon",
            tagline: data.tagline || "مرجع تخصصی تجهیزات دیجیتال",
            phone: data.phone || "",
            email: data.email || "",
            address: data.address || "",
            working_hours: data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
            logo_url: data.logo_url || "",
            logoUrl: data.logo_url || "",
            footer_logo_url: data.footer_logo_url || "",
            footerLogoUrl: data.footer_logo_url || "",
            allow_google_index: isAllowed,
            allowGoogleIndex: isAllowed,
            maintenance_mode: (data.maintenance_mode as MaintenanceMode) || (isAllowed ? "none" : "indefinite"),
            maintenance_until: data.maintenance_until || undefined,
            maintenance_duration_minutes: data.maintenance_duration_minutes ? Number(data.maintenance_duration_minutes) : undefined,
            header_announcement: data.header_announcement || "",
            description: data.description || data.footer_text || "",
            footer_text: data.footer_text || data.description || "",
            custom_css: data.custom_css || "",
            active_font_id: data.active_font_id || "Vazirmatn",
            updated_at: data.updated_at,
          };
        }
      }
      return this.getSiteInfoSync();
    } catch {
      return this.getSiteInfoSync();
    }
  },

  // تابع الزامی getAll برای سازگاری کامل و رفع خطای کنسول
  async getAll(): Promise<SiteInfo | null> {
    return this.getSiteInfo();
  },

  async updateSiteInfo(payload: Partial<SiteInfo>): Promise<SiteInfo | null> {
    try {
      const isAllowed =
        payload.allow_google_index !== undefined
          ? payload.allow_google_index
          : payload.maintenance_mode === "none";

      const sName = payload.site_name || payload.siteName || payload.storeName || "آکسون | Axon";

      const dbPayload: any = {
        site_name: sName,
        store_name: sName,
        tagline: payload.tagline || "",
        phone: payload.phone || "",
        email: payload.email || "",
        address: payload.address || "",
        working_hours: payload.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        logo_url: payload.logo_url || payload.logoUrl || "",
        footer_logo_url: payload.footer_logo_url || payload.footerLogoUrl || "",
        allow_google_index: isAllowed,
        maintenance_mode: payload.maintenance_mode || (isAllowed ? "none" : "indefinite"),
        maintenance_until: payload.maintenance_until || null,
        maintenance_duration_minutes: payload.maintenance_duration_minutes || null,
        header_announcement: payload.header_announcement || "",
        footer_text: payload.footer_text || payload.description || "",
        description: payload.description || payload.footer_text || "",
        updated_at: new Date().toISOString(),
      };

      try {
        await fetch("/api/site-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dbPayload),
        });
      } catch {}

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("site_info_updated", { detail: dbPayload }));
      }

      return dbPayload;
    } catch {
      return null;
    }
  },
};
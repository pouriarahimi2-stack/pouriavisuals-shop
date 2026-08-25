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
  maintenance_until?: string; // تاریخ و ساعت پایان به فرمت ISO
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
  custom_css?: string;
  active_font_id?: string;
  updated_at?: string;
}

let cachedSiteInfo: SiteInfo | null = null;

export const siteInfoService = {
  getSiteInfoSync(): SiteInfo | null {
    if (cachedSiteInfo) return cachedSiteInfo;
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("axon_site_info_cache");
      if (local) {
        try {
          cachedSiteInfo = JSON.parse(local);
          return cachedSiteInfo;
        } catch {}
      }
    }
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
        const { data, error } = await supabase
          .from("site_info")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const isAllowed = data.allow_google_index !== false && data.allowGoogleIndex !== false;
          const mapped: SiteInfo = {
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
            favicon_url: data.favicon_url || "",
            allow_google_index: isAllowed,
            allowGoogleIndex: isAllowed,
            maintenance_mode: (data.maintenance_mode as MaintenanceMode) || (isAllowed ? "none" : "indefinite"),
            maintenance_until: data.maintenance_until || undefined,
            maintenance_duration_minutes: data.maintenance_duration_minutes ? Number(data.maintenance_duration_minutes) : undefined,
            maintenance_title: data.maintenance_title || "",
            maintenance_message: data.maintenance_message || "",
            instagram: data.instagram || "",
            telegram: data.telegram || "",
            whatsapp: data.whatsapp || "",
            youtube: data.youtube || "",
            header_announcement: data.header_announcement || "",
            announcement_enabled: data.announcement_enabled !== false,
            free_shipping_threshold: Number(data.free_shipping_threshold || 2000000),
            description: data.description || data.footer_text || "",
            footer_text: data.footer_text || data.description || "",
            custom_css: data.custom_css || "",
            active_font_id: data.active_font_id || "Vazirmatn",
            updated_at: data.updated_at,
          };

          cachedSiteInfo = mapped;
          if (typeof window !== "undefined") {
            localStorage.setItem("axon_site_info_cache", JSON.stringify(mapped));
          }
          return mapped;
        }
      }
      return this.getSiteInfoSync();
    } catch (e) {
      console.error("siteInfoService.getSiteInfo error:", e);
      return this.getSiteInfoSync();
    }
  },

  async getAll(): Promise<SiteInfo | null> {
    return this.getSiteInfo();
  },

  async updateSiteInfo(payload: Partial<SiteInfo>): Promise<SiteInfo | null> {
    try {
      const isAllowed =
        payload.allow_google_index !== undefined
          ? payload.allow_google_index
          : payload.allowGoogleIndex !== undefined
          ? payload.allowGoogleIndex
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
        favicon_url: payload.favicon_url || "",
        allow_google_index: isAllowed,
        maintenance_mode: payload.maintenance_mode || (isAllowed ? "none" : "indefinite"),
        maintenance_until: payload.maintenance_until || null,
        maintenance_duration_minutes: payload.maintenance_duration_minutes || null,
        maintenance_title: payload.maintenance_title || null,
        maintenance_message: payload.maintenance_message || null,
        instagram: payload.instagram || "",
        telegram: payload.telegram || "",
        whatsapp: payload.whatsapp || "",
        youtube: payload.youtube || "",
        header_announcement: payload.header_announcement || "",
        announcement_enabled: payload.announcement_enabled !== false,
        free_shipping_threshold: Number(payload.free_shipping_threshold || 2000000),
        footer_text: payload.footer_text || payload.description || "",
        description: payload.description || payload.footer_text || "",
        custom_css: payload.custom_css || "",
        active_font_id: payload.active_font_id || "Vazirmatn",
        updated_at: new Date().toISOString(),
      };

      let resultData: any = null;

      if (supabase) {
        const { data: existing } = await supabase
          .from("site_info")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          const { data, error } = await supabase
            .from("site_info")
            .update(dbPayload)
            .eq("id", existing.id)
            .select()
            .single();

          if (error) throw error;
          resultData = data;
        } else {
          const { data, error } = await supabase
            .from("site_info")
            .insert([{ id: 1, ...dbPayload }])
            .select()
            .single();

          if (error) throw error;
          resultData = data;
        }
      }

      const updatedMapped: SiteInfo = {
        ...(resultData || dbPayload),
        siteName: sName,
        storeName: sName,
        logoUrl: dbPayload.logo_url,
        footerLogoUrl: dbPayload.footer_logo_url,
        allowGoogleIndex: isAllowed,
        allow_google_index: isAllowed,
        maintenance_mode: dbPayload.maintenance_mode,
        maintenance_until: dbPayload.maintenance_until,
      };

      cachedSiteInfo = updatedMapped;

      if (typeof window !== "undefined") {
        localStorage.setItem("axon_site_info_cache", JSON.stringify(updatedMapped));
        window.dispatchEvent(new CustomEvent("site_info_updated", { detail: updatedMapped }));

        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("site_info_sync_channel");
          bc.postMessage({ type: "SYNC_SITE_INFO", data: updatedMapped });
          bc.close();
        }
      }

      return updatedMapped;
    } catch (err) {
      console.error("Error updating site_info:", err);
      return null;
    }
  },
};
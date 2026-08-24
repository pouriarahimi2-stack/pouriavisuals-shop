import { supabase } from "@/lib/supabase";

export interface SiteInfo {
  id?: string;
  site_name?: string;
  siteName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string;
  logoUrl?: string;
  footer_logo_url?: string;
  footerLogoUrl?: string;
  allow_google_index?: boolean;
  allowGoogleIndex?: boolean;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  header_announcement?: string;
  description?: string;
  footer_text?: string;
}

let cachedSiteInfo: SiteInfo | null = null;

export const siteInfoService = {
  getSiteInfoSync(): SiteInfo | null {
    if (cachedSiteInfo) return cachedSiteInfo;
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("axon_site_info");
      if (local) {
        try {
          cachedSiteInfo = JSON.parse(local);
          return cachedSiteInfo;
        } catch {}
      }
    }
    return null;
  },

  async getSiteInfo(): Promise<SiteInfo | null> {
    try {
      const { data, error } = await supabase
        .from("site_info")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching site_info:", error);
        return this.getSiteInfoSync();
      }

      if (data) {
        const isAllowed = data.allow_google_index !== false && data.allowGoogleIndex !== false;
        const mapped: SiteInfo = {
          ...data,
          siteName: data.site_name,
          logoUrl: data.logo_url,
          footerLogoUrl: data.footer_logo_url,
          allowGoogleIndex: isAllowed,
          allow_google_index: isAllowed,
          footerText: data.footer_text || data.description,
        };
        cachedSiteInfo = mapped;
        if (typeof window !== "undefined") {
          localStorage.setItem("axon_site_info", JSON.stringify(mapped));
        }
        return mapped;
      }
      return this.getSiteInfoSync();
    } catch (e) {
      console.error("getSiteInfo error:", e);
      return this.getSiteInfoSync();
    }
  },

  async updateSiteInfo(payload: Partial<SiteInfo>): Promise<SiteInfo | null> {
    try {
      const isAllowed = payload.allowGoogleIndex !== undefined 
        ? payload.allowGoogleIndex 
        : payload.allow_google_index !== undefined 
        ? payload.allow_google_index 
        : true;

      const dbPayload: any = {
        site_name: payload.site_name || payload.siteName || "",
        tagline: payload.tagline || "",
        phone: payload.phone || "",
        email: payload.email || "",
        address: payload.address || "",
        logo_url: payload.logo_url || payload.logoUrl || "",
        footer_logo_url: payload.footer_logo_url || payload.footerLogoUrl || "",
        allow_google_index: isAllowed,
        instagram: payload.instagram || "",
        telegram: payload.telegram || "",
        whatsapp: payload.whatsapp || "",
        header_announcement: payload.header_announcement || "",
        footer_text: payload.footer_text || payload.description || "",
        description: payload.description || payload.footer_text || "",
      };

      const { data: existing } = await supabase.from("site_info").select("id").limit(1).maybeSingle();

      let resultData;
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
          .insert([dbPayload])
          .select()
          .single();
        if (error) throw error;
        resultData = data;
      }

      const updatedMapped: SiteInfo = {
        ...resultData,
        siteName: resultData.site_name,
        logoUrl: resultData.logo_url,
        footerLogoUrl: resultData.footer_logo_url,
        allowGoogleIndex: resultData.allow_google_index !== false,
        allow_google_index: resultData.allow_google_index !== false,
      };

      cachedSiteInfo = updatedMapped;
      if (typeof window !== "undefined") {
        localStorage.setItem("axon_site_info", JSON.stringify(updatedMapped));
        window.dispatchEvent(new CustomEvent("site_info_updated", { detail: updatedMapped }));
      }
      return updatedMapped;
    } catch (err) {
      console.error("Error updating site_info:", err);
      return null;
    }
  }
};
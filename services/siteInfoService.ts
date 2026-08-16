import { supabase } from "@/lib/supabase";

export interface SiteInfo {
  id?: string;
  storeName?: string;
  store_name?: string;
  siteTitle?: string;
  site_title?: string;
  phone?: string;
  email?: string;
  address?: string;
  aboutText?: string;
  about_text?: string;
  aboutUs?: string;
  logo?: string;
  logo_url?: string;
  logoUrl?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  allowGoogleIndex?: boolean;
  allow_google_index?: boolean;
  updated_at?: string;
}

const STORAGE_KEY = "site_info_db";

export const siteInfoService = {
  async getAll(): Promise<SiteInfo> {
    const defaultData: SiteInfo = {
      id: "main_config",
      storeName: "Tech Store",
      siteTitle: "Tech Store",
      phone: "۰۲۱-۸۸۸۸۸۸۸۸",
      email: "info@techstore.com",
      address: "تهران، خیابان ولیعصر، برج فناوری",
      aboutText: "مرجع تخصصی خرید محصولات اصل با تضمین اصالت و بهترین قیمت.",
      aboutUs: "مرجع تخصصی خرید محصولات اصل با تضمین اصالت و بهترین قیمت.",
      logo: "",
      logoUrl: "",
      instagram: "tech_store",
      telegram: "tech_store",
      allowGoogleIndex: true,
    };

    // اولویت با خواندن مستقیم از دیتابیس Supabase
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("site_info")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const unified: SiteInfo = {
            id: data.id || "main_config",
            storeName: data.store_name || data.storeName || defaultData.storeName,
            siteTitle: data.site_title || data.siteTitle || defaultData.siteTitle,
            phone: data.phone || defaultData.phone,
            email: data.email || defaultData.email,
            address: data.address || defaultData.address,
            aboutText: data.about_text || data.aboutText || data.aboutUs || defaultData.aboutText,
            aboutUs: data.about_text || data.aboutText || data.aboutUs || defaultData.aboutUs,
            logo: data.logo_url || data.logo || data.logoUrl || "",
            logoUrl: data.logo_url || data.logo || data.logoUrl || "",
            instagram: data.instagram || defaultData.instagram,
            telegram: data.telegram || defaultData.telegram,
            whatsapp: data.whatsapp || "",
            allowGoogleIndex: data.allow_google_index !== false && data.allowGoogleIndex !== false,
            updated_at: data.updated_at,
          };

          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(unified));
          }
          return unified;
        }
      }
    } catch (err) {
      console.warn("Supabase site info fetch warning:", err);
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        try {
          return { ...defaultData, ...JSON.parse(local) };
        } catch {}
      }
    }

    return defaultData;
  },

  async getSiteInfo(): Promise<SiteInfo> {
    return this.getAll();
  },

  async update(info: Partial<SiteInfo>): Promise<{ success: boolean; data?: SiteInfo }> {
    const current = await this.getAll();
    const merged: SiteInfo = {
      ...current,
      ...info,
      updated_at: new Date().toISOString(),
    };

    const targetTitle = merged.storeName || merged.siteTitle || "Tech Store";

    if (typeof document !== "undefined") {
      document.title = targetTitle;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("site_info_updated", { detail: merged }));
    }

    try {
      if (supabase) {
        const dbPayload = {
          id: "main_config",
          store_name: merged.storeName || merged.store_name,
          site_title: merged.siteTitle || merged.site_title,
          phone: merged.phone,
          email: merged.email,
          address: merged.address,
          about_text: merged.aboutText || merged.aboutUs || merged.about_text,
          logo_url: merged.logo || merged.logoUrl || merged.logo_url,
          instagram: merged.instagram,
          telegram: merged.telegram,
          whatsapp: merged.whatsapp,
          allow_google_index: merged.allowGoogleIndex !== false,
          updated_at: merged.updated_at,
        };

        await supabase.from("site_info").upsert([dbPayload], { onConflict: "id" });
      }
    } catch (err) {
      console.warn("Supabase update error:", err);
    }

    return { success: true, data: merged };
  },

  async updateSiteInfo(info: Partial<SiteInfo>): Promise<{ success: boolean; data?: SiteInfo }> {
    return this.update(info);
  },
};
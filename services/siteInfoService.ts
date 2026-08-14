import { supabase } from "@/lib/supabase";

export interface SiteInfo {
  storeName: string;
  aboutText: string;
  phone: string;
  email: string;
  address: string;
  activeFontId: string;
  maintenanceMode: boolean;
  customFonts?: Array<{ id: string; name: string; url: string }>;
}

const DEFAULT_SITE_INFO: SiteInfo = {
  storeName: "BitByPouria",
  aboutText: "فروشگاه تخصصی تجهیزات و کالاهای دیجیتال",
  phone: "۰۲۱-۱۲۳۴۵۶۷۸",
  email: "info@pouriavisuals.ir",
  address: "تهران، خیابان آزادی",
  activeFontId: "vazir",
  maintenanceMode: false,
};

// حافظه موقت کلاینت برای رندر سریع‌تر
let cachedSiteInfo: SiteInfo = DEFAULT_SITE_INFO;

export const siteInfoService = {
  // ۱. دریافت اطلاعات زنده از Supabase
  async fetchSiteInfo(): Promise<SiteInfo> {
    try {
      const { data, error } = await supabase
        .from("site_info")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching site_info from Supabase:", error);
        return cachedSiteInfo;
      }

      if (data) {
        cachedSiteInfo = {
          storeName: data.store_name ?? DEFAULT_SITE_INFO.storeName,
          aboutText: data.about_text ?? DEFAULT_SITE_INFO.aboutText,
          phone: data.phone ?? DEFAULT_SITE_INFO.phone,
          email: data.email ?? DEFAULT_SITE_INFO.email,
          address: data.address ?? DEFAULT_SITE_INFO.address,
          activeFontId: data.active_font_id ?? DEFAULT_SITE_INFO.activeFontId,
          maintenanceMode: data.maintenance_mode ?? false,
        };
      }
      return cachedSiteInfo;
    } catch (e) {
      console.error("Supabase connection error:", e);
      return cachedSiteInfo;
    }
  },

  // دریافت سنکرون کلاینتی
  getSiteInfo(): SiteInfo {
    return cachedSiteInfo;
  },

  // ۲. ذخیره و آپدیت هوشمند مستقیم در Supabase
  async saveSiteInfo(info: Partial<SiteInfo>): Promise<SiteInfo> {
    try {
      // ابتدا بررسی می‌کنیم رکوردی وجود دارد یا خیر
      const { data: existing } = await supabase
        .from("site_info")
        .select("id")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      const payload = {
        store_name: info.storeName ?? cachedSiteInfo.storeName,
        about_text: info.aboutText ?? cachedSiteInfo.aboutText,
        phone: info.phone ?? cachedSiteInfo.phone,
        email: info.email ?? cachedSiteInfo.email,
        address: info.address ?? cachedSiteInfo.address,
        active_font_id: info.activeFontId ?? cachedSiteInfo.activeFontId,
        maintenance_mode: info.maintenanceMode ?? cachedSiteInfo.maintenanceMode,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        // آپدیت سطر موجود
        const { error } = await supabase
          .from("site_info")
          .update(payload)
          .eq("id", existing.id);

        if (error) {
          console.error("Supabase Update Error:", error);
          throw error;
        }
      } else {
        // ساخت سطر جدید در صورت نبود رکورد اولیه
        const { error } = await supabase
          .from("site_info")
          .insert([payload]);

        if (error) {
          console.error("Supabase Insert Error:", error);
          throw error;
        }
      }

      // آپدیت کش و اطلاع به بقیه کامپوننت‌ها
      cachedSiteInfo = { ...cachedSiteInfo, ...info };

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("siteInfoUpdated"));
      }

      return cachedSiteInfo;
    } catch (e) {
      console.error("Error saving site_info to Supabase:", e);
      throw e;
    }
  },
};
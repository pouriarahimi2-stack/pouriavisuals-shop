import { supabase } from "@/lib/supabase";

export interface SiteInfo {
  id?: string;
  site_name: string;
  tagline?: string;
  description?: string;
  phone: string;
  email: string;
  address: string;
  logo?: string;
  allowGoogleIndex?: boolean;
  socials?: {
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    youtube?: string;
  };
}

const LOCAL_STORAGE_KEY = "site_global_info";

export const siteInfoService = {
  async getAll(): Promise<SiteInfo> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("site_info")
          .select("*")
          .limit(1)
          .single();

        if (!error && data) {
          const mapped: SiteInfo = {
            id: data.id,
            site_name: data.site_name || data.siteName,
            tagline: data.tagline,
            description: data.description,
            phone: data.phone,
            email: data.email,
            address: data.address,
            logo: data.logo,
            allowGoogleIndex: data.allow_google_index ?? data.allowGoogleIndex ?? true,
            socials: typeof data.socials === "string" ? JSON.parse(data.socials) : data.socials,
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      }

      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) return JSON.parse(local);

      // اطلاعات پیش‌فرض برند
      const defaults: SiteInfo = {
        site_name: "پوریا ویژوالز",
        tagline: "مرجع تخصصی تجهیزات تصویر و دیجیتال",
        description: "ارائه‌دهنده تخصصی تجهیزات مانیتورینگ، ابزارهای تدوین و سخت‌افزارهای مدرن بصری با گارانتی اصالت کالا.",
        phone: "۰۲۱-۸۸۸۸۸۸۸۸",
        email: "info@pouriavisuals.ir",
        address: "تهران، خیابان ولیعصر",
        allowGoogleIndex: true,
        socials: {
          instagram: "https://instagram.com",
          telegram: "https://t.me",
        },
      };
      return defaults;
    } catch (e) {
      console.error("Error loading site info:", e);
      return {
        site_name: "پوریا ویژوالز",
        phone: "۰۲۱-۸۸۸۸۸۸۸۸",
        email: "info@pouriavisuals.ir",
        address: "تهران، خیابان ولیعصر",
        allowGoogleIndex: true,
      };
    }
  },

  async update(info: SiteInfo): Promise<boolean> {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(info));

      if (supabase) {
        const payload = {
          site_name: info.site_name,
          tagline: info.tagline,
          description: info.description,
          phone: info.phone,
          email: info.email,
          address: info.address,
          logo: info.logo,
          allow_google_index: info.allowGoogleIndex,
          socials: info.socials,
        };

        const { data } = await supabase.from("site_info").select("id").limit(1);
        if (data && data.length > 0) {
          await supabase.from("site_info").update(payload).eq("id", data[0].id);
        } else {
          await supabase.from("site_info").insert([payload]);
        }
      }

      // انتشار رویداد بلادرنگ
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("site_info_updated", { detail: info }));
        if ("BroadcastChannel" in window) {
          const channel = new BroadcastChannel("site_info_sync_channel");
          channel.postMessage({ type: "SYNC_SITE_INFO", data: info });
          channel.close();
        }
      }

      return true;
    } catch (e) {
      console.error("Error saving site info:", e);
      return false;
    }
  },
};
import { supabase } from "@/lib/supabase";

export interface SiteInfo {
  id?: string;
  siteName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  telegram: string;
  whatsapp: string;
  workingHours: string;
  shippingText: string;
  guaranteeText: string;
  supportText: string;
  allowGoogleIndex: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

export const defaultSiteInfo: SiteInfo = {
  siteName: "AXonCore | تجهیزات تخصصی دیجیتال",
  tagline: "مرجع تخصصی فروش جدیدترین گجت‌ها و اکسسوری‌های اورجینال",
  description: "فروشگاه آنلاین آکسون، ارائه‌دهنده باکیفیت‌ترین محصولات دیجیتال، مک‌بوک، آیفون و گجت‌های هوشمند همراه با گارانتی اصالت کالا.",
  phone: "۰۲۱-۸۸۸۸۸۸۸۸",
  email: "support@axoncore.ir",
  address: "تهران، خیابان ولیعصر، تقاطع میرداماد، مجتمع تجاری پایتخت، طبقه دوم",
  instagram: "axoncore",
  telegram: "axoncore_support",
  whatsapp: "09120000000",
  workingHours: "شنبه تا چهارشنبه ۹ الی ۲۱ | پنج‌شنبه‌ها ۹ الی ۱۸",
  shippingText: "ارسال سریع با پست پیشتاز و تیپاکس به سراسر کشور",
  guaranteeText: "۷ روز ضمانت بازگشت وجه و تضمین ۱۰۰٪ اصالت کالا",
  supportText: "پشتیبانی ۲۴ ساعته در ۷ روز هفته",
  allowGoogleIndex: true,
  metaTitle: "فروشگاه تخصصی محصولات دیجیتال و هوشمند | AXonCore",
  metaDescription: "خرید آنلاین انواع لپ‌تاپ، لوازم جانبی هوشمند، قطعات و گجت‌های کاربردی با بهترین قیمت و ضمانت بازگشت وجه.",
  metaKeywords: "خرید آنلاین, محصولات دیجیتال, فروشگاه اینترنتی, گجت هوشمند",
};

const STORAGE_KEY = "site_info_cache";

export const siteInfoService = {
  // ۱. متد همگام (Sync) برای رندر بدون معطلی در کلاینت و لایوت
  getSiteInfoSync(): SiteInfo {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          return { ...defaultSiteInfo, ...JSON.parse(cached) };
        }
      } catch {}
    }
    return defaultSiteInfo;
  },

  // ۲. متد ناهمگام (Async) برای واکشی و به‌روزرسانی زنده
  async getSiteInfo(): Promise<SiteInfo> {
    if (typeof window !== "undefined") {
      const syncData = this.getSiteInfoSync();
      
      // واکشی در پس‌زمینه از سرور یا سوپابیس
      try {
        const res = await fetch("/api/site-info", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
            return { ...defaultSiteInfo, ...json.data };
          }
        }
      } catch {}

      if (supabase) {
        try {
          const { data, error } = await supabase.from("site_info").select("*").limit(1).single();
          if (!error && data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return { ...defaultSiteInfo, ...data };
          }
        } catch {}
      }

      return syncData;
    }
    return defaultSiteInfo;
  },

  // ۳. ذخیره‌سازی اطلاعات
  async updateSiteInfo(info: Partial<SiteInfo>): Promise<{ success: boolean; message?: string }> {
    try {
      const current = this.getSiteInfoSync();
      const updated = { ...current, ...info };

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      try {
        await fetch("/api/site-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
      } catch {}

      if (supabase) {
        try {
          await supabase.from("site_info").upsert({ id: "main_config", ...updated });
        } catch {}
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || "خطا در ثبت اطلاعات سایت." };
    }
  },
};

export const getSiteInfoSync = siteInfoService.getSiteInfoSync.bind(siteInfoService);
export const getSiteInfo = siteInfoService.getSiteInfo.bind(siteInfoService);
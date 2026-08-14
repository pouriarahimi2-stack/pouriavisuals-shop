export interface CustomFont {
  id: string;
  name: string;
  url: string;
}

export interface SiteInfo {
  storeName: string;
  logoUrl?: string;
  activeFontId?: string;
  customFonts?: CustomFont[];
  aboutText?: string;
  phone?: string;
  email?: string;
  address?: string;
  instagram?: string;
  telegram?: string;
  allowGoogleIndex?: boolean; // 🔍 کلید فعال/غیرفعال‌سازی ایندکس گوگل
}

const SITE_INFO_KEY = "site_info_settings";

const DEFAULT_SITE_INFO: SiteInfo = {
  storeName: "فروشگاه اینترنتی مدرن",
  logoUrl: "",
  activeFontId: "vazir",
  customFonts: [],
  aboutText: "مرجع تخصصی عرضه بهترین محصولات با بالاترین کیفیت و پشتیبانی ۲۴ ساعته.",
  phone: "۰۲۱-۱۲۳۴۵۶۷۸",
  email: "support@example.com",
  address: "تهران، خیابان آزادی، پلاک ۱",
  instagram: "https://instagram.com",
  telegram: "https://t.me",
  allowGoogleIndex: true, // به‌صورت پیش‌فرض فعال
};

export const siteInfoService = {
  getSiteInfo: (): SiteInfo => {
    if (typeof window === "undefined") return DEFAULT_SITE_INFO;
    const data = localStorage.getItem(SITE_INFO_KEY);
    return data ? JSON.parse(data) : DEFAULT_SITE_INFO;
  },

  saveSiteInfo: (info: SiteInfo) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SITE_INFO_KEY, JSON.stringify(info));
  },
};
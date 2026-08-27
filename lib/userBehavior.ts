// File Path: lib/userBehavior.ts
/**
 * موتور رفتارشناسی هوشمند کاربر و تحلیلگر علایق بر پایه کوکی و LocalStorage
 * پیاده‌سازی هوشمند جهت افزایش نرخ تبدیل فروش و ماندگاری کاربر در سایت
 */

export interface UserInterests {
  categories: Record<string, number>;
  viewedProductIds: string[];
  readNewsSlugs: string[];
  searchHistory: string[];
  lastActive: string;
}

const COOKIE_NAME = "axon_user_profile_v2";
const STORAGE_KEY = "axon_behavior_metrics_v2";

export const userBehavior = {
  // دریافت پروفایل رفتاری کاربر
  getProfile(): UserInterests {
    if (typeof window === "undefined") {
      return { categories: {}, viewedProductIds: [], readNewsSlugs: [], searchHistory: [], lastActive: new Date().toISOString() };
    }

    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) return JSON.parse(local);

      // بررسی کوکی به عنوان فال‌بک
      const match = document.cookie.match(new RegExp("(^| )" + COOKIE_NAME + "=([^;]+)"));
      if (match) {
        return JSON.parse(decodeURIComponent(match[2]));
      }
    } catch {}

    return {
      categories: { gadgets: 1, hardware: 1 },
      viewedProductIds: [],
      readNewsSlugs: [],
      searchHistory: [],
      lastActive: new Date().toISOString(),
    };
  },

  // ذخیره امن متریک‌ها در کوکی و استوریج
  saveProfile(profile: UserInterests) {
    if (typeof window === "undefined") return;
    try {
      profile.lastActive = new Date().toISOString();
      const serialized = JSON.stringify(profile);
      localStorage.setItem(STORAGE_KEY, serialized);

      // تنظیم کوکی با ماندگاری ۳۰ روزه
      const d = new Date();
      d.setTime(d.getTime() + 30 * 24 * 60 * 60 * 1000);
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serialized)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    } catch {}
  },

  // ثبت بازدید از خبر و ارتقای وزن دسته‌بندی مربوطه
  trackNewsRead(slug: string, category: string) {
    const p = this.getProfile();
    if (!p.readNewsSlugs.includes(slug)) {
      p.readNewsSlugs.unshift(slug);
      if (p.readNewsSlugs.length > 50) p.readNewsSlugs.pop();
    }
    const catKey = category.toLowerCase().trim();
    p.categories[catKey] = (p.categories[catKey] || 0) + 3; // ضریب علاقه +۳
    this.saveProfile(p);
  },

  // ثبت بازدید محصول
  trackProductView(productId: string, category: string) {
    const p = this.getProfile();
    if (!p.viewedProductIds.includes(productId)) {
      p.viewedProductIds.unshift(productId);
      if (p.viewedProductIds.length > 30) p.viewedProductIds.pop();
    }
    const catKey = category.toLowerCase().trim();
    p.categories[catKey] = (p.categories[catKey] || 0) + 5; // ضریب خرید و علاقه به کالا +۵
    this.saveProfile(p);
  },

  // ثبت واژه جستجو شده
  trackSearch(query: string) {
    if (!query.trim()) return;
    const p = this.getProfile();
    const clean = query.trim().toLowerCase();
    if (!p.searchHistory.includes(clean)) {
      p.searchHistory.unshift(clean);
      if (p.searchHistory.length > 15) p.searchHistory.pop();
    }
    this.saveProfile(p);
  },

  // استخراج دسته‌بندی با بالاترین اولویت برای کاربر جاری
  getTopInterestCategory(): string {
    const p = this.getProfile();
    let topCat = "all";
    let maxWeight = -1;

    for (const [cat, weight] of Object.entries(p.categories)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        topCat = cat;
      }
    }
    return topCat;
  },
};
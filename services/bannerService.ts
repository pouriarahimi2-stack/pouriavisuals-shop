export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  badgeText?: string;
  isActive: boolean;
}

const STORAGE_KEY = "app_banners_db";

const DEFAULT_BANNERS: HeroBanner[] = [
  {
    id: "banner-1",
    title: "نسل جدید جادو با آیفون ۱۶ پرو",
    subtitle: "با بدنه تیتانیومی بسیار سبک و پردازنده فوق‌العاده قوی A18 Pro",
    buttonText: "خرید و بررسی",
    buttonLink: "#products",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200",
    badgeText: "پیش‌فروش ویژه",
    isActive: true,
  },
];

export const bannerService = {
  getBanners: (): HeroBanner[] => {
    if (typeof window === "undefined") return DEFAULT_BANNERS;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BANNERS));
      return DEFAULT_BANNERS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_BANNERS;
    }
  },

  addBanner: (banner: Omit<HeroBanner, "id">): HeroBanner[] => {
    const banners = bannerService.getBanners();
    const newBanner: HeroBanner = {
      ...banner,
      id: `banner-${Date.now()}`,
    };
    const updated = [newBanner, ...banners];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  updateBanner: (updatedBanner: HeroBanner): HeroBanner[] => {
    const banners = bannerService.getBanners();
    const updated = banners.map((b) =>
      b.id === updatedBanner.id ? updatedBanner : b
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  deleteBanner: (id: string): HeroBanner[] => {
    const banners = bannerService.getBanners();
    const updated = banners.filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },
};
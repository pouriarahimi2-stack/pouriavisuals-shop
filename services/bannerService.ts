import { supabase } from "@/lib/supabase";

export interface BannerItem {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  image_url?: string;
  image?: string;
  linkUrl: string;
  link_url?: string;
  link?: string;
  badge?: string;
  badge_text?: string;
  button_text?: string;
  buttonText?: string;
  position: "main_slider" | "grid_top" | "grid_bottom" | "sidebar";
  order?: number;
  isActive?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type Banner = BannerItem;

const LOCAL_STORAGE_KEY = "axon_banners_cache";

export function normalizeBanner(raw: any, index: number = 0): BannerItem {
  if (!raw) return {} as BannerItem;

  const id = raw.id || `ban_${Date.now()}_${index}`;
  const title = raw.title || "بنر تبلیغاتی";
  const subtitle = raw.subtitle || "";
  const imageUrl = raw.imageUrl || raw.image_url || raw.image || "/placeholder.png";
  const linkUrl = raw.linkUrl || raw.link_url || raw.link || "/#products";
  const position = raw.position || "main_slider";
  const order = Number(raw.order ?? raw.display_order ?? index + 1);
  const isActive = raw.isActive !== undefined ? Boolean(raw.isActive) : raw.is_active !== undefined ? Boolean(raw.is_active) : true;
  const badge = raw.badge || raw.badgeText || raw.badge_text || "";
  const button_text = raw.button_text || raw.buttonText || "مشاهده و خرید";

  return {
    ...raw,
    id,
    title,
    subtitle,
    imageUrl,
    image_url: imageUrl,
    image: imageUrl,
    linkUrl,
    link_url: linkUrl,
    link: linkUrl,
    badge,
    badge_text: badge,
    button_text,
    buttonText: button_text,
    position,
    order,
    isActive,
    is_active: isActive,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export const bannerService = {
  // دریافت همه بنرها با اولویت چینش
  async getAll(): Promise<BannerItem[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("order", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map((b: any, idx: number) => normalizeBanner(b, idx));
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      }

      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          return JSON.parse(cached).map((b: any, idx: number) => normalizeBanner(b, idx));
        }
      }

      const defaults: BannerItem[] = [
        {
          id: "ban_1",
          title: "مانیتورهای تخصصی تدوین و رنگ‌آمیزی 4K",
          subtitle: "دقت رنگ ۹۹٪ DCI-P3 ویژه ادیتورها، کارگردانان و طراحان گرافیک",
          imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200",
          linkUrl: "/#products",
          badge: "ویژه حرفه‌ای‌ها",
          button_text: "بررسی مشخصات و خرید",
          position: "main_slider",
          order: 1,
          isActive: true,
        },
      ];

      return defaults.map((b, idx) => normalizeBanner(b, idx));
    } catch (err) {
      console.error("bannerService getAll error:", err);
      return [];
    }
  },

  // دریافت بنرهای فعال جهت نمایش در صفحه اصلی
  async getActive(): Promise<BannerItem[]> {
    const all = await this.getAll();
    return all.filter((b) => b.isActive !== false && b.is_active !== false);
  },

  // ذخیره کل بنرها و به‌روزرسانی در دیتابیس
  async saveAll(bannersList: BannerItem[]): Promise<boolean> {
    try {
      const normalized = bannersList.map((b, idx) => normalizeBanner(b, idx));

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
      }

      if (supabase) {
        const payload = normalized.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          image_url: b.imageUrl,
          link_url: b.linkUrl,
          position: b.position,
          order: b.order,
          is_active: b.isActive,
          badge_text: b.badge,
          button_text: b.button_text,
          updated_at: new Date().toISOString(),
        }));

        await supabase.from("banners").delete().neq("id", "0");
        await supabase.from("banners").insert(payload);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("banners_updated", { detail: normalized }));
      }

      return true;
    } catch (err) {
      console.error("bannerService saveAll error:", err);
      return false;
    }
  },

  // ایجاد بنر تکی
  async create(bannerData: Partial<BannerItem>): Promise<BannerItem | null> {
    try {
      const current = await this.getAll();
      const newBanner = normalizeBanner({
        ...bannerData,
        id: `ban_${Date.now()}`,
        order: current.length + 1,
      });

      const updatedList = [...current, newBanner];
      await this.saveAll(updatedList);
      return newBanner;
    } catch (err) {
      console.error("bannerService create error:", err);
      return null;
    }
  },

  // به‌روزرسانی بنر تکی
  async update(id: string | number, bannerData: Partial<BannerItem>): Promise<BannerItem | null> {
    try {
      const current = await this.getAll();
      let updatedItem: BannerItem | null = null;

      const updatedList = current.map((b) => {
        if (String(b.id) === String(id)) {
          updatedItem = normalizeBanner({ ...b, ...bannerData });
          return updatedItem;
        }
        return b;
      });

      if (updatedItem) {
        await this.saveAll(updatedList);
      }

      return updatedItem;
    } catch (err) {
      console.error("bannerService update error:", err);
      return null;
    }
  },

  // حذف بنر تکی
  async delete(id: string | number): Promise<boolean> {
    try {
      const current = await this.getAll();
      const filtered = current.filter((b) => String(b.id) !== String(id));
      return await this.saveAll(filtered);
    } catch (err) {
      console.error("bannerService delete error:", err);
      return false;
    }
  },
};
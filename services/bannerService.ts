// services/bannerService.ts
import { supabase } from "@/lib/supabase";

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badge_text?: string;
  image: string;
  image_url?: string;
  link?: string;
  link_url?: string;
  button_text?: string;
  buttonText?: string;
  is_active?: boolean;
  created_at?: string;
}

const LOCAL_BANNERS_KEY = "axon_banners_cache";

export const bannerService = {
  async getAll(): Promise<Banner[]> {
    try {
      if (supabase) {
        // کوئری اصلاح‌شده بدون وابستگی به order_index جهت رفع خطای 400
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Banner[] = data.map((b: any) => ({
            id: String(b.id),
            title: b.title || "بنر ویژه",
            subtitle: b.subtitle || "",
            badge: b.badge || b.badge_text || "",
            badge_text: b.badge || b.badge_text || "",
            image: b.image || b.image_url || "/placeholder.png",
            image_url: b.image || b.image_url || "/placeholder.png",
            link: b.link || b.link_url || "/products",
            link_url: b.link || b.link_url || "/products",
            button_text: b.button_text || b.buttonText || "مشاهده و خرید",
            buttonText: b.button_text || b.buttonText || "مشاهده و خرید",
            is_active: b.is_active !== false,
            created_at: b.created_at,
          }));

          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      }

      if (typeof window !== "undefined") {
        const local = localStorage.getItem(LOCAL_BANNERS_KEY);
        if (local) return JSON.parse(local);
      }

      return [
        {
          id: "default-banner-1",
          title: "مرجع تخصصی تجهیزات مانیتورینگ و تدوین رنگ ۵K",
          subtitle: "پوشش رنگ ۱۰۰٪ DCI-P3 به همراه کالیبراسیون سخت‌افزاری و ضمانت اصالت ۱۸ ماهه",
          badge: "تجهیزات استودیویی ۲۰۲۶",
          image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1600&auto=format&fit=crop&q=80",
          link: "/products",
          button_text: "مشاهده و بررسی کالاها",
          is_active: true,
        },
      ];
    } catch (e) {
      console.error("bannerService.getAll error:", e);
      return [];
    }
  },

  async getBanners(): Promise<Banner[]> {
    return this.getAll();
  },

  async getActive(): Promise<Banner[]> {
    const all = await this.getAll();
    return all.filter((b) => b.is_active !== false);
  }
};
// services/newsService.ts
import { supabase } from "@/lib/supabase";

export interface TechNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: "gadgets" | "gaming" | "ai" | "apple" | "hardware" | "general";
  source_name: string;
  source_url?: string;
  image_url: string;
  published_at: string;
  views_count?: number;
  trending_score?: number;
  tags?: string[];
  is_published?: boolean;
}

const LOCAL_NEWS_KEY = "axon_tech_radar_news";

export const newsService = {
  async getAll(): Promise<TechNewsItem[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("tech_news")
          .select("*")
          .order("published_at", { ascending: false });

        if (!error && data && data.length > 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_NEWS_KEY, JSON.stringify(data));
          }
          return data as TechNewsItem[];
        }
      }

      if (typeof window !== "undefined") {
        const local = localStorage.getItem(LOCAL_NEWS_KEY);
        if (local) return JSON.parse(local);
      }

      return this.getDefaults();
    } catch (e) {
      console.error("newsService.getAll Error:", e);
      return this.getDefaults();
    }
  },

  async getBySlug(slug: string): Promise<TechNewsItem | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("tech_news")
          .select("*")
          .eq("slug", slug.trim().toLowerCase())
          .maybeSingle();

        if (!error && data) {
          return data as TechNewsItem;
        }
      }

      const all = await this.getAll();
      return all.find((n) => n.slug === slug.trim().toLowerCase()) || null;
    } catch (e) {
      console.error("newsService.getBySlug Error:", e);
      return null;
    }
  },

  async saveNewsItem(item: Partial<TechNewsItem>): Promise<TechNewsItem | null> {
    try {
      const cleanSlug = (item.slug || item.title || `news-${Date.now()}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload = {
        title: item.title?.trim() || "خبر تکنولوژی",
        slug: cleanSlug,
        summary: item.summary?.trim() || "",
        content: item.content?.trim() || "",
        category: item.category || "gadgets",
        source_name: item.source_name || "Global Tech Wire",
        source_url: item.source_url || "",
        image_url: item.image_url || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200",
        published_at: item.published_at || new Date().toISOString(),
        trending_score: item.trending_score || 95,
        tags: item.tags || ["تکنولوژی", "گجت", "سخت‌افزار"],
        is_published: item.is_published !== false,
      };

      if (supabase) {
        let result: any;
        if (item.id && !item.id.startsWith("temp_") && !item.id.startsWith("news-")) {
          const { data, error } = await supabase
            .from("tech_news")
            .update(payload)
            .eq("id", item.id)
            .select()
            .single();
          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await supabase
            .from("tech_news")
            .insert([payload])
            .select()
            .single();
          if (error) throw error;
          result = data;
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("news_updated", { detail: result }));
        }
        return result as TechNewsItem;
      }

      const localItem: TechNewsItem = {
        ...payload,
        id: item.id || `news_${Date.now()}`,
      };

      if (typeof window !== "undefined") {
        const current = await this.getAll();
        const updated = [localItem, ...current.filter((n) => n.id !== localItem.id)];
        localStorage.setItem(LOCAL_NEWS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("news_updated", { detail: localItem }));
      }
      return localItem;
    } catch (e) {
      console.error("newsService.saveNewsItem Error:", e);
      return null;
    }
  },

  async deleteNewsItem(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("tech_news").delete().eq("id", id);
      }
      if (typeof window !== "undefined") {
        const current = await this.getAll();
        const updated = current.filter((n) => n.id !== id);
        localStorage.setItem(LOCAL_NEWS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("news_updated", { detail: id }));
      }
      return true;
    } catch (e) {
      console.error("newsService.deleteNewsItem Error:", e);
      return false;
    }
  },

  getDefaults(): TechNewsItem[] {
    return [
      {
        id: "news-1",
        title: "رونمایی از تراشه‌های ۳ نانومتری نسل جدید و انقلاب پردازش هوش مصنوعی در گجت‌های ۲۰۲۶",
        slug: "next-gen-3nm-ai-chips-revolution-gadgets-2026",
        summary: "تراشه‌های پردازشی جدید با معماری عصبی بهبودیافته، اجرای مدل‌های مولد محلی را در ساعت‌های هوشمند و لپ‌تاپ‌های حرفه‌ای با یک‌سوم مصرف انرژی محقق ساختند.",
        content: `<h3>تحول پردازش عصبی در لبه شبکه (Edge AI)</h3>
        <p>کمپانی‌های پیشرو در صنعت نیمه‌هادی با رونمایی از سیلیکون‌های اختصاصی نوین، امکان رندر بلادرنگ ۸K و کالیبراسیون سخت‌افزاری نمایشگرها را به صورت مستقیم در مدار داخلی مانیتورها و تبلت‌ها فراهم کردند.</p>`,
        category: "hardware",
        source_name: "The Verge / TechCrunch",
        source_url: "https://theverge.com",
        image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        published_at: new Date().toISOString(),
        trending_score: 99,
        tags: ["هوش مصنوعی", "سخت‌افزار", "چیپست", "گجت"],
        is_published: true,
      },
      {
        id: "news-2",
        title: "کنسول‌ها و مانیتورهای گیمینگ OLED 480Hz با حداقل زمان تاخیر ۰.۰۳ میلی‌ثانیه به بازار آمدند",
        slug: "gaming-oled-480hz-ultra-low-latency-display-monitors",
        summary: "پنل‌های فوق‌سریع QD-OLED با نرخ نوسازی ۴۸۰ هرتز و تفکیک رنگ ۱۰ بیتی استاندارد جدیدی را برای استودیوهای تولید بازی و گیمرهای فوق‌حرفه‌ای به ارمغان آوردند.",
        content: `<h3>دقت بی‌رقیب در صحنه‌های پرتحرک</h3>
        <p>تکنولوژی جدید ضد انعکاس نوری و هیت‌سینک گرافنی اختصاصی، طول عمر پنل‌های OLED را تا دو برابر افزایش داده و از هرگونه افت فریم جلوگیری می‌کند.</p>`,
        category: "gaming",
        source_name: "IGN / Tom's Hardware",
        source_url: "https://ign.com",
        image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200",
        published_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        trending_score: 96,
        tags: ["گیمینگ", "مانیتور", "OLED", "نمایشگر"],
        is_published: true,
      },
      {
        id: "news-3",
        title: "استاندارد شارژ بی‌سیم Qi2 و مگنتیک هوشمند: هماهنگی کامل تمام گجت‌های اپل، سامسونگ و شیائومی",
        slug: "qi2-wireless-charging-magnetic-cross-brand-ecosystem",
        summary: "استاندارد بین‌المللی یکپارچه شارژ سریع بی‌سیم با توان ۲۵ وات به بازار جهانی لوازم جانبی راه یافت و نیاز به کابل‌های مختلف را حذف کرد.",
        content: `<h3>اکوسیستم واحد مغناطیسی</h3>
        <p>با پشتیبانی برندهای اصلی از استاندارد باز Qi2، پاوربانک‌ها، داک‌استیشن‌ها و پایه‌های رومیزی استودیویی به طور هوشمند جریان شارژ بهینه را بر اساس دمای باتری تنظیم می‌کنند.</p>`,
        category: "gadgets",
        source_name: "Wired / CNET",
        source_url: "https://wired.com",
        image_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200",
        published_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        trending_score: 93,
        tags: ["گجت", "شارژر", "لوازم جانبی", "تکنولوژی"],
        is_published: true,
      },
    ];
  },
};
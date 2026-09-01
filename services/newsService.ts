// File Path: services/newsService.ts
import { supabase } from "@/lib/supabase";
import { userBehavior } from "@/lib/userBehavior";

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

const LOCAL_NEWS_KEY = "axon_tech_radar_news_cache_v2026";

export const STATIC_DEFAULT_NEWS: TechNewsItem[] = [
  {
    id: "news-tandem-oled-2026",
    title: "انقلاب پنل‌های تاندم اولد ۲۴۰ هرتز در مانیتورهای ۵K استودیو",
    slug: "tandem-oled-5k-studio-displays-2026",
    summary: "نسل جدید نمایشگرهای تدوین با دو لایه ساطع‌کننده ارگانیک و روشنایی پایدار ۲۰۰۰ نیت بدون خطر برن‌این.",
    content: "<p>فناوری Tandem OLED با افزایش دو برابری طول عمر دیودها و دستیابی به پوشش ۱۰۰٪ گاموت DCI-P3 استاندارد جدیدی در استودیوهای تدوین هالیوودی خلق کرده است.</p>",
    category: "hardware",
    source_name: "DisplayMate",
    image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200",
    published_at: "2026-03-01T08:00:00.000Z",
    trending_score: 99,
    tags: ["مانیتور", "سخت‌افزار", "اولد"],
    is_published: true,
  },
  {
    id: "news-thunderbolt-5-capture",
    title: "معماری تاندربولت ۵ و کارت‌های کپچر ۱۲ بیتی بدون فشرده‌سازی",
    slug: "thunderbolt-5-ultra-capture-cards-8k",
    summary: "پهنای باند ۱۲۰ گیگابیت بر ثانیه برای ضبط همزمان تصاویر 8K 60fps RAW با تاخیر صفر میلی‌ثانیه.",
    content: "<p>با نسل جدید درگاه‌های تاندربولت ۵، استودیوهای پخش زنده و تدوین‌گران رنگ می‌توانند استریم‌های سنگین بدون افت کیفیت فریم را پردازش کنند.</p>",
    category: "gadgets",
    source_name: "AnandTech",
    image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200",
    published_at: "2026-03-01T07:00:00.000Z",
    trending_score: 97,
    tags: ["کپچر", "تاندربولت", "8K"],
    is_published: true,
  },
  {
    id: "news-ai-neural-color",
    title: "کالیبراسیون هوش مصنوعی در چیپست‌های پردازش عصبی تصویر",
    slug: "ai-neural-color-engine-hardware-calibration",
    summary: "موتورهای عصبی کالیبراسیون سخت‌افزاری با خطای رنگی کمتر از ۰.۲ Delta E در DaVinci Resolve.",
    content: "<p>الگوریتم‌های عصبی با رصد لحظه‌ای دمای پنل و شرایط نوری محیط، جدول رنگ ۳D LUT را در کسری از میلی‌ثانیه کالیبره نگه می‌دارند.</p>",
    category: "ai",
    source_name: "The Verge",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    published_at: "2026-03-01T06:00:00.000Z",
    trending_score: 95,
    tags: ["هوش مصنوعی", "رنگ", "داوینچی"],
    is_published: true,
  },
  {
    id: "news-mini-led-32-zones",
    title: "معرفی نمایشگرهای ۳۲ اینچ Mini-LED با ۵۰۰۰ منطقه نوردهی موضعی",
    slug: "mini-led-32-inch-local-dimming-5000-zones",
    summary: "تولید سیاهی عمیق مطلق در سطح OLED همراه با اوج روشنایی ۳۰۰۰ نیت در تدوین محتوای HDR سینمایی.",
    content: "<p>آرایه‌های پرتراکم ال‌ای‌دی‌های میکرومتری پدیده Bloom و هاله نور اطراف متون و سوژه‌های پرنور را کاملاً ریشه‌کن کرده‌اند.</p>",
    category: "hardware",
    source_name: "Tom Hardware",
    image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200",
    published_at: "2026-03-01T05:00:00.000Z",
    trending_score: 93,
    tags: ["مینی ال‌ای‌دی", "HDR", "تدوین"],
    is_published: true,
  },
  {
    id: "news-gan-240w-power",
    title: "استاندارد شارژ سریع ۲۴۰ وات GaN برای استودیوهای سیار تدوین",
    slug: "gan-240w-ultra-power-delivery-studio",
    summary: "تغذیه پایدار همزمان لپ‌تاپ‌های ورک‌استیشن M4 Max و چند مانیتور اکسترنال با آداپتورهای نیترید گالیوم فشرده.",
    content: "<p>کاهش ۶۰ درصدی ابعاد شارژرها و راندمان حرارتی ۹۶ درصدی امکان راه‌اندازی استودیوهای پرتابل تدوین رنگ را تسهیل کرده است.</p>",
    category: "gadgets",
    source_name: "TechPowerUp",
    image_url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200",
    published_at: "2026-03-01T04:00:00.000Z",
    trending_score: 91,
    tags: ["شارژر", "GaN", "سخت‌افزار"],
    is_published: true,
  },
  {
    id: "news-ai-neural-gpu-render",
    title: "ادغام موتورهای رندرینگ هوش مصنوعی با شتاب‌دهنده‌های سخت‌افزاری",
    slug: "ai-neural-rendering-gpu-acceleration-2026",
    summary: "رندر بی‌درنگ پروژه‌های سنگین ویدیو و سه‌بعدی با یک‌سوم مصرف انرژی متداول.",
    content: "<p>هسته‌های پردازش تانسوری با پیش‌بینی مسیر پرتوهای نور رندرینگ خروجی ۸K را در زمان واقعی ممکن ساخته‌اند.</p>",
    category: "ai",
    source_name: "MacRumors",
    image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200",
    published_at: "2026-03-01T03:00:00.000Z",
    trending_score: 89,
    tags: ["رندرینگ", "گرافیک", "هوش مصنوعی"],
    is_published: true,
  },
];

export const newsService = {
  getAllSync(): TechNewsItem[] {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(LOCAL_NEWS_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return STATIC_DEFAULT_NEWS;
  },

  async getAll(): Promise<TechNewsItem[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("tech_news")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false });

        if (!error && data && data.length > 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_NEWS_KEY, JSON.stringify(data));
          }
          return data as TechNewsItem[];
        }
      }
      return this.getAllSync();
    } catch {
      return this.getAllSync();
    }
  },

  async getPersonalizedNews(): Promise<TechNewsItem[]> {
    const all = await this.getAll();
    const topCategory = userBehavior.getTopInterestCategory();

    if (topCategory === "all") return all;

    return [...all].sort((a, b) => {
      const aMatch = a.category.toLowerCase() === topCategory.toLowerCase() ? 1 : 0;
      const bMatch = b.category.toLowerCase() === topCategory.toLowerCase() ? 1 : 0;
      return bMatch - aMatch;
    });
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
          userBehavior.trackNewsRead(data.slug, data.category);
          return data as TechNewsItem;
        }
      }

      const all = await this.getAll();
      const found = all.find((n) => n.slug === slug.trim().toLowerCase()) || null;
      if (found) {
        userBehavior.trackNewsRead(found.slug, found.category);
      }
      return found;
    } catch {
      const all = this.getAllSync();
      return all.find((n) => n.slug === slug.trim().toLowerCase()) || null;
    }
  },

  async saveNewsItem(item: Partial<TechNewsItem>): Promise<TechNewsItem | null> {
    try {
      const cleanSlug = (item.slug || item.title || `news-${Date.now()}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9؀-ۿ]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload = {
        title: item.title?.trim() || "خبر تکنولوژی",
        slug: cleanSlug,
        summary: item.summary?.trim() || "",
        content: item.content?.trim() || "",
        category: item.category || "gadgets",
        source_name: item.source_name || "Global Tech Radar",
        source_url: item.source_url || "",
        image_url: item.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
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
      return null;
    } catch {
      return null;
    }
  },

  async deleteNewsItem(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("tech_news").delete().eq("id", id);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("news_updated", { detail: id }));
      }
      return true;
    } catch {
      return false;
    }
  },
};

export default newsService;

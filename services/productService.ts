"use client";

import { supabase } from "@/lib/supabase";
import { realtimeEngine } from "@/lib/realtimeSync";

export interface ProductVariant {
  id: string;
  name: string;
  colorHex?: string;
  modelType?: string;
  priceDelta?: number;
  stock?: number;
}

export interface MarketBenchmark {
  storeName: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  warranty: string;
  isOurStore?: boolean;
  deliveryTime?: string;
  logo?: string;
}

export interface Product {
  id: string;
  title: string;
  name?: string;
  title_fa?: string;
  sku?: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
  originalPrice?: number;
  stock: number;
  category: string;
  category_id?: string;
  category_name?: string;
  description: string;
  short_description?: string;
  highlights?: string[];
  image: string;
  image_url?: string;
  images: string[];
  variants?: ProductVariant[];
  specs: Record<string, string>;
  warranty?: string;
  badge?: string;
  isAvailable: boolean;
  is_available?: boolean;
  is_featured?: boolean;
  market_comparison?: MarketBenchmark[];
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_PRODUCTS_CACHE = "axon_products_registry_cache_v2026";

export const FLAGSHIP_7_PRODUCTS: Product[] = [
  {
    id: "prod-macbook-pro-m5-max",
    title: "MacBook Pro 16 Inch (Apple M4 Max, 128GB RAM, 2TB SSD)",
    name: "MacBook Pro 16 Inch (Apple M4 Max, 128GB RAM, 2TB SSD)",
    title_fa: "لپ‌تاپ پرچمدار ۱۶ اینچ با تراشه M4 Max، حافظه رم ۱۲۸ گیگابایت و ۲ ترابایت SSD",
    brand: "Apple",
    category: "لپ‌تاپ و اولترابوک",
    price: 310000000,
    discountPrice: 208500000,
    discount_price: 208500000,
    originalPrice: 310000000,
    stock: 8,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی آکسون + مهلت تست ۷ روزه",
    badge: "⚡ ابرقدرت پردازش",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800"
    ],
    description: "ورک‌استیشن پرتابل ۱۶ اینچ با صفحه Liquid Retina XDR، پردازشگر ۱۶ هسته‌ای M4 Max با ۴۰ هسته گرافیکی و پهنای باند حافظه ۵۴۶ گیگابایت بر ثانیه.",
    highlights: [
      "تراشه ۳ نانومتری با ۴۰ هسته گرافیکی",
      "رم یکپارچه ۱۲۸ گیگابایت فوق‌سریع",
      "صفحه نمایش ۱۲۰ هرتز Liquid Retina XDR",
      "باتری با دوام تا ۲۲ ساعت کار مداوم"
    ],
    specs: {
      "پردازنده مرکزی": "Apple M4 Max (16-Core CPU, 40-Core GPU)",
      "حافظه رم": "128GB Unified Memory",
      "حافظه ذخیره‌سازی": "2TB NVMe SSD",
      "نمایشگر": "16.2 Inch Liquid Retina XDR (120Hz ProMotion)"
    }
  },
  {
    id: "prod-studio-display-5k",
    title: "Apple Studio Display 27 Inch 5K Retina (Nano-Texture)",
    name: "Apple Studio Display 27 Inch 5K Retina (Nano-Texture)",
    title_fa: "نمایشگر ۲۷ اینچ ۵K رتینا با شیشه مات نانوتکستچر و کالیبراسیون سخت‌افزاری",
    brand: "Apple",
    category: "صوتی و تصویر",
    price: 135000000,
    discountPrice: 128500000,
    discount_price: 128500000,
    originalPrice: 135000000,
    stock: 6,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی آکسون",
    badge: "🖥️ وضوح شگفت‌انگیز 5K",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"],
    description: "نمایشگر حرفه‌ای ۲۷ اینچ با تفکیک رنگ ۱۰ بیتی، پوشش کامل گاموت DCI-P3، درگاه تاندربولت ۳ و سیستم صوتی ۶ درایور استودیو.",
    highlights: ["پنل 5K رتینا با ۲۱۸ PPI", "پوشش ۹۹.۲٪ گاموت DCI-P3", "شیشه نانوتکستچر ضد انعکاس"],
    specs: { "رزولوشن": "5120 در 2880 پیکسل", "روشنایی": "600 نیت پایدار", "پورت‌ها": "Thunderbolt 3 + USB-C" }
  },
  {
    id: "prod-apple-watch-ultra-3",
    title: "Apple Watch Ultra 2 (Titanium Case, 49mm GPS)",
    name: "Apple Watch Ultra 2 (Titanium Case, 49mm GPS)",
    title_fa: "ساعت هوشمند پرچمدار بدنه تیتانیوم ۴۹ میلی‌متری با روشنایی ۳۰۰۰ نیت",
    brand: "Apple",
    category: "گجت‌های هوشمند",
    price: 58500000,
    discountPrice: 55800000,
    discount_price: 55800000,
    originalPrice: 58500000,
    stock: 12,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی تعویض طلایی شرکتی",
    badge: "🏔️ مقاوم‌ترین ساعت هوشمند",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
    description: "ساعت هوشمند پرچمدار با بدنه تیتانیوم گرید هوافضا، شیشه یاقوت کبود، روشنایی نمایشگر ۳۰۰۰ نیت و مقاومت در برابر آب تا عمق ۱۰۰ متر.",
    highlights: ["روشنایی خیره‌کننده ۳۰۰۰ نیت", "بدنه تیتانیوم گرید ۵", "عمق‌سنج خودکار و آژیر اضطراری"],
    specs: { "جنس بدنه": "Titanium Grade 5", "روشنایی": "3000 Nits OLED", "مقاومت آب": "100 متر (WR100)" }
  },
  {
    id: "prod-ipad-pro-13-m5",
    title: "iPad Pro 13 Inch (Apple M4, Tandem OLED, 256GB)",
    name: "iPad Pro 13 Inch (Apple M4, Tandem OLED, 256GB)",
    title_fa: "تبلت پرچمدار ۱۳ اینچ با نمایشگر Tandem OLED و تراشه M4",
    brand: "Apple",
    category: "گجت‌های هوشمند",
    price: 98500000,
    discountPrice: 94900000,
    discount_price: 94900000,
    originalPrice: 98500000,
    stock: 9,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی",
    badge: "🎨 باریک‌ترین تبلت دنیا",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800"],
    description: "باریک‌ترین دستگاه تاریخ با ضخامت ۵.۱ میلی‌متر، نمایشگر Ultra Retina XDR با دو لایه اولد تاندم و قدرت پردازش تراشه M4.",
    highlights: ["فناوری Tandem OLED", "ضخامت شگفت‌انگیز ۵.۱ میلی‌متر", "پردازنده پرقدرت M4"],
    specs: { "نمایشگر": "13.0 Inch Tandem OLED", "روشنایی": "1600 Nits Peak", "ضخامت": "5.1 میلی‌متر" }
  },
  {
    id: "prod-pro-display-xdr-6k",
    title: "Apple Pro Display XDR 32 Inch 6K Retina (HDR 1600 Nits)",
    name: "Apple Pro Display XDR 32 Inch 6K Retina (HDR 1600 Nits)",
    title_fa: "نمایشگر پرچمدار ۳۲ اینچ ۶K با روشنایی ۱۶۰۰ نیت و کنتراست ۱,۰۰۰,۰۰۰:۱",
    brand: "Apple",
    category: "صوتی و تصویر",
    price: 295000000,
    discountPrice: 279000000,
    discount_price: 279000000,
    originalPrice: 295000000,
    stock: 4,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی تعویض طلایی",
    badge: "💎 استاندارد 6K HDR",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"],
    description: "نمایشگر ۶K حرفه‌ای با ماتریس نوردهی موضعی ۵۷۶ زون، کنتراست ۱,۰۰۰,۰۰۰:۱ و پوشش ۱۰۰٪ فضای رنگی سینمایی.",
    highlights: ["رزولوشن 6K با ۲۰.۴ میلیون پیکسل", "روشنایی ۱۶۰۰ نیت", "کنتراست بی‌نهایت ۱,۰۰۰,۰۰۰:۱"],
    specs: { "رزولوشن": "6016 در 3384 پیکسل", "روشنایی پیک": "1600 نیت", "تعداد زون‌ها": "576 ناحیه مستقل" }
  },
  {
    id: "prod-decklink-8k-pro",
    title: "Blackmagic DeckLink 8K Pro Capture Card",
    name: "Blackmagic DeckLink 8K Pro",
    title_fa: "کارت کپچر و پردازش ویدیویی 8K با درگاه چهارگانه 12G-SDI",
    brand: "Blackmagic Design",
    category: "سخت‌افزار و پردازش",
    price: 68000000,
    discountPrice: 63500000,
    discount_price: 63500000,
    originalPrice: 68000000,
    stock: 5,
    isAvailable: true,
    is_available: true,
    is_featured: false,
    warranty: "۲ سال گارانتی معتبر شرکتی",
    badge: "🎬 پردازش 8K RAW",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
    images: ["https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"],
    description: "کارت کپچر PCIe نسل جدید با پشتیبانی از استریم‌های 8K DCI تا ۶۰ فریم در ثانیه با عمق رنگ ۱۲ بیت RGB 4:4:4.",
    highlights: ["پشتیبانی تا 8K DCI", "چهار پورت دوطرفه 12G-SDI", "رابط PCIe Gen3 x8 با تاخیر صفر"],
    specs: { "رزولوشن کپچر": "8K DCI 60p", "عمق رنگ": "12-Bit RGB 4:4:4", "درگاه‌ها": "4x 12G-SDI" }
  },
  {
    id: "prod-calibrite-colorchecker",
    title: "Calibrite ColorChecker Display Plus Sensor",
    name: "Calibrite ColorChecker Display Plus",
    title_fa: "سنسور کالیبراسیون سخت‌افزاری نمایشگرها تا ۲۰۰۰ نیت",
    brand: "Calibrite",
    category: "هوش مصنوعی و دیجیتال",
    price: 29500000,
    discountPrice: 27800000,
    discount_price: 27800000,
    originalPrice: 29500000,
    stock: 7,
    isAvailable: true,
    is_available: true,
    is_featured: false,
    warranty: "۱ سال گارانتی تعویض شرکتی",
    badge: "🎯 دقت سنجش رنگ",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800",
    images: ["https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800"],
    description: "حسگر کالیبراسیون اپتیکال برای سنجش دقیق نمایشگرهای HDR، OLED و Mini-LED تا روشنایی ۲۰۰۰ نیت.",
    highlights: ["سنجش شدت نور تا ۲۰۰۰ نیت", "فیلتر اپتیکال شیشه‌ای", "سازگار با ویندوز و مک"],
    specs: { "دامنه سنجش": "0.05 تا 2000 cd/m2", "دقت": "Delta E < 0.2", "اتصال": "USB-C" }
  }
];

export function normalizeProduct(p: any): Product {
  if (!p) return FLAGSHIP_7_PRODUCTS[0];

  const matchedFlagship = FLAGSHIP_7_PRODUCTS.find((f) => String(f.id) === String(p.id));

  let price = Number(p.price || 0);
  let discountPrice = p.discountPrice !== undefined ? Number(p.discountPrice) : (p.discount_price !== undefined ? Number(p.discount_price) : undefined);

  if ((!price || price <= 0) && matchedFlagship) {
    price = matchedFlagship.price;
    discountPrice = matchedFlagship.discountPrice;
  }

  const title = (p.title && p.title !== "کالای تکنولوژی") ? p.title : (matchedFlagship?.title || p.name || "کالای تکنولوژی آکسون");

  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (matchedFlagship?.images || [p.image || p.image_url || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"]);

  const stock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 10;
  const isAvailable = p.is_available !== false && p.isAvailable !== false && stock > 0;

  return {
    ...p,
    id: String(p.id),
    title,
    name: title,
    title_fa: p.title_fa || matchedFlagship?.title_fa || "",
    sku: p.sku || `SKU-${String(p.id).slice(-6)}`,
    brand: p.brand || matchedFlagship?.brand || "Apple",
    price: price > 0 ? price : 55800000,
    discountPrice: discountPrice && discountPrice > 0 ? discountPrice : undefined,
    discount_price: discountPrice && discountPrice > 0 ? discountPrice : undefined,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : price,
    stock,
    category: p.category || matchedFlagship?.category || "تکنولوژی",
    description: p.description || matchedFlagship?.description || "تجهیزات تخصصی و گجت‌های نوین با گارانتی اصالت طلایی آکسون",
    short_description: p.short_description || matchedFlagship?.short_description || "",
    highlights: Array.isArray(p.highlights) && p.highlights.length > 0 ? p.highlights : (matchedFlagship?.highlights || []),
    image: images[0],
    image_url: images[0],
    images,
    variants: Array.isArray(p.variants) ? p.variants : [],
    specs: p.specs && typeof p.specs === "object" ? p.specs : (matchedFlagship?.specs || {}),
    warranty: p.warranty || matchedFlagship?.warranty || "۱۸ ماه گارانتی اصالت طلایی آکسون",
    badge: p.badge || matchedFlagship?.badge || "",
    isAvailable,
    is_available: isAvailable,
    is_featured: Boolean(p.is_featured ?? matchedFlagship?.is_featured),
    market_comparison: Array.isArray(p.market_comparison) ? p.market_comparison : [],
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

export const productService = {
  getProductSync(id: string): Product | null {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE);
        if (cached) {
          const list: Product[] = JSON.parse(cached);
          const found = list.find((p) => p.id === id);
          if (found) return normalizeProduct(found);
        }
      } catch {}
    }
    const defaultItem = FLAGSHIP_7_PRODUCTS.find((p) => p.id === id);
    return defaultItem ? normalizeProduct(defaultItem) : null;
  },

  getAllSync(): Product[] {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(normalizeProduct);
          }
        }
      } catch {}
    }
    return FLAGSHIP_7_PRODUCTS.map(normalizeProduct);
  },

  async getAll(): Promise<Product[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const normalized = data.map(normalizeProduct);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(normalized));
          }
          return normalized;
        }
      }
      return this.getAllSync();
    } catch {
      return this.getAllSync();
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return normalizeProduct(data);
        }
      }
      return this.getProductSync(id);
    } catch {
      return this.getProductSync(id);
    }
  },

  async saveProduct(productData: Partial<Product>): Promise<Product | null> {
    try {
      const id = productData.id || `prod_${Date.now()}`;
      const normalized = normalizeProduct({ ...productData, id });

      const dbPayload: any = {
        id: normalized.id,
        title: normalized.title,
        name: normalized.title,
        title_fa: normalized.title_fa || null,
        sku: normalized.sku || null,
        brand: normalized.brand || "Apple",
        price: normalized.price,
        discount_price: normalized.discountPrice || null,
        stock: normalized.stock,
        category: normalized.category,
        description: normalized.description,
        short_description: normalized.short_description || null,
        highlights: normalized.highlights || [],
        image: normalized.image,
        image_url: normalized.image,
        images: normalized.images,
        variants: normalized.variants || [],
        specs: normalized.specs || {},
        warranty: normalized.warranty || null,
        badge: normalized.badge || null,
        is_available: normalized.is_available,
        is_featured: normalized.is_featured,
        market_comparison: normalized.market_comparison || [],
        meta_title: normalized.meta_title || normalized.title,
        meta_description: normalized.meta_description || normalized.short_description || null,
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        await supabase.from("products").upsert(dbPayload, { onConflict: "id" });
      }

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = [normalized, ...all.filter((p) => p.id !== normalized.id)];
        localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(updated));
        realtimeEngine.broadcastLocally("products_updated", updated);
      }

      return normalized;
    } catch (e) {
      console.error("productService.saveProduct error:", e);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("products").delete().eq("id", id);
      }

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = all.filter((p) => p.id !== id);
        localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(updated));
        realtimeEngine.broadcastLocally("products_updated", updated);
      }
      return true;
    } catch (e) {
      console.error("productService.deleteProduct error:", e);
      return false;
    }
  },
};

export default productService;

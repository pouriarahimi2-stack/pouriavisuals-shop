// services/productService.ts
import { supabase } from "@/lib/supabase";

export interface ProductVariant {
  id: string;
  name: string;
  colorHex?: string;
  priceDelta?: number;
  stock?: number;
}

export interface MarketBenchmark {
  storeName: string;
  price: number;
  warranty: string;
  isOurStore?: boolean;
  deliveryTime?: string;
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

const LOCAL_PRODUCTS_CACHE = "PV_STORE_PRODUCTS_CACHE";

export function normalizeProduct(raw: any): Product {
  if (!raw) return {} as Product;

  const id = String(raw.id || `p_${Date.now()}`);
  const title = raw.title || raw.name || "محصول دیجیتال";
  const name = raw.name || title;
  const price = Number(raw.price || 0);
  const discountPrice =
    raw.discountPrice !== undefined && raw.discountPrice !== null
      ? Number(raw.discountPrice)
      : raw.discount_price !== undefined && raw.discount_price !== null
      ? Number(raw.discount_price)
      : undefined;

  let rawImages: string[] = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    rawImages = raw.images.filter((img: any) => typeof img === "string" && img.trim() !== "");
  } else if (raw.image_url) {
    rawImages = [raw.image_url];
  } else if (raw.image) {
    rawImages = [raw.image];
  }

  if (rawImages.length === 0) {
    rawImages = ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=60"];
  }

  const primaryImage = rawImages[0];

  let specsObj: Record<string, string> = {};
  if (raw.specs && typeof raw.specs === "object" && !Array.isArray(raw.specs)) {
    specsObj = raw.specs;
  }

  let variantsList: ProductVariant[] = [];
  if (Array.isArray(raw.variants)) {
    variantsList = raw.variants;
  }

  let highlightsList: string[] = [];
  if (Array.isArray(raw.highlights)) {
    highlightsList = raw.highlights.filter(Boolean);
  } else if (typeof raw.highlights === "string") {
    highlightsList = raw.highlights.split("\n").map((h: string) => h.trim()).filter(Boolean);
  }

  let comparisonList: MarketBenchmark[] = [];
  if (Array.isArray(raw.market_comparison)) {
    comparisonList = raw.market_comparison;
  }

  const isAvail =
    raw.is_available !== false &&
    raw.isAvailable !== false &&
    (raw.stock === undefined || Number(raw.stock) > 0);

  return {
    ...raw,
    id,
    title,
    name,
    title_fa: raw.title_fa || "",
    sku: raw.sku || `SKU-${id.slice(-6)}`,
    brand: raw.brand || "Apple",
    price,
    discountPrice,
    discount_price: discountPrice,
    originalPrice: price,
    stock: raw.stock !== undefined ? Number(raw.stock) : 10,
    category: raw.category || raw.category_name || "کالای دیجیتال",
    category_id: raw.category_id,
    category_name: raw.category || raw.category_name || "کالای دیجیتال",
    description: raw.description || "",
    short_description: raw.short_description || "",
    highlights: highlightsList,
    image: primaryImage,
    image_url: primaryImage,
    images: rawImages,
    variants: variantsList,
    specs: specsObj,
    warranty: raw.warranty || "۱۸ ماه گارانتی اصالت و سلامت فیزیکی",
    badge: raw.badge || (raw.is_featured ? "پیشنهاد ویژه" : ""),
    isAvailable: isAvail,
    is_available: isAvail,
    is_featured: Boolean(raw.is_featured),
    market_comparison: comparisonList,
    meta_title: raw.meta_title || title,
    meta_description: raw.meta_description || raw.description?.slice(0, 150) || "",
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export const productService = {
  getProductSync(id: string): Product | null {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE);
        if (cached) {
          const list: any[] = JSON.parse(cached);
          const found = list.find((p) => String(p.id) === String(id));
          if (found) return normalizeProduct(found);
        }
      } catch {}
    }
    const defaults = this.getDefaultProducts();
    const match = defaults.find((p) => String(p.id) === String(id));
    return match ? normalizeProduct(match) : null;
  },

  getAllSync(): Product[] {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE);
        if (cached) {
          return JSON.parse(cached).map(normalizeProduct);
        }
      } catch {}
    }
    return this.getDefaultProducts().map(normalizeProduct);
  },

  async getAll(): Promise<Product[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(normalizeProduct);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(mapped));
          }
          return mapped;
        }
      }

      return this.getAllSync();
    } catch (e) {
      console.error("productService.getAll error:", e);
      return this.getAllSync();
    }
  },

  async getById(id: string): Promise<Product | null> {
    const instantLocal = this.getProductSync(id);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          const norm = normalizeProduct(data);
          return norm;
        }
      }
      return instantLocal;
    } catch (e) {
      console.error("productService.getById error:", e);
      return instantLocal;
    }
  },

  async saveProduct(p: Partial<Product>): Promise<Product | null> {
    try {
      const normalized = normalizeProduct(p);
      const cleanImages = (normalized.images || []).filter(
        (url) => typeof url === "string" && url.trim().length > 0
      );

      const dbPayload: any = {
        title: normalized.title,
        name: normalized.title,
        title_fa: normalized.title_fa || null,
        sku: normalized.sku,
        brand: normalized.brand,
        price: Number(normalized.price),
        discount_price: normalized.discountPrice !== undefined ? Number(normalized.discountPrice) : null,
        stock: Number(normalized.stock),
        category: normalized.category,
        description: normalized.description,
        short_description: normalized.short_description || null,
        highlights: normalized.highlights,
        image_url: cleanImages[0] || normalized.image,
        image: cleanImages[0] || normalized.image,
        images: cleanImages,
        variants: normalized.variants,
        specs: normalized.specs,
        warranty: normalized.warranty,
        badge: normalized.badge || null,
        is_available: normalized.isAvailable,
        is_featured: normalized.is_featured,
        market_comparison: normalized.market_comparison,
        meta_title: normalized.meta_title,
        meta_description: normalized.meta_description,
        updated_at: new Date().toISOString(),
      };

      let savedData: any = null;

      if (p.id && !p.id.startsWith("temp_") && !p.id.startsWith("p_")) {
        const { data, error } = await supabase
          .from("products")
          .update(dbPayload)
          .eq("id", p.id)
          .select()
          .single();

        if (error) throw error;
        savedData = data;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert([dbPayload])
          .select()
          .single();

        if (error) throw error;
        savedData = data;
      }

      const result = normalizeProduct(savedData || { ...p, ...dbPayload });

      if (typeof window !== "undefined") {
        const currentList = this.getAllSync();
        const updatedList = [
          result,
          ...currentList.filter((item) => String(item.id) !== String(result.id)),
        ];
        localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent("products_updated", { detail: updatedList }));
      }

      return result;
    } catch (err) {
      console.error("productService.saveProduct error:", err);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("products").delete().eq("id", id);
      }

      if (typeof window !== "undefined") {
        const currentList = this.getAllSync();
        const updatedList = currentList.filter((item) => String(item.id) !== String(id));
        localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent("products_updated", { detail: updatedList }));
      }

      return true;
    } catch (err) {
      console.error("productService.deleteProduct error:", err);
      return false;
    }
  },

  getDefaultProducts(): any[] {
    return [
      {
        id: "prod-macbook-pro-m5-max",
        title: 'MacBook Pro 16" (Apple M5 Max, 48GB, 1TB SSD)',
        title_fa: "مک‌بوک پرو ۱۶ اینچ اپل با تراشه M5 Max نسل جدید ۲۰۲۶",
        sku: "SKP-MBP16-M5MAX",
        brand: "Apple",
        price: 215000000,
        discountPrice: 208500000,
        discount_price: 208500000,
        stock: 8,
        category: "لپ‌تاپ و ورک‌استیشن",
        category_name: "لپ‌تاپ و ورک‌استیشن",
        description: "مک‌بوک پرو ۱۶ اینچ با تراشه انقلابی Apple M5 Max استاندارد جدیدی را برای استودیوهای تدوین فیلم و هوش مصنوعی تعریف کرده است.",
        highlights: [
          "تراشه پرچمدار M5 Max با پهنای باند حافظه ۴۰۰GB/s",
          "نمایشگر ۱۶ اینچ Liquid Retina XDR با رفرش‌ریت ۱۲۰Hz ProMotion",
          "۴۸ گیگابایت رم یکپارچه با تاخیر نزدیک به صفر و ۱ ترابایت SSD",
          "شارژدهی بی‌رقیب تا ۲۲ ساعت و پورت تاندربولت ۵"
        ],
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200",
        images: [
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200",
          "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1200"
        ],
        variants: [
          { id: "var-mbp-space-black", name: "مشکی فضایی مات (Space Black)", colorHex: "#1c1c1e", priceDelta: 0, stock: 5 },
          { id: "var-mbp-silver", name: "نقره‌ای کلاسیک (Silver)", colorHex: "#e5e7eb", priceDelta: 0, stock: 3 }
        ],
        specs: {
          "پردازنده مرکزی": "Apple M5 Max (16-Core CPU)",
          "پردازنده گرافیکی": "40-Core GPU",
          "حافظه رم": "۴۸ گیگابایت Unified Memory",
          "حافظه ذخیره‌سازی": "۱ ترابایت SSD",
          "نمایشگر": "۱۶.۲ اینچ Liquid Retina XDR (120Hz)"
        },
        warranty: "۱۸ ماه گارانتی معتبر شرکتی + ۷ روز ضمانت بازگشت وجه",
        badge: "پرچمدار ۲۰۲۶ 🔥",
        is_available: true,
        is_featured: true,
      },
      {
        id: "prod-ipad-pro-13-m5",
        title: 'iPad Pro 13" (Apple M5, Tandem OLED, 256GB Wi-Fi)',
        title_fa: "آیپد پرو ۱۳ اینچ اپل با تراشه M5 و نمایشگر تاندم اولد (Tandem OLED)",
        sku: "SKP-IPAD13-M5",
        brand: "Apple",
        price: 98500000,
        discountPrice: 94900000,
        discount_price: 94900000,
        stock: 12,
        category: "تبلت و نمایشگر همراه",
        category_name: "تبلت و نمایشگر همراه",
        description: "آیپد پرو ۱۳ اینچ با ضخامت ۵.۱ میلی‌متر و نمایشگر Ultra Retina XDR Tandem OLED با روشنایی ۱۶۰۰ نیت.",
        highlights: [
          "نمایشگر خارق‌العاده Tandem OLED Ultra Retina XDR با رفرش‌ریت ۱۲۰Hz",
          "طراحی فوق‌العاده باریک با ضخامت فقط ۵.۱ میلی‌متر",
          "تراشه فوق‌سریع Apple M5 با موتور هوش مصنوعی نسل جدید",
          "پشتیبانی از قلم Apple Pencil Pro"
        ],
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1200",
        images: [
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1200",
          "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=1200"
        ],
        variants: [
          { id: "var-ipad-space-black", name: "مشکی فضایی (Space Black)", colorHex: "#1f2022", priceDelta: 0, stock: 7 },
          { id: "var-ipad-silver", name: "نقره‌ای مات (Silver)", colorHex: "#e2e4e6", priceDelta: 0, stock: 5 }
        ],
        specs: {
          "پردازنده": "Apple M5 (10-Core CPU)",
          "نمایشگر": "۱۳ اینچ Ultra Retina XDR (Tandem OLED)",
          "رزولوشن": "2752x2064 پیکسل",
          "روشنایی": "۱۶۰۰ نیت اوج HDR",
          "ضخامت": "۵.۱ میلی‌متر"
        },
        warranty: "۱۸ ماه گارانتی اصالت طلایی + ۷ روز مهلت تست",
        badge: "پرفروش‌ترین تبلت استودیو ✨",
        is_available: true,
        is_featured: true,
      },
      {
        id: "prod-apple-watch-ultra-3",
        title: "Apple Watch Ultra 3 (Titanium Case, 49mm GPS + Cellular)",
        title_fa: "اپل واچ اولترا ۳ تیتانیومی با اتصال ماهواره‌ای و نمایشگر Micro-OLED",
        sku: "SKP-AW-ULTRA3",
        brand: "Apple",
        price: 58500000,
        discountPrice: 55800000,
        discount_price: 55800000,
        stock: 15,
        category: "ساعت هوشمند و گجت",
        category_name: "ساعت هوشمند و گجت",
        description: "مقاوم‌ترین ساعت ورزشی و ماجراجویی جهان با بدنه تیتانیوم گرید ۵، شیشه یاقوت کبود و نمایشگر ۳۰۰۰ نیتی.",
        highlights: [
          "کیس فوق‌مقاوم تیتانیوم هوانوردی گرید ۵ با استاندارد غواصی EN13319",
          "نمایشگر همیشه روشن با روشنایی فوق‌العاده ۳۰۰۰ نیت و شیشه کریستال یاقوت",
          "سیستم موقعیت‌یابی فرکانس دوگانه فوق‌دقیق L1 و L5",
          "شارژدهی باتری تا ۷۲ ساعت در حالت Low Power Mode"
        ],
        image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1200",
        images: [
          "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1200",
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200"
        ],
        variants: [
          { id: "var-aw-titanium-natural", name: "تیتانیوم طبیعی (Natural Titanium)", colorHex: "#8b8c8d", priceDelta: 0, stock: 9 },
          { id: "var-aw-titanium-black", name: "تیتانیوم مشکی فضایی (Space Black)", colorHex: "#242526", priceDelta: 0, stock: 6 }
        ],
        specs: {
          "جنس کیس": "تیتانیوم گرید ۵ با شیشه یاقوت کبود",
          "سایز ساعت": "۴۹ میلی‌متر",
          "روشنایی": "۳۰۰۰ نیت Always-On",
          "مقاومت در آب": "۱۰۰ متر (استاندارد غواصی WR100)",
          "پردازنده": "Apple S10 SiP 64-bit"
        },
        warranty: "۱۸ ماه گارانتی طلایی اصالت و تست سلامت فیزیکی",
        badge: "مقاوم‌ترین ساعت هوشمند ⚡",
        is_available: true,
        is_featured: true,
      }
    ];
  }
};
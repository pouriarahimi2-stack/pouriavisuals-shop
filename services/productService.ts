// File Path: services/productService.ts
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

const LOCAL_PRODUCTS_CACHE = "axon_products_registry_cache_v2026";

export function normalizeProduct(raw: any): Product {
  if (!raw) return {} as Product;

  const id = String(raw.id || `p_${Date.now()}`);
  const title = raw.title || raw.name || "کالای دیجیتال تخصصی";
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
    rawImages = ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80"];
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
    brand: raw.brand || "Axon Core",
    price,
    discountPrice,
    discount_price: discountPrice,
    originalPrice: price,
    stock: raw.stock !== undefined ? Number(raw.stock) : 10,
    category: raw.category || raw.category_name || "تجهیزات تخصصی",
    category_id: raw.category_id,
    category_name: raw.category || raw.category_name || "تجهیزات تخصصی",
    description: raw.description || "",
    short_description: raw.short_description || "",
    highlights: highlightsList,
    image: primaryImage,
    image_url: primaryImage,
    images: rawImages,
    variants: variantsList,
    specs: specsObj,
    warranty: raw.warranty || "۱۸ ماه گارانتی اصالت طلایی و سلامت فیزیکی",
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
    return null;
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
    return [];
  },

  async getAll(): Promise<Product[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
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
        id: normalized.id,
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

      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .upsert(dbPayload, { onConflict: "id" })
          .select()
          .single();

        if (error) throw error;
        const result = normalizeProduct(data || dbPayload);

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
      }
      return null;
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
};
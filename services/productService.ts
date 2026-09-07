import { supabase } from "@/lib/supabase";

export interface ProductVariant {
  id: string;
  name: string;
  colorHex?: string;
  priceDelta?: number;
}

export interface MarketBenchmark {
  storeName: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
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
  stock?: number;
  is_available?: boolean;
  isAvailable?: boolean;
  is_featured?: boolean;
  category?: string;
  category_name?: string;
  image?: string;
  images?: string[];
  description?: string;
  short_description?: string;
  highlights?: string[];
  warranty?: string;
  badge?: string;
  meta_title?: string;
  meta_description?: string;
  variants?: ProductVariant[];
  specs?: Record<string, string>;
  market_comparison?: MarketBenchmark[];
  created_at?: string;
  updated_at?: string;
}

// آرایه خالی سازگار؛ منبع انحصاری فقط و فقط دیتابیس زنده است
export const FLAGSHIP_7_PRODUCTS: Product[] = [];

export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) return [];

      return data.map((p: any) => ({
        ...p,
        id: String(p.id),
        discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
        isAvailable: p.is_available !== false && (p.stock === null || p.stock === undefined || p.stock > 0),
      }));
    } catch {
      return [];
    }
  },

  getAllSync(): Product[] {
    return [];
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return null;

      return {
        ...data,
        id: String(data.id),
        discountPrice: data.discount_price ? Number(data.discount_price) : undefined,
        isAvailable: data.is_available !== false && (data.stock === null || data.stock === undefined || data.stock > 0),
      };
    } catch {
      return null;
    }
  },

  async saveProduct(product: Partial<Product>): Promise<Product | null> {
    try {
      const payload: Record<string, any> = {
        title: product.title || product.name,
        title_fa: product.title_fa || null,
        sku: product.sku || null,
        brand: product.brand || "Apple",
        category: product.category || "تجهیزات تخصصی",
        price: Number(product.price || 0),
        discount_price: product.discountPrice ? Number(product.discountPrice) : null,
        stock: product.stock !== undefined ? Number(product.stock) : 10,
        is_available: product.isAvailable ?? product.is_available ?? true,
        is_featured: Boolean(product.is_featured),
        image: product.image || (product.images && product.images[0]) || null,
        images: product.images || [],
        description: product.description || null,
        short_description: product.short_description || null,
        highlights: product.highlights || [],
        warranty: product.warranty || "گارانتی اصالت طلایی",
        badge: product.badge || null,
        meta_title: product.meta_title || product.title,
        meta_description: product.meta_description || null,
        variants: product.variants || [],
        specs: product.specs || {},
        market_comparison: product.market_comparison || [],
      };

      if (product.id) {
        const { data, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (e) {
      console.error("Save product error:", e);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  },
};

import { supabase } from "@/lib/supabase";

export interface ProductVariant {
  id: string;
  name: string;
  colorHex?: string;
  priceDelta?: number;
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
  image?: string;
  images?: string[];
  description?: string;
  warranty?: string;
  variants?: ProductVariant[];
  specs?: Record<string, string>;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
}

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
      const generatedId = product.id || ("prod_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7));
      
      const payload: Record<string, any> = {
        id: generatedId,
        title: product.title || product.name,
        title_fa: product.title_fa || null,
        sku: product.sku || null,
        brand: product.brand || "Apple",
        category: product.category || "تجهیزات تخصصی",
        price: Number(product.price || 0),
        discount_price: product.discountPrice ? Number(product.discountPrice) : (product.discount_price ? Number(product.discount_price) : null),
        stock: product.stock !== undefined ? Number(product.stock) : 10,
        is_available: product.isAvailable ?? product.is_available ?? true,
        image: product.image || (product.images && product.images[0]) || null,
        images: product.images || [],
        description: product.description || null,
        warranty: product.warranty || "گارانتی اصالت طلایی",
        variants: product.variants || [],
        specs: product.specs || {},
        meta_title: product.meta_title || product.title,
        meta_description: product.meta_description || null,
      };

      // بررسی وجود رکورد برای تفکیک Update و Insert
      const { data: existing } = await supabase.from("products").select("id").eq("id", generatedId).maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", generatedId)
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
      console.error("Save product error in service:", e);
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

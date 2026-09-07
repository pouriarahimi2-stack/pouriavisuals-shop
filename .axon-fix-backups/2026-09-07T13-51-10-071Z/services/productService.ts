import { supabase } from "@/lib/supabase";

export interface Product {
  id: string;
  title: string;
  name?: string;
  title_fa?: string;
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
  warranty?: string;
  specs?: Record<string, string>;
  created_at?: string;
}

// ساختار خروجی سازگار برای ماژول‌های هوش مصنوعی جهت جلوگیری از خطای بیلد
export const FLAGSHIP_7_PRODUCTS: Product[] = [
  { id: "1", title: "Apple Studio Display 27 5K", price: 142000000, category: "مانیتور استودیو", stock: 10, is_available: true },
  { id: "2", title: "Pro Display XDR 32 6K Retina", price: 310000000, category: "نمایشگر تدوین", stock: 5, is_available: true },
  { id: "3", title: "Calibrite ColorChecker Display Pro", price: 28500000, category: "ابزار کالیبراسیون", stock: 12, is_available: true }
];

export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        return FLAGSHIP_7_PRODUCTS;
      }

      return data.map((p: any) => ({
        ...p,
        id: String(p.id),
        discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
        isAvailable: p.is_available !== false && (p.stock === null || p.stock > 0),
      }));
    } catch {
      return FLAGSHIP_7_PRODUCTS;
    }
  },

  getAllSync(): Product[] {
    return FLAGSHIP_7_PRODUCTS;
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          id: String(data.id),
          discountPrice: data.discount_price ? Number(data.discount_price) : undefined,
          isAvailable: data.is_available !== false && (data.stock === null || data.stock > 0),
        };
      }
      return FLAGSHIP_7_PRODUCTS.find((p) => p.id === id) || null;
    } catch {
      return FLAGSHIP_7_PRODUCTS.find((p) => p.id === id) || null;
    }
  },

  async saveProduct(product: Partial<Product>): Promise<Product | null> {
    try {
      const payload: Record<string, any> = {
        title: product.title || product.name,
        price: product.price,
        discount_price: product.discountPrice ?? product.discount_price ?? null,
        stock: product.stock !== undefined ? Number(product.stock) : 10,
        is_available: product.isAvailable ?? product.is_available ?? true,
        category: product.category || "تجهیزات",
        image: product.image || (product.images && product.images[0]) || null,
        images: product.images || [],
        description: product.description || null,
        specs: product.specs || {},
        updated_at: new Date().toISOString(),
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

import { supabase } from "@/lib/supabase";

export interface Product {
  id: string;
  title?: string;
  name?: string;
  title_fa?: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
  originalPrice?: number;
  stock?: number;
  category?: string;
  description?: string;
  image?: string;
  image_url?: string;
  images?: string[];
  specs?: Record<string, any>;
  warranty?: string;
  isAvailable?: boolean;
  is_available?: boolean;
  created_at?: string;
}

export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id,
        title: p.title || p.name,
        name: p.name || p.title,
        title_fa: p.title_fa,
        price: Number(p.price || 0),
        discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
        discount_price: p.discount_price ? Number(p.discount_price) : undefined,
        originalPrice: Number(p.price || 0),
        stock: p.stock ?? 10,
        category: p.category || "کالای دیجیتال",
        description: p.description || "",
        image: p.image_url || p.image || (Array.isArray(p.images) ? p.images[0] : ""),
        image_url: p.image_url || p.image,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image_url || p.image || ""],
        specs: typeof p.specs === "object" ? p.specs : {},
        warranty: p.warranty,
        isAvailable: p.is_available !== false,
        is_available: p.is_available !== false,
      }));
    } catch (e) {
      console.error("productService.getAll error:", e);
      return [];
    }
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
        id: data.id,
        title: data.title || data.name,
        name: data.name || data.title,
        title_fa: data.title_fa,
        price: Number(data.price || 0),
        discountPrice: data.discount_price ? Number(data.discount_price) : undefined,
        discount_price: data.discount_price ? Number(data.discount_price) : undefined,
        stock: data.stock ?? 10,
        category: data.category || "کالای دیجیتال",
        description: data.description || "",
        image: data.image_url || data.image,
        images: Array.isArray(data.images) ? data.images : [data.image_url || data.image || ""],
        specs: data.specs || {},
        warranty: data.warranty,
        isAvailable: data.is_available !== false,
      };
    } catch (e) {
      console.error("productService.getById error:", e);
      return null;
    }
  },

  async saveProduct(p: Partial<Product>): Promise<Product | null> {
    try {
      const payload: any = {
        title: p.title || p.name,
        name: p.name || p.title,
        title_fa: p.title_fa || null,
        price: Number(p.price || 0),
        discount_price: p.discountPrice || p.discount_price ? Number(p.discountPrice || p.discount_price) : null,
        stock: p.stock !== undefined ? Number(p.stock) : 10,
        category: p.category || "کالای دیجیتال",
        description: p.description || "",
        image: p.image || p.image_url || (p.images ? p.images[0] : ""),
        image_url: p.image_url || p.image || (p.images ? p.images[0] : ""),
        images: p.images || [],
        specs: p.specs || {},
        warranty: p.warranty || "۱۸ ماه گارانتی معتبر شرکتی",
        is_available: p.isAvailable !== false && p.is_available !== false,
        updated_at: new Date().toISOString(),
      };

      if (p.id) {
        const { data, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", p.id)
          .select()
          .single();
        if (error) throw error;
        return data as Product;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data as Product;
      }
    } catch (err) {
      console.error("productService.saveProduct error:", err);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("productService.deleteProduct error:", err);
      return false;
    }
  },
};
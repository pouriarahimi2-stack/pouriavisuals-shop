// File Path: services/productService.ts
import { supabase } from "@/lib/supabase";
import { FLAGSHIP_7_PRODUCTS, Product, ProductVariant, MarketBenchmark } from "@/services/productCatalog";

export type { Product, ProductVariant, MarketBenchmark };
export { FLAGSHIP_7_PRODUCTS };

export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((p: any) => ({
            ...p,
            id: String(p.id),
            price: Number(p.price || 0),
            discountPrice: p.discount_price ? Number(p.discount_price) : (p.discountPrice ? Number(p.discountPrice) : undefined),
            stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 10,
            isAvailable: p.is_available !== false && (p.stock === null || p.stock > 0),
            is_available: p.is_available !== false && (p.stock === null || p.stock > 0),
            images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || "/placeholder.png"],
            image: (Array.isArray(p.images) && p.images[0]) || p.image || "/placeholder.png",
          }));
        }
      }

      return FLAGSHIP_7_PRODUCTS;
    } catch {
      return FLAGSHIP_7_PRODUCTS;
    }
  },

  getAllSync(): Product[] {
    return FLAGSHIP_7_PRODUCTS;
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
          return {
            ...data,
            id: String(data.id),
            price: Number(data.price || 0),
            discountPrice: data.discount_price ? Number(data.discount_price) : (data.discountPrice ? Number(data.discountPrice) : undefined),
            isAvailable: data.is_available !== false && (data.stock === null || data.stock > 0),
            is_available: data.is_available !== false && (data.stock === null || data.stock > 0),
            images: Array.isArray(data.images) && data.images.length > 0 ? data.images : [data.image || "/placeholder.png"],
            image: (Array.isArray(data.images) && data.images[0]) || data.image || "/placeholder.png",
          };
        }
      }
      return FLAGSHIP_7_PRODUCTS.find((p) => p.id === id) || null;
    } catch {
      return FLAGSHIP_7_PRODUCTS.find((p) => p.id === id) || null;
    }
  },

  async saveProduct(product: Partial<Product>): Promise<Product | null> {
    try {
      const pId = product.id || `prod-${Date.now()}`;
      const payload: Record<string, any> = {
        id: pId,
        title: product.title || product.name,
        name: product.title || product.name,
        title_fa: product.title_fa || null,
        sku: product.sku || null,
        brand: product.brand || "Apple",
        price: Number(product.price || 0),
        discount_price: product.discountPrice ?? product.discount_price ?? null,
        stock: product.stock !== undefined ? Number(product.stock) : 10,
        is_available: product.isAvailable ?? product.is_available ?? true,
        category: product.category || "تجهیزات تخصصی",
        image: product.image || (product.images && product.images[0]) || null,
        images: product.images || [],
        description: product.description || null,
        short_description: product.short_description || null,
        highlights: product.highlights || [],
        warranty: product.warranty || "۱۸ ماه گارانتی اصالت طلایی",
        badge: product.badge || null,
        specs: product.specs || {},
        variants: product.variants || [],
        market_comparison: product.market_comparison || [],
        meta_title: product.meta_title || product.title,
        meta_description: product.meta_description || product.description?.slice(0, 140),
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .upsert(payload, { onConflict: "id" })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      return payload as Product;
    } catch (e) {
      console.error("Save product error:", e);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      if (supabase) {
        const { error } = await supabase.from("products").delete().eq("id", id);
        return !error;
      }
      return true;
    } catch {
      return false;
    }
  },
};

export default productService;

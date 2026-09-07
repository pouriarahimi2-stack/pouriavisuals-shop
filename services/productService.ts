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

      if (!error && data) {
        return data.map((p: any) => ({
          ...p,
          id: String(p.id),
          title: p.title || p.name,
          name: p.name || p.title,
          discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
          isAvailable: p.is_available !== false && (p.stock === null || p.stock === undefined || p.stock > 0),
        }));
      }

      const res = await fetch("/api/products", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.map((p: any) => ({
          ...p,
          id: String(p.id),
          title: p.title || p.name,
          name: p.name || p.title,
          discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
          isAvailable: p.is_available !== false && (p.stock === null || p.stock === undefined || p.stock > 0),
        }));
      }

      return [];
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

      if (!error && data) {
        return {
          ...data,
          id: String(data.id),
          title: data.title || data.name,
          name: data.name || data.title,
          discountPrice: data.discount_price ? Number(data.discount_price) : undefined,
          isAvailable: data.is_available !== false && (data.stock === null || data.stock === undefined || data.stock > 0),
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async saveProduct(product: Partial<Product>): Promise<Product | null> {
    const cleanTitle = String(product.title || product.name || "").trim();
    const productId = product.id || ("prod_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7));

    const payload = {
      ...product,
      id: productId,
      name: cleanTitle,
      title: cleanTitle,
    };

    try {
      let saved: any = null;
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        saved = json.data;
      } else {
        const dbPayload: Record<string, any> = {
          id: productId,
          name: cleanTitle,
          title: cleanTitle,
          title_fa: product.title_fa || cleanTitle,
          sku: product.sku || ("SKU-" + productId.slice(-6).toUpperCase()),
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
          meta_title: product.meta_title || cleanTitle,
          meta_description: product.meta_description || null,
        };

        const { data: existing } = await supabase.from("products").select("id").eq("id", productId).maybeSingle();

        if (existing) {
          const { data, error } = await supabase.from("products").update(dbPayload).eq("id", productId).select().single();
          if (!error) saved = data;
        } else {
          dbPayload.created_at = new Date().toISOString();
          const { data, error } = await supabase.from("products").insert([dbPayload]).select().single();
          if (!error) saved = data;
        }
      }

      // انتشار زنده رویداد در مرورگر برای جهش لحظه‌ای ویترین کالاها
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products_updated", { detail: saved }));
      }
      return saved;
    } catch (e) {
      console.error("Save product error:", e);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch("/api/products?id=" + encodeURIComponent(id), { method: "DELETE" });
      const ok = res.ok;
      if (ok && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products_updated", { detail: { id, deleted: true } }));
      }
      return ok;
    } catch {
      return false;
    }
  },
};

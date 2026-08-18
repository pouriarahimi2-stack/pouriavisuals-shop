import { supabase } from "@/lib/supabase";

export interface Product {
  id: string;
  name: string;
  title_fa?: string;
  description?: string;
  price: number;
  original_price?: number;
  originalPrice?: number;
  category?: string;
  category_id?: string;
  image?: string;
  images?: string[];
  stock?: number;
  is_available?: boolean;
  isAvailable?: boolean;
  warranty?: string;
  specs?: Record<string, any>;
  created_at?: string;
}

const STORAGE_KEY = "pouriavisuals_products_cache_v2";

const getChannel = () => {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    return new BroadcastChannel("products_sync_channel");
  }
  return null;
};

export const productService = {
  async getAll(): Promise<Product[]> {
    let localData: Product[] = [];
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          localData = JSON.parse(cached);
        } catch {}
      }
    }

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const formatted: Product[] = data.map((item: any) => ({
            id: String(item.id),
            name: item.name || item.title || "محصول بدون نام",
            title_fa: item.title_fa || item.name_fa || item.name,
            description: item.description || "",
            price: Number(item.price || 0),
            original_price: item.original_price ? Number(item.original_price) : undefined,
            originalPrice: item.original_price ? Number(item.original_price) : undefined,
            category: item.category || item.category_id || "کالای دیجیتال",
            category_id: item.category_id || item.category || "کالای دیجیتال",
            image: item.image || (Array.isArray(item.images) ? item.images[0] : ""),
            images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image || ""].filter(Boolean),
            stock: item.stock !== undefined ? Number(item.stock) : 10,
            is_available: item.is_available !== false,
            isAvailable: item.is_available !== false,
            warranty: item.warranty || "گارانتی اصالت و سلامت فیزیکی",
            specs: item.specs || {},
            created_at: item.created_at,
          }));

          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
          }
          return formatted;
        }
      }
    } catch (e) {
      console.warn("Supabase products fetch warning:", e);
    }

    return localData;
  },

  async getById(id: string): Promise<Product | null> {
    const all = await this.getAll();
    return all.find((p) => String(p.id) === String(id)) || null;
  },

  async getCategories(): Promise<string[]> {
    const all = await this.getAll();
    const cats = new Set<string>();
    all.forEach((p) => {
      if (p.category) cats.add(p.category);
      if (p.category_id) cats.add(p.category_id);
    });
    return Array.from(cats);
  },

  async save(product: Partial<Product>): Promise<{ success: boolean; data?: Product }> {
    const current = await this.getAll();
    const productId = product.id ? String(product.id) : `prod_${Date.now()}`;

    const newProduct: Product = {
      id: productId,
      name: product.name || "محصول جدید",
      title_fa: product.title_fa || product.name,
      description: product.description || "",
      price: Number(product.price || 0),
      original_price: product.original_price ? Number(product.original_price) : undefined,
      category: product.category || product.category_id || "عمومی",
      category_id: product.category_id || product.category || "عمومی",
      image: product.image || (product.images?.[0] ?? ""),
      images: product.images && product.images.length > 0 ? product.images : [product.image ?? ""].filter(Boolean),
      stock: product.stock !== undefined ? Number(product.stock) : 10,
      is_available: product.is_available !== false && (product.stock === undefined || Number(product.stock) > 0),
      warranty: product.warranty || "گارانتی اصالت کالا",
      specs: product.specs || {},
      created_at: product.created_at || new Date().toISOString(),
    };

    const existsIndex = current.findIndex((p) => String(p.id) === String(productId));
    let updatedList: Product[] = [];

    if (existsIndex >= 0) {
      updatedList = [...current];
      updatedList[existsIndex] = newProduct;
    } else {
      updatedList = [newProduct, ...current];
    }

    // ۱. انتشار فوری در کلاینت و کانال همگام‌سازی
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent("products_updated", { detail: updatedList }));
      const channel = getChannel();
      if (channel) {
        channel.postMessage({ type: "SYNC_PRODUCTS", data: updatedList });
      }
    }

    // ۲. ذخیره‌سازی منعطف در Supabase
    try {
      if (supabase) {
        const payload: Record<string, any> = {
          name: newProduct.name,
          title_fa: newProduct.title_fa,
          description: newProduct.description,
          price: newProduct.price,
          original_price: newProduct.original_price,
          category: newProduct.category,
          category_id: newProduct.category_id,
          image: newProduct.image && !newProduct.image.startsWith("data:image/") ? newProduct.image : null,
          images: (newProduct.images || []).filter((img) => !img.startsWith("data:image/")),
          stock: newProduct.stock,
          is_available: newProduct.is_available,
          warranty: newProduct.warranty,
          specs: newProduct.specs,
        };

        if (existsIndex >= 0) {
          await supabase.from("products").update(payload).eq("id", productId);
        } else {
          await supabase.from("products").insert([{ id: productId, ...payload }]);
        }
      }
    } catch (err) {
      console.warn("Supabase product save background:", err);
    }

    return { success: true, data: newProduct };
  },

  async delete(id: string): Promise<boolean> {
    const current = await this.getAll();
    const filtered = current.filter((p) => String(p.id) !== String(id));

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent("products_updated", { detail: filtered }));
      const channel = getChannel();
      if (channel) {
        channel.postMessage({ type: "SYNC_PRODUCTS", data: filtered });
      }
    }

    try {
      if (supabase) {
        await supabase.from("products").delete().eq("id", id);
      }
    } catch (err) {
      console.warn("Supabase product delete background:", err);
    }

    return true;
  },

  async updateStock(id: string, newStock: number): Promise<boolean> {
    const product = await this.getById(id);
    if (!product) return false;

    return (
      await this.save({
        ...product,
        stock: newStock,
        is_available: newStock > 0,
      })
    ).success;
  },
};
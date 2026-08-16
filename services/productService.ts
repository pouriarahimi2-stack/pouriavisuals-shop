import { supabase } from "@/lib/supabase";

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  title_fa?: string;
  price: number;
  original_price?: number;
  originalPrice?: number;
  discount_percent?: number;
  discountPercent?: number;
  category?: string;
  category_id?: string;
  brand?: string;
  image?: string;
  images?: string[];
  colors?: ProductColor[];
  warranty?: string;
  stock?: number;
  description?: string;
  specs?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

const STORAGE_KEY = "site_products_db";
const CATEGORIES_KEY = "site_categories_db";

export const productService = {
  // ۱. دریافت تمامی محصولات از دیتابیس
  async getAll(): Promise<Product[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
          return data;
        }
      }
    } catch (err) {
      console.warn("Supabase products fetch failed:", err);
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local !== null) {
        return JSON.parse(local);
      }
    }
    return [];
  },

  // ۲. دریافت لیست تمامی دسته‌بندی‌ها (حل کننده ارور getCategories)
  async getCategories(): Promise<string[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("categories")
          .select("name, title");

        if (!error && data && data.length > 0) {
          const list = data.map((c: any) => c.title || c.name).filter(Boolean);
          if (typeof window !== "undefined") {
            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list));
          }
          return list;
        }
      }
    } catch (err) {
      console.warn("Supabase categories fetch error:", err);
    }

    if (typeof window !== "undefined") {
      const localCats = localStorage.getItem(CATEGORIES_KEY);
      if (localCats !== null) {
        return JSON.parse(localCats);
      }
    }

    // استخراج داینامیک دسته‌بندی‌ها از محصولات ثبت‌شده در دیتابیس
    const allProds = await this.getAll();
    const extracted = Array.from(
      new Set(allProds.map((p) => p.category || p.category_id).filter(Boolean))
    ) as string[];

    return extracted.length > 0 ? extracted : ["آیفون", "مک‌بوک", "آیپد", "اپل واچ", "ایرپاد", "لوازم جانبی"];
  },

  // ۳. افزودن دسته‌بندی جدید به دیتابیس
  async addCategory(categoryName: string): Promise<boolean> {
    const trimmed = categoryName.trim();
    if (!trimmed) return false;

    try {
      if (supabase) {
        await supabase.from("categories").insert([{ name: trimmed, title: trimmed }]);
      }
    } catch (err) {
      console.warn("Supabase add category error:", err);
    }

    const current = await this.getCategories();
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      if (typeof window !== "undefined") {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
      }
    }
    return true;
  },

  // ۴. حذف دسته‌بندی از دیتابیس
  async deleteCategory(categoryName: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("categories").delete().or(`name.eq.${categoryName},title.eq.${categoryName}`);
      }
    } catch (err) {
      console.warn("Supabase delete category error:", err);
    }

    const current = await this.getCategories();
    const updated = current.filter((c) => c !== categoryName);
    if (typeof window !== "undefined") {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    }
    return true;
  },

  // ۵. دریافت یک محصول با شناسه
  async getById(id: string): Promise<Product | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) return data;
      }
    } catch (err) {
      console.warn("Supabase single product fetch error:", err);
    }

    const all = await this.getAll();
    return all.find((p) => String(p.id) === String(id)) || null;
  },

  // ۶. دریافت محصولات بر اساس دسته‌بندی
  async getByCategory(category: string): Promise<Product[]> {
    const all = await this.getAll();
    if (!category || category === "all" || category === "همه") return all;
    return all.filter((p) => p.category === category || p.category_id === category);
  },

  // ۷. ایجاد و ذخیره محصول جدید در دیتابیس
  async create(product: Product): Promise<{ success: boolean; data?: Product }> {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("products").insert([product]).select();
        if (!error && data && data.length > 0) {
          const current = await this.getAll();
          const updated = [data[0], ...current];
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          }
          return { success: true, data: data[0] };
        }
      }
    } catch (err) {
      console.warn("Supabase insert error:", err);
    }

    const current = await this.getAll();
    const updated = [product, ...current];
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return { success: true, data: product };
  },

  // ۸. ویرایش محصول در دیتابیس
  async update(id: string, updates: Partial<Product>): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("products").update(updates).eq("id", id);
      }
    } catch (err) {
      console.warn("Supabase update error:", err);
    }

    const current = await this.getAll();
    const updated = current.map((p) => (String(p.id) === String(id) ? { ...p, ...updates } : p));
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  },

  // ۹. حذف دائمی محصول از دیتابیس
  async delete(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("products").delete().eq("id", id);
      }
    } catch (err) {
      console.warn("Supabase delete product error:", err);
    }

    const current = await this.getAll();
    const updated = current.filter((p) => String(p.id) !== String(id));
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  },
};
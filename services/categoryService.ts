import { supabase } from "@/lib/supabase";

export interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "آیفون", slug: "iphone", icon: "📱", order: 1, isActive: true },
  { id: "cat-2", name: "مک‌بوک", slug: "macbook", icon: "💻", order: 2, isActive: true },
  { id: "cat-3", name: "ایرپاد", slug: "airpods", icon: "🎧", order: 3, isActive: true },
  { id: "cat-4", name: "اپل‌واچ", slug: "watch", icon: "⌚", order: 4, isActive: true },
  { id: "cat-5", name: "لوازم جانبی", slug: "accessories", icon: "⚡", order: 5, isActive: true },
];

let cachedCategories: Category[] = [];

export const categoryService = {
  // ۱. متد همگام کلاسیک برای سازگاری سریع کامپوننت‌های فرانت
  getCategories(): Category[] {
    if (cachedCategories.length > 0) return cachedCategories;
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("site_categories");
      if (local) {
        try {
          return JSON.parse(local);
        } catch {}
      }
    }
    return DEFAULT_CATEGORIES;
  },

  // ۲. متد زنده برای ارتباط با دیتابیس Supabase
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("order", { ascending: true });

      if (error || !data || data.length === 0) {
        return this.getCategories();
      }

      const formatted: Category[] = data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        slug: item.slug || item.id,
        icon: item.icon || "📁",
        description: item.description || "",
        order: Number(item.order || 0),
        isActive: item.is_active !== undefined ? item.is_active : true,
      }));

      cachedCategories = formatted;
      if (typeof window !== "undefined") {
        localStorage.setItem("site_categories", JSON.stringify(formatted));
      }

      return formatted;
    } catch {
      return this.getCategories();
    }
  },

  // ۳. ایجاد و به‌روزرسانی دسته‌بندی
  async saveCategory(cat: Partial<Category>): Promise<{ success: boolean; error?: string }> {
    try {
      const payload = {
        name: cat.name,
        slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, "-"),
        icon: cat.icon || "📁",
        description: cat.description || "",
        order: Number(cat.order || 1),
        is_active: cat.isActive !== undefined ? cat.isActive : true,
      };

      let error;
      if (cat.id && cat.id.length > 10) {
        const res = await supabase.from("categories").update(payload).eq("id", cat.id);
        error = res.error;
      } else {
        const res = await supabase.from("categories").insert([payload]);
        error = res.error;
      }

      if (error) throw error;
      await this.getAll();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "خطا در ذخیره دسته‌بندی" };
    }
  },

  // ۴. حذف دسته‌بندی
  async deleteCategory(id: string): Promise<{ success: boolean }> {
    try {
      await supabase.from("categories").delete().eq("id", id);
      await this.getAll();
      return { success: true };
    } catch {
      return { success: false };
    }
  },
};
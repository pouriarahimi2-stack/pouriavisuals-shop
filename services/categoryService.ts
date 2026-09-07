import { supabase } from "@/lib/supabase";

export interface Category {
  id: string;
  name: string;
  slug?: string;
  order?: number;
  created_at?: string;
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

      if (error || !data) return [];
      return data.map((c: any) => ({
        ...c,
        id: String(c.id),
      }));
    } catch {
      return [];
    }
  },

  async addCategory(cat: { name: string; slug?: string }): Promise<Category | null> {
    try {
      const cleanName = cat.name.trim();
      const cleanSlug = (cat.slug || cleanName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload: Record<string, any> = {
        name: cleanName,
        slug: cleanSlug,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("categories")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { ...data, id: String(data.id) };
    } catch (e) {
      console.error("Add category error:", e);
      return null;
    }
  },

  async updateCategory(id: string, newName: string): Promise<Category | null> {
    try {
      const cleanName = newName.trim();
      const cleanSlug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // واکشی نام قبلی جهت به‌روزرسانی محصولات متصل
      const { data: oldCat } = await supabase
        .from("categories")
        .select("name")
        .eq("id", id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("categories")
        .update({
          name: cleanName,
          slug: cleanSlug,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // همگام‌سازی نام دسته در جدول محصولات
      if (oldCat?.name) {
        await supabase
          .from("products")
          .update({ category: cleanName })
          .eq("category", oldCat.name);
      }

      return { ...data, id: String(data.id) };
    } catch (e) {
      console.error("Update category error:", e);
      return null;
    }
  },

  async deleteCategory(id: string, catName?: string): Promise<boolean> {
    try {
      // تغییر دسته محصولات وابسته به پیش‌فرض جهت حفظ سلامت داده‌ها
      if (catName) {
        await supabase
          .from("products")
          .update({ category: "تجهیزات عمومی" })
          .eq("category", catName);
      }

      const { error } = await supabase.from("categories").delete().eq("id", id);
      return !error;
    } catch (e) {
      console.error("Delete category error:", e);
      return false;
    }
  },
};

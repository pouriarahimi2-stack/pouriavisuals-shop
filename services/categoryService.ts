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
      // ابتدا از کلاینت سوپابیس
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({ ...c, id: String(c.id) }));
      }

      // در صورت لزوم از روت API
      const res = await fetch("/api/categories", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.map((c: any) => ({ ...c, id: String(c.id) }));
      }
      return [];
    } catch {
      return [];
    }
  },

  async addCategory(cat: { name: string; slug?: string }): Promise<Category | null> {
    const cleanName = cat.name.trim();
    const generatedId = "cat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    try {
      // ۱. ارسال به روت سروری جهت ثبت مطمئن
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: generatedId, name: cleanName }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        return { ...json.data, id: String(json.data.id) };
      }

      // ۲. در صورت در دسترس نبودن API، ثبت مستقیم با ارسال ID
      const { data, error } = await supabase
        .from("categories")
        .insert([{ id: generatedId, name: cleanName }])
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
      const { data, error } = await supabase
        .from("categories")
        .update({ name: cleanName })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, id: String(data.id) };
    } catch (e) {
      console.error("Update category error:", e);
      return null;
    }
  },

  async deleteCategory(id: string, catName?: string): Promise<boolean> {
    try {
      const res = await fetch("/api/categories?id=" + encodeURIComponent(id), { method: "DELETE" });
      if (res.ok) return true;

      const { error } = await supabase.from("categories").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  },
};

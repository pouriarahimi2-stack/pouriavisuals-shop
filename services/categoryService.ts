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

  async addCategory(cat: { name: string }): Promise<Category | null> {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cat.name.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        return { ...json.data, id: String(json.data.id) };
      }
      return null;
    } catch {
      return null;
    }
  },

  async updateCategory(id: string, newName: string): Promise<Category | null> {
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        return { ...json.data, id: String(json.data.id) };
      }
      return null;
    } catch {
      return null;
    }
  },

  async deleteCategory(id: string, catName?: string): Promise<boolean> {
    try {
      let url = "/api/categories?id=" + encodeURIComponent(id);
      if (catName) url += "&name=" + encodeURIComponent(catName);
      const res = await fetch(url, { method: "DELETE" });
      return res.ok;
    } catch {
      return false;
    }
  },
};

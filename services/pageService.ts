import { supabase } from "@/lib/supabase";

export interface PageBlock {
  id: string;
  type: "hero" | "products" | "features" | "faq" | "cta" | "text";
  data: Record<string, any>;
}

export interface CustomPage {
  id?: string;
  title: string;
  slug: string;
  meta_description?: string;
  content: PageBlock[];
  is_published?: boolean;
}

export const pageService = {
  async getAll(): Promise<CustomPage[]> {
    try {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  async getBySlug(slug: string): Promise<CustomPage | null> {
    try {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  },

  async savePage(page: CustomPage): Promise<CustomPage | null> {
    try {
      const payload = {
        title: page.title,
        slug: page.slug,
        meta_description: page.meta_description || null,
        content: page.content || [],
        is_published: page.is_published !== false,
      };

      if (page.id) {
        const { data, error } = await supabase
          .from("site_pages")
          .update(payload)
          .eq("id", page.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("site_pages")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (e) {
      console.error("Save page error:", e);
      return null;
    }
  },

  async deletePage(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("site_pages").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  },
};

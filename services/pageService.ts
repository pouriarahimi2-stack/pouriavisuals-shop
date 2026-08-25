import { supabase } from "@/lib/supabase";

export interface PageBlock {
  id: string;
  type:
    | "hero"
    | "text"
    | "banner"
    | "products"
    | "features"
    | "blogs"
    | "video"
    | "faq"
    | "cta"
    | "testimonials";
  data: Record<string, any>;
}

export interface CustomPage {
  id?: string;
  slug: string;
  title: string;
  meta_description?: string;
  content: PageBlock[];
  is_published?: boolean;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
  };
  created_at?: string;
  updated_at?: string;
}

const LOCAL_KEY = "PV_CUSTOM_PAGES_CACHE";

export const pageService = {
  async getAll(): Promise<CustomPage[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("site_pages")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: CustomPage[] = data.map((d: any) => ({
            id: d.id,
            slug: d.slug,
            title: d.title,
            meta_description: d.meta_description || "",
            content: Array.isArray(d.sections) ? d.sections : (Array.isArray(d.content) ? d.content : []),
            is_published: d.is_published !== false,
            theme: d.theme || {},
            created_at: d.created_at,
            updated_at: d.updated_at,
          }));

          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      }

      if (typeof window !== "undefined") {
        const local = localStorage.getItem(LOCAL_KEY);
        if (local) return JSON.parse(local);
      }

      return [];
    } catch (e) {
      console.error("pageService.getAll Error:", e);
      return [];
    }
  },

  async getBySlug(slug: string): Promise<CustomPage | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("site_pages")
          .select("*")
          .eq("slug", slug.trim().toLowerCase())
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            slug: data.slug,
            title: data.title,
            meta_description: data.meta_description || "",
            content: Array.isArray(data.sections) ? data.sections : (Array.isArray(data.content) ? data.content : []),
            is_published: data.is_published !== false,
            theme: data.theme || {},
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      }

      const all = await this.getAll();
      return all.find((p) => p.slug.toLowerCase() === slug.trim().toLowerCase()) || null;
    } catch (e) {
      console.error("pageService.getBySlug Error:", e);
      return null;
    }
  },

  async savePage(pageData: CustomPage): Promise<CustomPage | null> {
    try {
      const cleanSlug = pageData.slug.trim().toLowerCase().replace(/\s+/g, "-");
      const payload: any = {
        slug: cleanSlug,
        title: pageData.title.trim(),
        meta_description: pageData.meta_description || null,
        sections: pageData.content || [],
        content: pageData.content || [],
        theme: pageData.theme || {},
        is_published: pageData.is_published !== false,
        updated_at: new Date().toISOString(),
      };

      if (pageData.id && !pageData.id.startsWith("temp_")) {
        payload.id = pageData.id;
      }

      if (supabase) {
        const { data, error } = await supabase
          .from("site_pages")
          .upsert(payload, { onConflict: "slug" })
          .select()
          .single();

        if (!error && data) {
          const saved: CustomPage = {
            id: data.id,
            slug: data.slug,
            title: data.title,
            meta_description: data.meta_description,
            content: Array.isArray(data.sections) ? data.sections : (data.content || []),
            is_published: data.is_published,
            theme: data.theme,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };

          if (typeof window !== "undefined") {
            const all = await this.getAll();
            const updatedList = [saved, ...all.filter((p) => p.slug !== saved.slug)];
            localStorage.setItem(LOCAL_KEY, JSON.stringify(updatedList));
            window.dispatchEvent(new CustomEvent("page_structure_updated", { detail: saved }));
          }

          return saved;
        }
      }

      const localPage: CustomPage = {
        ...pageData,
        id: pageData.id || `page_${Date.now()}`,
        slug: cleanSlug,
        updated_at: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updatedList = [localPage, ...all.filter((p) => p.slug !== cleanSlug)];
        localStorage.setItem(LOCAL_KEY, JSON.stringify(updatedList));
      }

      return localPage;
    } catch (e) {
      console.error("pageService.savePage Error:", e);
      return null;
    }
  },

  async deletePage(idOrSlug: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase
          .from("site_pages")
          .delete()
          .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`);
      }

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updatedList = all.filter((p) => p.id !== idOrSlug && p.slug !== idOrSlug);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent("page_deleted", { detail: idOrSlug }));
      }

      return true;
    } catch (e) {
      console.error("pageService.deletePage Error:", e);
      return false;
    }
  },
};

export default pageService;
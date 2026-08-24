import { supabase } from "@/lib/supabase";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  image: string;
  link?: string;
  button_text?: string;
  is_active?: boolean;
}

export const bannerService = {
  async getAll(): Promise<Banner[]> {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching banners from Supabase:", error);
        return [];
      }
      return (data as Banner[]) || [];
    } catch (e) {
      console.error("bannerService getAll error:", e);
      return [];
    }
  },

  async getBanners(): Promise<Banner[]> {
    return this.getAll();
  },

  async getActive(): Promise<Banner[]> {
    return this.getAll();
  }
};
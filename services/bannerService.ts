import { supabase } from "@/lib/supabase";

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badge_text?: string;
  image?: string;
  image_url?: string;
  link?: string;
  link_url?: string;
  button_text?: string;
  buttonText?: string;
  is_active?: boolean;
}

export const bannerService = {
  async getAll(): Promise<Banner[]> {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("id", { ascending: true });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },
};

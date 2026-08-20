import { supabase } from '@/lib/supabase';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  order_index?: number;
  created_at?: string;
}

export const bannerService = {
  async getBanners(): Promise<Banner[]> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as Banner[];
    } catch {
      return [];
    }
  },

  async getAll(): Promise<Banner[]> {
    return this.getBanners();
  },

  async saveBanner(banner: Partial<Banner>): Promise<{ success: boolean; data?: Banner }> {
    try {
      if (banner.id && !banner.id.startsWith('temp-')) {
        const { data, error } = await supabase
          .from('banners')
          .update(banner)
          .eq('id', banner.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } else {
        const { data, error } = await supabase
          .from('banners')
          .insert(banner)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      }
    } catch {
      return { success: false };
    }
  },

  async create(banner: Partial<Banner>) {
    return this.saveBanner(banner);
  },

  async update(id: string, banner: Partial<Banner>) {
    return this.saveBanner({ ...banner, id });
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }
};

export default bannerService;
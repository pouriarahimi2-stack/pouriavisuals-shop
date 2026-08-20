import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at?: string;
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as Category[];
    } catch {
      return [];
    }
  },

  async getAll(): Promise<Category[]> {
    return this.getCategories();
  },

  async saveCategory(category: Partial<Category>): Promise<{ success: boolean; data?: Category }> {
    try {
      if (category.id && !category.id.startsWith('temp-')) {
        const { data, error } = await supabase
          .from('categories')
          .update(category)
          .eq('id', category.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert(category)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      }
    } catch {
      return { success: false };
    }
  },

  async create(category: Partial<Category>) {
    return this.saveCategory(category);
  },

  async update(id: string, category: Partial<Category>) {
    return this.saveCategory({ ...category, id });
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }
};

export default categoryService;
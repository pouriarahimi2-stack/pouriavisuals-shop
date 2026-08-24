import { supabase } from '@/lib/supabase';

export interface Category {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  icon?: string;
  display_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function normalizeCategory(raw: any): Category {
  if (!raw) return {} as Category;
  const name = raw.name || raw.title || 'دسته‌بندی';
  const slug = raw.slug || name.trim().toLowerCase().replace(/\s+/g, '-');
  return {
    ...raw,
    id: raw.id,
    name,
    slug,
    description: raw.description || '',
    image: raw.image || raw.image_url || '',
    image_url: raw.image_url || raw.image || '',
    icon: raw.icon || '🏷️',
    display_order: Number(raw.display_order ?? raw.displayOrder ?? 0),
    is_active: raw.is_active !== undefined ? Boolean(raw.is_active) : true,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export const categoryService = {
  // دریافت تمامی دسته‌بندی‌ها با اولویت چیدمان
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        // فال‌بک هوشمند: استخراج دسته‌بندی‌های منحصربه‌فرد از جدول محصولات در صورت نبود جدول مجزا
        const { data: prods } = await supabase
          .from('products')
          .select('category');

        if (prods && prods.length > 0) {
          const uniqueCats = Array.from(new Set(prods.map((p: any) => p.category).filter(Boolean)));
          return uniqueCats.map((catName, index) => ({
            id: String(index + 1),
            name: catName,
            slug: catName.trim().toLowerCase().replace(/\s+/g, '-'),
            icon: '🏷️',
            display_order: index,
            is_active: true,
          }));
        }
        return [];
      }

      return data.map(normalizeCategory);
    } catch (err) {
      console.error('getAll Categories Exception:', err);
      return [];
    }
  },

  // دریافت یک دسته‌بندی با اسلاگ یا آیدی
  async getBySlug(slug: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) return null;
      return normalizeCategory(data);
    } catch (err) {
      console.error(`getBySlug Exception for ${slug}:`, err);
      return null;
    }
  },

  // ایجاد دسته‌بندی جدید
  async create(categoryData: Partial<Category>): Promise<Category | null> {
    try {
      const name = categoryData.name?.trim() || '';
      const slug = categoryData.slug?.trim() || name.toLowerCase().replace(/\s+/g, '-');

      const payload = {
        name,
        slug,
        description: categoryData.description || '',
        image: categoryData.image || categoryData.image_url || '',
        image_url: categoryData.image_url || categoryData.image || '',
        icon: categoryData.icon || '🏷️',
        display_order: Number(categoryData.display_order ?? 0),
        is_active: categoryData.is_active !== undefined ? Boolean(categoryData.is_active) : true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error.message);
        return null;
      }

      return normalizeCategory(data);
    } catch (err) {
      console.error('create Category Exception:', err);
      return null;
    }
  },

  // به‌روزرسانی دسته‌بندی
  async update(id: string | number, categoryData: Partial<Category>): Promise<Category | null> {
    try {
      const payload: any = {
        ...(categoryData.name && { name: categoryData.name.trim() }),
        ...(categoryData.slug && { slug: categoryData.slug.trim() }),
        ...(categoryData.description !== undefined && { description: categoryData.description }),
        ...(categoryData.image !== undefined && { image: categoryData.image, image_url: categoryData.image }),
        ...(categoryData.image_url !== undefined && { image_url: categoryData.image_url, image: categoryData.image_url }),
        ...(categoryData.icon !== undefined && { icon: categoryData.icon }),
        ...(categoryData.display_order !== undefined && { display_order: Number(categoryData.display_order) }),
        ...(categoryData.is_active !== undefined && { is_active: Boolean(categoryData.is_active) }),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error.message);
        return null;
      }

      return normalizeCategory(data);
    } catch (err) {
      console.error(`update Category Exception for ID ${id}:`, err);
      return null;
    }
  },

  // حذف دسته‌بندی
  async delete(id: string | number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error(`delete Category Exception for ID ${id}:`, err);
      return false;
    }
  },
};
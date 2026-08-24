import { supabase } from '@/lib/supabase';

export interface Product {
  id: string | number;
  name: string;
  title?: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number;
  image: string;
  image_url?: string;
  images?: string[];
  category: string;
  description: string;
  fullDescription?: string;
  features?: string[];
  specs?: Record<string, string>;
  stock: number;
  rating?: number;
  reviewsCount?: number;
  isAvailable?: boolean;
  is_available?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  salesCount?: number;
  created_at?: string;
  updated_at?: string;
}

// لایه تبدیل امن داده‌های دریافتی از دیتابیس به تایپ استاندارد
export function normalizeProduct(raw: any): Product {
  if (!raw) return {} as Product;

  const id = raw.id;
  const name = raw.name || raw.title || 'بدون نام';
  const price = Number(raw.price) || 0;
  const stock = typeof raw.stock === 'number' ? raw.stock : Number(raw.stock) || 0;
  const image = raw.image || raw.image_url || '/placeholder.png';
  const isAvailable = raw.is_available !== undefined ? Boolean(raw.is_available) : (raw.isAvailable !== undefined ? Boolean(raw.isAvailable) : stock > 0);

  return {
    ...raw,
    id,
    name,
    title: name,
    price,
    stock,
    image,
    image_url: image,
    isAvailable,
    is_available: isAvailable,
    category: raw.category || 'عمومی',
    description: raw.description || '',
    features: Array.isArray(raw.features) ? raw.features : [],
    specs: typeof raw.specs === 'object' && raw.specs !== null ? raw.specs : {},
    images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : [image],
  };
}

export const productService = {
  // دریافت لیست تمام محصولات
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error.message);
        return [];
      }

      return (data || []).map(normalizeProduct);
    } catch (err) {
      console.error('getAll Products Exception:', err);
      return [];
    }
  },

  // دریافت یک محصول با آیدی یا اسلاگ
  async getById(id: string | number): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return normalizeProduct(data);
    } catch (err) {
      console.error(`getById Product Exception for ID ${id}:`, err);
      return null;
    }
  },

  // دریافت محصولات بر اساس دسته‌بندی
  async getByCategory(category: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products by category:', error.message);
        return [];
      }

      return (data || []).map(normalizeProduct);
    } catch (err) {
      console.error('getByCategory Exception:', err);
      return [];
    }
  },

  // ثبت محصول جدید
  async create(product: Partial<Product>): Promise<Product | null> {
    try {
      const name = product.name || product.title || '';
      const payload: any = {
        name,
        title: name,
        price: Number(product.price) || 0,
        original_price: product.originalPrice ? Number(product.originalPrice) : null,
        discount_price: product.discountPrice ? Number(product.discountPrice) : null,
        image: product.image || product.image_url || '',
        image_url: product.image || product.image_url || '',
        images: product.images || [],
        category: product.category || 'عمومی',
        description: product.description || '',
        full_description: product.fullDescription || '',
        features: product.features || [],
        specs: product.specs || {},
        stock: Number(product.stock) || 0,
        is_available: product.isAvailable !== undefined ? product.isAvailable : (product.is_available !== undefined ? product.is_available : true),
        is_new: Boolean(product.isNew),
        is_featured: Boolean(product.isFeatured),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error.message);
        return null;
      }

      return normalizeProduct(data);
    } catch (err) {
      console.error('create Product Exception:', err);
      return null;
    }
  },

  // ویرایش محصول
  async update(id: string | number, product: Partial<Product>): Promise<Product | null> {
    try {
      const name = product.name || product.title;
      const payload: any = {
        ...(name && { name, title: name }),
        ...(product.price !== undefined && { price: Number(product.price) }),
        ...(product.originalPrice !== undefined && { original_price: Number(product.originalPrice) }),
        ...(product.discountPrice !== undefined && { discount_price: Number(product.discountPrice) }),
        ...(product.image !== undefined && { image: product.image, image_url: product.image }),
        ...(product.image_url !== undefined && { image: product.image_url, image_url: product.image_url }),
        ...(product.images !== undefined && { images: product.images }),
        ...(product.category !== undefined && { category: product.category }),
        ...(product.description !== undefined && { description: product.description }),
        ...(product.fullDescription !== undefined && { full_description: product.fullDescription }),
        ...(product.features !== undefined && { features: product.features }),
        ...(product.specs !== undefined && { specs: product.specs }),
        ...(product.stock !== undefined && { stock: Number(product.stock) }),
        ...(product.isAvailable !== undefined && { is_available: Boolean(product.isAvailable) }),
        ...(product.is_available !== undefined && { is_available: Boolean(product.is_available) }),
        ...(product.isNew !== undefined && { is_new: Boolean(product.isNew) }),
        ...(product.isFeatured !== undefined && { is_featured: Boolean(product.isFeatured) }),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error.message);
        return null;
      }

      return normalizeProduct(data);
    } catch (err) {
      console.error(`update Product Exception for ID ${id}:`, err);
      return null;
    }
  },

  // حذف محصول
  async delete(id: string | number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error(`delete Product Exception for ID ${id}:`, err);
      return false;
    }
  },

  // ویرایش سریع موجودی انبار
  async updateStock(id: string | number, newStock: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          stock: newStock,
          is_available: newStock > 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating stock:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('updateStock Exception:', err);
      return false;
    }
  },
};
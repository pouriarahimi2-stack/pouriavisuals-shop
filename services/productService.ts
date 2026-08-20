import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  title: string;
  slug?: string;
  price: number;
  discount_price?: number;
  stock: number;
  category_id?: string;
  category_name?: string;
  image?: string;
  images?: string[];
  description?: string;
  features?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  rating?: number;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_PRODUCTS_KEY = 'PV_LOCAL_PRODUCTS_CACHE_V2';
let memoryCache: Product[] | null = null;

export const productService = {
  // ۱. دریافت لیست محصولات با لود فوق‌سریع از کش محلی و سینک همزمان با Supabase
  async getProducts(forceRefresh = false): Promise<Product[]> {
    if (memoryCache && !forceRefresh) {
      return memoryCache;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        throw error || new Error('خطا در دریافت لیست محصولات');
      }

      memoryCache = data as Product[];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(data));
      }
      return memoryCache;
    } catch {
      // استفاده از کش محلی در صورت بروز قطعی اینترنت
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(LOCAL_PRODUCTS_KEY);
        if (local) {
          memoryCache = JSON.parse(local);
          return memoryCache || [];
        }
      }
      return [];
    }
  },

  // ۲. دریافت مشخصات یک محصول براساس ID یا Slug
  async getProductById(idOrSlug: string): Promise<Product | null> {
    if (memoryCache) {
      const found = memoryCache.find(p => p.id === idOrSlug || p.slug === idOrSlug);
      if (found) return found;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .maybeSingle();

      if (error || !data) return null;
      return data as Product;
    } catch {
      return null;
    }
  },

  // ۳. ایجاد یا به‌روزرسانی محصول (پشتیبانی از هر دو نام متد برای کامپوننت‌های ادمین)
  async saveProduct(product: Partial<Product>): Promise<{ success: boolean; data?: Product; error?: string }> {
    try {
      const payload: Record<string, any> = {
        title: product.title,
        price: Number(product.price) || 0,
        discount_price: product.discount_price ? Number(product.discount_price) : null,
        stock: Number(product.stock) || 0,
        category_id: product.category_id || null,
        category_name: product.category_name || '',
        image: product.image || '',
        images: product.images || [],
        description: product.description || '',
        features: product.features || [],
        is_featured: Boolean(product.is_featured),
        is_active: product.is_active !== undefined ? Boolean(product.is_active) : true,
        updated_at: new Date().toISOString(),
      };

      let resultProduct: Product;

      if (product.id && !product.id.startsWith('temp-')) {
        // آپدیت محصول موجود
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id)
          .select()
          .single();

        if (error || !data) throw error || new Error('خطا در به‌روزرسانی محصول');
        resultProduct = data as Product;
      } else {
        // ایجاد محصول جدید
        payload.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();

        if (error || !data) throw error || new Error('خطا در ایجاد محصول جدید');
        resultProduct = data as Product;
      }

      // آپدیت آنی کش رم و لوکال استوریج (Optimistic Update)
      if (memoryCache) {
        const index = memoryCache.findIndex(p => p.id === resultProduct.id);
        if (index > -1) {
          memoryCache[index] = resultProduct;
        } else {
          memoryCache.unshift(resultProduct);
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(memoryCache));
        }
      }

      return { success: true, data: resultProduct };
    } catch (err: any) {
      return { success: false, error: err.message || 'خطا در ذخیره‌سازی محصول' };
    }
  },

  // متدهای همگام‌ساز برای کامپوننت‌هایی که create یا update را جدا صدا می‌زنند
  async createProduct(product: Partial<Product>) {
    return this.saveProduct(product);
  },

  async updateProduct(id: string, product: Partial<Product>) {
    return this.saveProduct({ ...product, id });
  },

  // ۴. حذف آنی محصول
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // حذف از کش داخلی به صورت آنی
      if (memoryCache) {
        memoryCache = memoryCache.filter(p => p.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(memoryCache));
        }
      }

      return true;
    } catch {
      return false;
    }
  },

  // ۵. به‌روزرسانی موجودی انبار (Inventory Sync)
  async updateStock(productId: string, newStock: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: Math.max(0, newStock), updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      if (memoryCache) {
        const target = memoryCache.find(p => p.id === productId);
        if (target) target.stock = Math.max(0, newStock);
      }

      return true;
    } catch {
      return false;
    }
  }
};
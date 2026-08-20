import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  title: string;
  slug?: string;
  price: number;
  discount_price?: number;
  discountPrice?: number;
  stock: number;
  category_id?: string;
  category_name?: string;
  category?: string;
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
  // دریافت لیست محصولات با لود سریع
  async getProducts(forceRefresh = false): Promise<Product[]> {
    if (memoryCache && !forceRefresh) {
      return memoryCache;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) throw error;

      memoryCache = (data as any[]).map(p => ({
        ...p,
        discountPrice: p.discount_price ?? p.discountPrice,
        category: p.category_name ?? p.category,
      }));

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(memoryCache));
      }
      return memoryCache;
    } catch {
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

  // متدهای همگام‌ساز (سازگار با صدا زدن‌های getAll و fetchAll در کامپوننت‌های ادمین)
  async getAll(): Promise<Product[]> {
    return this.getProducts();
  },

  async fetchProducts(): Promise<Product[]> {
    return this.getProducts();
  },

  // دریافت یک محصول
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
      return {
        ...data,
        discountPrice: data.discount_price ?? data.discountPrice,
        category: data.category_name ?? data.category,
      } as Product;
    } catch {
      return null;
    }
  },

  async getById(id: string): Promise<Product | null> {
    return this.getProductById(id);
  },

  // ایجاد یا ویرایش محصول با اعمال آنی (Optimistic UI)
  async saveProduct(product: Partial<Product>): Promise<{ success: boolean; data?: Product; error?: string }> {
    try {
      const payload: Record<string, any> = {
        title: product.title,
        price: Number(product.price) || 0,
        discount_price: product.discount_price !== undefined ? Number(product.discount_price) : (product.discountPrice !== undefined ? Number(product.discountPrice) : null),
        stock: Number(product.stock) || 0,
        category_id: product.category_id || null,
        category_name: product.category_name || product.category || '',
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
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id)
          .select()
          .single();

        if (error || !data) throw error;
        resultProduct = data as Product;
      } else {
        payload.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();

        if (error || !data) throw error;
        resultProduct = data as Product;
      }

      // به‌روزرسانی کش کلاینت
      if (memoryCache) {
        const index = memoryCache.findIndex(p => p.id === resultProduct.id);
        if (index > -1) {
          memoryCache[index] = { ...resultProduct, discountPrice: resultProduct.discount_price, category: resultProduct.category_name };
        } else {
          memoryCache.unshift({ ...resultProduct, discountPrice: resultProduct.discount_price, category: resultProduct.category_name });
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

  async create(product: Partial<Product>) {
    return this.saveProduct(product);
  },

  async createProduct(product: Partial<Product>) {
    return this.saveProduct(product);
  },

  async update(id: string, product: Partial<Product>) {
    return this.saveProduct({ ...product, id });
  },

  async updateProduct(id: string, product: Partial<Product>) {
    return this.saveProduct({ ...product, id });
  },

  // حذف محصول
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

  async delete(id: string): Promise<boolean> {
    return this.deleteProduct(id);
  },

  // آپدیت موجودی
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

export default productService;
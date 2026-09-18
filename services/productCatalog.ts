// File Path: services/productCatalog.ts
export interface ProductVariant {
  id: string;
  name: string;
  colorHex?: string;
  modelType?: string;
  priceDelta?: number;
  stock?: number;
}

export interface MarketBenchmark {
  storeName: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  warranty: string;
  isOurStore?: boolean;
  deliveryTime?: string;
  logo?: string;
}

export interface Product {
  id: string;
  title: string;
  name?: string;
  title_fa?: string;
  sku?: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
  originalPrice?: number;
  stock: number;
  category: string;
  category_id?: string;
  category_name?: string;
  description: string;
  short_description?: string;
  highlights?: string[];
  image: string;
  image_url?: string;
  images: string[];
  variants?: ProductVariant[];
  specs: Record<string, string>;
  warranty?: string;
  badge?: string;
  isAvailable: boolean;
  is_available?: boolean;
  is_featured?: boolean;
  market_comparison?: MarketBenchmark[];
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

export const FLAGSHIP_7_PRODUCTS: Product[] = [
  {
    id: "steamer-180-pro",
    title: "اتوبخار پرتابل هوشمند با چرخش ۱۸۰ درجه",
    title_fa: "اتوبخار مسافرتی و خانگی ۱۲۰۰ وات ۶ حالته",
    category: "اتوبخار و لوازم خانگی",
    price: 2450000,
    discountPrice: 1980000,
    discount_price: 1980000,
    stock: 25,
    isAvailable: true,
    is_available: true,
    warranty: "۱۲ ماه گارانتی سلامت فیزیکی و اصالت",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800",
    image_url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800",
    images: ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800"],
    short_description: "اتوبخار دستی دوکاره با توان ۱۲۰۰ وات، مخزن ۱۲۰ میلی‌لیتر و ۶ حالت تنظیم هوشمند بخار.",
    description: "اتوبخار هوشمند با چرخش ۱۸۰ درجه، کنترل دقیق دما و تنظیم بخار برای انواع پارچه‌های ابریشم، نخ و کتان بدون آسیب‌دیدگی.",
    specs: {
      "توان مصرفی": "1200W",
      "ظرفیت مخزن آب": "120 میلی‌لیتر",
      "زاویه چرخش دسته": "۱۸۰ درجه انعطاف‌پذیر",
      "نحوه عملکرد": "دوکاره (اتوکشی افقی + بخاردهی عمودی)",
      "تعداد حالات بخار": "۶ حالت هوشمند دیجیتال",
      "ابعاد دستگاه": "184 × 70 × 98 میلی‌متر"
    }
  },];

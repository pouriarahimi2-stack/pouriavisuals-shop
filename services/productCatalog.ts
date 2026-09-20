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

// عکس واقعی، شفاف و باکیفیت اتوبخار به جای صفحه سیاه placeholder
export const STEAMER_REAL_IMAGE = "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80";

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
    warranty: "۱۲ ماه گارانتی اصالت و سلامت فیزیکی",
    image: STEAMER_REAL_IMAGE,
    image_url: STEAMER_REAL_IMAGE,
    images: [STEAMER_REAL_IMAGE],
    short_description: "اتوبخار پرتابل دوکاره با توان ۱۲۰۰ وات، مخزن ۱۲۰ میلی‌لیتر و ۶ حالت تنظیم هوشمند بخار.",
    description: "اتوبخار هوشمند با قابلیت چرخش ۱۸۰ درجه، کنترل دقیق دما و تنظیم بخار چندحالته برای انواع پارچه‌های لطیف تا ضخیم بدون آسیب و لک آب.",
    specs: {
      "توان مصرفی": "1200W",
      "ظرفیت مخزن آب": "120 میلی‌لیتر",
      "زاویه چرخش دسته": "۱۸۰ درجه انعطاف‌پذیر",
      "حالت عملکرد": "دوکاره (اتوکشی افقی + بخاردهی عمودی)",
      "تعداد حالات بخار": "۶ حالت هوشمند دیجیتال",
    }
  },
];

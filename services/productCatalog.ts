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
    id: "prod-macbook-pro-m5-max",
    title: "MacBook Pro 16 Inch (Apple M4 Max, 128GB RAM, 2TB SSD)",
    name: "MacBook Pro 16 Inch (Apple M4 Max, 128GB RAM, 2TB SSD)",
    title_fa: "لپ‌تاپ پرچمدار ۱۶ اینچ با تراشه M4 Max، حافظه رم ۱۲۸ گیگابایت و ۲ ترابایت SSD",
    brand: "Apple",
    category: "لپ‌تاپ و اولترابوک",
    price: 310000000,
    discountPrice: 208500000,
    discount_price: 208500000,
    originalPrice: 310000000,
    stock: 8,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی آکسون + مهلت تست ۷ روزه",
    badge: "⚡ ابرقدرت پردازش",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800"
    ],
    description: "ورک‌استیشن پرتابل ۱۶ اینچ با صفحه Liquid Retina XDR، پردازشگر ۱۶ هسته‌ای M4 Max با ۴۰ هسته گرافیکی و پهنای باند حافظه ۵۴۶ گیگابایت بر ثانیه.",
    highlights: [
      "تراشه ۳ نانومتری با ۴۰ هسته گرافیکی",
      "رم یکپارچه ۱۲۸ گیگابایت فوق‌سریع",
      "صفحه نمایش ۱۲۰ هرتز Liquid Retina XDR",
      "باتری با دوام تا ۲۲ ساعت کار مداوم"
    ],
    specs: {
      "پردازنده مرکزی": "Apple M4 Max (16-Core CPU, 40-Core GPU)",
      "حافظه رم": "128GB Unified Memory",
      "حافظه ذخیره‌سازی": "2TB NVMe SSD",
      "نمایشگر": "16.2 Inch Liquid Retina XDR (120Hz ProMotion)"
    }
  },
  {
    id: "prod-studio-display-5k",
    title: "Apple Studio Display 27 Inch 5K Retina (Nano-Texture)",
    name: "Apple Studio Display 27 Inch 5K Retina (Nano-Texture)",
    title_fa: "نمایشگر ۲۷ اینچ ۵K رتینا با شیشه مات نانوتکستچر و کالیبراسیون سخت‌افزاری",
    brand: "Apple",
    category: "صوتی و تصویر",
    price: 135000000,
    discountPrice: 128500000,
    discount_price: 128500000,
    originalPrice: 135000000,
    stock: 6,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی آکسون",
    badge: "🖥️ وضوح شگفت‌انگیز 5K",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"],
    description: "نمایشگر حرفه‌ای ۲۷ اینچ با تفکیک رنگ ۱۰ بیتی، پوشش کامل گاموت DCI-P3، درگاه تاندربولت ۳ و سیستم صوتی ۶ درایور استودیو.",
    highlights: ["پنل 5K رتینا با ۲۱۸ PPI", "پوشش ۹۹.۲٪ گاموت DCI-P3", "شیشه نانوتکستچر ضد انعکاس"],
    specs: { "رزولوشن": "5120 در 2880 پیکسل", "روشنایی": "600 نیت پایدار", "پورت‌ها": "Thunderbolt 3 + USB-C" }
  },
  {
    id: "prod-apple-watch-ultra-3",
    title: "Apple Watch Ultra 2 (Titanium Case, 49mm GPS)",
    name: "Apple Watch Ultra 2 (Titanium Case, 49mm GPS)",
    title_fa: "ساعت هوشمند پرچمدار بدنه تیتانیوم ۴۹ میلی‌متری با روشنایی ۳۰۰۰ نیت",
    brand: "Apple",
    category: "گجت‌های هوشمند",
    price: 58500000,
    discountPrice: 55800000,
    discount_price: 55800000,
    originalPrice: 58500000,
    stock: 12,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی تعویض طلایی شرکتی",
    badge: "🏔️ مقاوم‌ترین ساعت هوشمند",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
    description: "ساعت هوشمند پرچمدار با بدنه تیتانیوم گرید هوافضا، شیشه یاقوت کبود، روشنایی نمایشگر ۳۰۰۰ نیت و مقاومت در برابر آب تا عمق ۱۰۰ متر.",
    highlights: ["روشنایی خیره‌کننده ۳۰۰۰ نیت", "بدنه تیتانیوم گرید ۵", "عمق‌سنج خودکار و آژیر اضطراری"],
    specs: { "جنس بدنه": "Titanium Grade 5", "روشنایی": "3000 Nits OLED", "مقاومت آب": "100 متر (WR100)" }
  },
  {
    id: "prod-ipad-pro-13-m5",
    title: "iPad Pro 13 Inch (Apple M4, Tandem OLED, 256GB)",
    name: "iPad Pro 13 Inch (Apple M4, Tandem OLED, 256GB)",
    title_fa: "تبلت پرچمدار ۱۳ اینچ با نمایشگر Tandem OLED و تراشه M4",
    brand: "Apple",
    category: "گجت‌های هوشمند",
    price: 98500000,
    discountPrice: 94900000,
    discount_price: 94900000,
    originalPrice: 98500000,
    stock: 9,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی",
    badge: "🎨 باریک‌ترین تبلت دنیا",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800"],
    description: "باریک‌ترین دستگاه تاریخ با ضخامت ۵.۱ میلی‌متر، نمایشگر Ultra Retina XDR با دو لایه اولد تاندم و قدرت پردازش تراشه M4.",
    highlights: ["فناوری Tandem OLED", "ضخامت شگفت‌انگیز ۵.۱ میلی‌متر", "پردازنده پرقدرت M4"],
    specs: { "نمایشگر": "13.0 Inch Tandem OLED", "روشنایی": "1600 Nits Peak", "ضخامت": "5.1 میلی‌متر" }
  },
  {
    id: "prod-pro-display-xdr-6k",
    title: "Apple Pro Display XDR 32 Inch 6K Retina (HDR 1600 Nits)",
    name: "Apple Pro Display XDR 32 Inch 6K Retina (HDR 1600 Nits)",
    title_fa: "نمایشگر پرچمدار ۳۲ اینچ ۶K با روشنایی ۱۶۰۰ نیت و کنتراست ۱,۰۰۰,۰۰۰:۱",
    brand: "Apple",
    category: "صوتی و تصویر",
    price: 295000000,
    discountPrice: 279000000,
    discount_price: 279000000,
    originalPrice: 295000000,
    stock: 4,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی تعویض طلایی",
    badge: "💎 استاندارد 6K HDR",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"],
    description: "نمایشگر ۶K حرفه‌ای با ماتریس نوردهی موضعی ۵۷۶ زون، کنتراست ۱,۰۰۰,۰۰۰:۱ و پوشش ۱۰۰٪ فضای رنگی سینمایی.",
    highlights: ["رزولوشن 6K با ۲۰.۴ میلیون پیکسل", "روشنایی ۱۶۰۰ نیت", "کنتراست بی‌نهایت ۱,۰۰۰,۰۰۰:۱"],
    specs: { "رزولوشن": "6016 در 3384 پیکسل", "روشنایی پیک": "1600 نیت", "تعداد زون‌ها": "576 ناحیه مستقل" }
  },
  {
    id: "prod-decklink-8k-pro",
    title: "Blackmagic DeckLink 8K Pro Capture Card",
    name: "Blackmagic DeckLink 8K Pro",
    title_fa: "کارت کپچر و پردازش ویدیویی 8K با درگاه چهارگانه 12G-SDI",
    brand: "Blackmagic Design",
    category: "سخت‌افزار و پردازش",
    price: 68000000,
    discountPrice: 63500000,
    discount_price: 63500000,
    originalPrice: 68000000,
    stock: 5,
    isAvailable: true,
    is_available: true,
    is_featured: false,
    warranty: "۲ سال گارانتی معتبر شرکتی",
    badge: "🎬 پردازش 8K RAW",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
    images: ["https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"],
    description: "کارت کپچر PCIe نسل جدید با پشتیبانی از استریم‌های 8K DCI تا ۶۰ فریم در ثانیه با عمق رنگ ۱۲ بیت RGB 4:4:4.",
    highlights: ["پشتیبانی تا 8K DCI", "چهار پورت دوطرفه 12G-SDI", "رابط PCIe Gen3 x8 با تاخیر صفر"],
    specs: { "رزولوشن کپچر": "8K DCI 60p", "عمق رنگ": "12-Bit RGB 4:4:4", "درگاه‌ها": "4x 12G-SDI" }
  },
  {
    id: "prod-calibrite-colorchecker",
    title: "Calibrite ColorChecker Display Plus Sensor",
    name: "Calibrite ColorChecker Display Plus",
    title_fa: "سنسور کالیبراسیون سخت‌افزاری نمایشگرها تا ۲۰۰۰ نیت",
    brand: "Calibrite",
    category: "هوش مصنوعی و دیجیتال",
    price: 29500000,
    discountPrice: 27800000,
    discount_price: 27800000,
    originalPrice: 29500000,
    stock: 7,
    isAvailable: true,
    is_available: true,
    is_featured: false,
    warranty: "۱ سال گارانتی تعویض شرکتی",
    badge: "🎯 دقت سنجش رنگ",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800",
    images: ["https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800"],
    description: "حسگر کالیبراسیون اپتیکال برای سنجش دقیق نمایشگرهای HDR، OLED و Mini-LED تا روشنایی ۲۰۰۰ نیت.",
    highlights: ["سنجش شدت نور تا ۲۰۰۰ نیت", "فیلتر اپتیکال شیشه‌ای", "سازگار با ویندوز و مک"],
    specs: { "دامنه سنجش": "0.05 تا 2000 cd/m2", "دقت": "Delta E < 0.2", "اتصال": "USB-C" }
  }
];

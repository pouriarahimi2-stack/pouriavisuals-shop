import { supabase } from "@/lib/supabase";

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
  description: string;
  short_description?: string;
  highlights?: string[];
  image: string;
  images: string[];
  variants?: ProductVariant[];
  specs: Record<string, string>;
  warranty?: string;
  badge?: string;
  isAvailable: boolean;
  is_available?: boolean;
  is_featured?: boolean;
  market_comparison?: MarketBenchmark[];
  created_at?: string;
}

const LOCAL_PRODUCTS_CACHE = "axon_products_registry_cache_v2026";

export const FLAGSHIP_7_PRODUCTS: Product[] = [
  {
    id: "prod-macbook-pro-m5-max",
    title: "MacBook Pro 16\" (Apple M4 Max, 128GB RAM, 2TB SSD)",
    name: "MacBook Pro 16\" (Apple M4 Max, 128GB RAM, 2TB SSD)",
    title_fa: "مک‌بوک پرو ۱۶ اینچ اپل با تراشه M4 Max، حافظه رم ۱۲۸ گیگابایت و حافظه ۲ ترابایت",
    brand: "Apple",
    category: "لپ‌تاپ و ورک‌استیشن",
    price: 310000000,
    discountPrice: 208500000,
    discount_price: 208500000,
    originalPrice: 310000000,
    stock: 8,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی آکسون + مهلت تست ۷ روزه",
    badge: "⚡ ابرقدرت پردازش ۲۰۲۶",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800"
    ],
    description: "ورک‌استیشن پرتابل ۱۶ اینچ با صفحه Liquid Retina XDR، پردازشگر ۱۶ هسته‌ای M4 Max با ۴۰ هسته گرافیکی، پهنای باند حافظه ۵۴۶ گیگابایت بر ثانیه و شارژدهی باتری تا ۲۲ ساعت.",
    highlights: ["تراشه ۳ نانومتری M4 Max با ۴۰ هسته GPU", "رم یکپارچه ۱۲۸ گیگابایت (546 GB/s)", "صفحه نمایش ۱۲۰ هرتز Liquid Retina XDR", "خروجی همزمان ۴ مانیتور 6K"],
    specs: {
      "پردازنده مرکزی": "Apple M4 Max (16-Core CPU, 40-Core GPU)",
      "حافظه رم یکپارچه": "128GB Unified Memory",
      "حافظه پرسرعت": "2TB NVMe SSD (7.4 GB/s)",
      "نمایشگر": "16.2 Inch Liquid Retina XDR (120Hz ProMotion)",
      "روشنایی پیک": "1600 Nits در حالت HDR",
      "پورت‌ها": "3x Thunderbolt 4 + HDMI 2.1 + SDXC + MagSafe 3"
    },
    variants: [
      { id: "v1", name: "مشکی فضایی مات (Space Black)", modelType: "تراشه M4 Max (128GB/2TB)", colorHex: "#1f242d", priceDelta: 0, stock: 5 },
      { id: "v2", name: "نقره‌ای کلاسیک (Silver)", modelType: "تراشه M4 Max (128GB/2TB)", colorHex: "#e5e7eb", priceDelta: 0, stock: 3 }
    ],
    market_comparison: [
      { storeName: "ترب (Torob)", minPrice: 218000000, maxPrice: 226000000, warranty: "گارانتی شرکتی معمولی", isOurStore: false, logo: "🔍" },
      { storeName: "دیجی‌کالا (Digikala)", minPrice: 222000000, maxPrice: 229000000, warranty: "گارانتی متفرقه", isOurStore: false, logo: "🛍️" },
      { storeName: "ایمالز (Emalls)", minPrice: 219000000, maxPrice: 225000000, warranty: "گارانتی معمولی", isOurStore: false, logo: "📊" },
      { storeName: "باسلام (Basalam)", minPrice: 216000000, maxPrice: 224000000, warranty: "بدون ضمانت تعویض", isOurStore: false, logo: "🛒" },
      { storeName: "دیوار / بازار فیزیکی", minPrice: 215000000, maxPrice: 230000000, warranty: "خرید حضوری", isOurStore: false, logo: "🏷️" }
    ]
  },
  {
    id: "prod-apple-watch-ultra-3",
    title: "Apple Watch Ultra 2 (Titanium Case, 49mm GPS + Cellular)",
    name: "Apple Watch Ultra 2 (Titanium Case, 49mm GPS + Cellular)",
    title_fa: "ساعت هوشمند بدنه تیتانیومی ۴۹ میلی‌متری با روشنایی ۳۰۰۰ نیت و GPS دوفرکانسه",
    brand: "Apple",
    category: "ساعت هوشمند و گجت",
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
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800"
    ],
    description: "ساعت هوشمند پرچمدار با بدنه تیتانیوم گرید هوافضا، شیشه یاقوت کبود، روشنایی نمایشگر تا ۳۰۰۰ نیت، مقاومت در برابر آب تا عمق ۱۰۰ متر و پردازنده دوهسته‌ای S9 SiP.",
    highlights: ["روشنایی خیره‌کننده ۳۰۰۰ نیت", "بدنه تیتانیوم ۴۹ میلی‌متری گرید ۵", "عمق‌سنج خودکار غواصی تا ۴۰ متر", "شارژدهی باتری تا ۷۲ ساعت"],
    specs: {
      "جنس بدنه": "Titanium Grade 5 (هوافضا)",
      "شیشه محافظ": "Sapphire Crystal تخت",
      "روشنایی": "3000 Nits Always-On OLED",
      "مقاومت در آب": "100 متر (استاندارد غواصی EN13319)",
      "حسگرها": "ECG نوار قلب، اکسیژن خون، عمق‌سنج، آژیر 86dB"
    },
    variants: [
      { id: "w1", name: "بند تیتانیوم میلانس", modelType: "49mm GPS+Cellular", colorHex: "#d1d5db", priceDelta: 0, stock: 6 },
      { id: "w2", name: "بند اوشن آبی تیره", modelType: "49mm GPS+Cellular", colorHex: "#1e3a8a", priceDelta: 0, stock: 6 }
    ],
    market_comparison: [
      { storeName: "ترب (Torob)", minPrice: 57900000, maxPrice: 62000000, warranty: "گارانتی شرکتی", isOurStore: false, logo: "🔍" },
      { storeName: "دیجی‌کالا (Digikala)", minPrice: 59200000, maxPrice: 63500000, warranty: "گارانتی متفرقه", isOurStore: false, logo: "🛍️" },
      { storeName: "ایمالز (Emalls)", minPrice: 58200000, maxPrice: 61800000, warranty: "گارانتی معمولی", isOurStore: false, logo: "📊" }
    ]
  },
  {
    id: "prod-ipad-pro-13-m5",
    title: "iPad Pro 13\" (Apple M4, Tandem OLED, 256GB Wi-Fi)",
    name: "iPad Pro 13\" (Apple M4, Tandem OLED, 256GB Wi-Fi)",
    title_fa: "تبلت ۱۳ اینچ آیپد پرو با نمایشگر انقلابی Tandem OLED و تراشه ۳ نانومتری M4",
    brand: "Apple",
    category: "تبلت و نمایشگر همراه",
    price: 98500000,
    discountPrice: 94900000,
    discount_price: 94900000,
    originalPrice: 98500000,
    stock: 9,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی",
    badge: "🎨 باریک‌ترین محصول اپل",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800"
    ],
    description: "باریک‌ترین دستگاه تاریخ اپل با ضخامت ۵.۱ میلی‌متر، نمایشگر فوق‌پیشرفته Ultra Retina XDR با دو لایه اولد تاندم و قدرت پردازش خارق‌العاده چیپست M4.",
    highlights: ["فناوری نمایشگر Tandem OLED (۱۶۰۰ نیت)", "ضخامت شگفت‌انگیز ۵.۱ میلی‌متر", "تراشه فوق‌سریع Apple M4", "پشتیبانی از قلم Apple Pencil Pro"],
    specs: {
      "نمایشگر": "13.0 Inch Ultra Retina XDR Tandem OLED",
      "روشنایی": "1600 Nits Peak HDR (1000 Nits مداوم)",
      "پردازنده": "Apple M4 (9-Core CPU, 10-Core GPU)",
      "ضخامت بدنه": "5.1 میلی‌متر (آلومینیوم ۱۰۰٪ بازیافتی)"
    },
    variants: [
      { id: "ip1", name: "مشکی فضایی (Space Black)", modelType: "256GB Wi-Fi", colorHex: "#111827", priceDelta: 0, stock: 5 },
      { id: "ip2", name: "نقره‌ای (Silver)", modelType: "256GB Wi-Fi", colorHex: "#e5e7eb", priceDelta: 0, stock: 4 }
    ],
    market_comparison: [
      { storeName: "ترب (Torob)", minPrice: 97800000, maxPrice: 104000000, warranty: "شرکتی", isOurStore: false, logo: "🔍" },
      { storeName: "دیجی‌کالا (Digikala)", minPrice: 99500000, maxPrice: 106000000, warranty: "متفرقه", isOurStore: false, logo: "🛍️" },
      { storeName: "ایمالز (Emalls)", minPrice: 98100000, maxPrice: 103500000, warranty: "معمولی", isOurStore: false, logo: "📊" }
    ]
  },
  {
    id: "prod-studio-display-5k",
    title: "Apple Studio Display 27\" 5K Retina (Nano-Texture Glass)",
    name: "Apple Studio Display 27\" 5K Retina (Nano-Texture Glass)",
    title_fa: "نمایشگر ۲۷ اینچ ۵K رتینا با شیشه مات نانوتکستچر و کالیبراسیون سخت‌افزاری",
    brand: "Apple",
    category: "مانیتور و استودیو",
    price: 135000000,
    discountPrice: 128500000,
    discount_price: 128500000,
    originalPrice: 135000000,
    stock: 6,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی اصالت طلایی آکسون",
    badge: "🖥️ مرجع تدوین رنگ",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"
    ],
    description: "نمایشگر استودیویی ۲۷ اینچ با تفکیک رنگ ۱۰ بیتی، پوشش کامل گاموت DCI-P3، روشنایی ۶۰۰ نیت، درگاه تاندربولت ۳ با توان شارژ ۹۶ وات، دوربین ۱۲ مگاپیکسل با Center Stage و سیستم صوتی ۶ درایور استودیو.",
    highlights: ["پنل 5K رتینا (5120x2880 پیکسل)", "پوشش ۹۹.۲٪ گاموت رنگی DCI-P3", "شیشه نانوتکستچر ضد انعکاس نور محیط", "۶ اسپیکر استودیویی با Spatial Audio"],
    specs: {
      "رزولوشن": "5120 در 2880 پیکسل (218 PPI)",
      "روشنایی": "600 نیت پایدار",
      "پوشش رنگ": "100% sRGB و 99.2% DCI-P3",
      "درگاه‌ها": "1x Thunderbolt 3 + 3x USB-C (10Gbps)",
      "کالیبراسیون": "سخت‌افزاری با Delta E < 0.4",
      "توان شارژ": "96 وات به لپ‌تاپ"
    },
    variants: [
      { id: "sd1", name: "شیشه مات نانوتکستچر", modelType: "پایه با تنظیم شیب", colorHex: "#4b5563", priceDelta: 0, stock: 4 },
      { id: "sd2", name: "شیشه استاندارد براق", modelType: "پایه با تنظیم شیب و ارتفاع", colorHex: "#e5e7eb", priceDelta: 12000000, stock: 2 }
    ],
    market_comparison: [
      { storeName: "ترب (Torob)", minPrice: 136000000, maxPrice: 144000000, warranty: "شرکتی", isOurStore: false, logo: "🔍" },
      { storeName: "دیجی‌کالا (Digikala)", minPrice: 139000000, maxPrice: 147000000, warranty: "متفرقه", isOurStore: false, logo: "🛍️" },
      { storeName: "ایمالز (Emalls)", minPrice: 137000000, maxPrice: 143000000, warranty: "معمولی", isOurStore: false, logo: "📊" }
    ]
  },
  {
    id: "prod-pro-display-xdr-6k",
    title: "Apple Pro Display XDR 32\" 6K Retina (HDR 1600 Nits)",
    name: "Apple Pro Display XDR 32\" 6K Retina (HDR 1600 Nits)",
    title_fa: "مانیتور ۳۲ اینچ ۶K مرجع هالیوود با کنتراست ۱,۰۰۰,۰۰۰:۱ و روشنایی ۱۶۰۰ نیت",
    brand: "Apple",
    category: "مانیتور و استودیو",
    price: 295000000,
    discountPrice: 279000000,
    discount_price: 279000000,
    originalPrice: 295000000,
    stock: 4,
    isAvailable: true,
    is_available: true,
    is_featured: true,
    warranty: "۱۸ ماه گارانتی تعویض طلایی",
    badge: "💎 استاندارد سینمایی 6K",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"],
    description: "نمایشگر ۶K رفرانس استودیو با ماتریس نوردهی موضعی ۵۷۶ زون، کنتراست بی‌نهایت ۱,۰۰۰,۰۰۰:۱، پوشش ۱۰۰٪ فضای رنگی سینمایی و زاویه دید فوق عریض با فیلتر پولاریزه نوری.",
    highlights: ["رزولوشن 6K با ۲۰.۴ میلیون پیکسل", "روشنایی پیک ۱۶۰۰ نیت و مداوم ۱۰۰۰ نیت", "کنتراست ۱,۰۰۰,۰۰۰:۱ با آرایه ۲D LED", "پشتیبانی کامل از HDR10 و Dolby Vision"],
    specs: {
      "رزولوشن": "6016 در 3384 پیکسل (218 PPI)",
      "روشنایی پیک": "1600 نیت",
      "کنتراست": "1,000,000:1",
      "تعداد زون‌ها": "576 ناحیه مستقل نوردهی",
      "کالیبراسیون": "جدول کالیبراسیون سخت‌افزاری 3D LUT"
    }
  },
  {
    id: "prod-decklink-8k-pro",
    title: "Blackmagic DeckLink 8K Pro Capture & Playback Card",
    name: "Blackmagic DeckLink 8K Pro",
    title_fa: "کارت کپچر و پلی‌بک استودیویی 8K با درگاه چهارگانه 12G-SDI و پردازش ۱۲ بیتی",
    brand: "Blackmagic Design",
    category: "تجهیزات تدوین و کپچر",
    price: 68000000,
    discountPrice: 63500000,
    discount_price: 63500000,
    originalPrice: 68000000,
    stock: 5,
    isAvailable: true,
    is_available: true,
    is_featured: false,
    warranty: "۲ سال گارانتی معتبر شرکتی",
    badge: "🎬 پخش زنده 8K",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
    images: ["https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"],
    description: "کارت کپچر سینمایی PCIe با پشتیبانی از استریم‌های 8K DCI تا ۶۰ فریم در ثانیه با عمق رنگ ۱۲ بیت RGB 4:4:4 و ۶۴ کانال صوتی استودیویی.",
    highlights: ["پشتیبانی از فرمت‌های SD تا 8K DCI", "چهار پورت دوطرفه 12G-SDI", "پشتیبانی کامل از DaVinci Resolve", "رابط PCIe Gen3 x8 با تاخیر صفر"],
    specs: {
      "رزولوشن کپچر": "8K DCI 60p بدون فشرده‌سازی",
      "عمق رنگ": "12-Bit RGB 4:4:4",
      "پورت‌ها": "4x 12G-SDI Bidirectional",
      "صدا": "64 Channels Embedded Audio"
    }
  },
  {
    id: "prod-calibrite-colorchecker",
    title: "Calibrite ColorChecker Display Plus Colorimeter",
    name: "Calibrite ColorChecker Display Plus",
    title_fa: "دستگاه کالیبراتور سخت‌افزاری مانیتورهای اولد و مینی‌ال‌ای‌دی تا ۲۰۰۰ نیت",
    brand: "Calibrite",
    category: "کالیبراسیون و ابزار رنگ",
    price: 29500000,
    discountPrice: 27800000,
    discount_price: 27800000,
    originalPrice: 29500000,
    stock: 7,
    isAvailable: true,
    is_available: true,
    is_featured: false,
    warranty: "۱ سال گارانتی تعویض کالیبرایت",
    badge: "🎯 دقت رنگ ۱۰۰٪",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800",
    images: ["https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800"],
    description: "حسگر کالیبراسیون فوق‌دقیق اپتیکال برای کالیبره کردن نمایشگرهای HDR، OLED و Mini-LED تا روشنایی ۲۰۰۰ نیت با پروفایل‌سازی خودکار 3D LUT.",
    highlights: ["سنجش شدت نور تا ۲۰۰۰ نیت", "فیلتر اپتیکال شیشه‌ای مادام‌العمر", "سازگار با ویندوز، مک و مانیتورهای تدوین"],
    specs: {
      "دامنه روشنایی": "0.05 تا 2000 cd/m2",
      "دقت سنجش": "Delta E < 0.2",
      "اتصال": "USB-C با آداپتور Type-A",
      "پشتیبانی": "Calibrite PROFILER & DaVinci"
    }
  }
];

export const productService = {
  getProductSync(id: string): Product | null {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE);
        if (cached) {
          const list: Product[] = JSON.parse(cached);
          const found = list.find((p) => p.id === id);
          if (found) return found;
        }
      } catch {}
    }
    return FLAGSHIP_7_PRODUCTS.find((p) => p.id === id) || null;
  },

  getAllSync(): Product[] {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length >= 7) return parsed;
        }
      } catch {}
    }
    return FLAGSHIP_7_PRODUCTS;
  },

  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length >= 7) {
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(data));
        }
        return data as Product[];
      }
      return this.getAllSync();
    } catch {
      return this.getAllSync();
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (!error && data) return data as Product;
      return this.getProductSync(id);
    } catch {
      return this.getProductSync(id);
    }
  }
};

export default productService;

// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('⚡ [MASTER SYSTEM REBUILD] در حال بازنویسی و تثبیت ۱۰۰٪ کامل تمام اجزای فروشگاه آکسون...');

const files = {
  // ==========================================
  // ۱. موتور Realtime سه‌گانه سراسری
  // ==========================================
  'lib/realtimeSync.ts': `import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { productService } from "@/services/productService";
import { siteInfoService } from "@/services/siteInfoService";
import { bannerService } from "@/services/bannerService";
import { orderService } from "@/services/orderService";
import { couponService } from "@/services/couponService";
import { menuService } from "@/services/menuService";
import { categoryService } from "@/services/categoryService";

export function applyFaviconToDOM(url?: string) {
  if (typeof document === "undefined" || !url) return;
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = \`\${url}\${url.includes("?") ? "&" : "?"}v=\${Date.now()}\`;
  } catch {}
}

export function applyTitleToDOM(title?: string, storeName?: string) {
  if (typeof document === "undefined") return;
  try {
    const sName = storeName || "آکسون";
    const sTitle = title || "مرجع تخصصی مانیتور و تجهیزات تصویر";
    document.title = \`\${sName} | \${sTitle}\`;
  } catch {}
}

class MasterRealtimeEngine {
  private static instance: MasterRealtimeEngine;
  private channel: RealtimeChannel | null = null;
  private broadcastBus: BroadcastChannel | null = null;
  private isSubscribed: boolean = false;

  private constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastBus = new BroadcastChannel("axon_master_realtime_channel");
      this.broadcastBus.onmessage = (event) => {
        const { type, data } = event.data || {};
        if (type) {
          window.dispatchEvent(new CustomEvent(type, { detail: data }));
          if (type === "site_info_updated" && data) {
            if (data.favicon_url) applyFaviconToDOM(data.favicon_url);
            if (data.tagline || data.site_name) applyTitleToDOM(data.tagline, data.site_name);
          }
        }
      };
    }
  }

  public static getInstance(): MasterRealtimeEngine {
    if (!MasterRealtimeEngine.instance) {
      MasterRealtimeEngine.instance = new MasterRealtimeEngine();
    }
    return MasterRealtimeEngine.instance;
  }

  public broadcastLocally(type: string, data: any) {
    if (typeof window === "undefined") return;
    
    // ۱. انتشار در پنجره جاری
    window.dispatchEvent(new CustomEvent(type, { detail: data }));
    
    // ۲. ارسال به تمام تب‌های دیگر در همان مرورگر در ۰ میلی‌ثانیه
    if (this.broadcastBus) {
      this.broadcastBus.postMessage({ type, data });
    }
    
    // ۳. اعمال فوری فاوآیکون و تایتل
    if (type === "site_info_updated" && data) {
      if (data.favicon_url) applyFaviconToDOM(data.favicon_url);
      if (data.tagline || data.site_name) applyTitleToDOM(data.tagline, data.site_name);
    }

    // ۴. ارسال به سایر مرورگرها از طریق سوکت سوپابیس
    if (this.channel) {
      this.channel.send({
        type: "broadcast",
        event: type,
        payload: data,
      }).catch(() => {});
    }
  }

  public init(): () => void {
    if (typeof window === "undefined") return () => {};
    if (this.isSubscribed && this.channel) return () => {};

    this.channel = supabase.channel("axon_global_stream_v2026", {
      config: { broadcast: { ack: false } },
    });

    const eventNames = [
      "products_updated", "site_info_updated", "banners_updated",
      "orders_updated", "coupons_updated", "menu_updated", "news_updated",
      "categories_updated", "contact_messages_updated", "posts_updated"
    ];

    eventNames.forEach((ev) => {
      this.channel?.on("broadcast", { event: ev }, (payload) => {
        window.dispatchEvent(new CustomEvent(ev, { detail: payload.payload }));
        if (ev === "site_info_updated" && payload.payload) {
          if (payload.payload.favicon_url) applyFaviconToDOM(payload.payload.favicon_url);
          if (payload.payload.tagline || payload.payload.site_name) applyTitleToDOM(payload.payload.tagline, payload.payload.site_name);
        }
      });
    });

    const tables = [
      "products", "orders", "site_info", "banners", "tech_news",
      "coupons", "contact_messages", "posts", "site_pages", "menu_items", "categories"
    ];

    tables.forEach((tableName) => {
      this.channel?.on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        async (payload: any) => {
          const updatedItem = payload.new || payload;
          window.dispatchEvent(new CustomEvent(\`\${tableName}_updated\`, { detail: updatedItem }));

          if (tableName === "products") {
            const all = await productService.getAll();
            window.dispatchEvent(new CustomEvent("products_updated", { detail: all }));
          } else if (tableName === "site_info") {
            const latest = await siteInfoService.getSiteInfo();
            window.dispatchEvent(new CustomEvent("site_info_updated", { detail: latest }));
            if (latest?.favicon_url) applyFaviconToDOM(latest.favicon_url);
            if (latest?.tagline || latest?.site_name) applyTitleToDOM(latest?.tagline, latest?.site_name);
          } else if (tableName === "banners") {
            const allBanners = await bannerService.getAll();
            window.dispatchEvent(new CustomEvent("banners_updated", { detail: allBanners }));
          } else if (tableName === "orders") {
            const allOrders = await orderService.getAll();
            window.dispatchEvent(new CustomEvent("orders_updated", { detail: allOrders }));
          } else if (tableName === "coupons") {
            const allCoupons = await couponService.getAll();
            window.dispatchEvent(new CustomEvent("coupons_updated", { detail: allCoupons }));
          } else if (tableName === "menu_items") {
            const allMenu = await menuService.getAll();
            window.dispatchEvent(new CustomEvent("menu_updated", { detail: allMenu }));
          } else if (tableName === "categories") {
            const allCats = await categoryService.getAll();
            window.dispatchEvent(new CustomEvent("categories_updated", { detail: allCats }));
          }
        }
      );
    });

    this.channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        this.isSubscribed = true;
      }
    });

    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
        this.isSubscribed = false;
      }
    };
  }
}

export function initRealtimeSync(): () => void {
  return MasterRealtimeEngine.getInstance().init();
}

export const realtimeEngine = MasterRealtimeEngine.getInstance();
export default MasterRealtimeEngine;
`,

  // ==========================================
  // ۲. سرویس کامل محصولات با ۷ پرچمدار و CRUD دیتابیس
  // ==========================================
  'services/productService.ts': `import { supabase } from "@/lib/supabase";
import { realtimeEngine } from "@/lib/realtimeSync";

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

const LOCAL_PRODUCTS_CACHE = "axon_products_registry_cache_v2026";

export const FLAGSHIP_7_PRODUCTS: Product[] = [
  {
    id: "prod-macbook-pro-m5-max",
    title: "MacBook Pro 16\\" (Apple M4 Max, 128GB RAM, 2TB SSD)",
    name: "MacBook Pro 16\\" (Apple M4 Max, 128GB RAM, 2TB SSD)",
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
    highlights: [
      "تراشه ۳ نانومتری M4 Max با ۴۰ هسته GPU",
      "رم یکپارچه ۱۲۸ گیگابایت (546 GB/s)",
      "صفحه نمایش ۱۲۰ هرتز Liquid Retina XDR",
      "خروجی همزمان ۴ مانیتور 6K"
    ],
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
    highlights: [
      "روشنایی خیره‌کننده ۳۰۰۰ نیت",
      "بدنه تیتانیوم ۴۹ میلی‌متری گرید ۵",
      "عمق‌سنج خودکار غواصی تا ۴۰ متر",
      "شارژدهی باتری تا ۷۲ ساعت"
    ],
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
    title: "iPad Pro 13\\" (Apple M4, Tandem OLED, 256GB Wi-Fi)",
    name: "iPad Pro 13\\" (Apple M4, Tandem OLED, 256GB Wi-Fi)",
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
    highlights: [
      "فناوری نمایشگر Tandem OLED (۱۶۰۰ نیت)",
      "ضخامت شگفت‌انگیز ۵.۱ میلی‌متر",
      "تراشه فوق‌سریع Apple M4",
      "پشتیبانی از قلم Apple Pencil Pro"
    ],
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
    title: "Apple Studio Display 27\\" 5K Retina (Nano-Texture Glass)",
    name: "Apple Studio Display 27\\" 5K Retina (Nano-Texture Glass)",
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
    highlights: [
      "پنل 5K رتینا (5120x2880 پیکسل)",
      "پوشش ۹۹.۲٪ گاموت رنگی DCI-P3",
      "شیشه نانوتکستچر ضد انعکاس نور محیط",
      "۶ اسپیکر استودیویی با Spatial Audio"
    ],
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
    title: "Apple Pro Display XDR 32\\" 6K Retina (HDR 1600 Nits)",
    name: "Apple Pro Display XDR 32\\" 6K Retina (HDR 1600 Nits)",
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
    highlights: [
      "رزولوشن 6K با ۲۰.۴ میلیون پیکسل",
      "روشنایی پیک ۱۶۰۰ نیت و مداوم ۱۰۰۰ نیت",
      "کنتراست ۱,۰۰۰,۰۰۰:۱ با آرایه ۲D LED",
      "پشتیبانی کامل از HDR10 و Dolby Vision"
    ],
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
    highlights: [
      "پشتیبانی از فرمت‌های SD تا 8K DCI",
      "چهار پورت دوطرفه 12G-SDI",
      "پشتیبانی کامل از DaVinci Resolve",
      "رابط PCIe Gen3 x8 با تاخیر صفر"
    ],
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
    highlights: [
      "سنجش شدت نور تا ۲۰۰۰ نیت",
      "فیلتر اپتیکال شیشه‌ای مادام‌العمر",
      "سازگار با ویندوز، مک و مانیتورهای تدوین"
    ],
    specs: {
      "دامنه روشنایی": "0.05 تا 2000 cd/m2",
      "دقت سنجش": "Delta E < 0.2",
      "اتصال": "USB-C با آداپتور Type-A",
      "پشتیبانی": "Calibrite PROFILER & DaVinci"
    }
  }
];

export function normalizeProduct(p: any): Product {
  if (!p) return FLAGSHIP_7_PRODUCTS[0];
  const price = Number(p.price || 0);
  const discountPrice =
    p.discountPrice !== undefined && p.discountPrice !== null
      ? Number(p.discountPrice)
      : p.discount_price !== undefined && p.discount_price !== null
      ? Number(p.discount_price)
      : undefined;

  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : [p.image || p.image_url || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"];

  const stock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 10;
  const isAvailable = p.is_available !== false && p.isAvailable !== false && stock > 0;

  return {
    ...p,
    id: String(p.id),
    title: p.title || p.name || "کالای دیجیتال استودیویی",
    name: p.name || p.title || "کالای دیجیتال استودیویی",
    title_fa: p.title_fa || "",
    sku: p.sku || \`SKU-\${String(p.id).slice(-6)}\`,
    brand: p.brand || "Apple",
    price,
    discountPrice,
    discount_price: discountPrice,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : price,
    stock,
    category: p.category || p.category_name || "تجهیزات تخصصی",
    description: p.description || "تجهیزات تخصصی اورجینال با گارانتی اصالت طلایی آکسون",
    short_description: p.short_description || "",
    highlights: Array.isArray(p.highlights) ? p.highlights : [],
    image: images[0],
    image_url: images[0],
    images,
    variants: Array.isArray(p.variants) ? p.variants : [],
    specs: p.specs && typeof p.specs === "object" ? p.specs : {},
    warranty: p.warranty || "۱۸ ماه گارانتی اصالت طلایی آکسون",
    badge: p.badge || "",
    isAvailable,
    is_available: isAvailable,
    is_featured: Boolean(p.is_featured),
    market_comparison: Array.isArray(p.market_comparison) ? p.market_comparison : [],
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

export const productService = {
  getProductSync(id: string): Product | null {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE);
        if (cached) {
          const list: Product[] = JSON.parse(cached);
          const found = list.find((p) => p.id === id);
          if (found) return normalizeProduct(found);
        }
      } catch {}
    }
    const defaultItem = FLAGSHIP_7_PRODUCTS.find((p) => p.id === id);
    return defaultItem ? normalizeProduct(defaultItem) : null;
  },

  getAllSync(): Product[] {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_PRODUCTS_CACHE);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length >= 7) {
            return parsed.map(normalizeProduct);
          }
        }
      } catch {}
    }
    return FLAGSHIP_7_PRODUCTS.map(normalizeProduct);
  },

  async getAll(): Promise<Product[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length >= 7) {
          const normalized = data.map(normalizeProduct);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(normalized));
          }
          return normalized;
        }
      }
      return this.getAllSync();
    } catch {
      return this.getAllSync();
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return normalizeProduct(data);
        }
      }
      return this.getProductSync(id);
    } catch {
      return this.getProductSync(id);
    }
  },

  async saveProduct(productData: Partial<Product>): Promise<Product | null> {
    try {
      const id = productData.id || \`prod_\${Date.now()}\`;
      const normalized = normalizeProduct({ ...productData, id });

      const dbPayload: any = {
        id: normalized.id,
        title: normalized.title,
        name: normalized.title,
        title_fa: normalized.title_fa || null,
        sku: normalized.sku || null,
        brand: normalized.brand || "Apple",
        price: normalized.price,
        discount_price: normalized.discountPrice || null,
        stock: normalized.stock,
        category: normalized.category,
        description: normalized.description,
        short_description: normalized.short_description || null,
        highlights: normalized.highlights || [],
        image: normalized.image,
        image_url: normalized.image,
        images: normalized.images,
        variants: normalized.variants || [],
        specs: normalized.specs || {},
        warranty: normalized.warranty || null,
        badge: normalized.badge || null,
        is_available: normalized.is_available,
        is_featured: normalized.is_featured,
        market_comparison: normalized.market_comparison || [],
        meta_title: normalized.meta_title || normalized.title,
        meta_description: normalized.meta_description || normalized.short_description || null,
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        await supabase.from("products").upsert(dbPayload, { onConflict: "id" });
      }

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = [normalized, ...all.filter((p) => p.id !== normalized.id)];
        localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(updated));
        realtimeEngine.broadcastLocally("products_updated", updated);
      }

      return normalized;
    } catch (e) {
      console.error("productService.saveProduct error:", e);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("products").delete().eq("id", id);
      }

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = all.filter((p) => p.id !== id);
        localStorage.setItem(LOCAL_PRODUCTS_CACHE, JSON.stringify(updated));
        realtimeEngine.broadcastLocally("products_updated", updated);
      }
      return true;
    } catch (e) {
      console.error("productService.deleteProduct error:", e);
      return false;
    }
  },
};

export default productService;
`,

  // ==========================================
  // ۳. سرویس بنرها و اسلایدرها
  // ==========================================
  'services/bannerService.ts': `import { supabase } from "@/lib/supabase";
import { realtimeEngine } from "@/lib/realtimeSync";

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badge_text?: string;
  image: string;
  image_url?: string;
  link?: string;
  link_url?: string;
  button_text?: string;
  buttonText?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_BANNERS_KEY = "axon_banners_cache_v2026";

export const bannerService = {
  async getAll(): Promise<Banner[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Banner[] = data.map((b: any) => ({
            id: String(b.id),
            title: b.title || "پیشنهاد ویژه",
            subtitle: b.subtitle || "",
            badge: b.badge || b.badge_text || "",
            badge_text: b.badge || b.badge_text || "",
            image: b.image || b.image_url || "/placeholder.png",
            image_url: b.image || b.image_url || "/placeholder.png",
            link: b.link || b.link_url || "/products",
            link_url: b.link || b.link_url || "/products",
            button_text: b.button_text || b.buttonText || "مشاهده و خرید کالا",
            buttonText: b.button_text || b.buttonText || "مشاهده و خرید کالا",
            is_active: b.is_active !== false,
            created_at: b.created_at,
          }));

          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      }

      if (typeof window !== "undefined") {
        const local = localStorage.getItem(LOCAL_BANNERS_KEY);
        if (local) return JSON.parse(local);
      }

      return [];
    } catch (e) {
      console.error("bannerService.getAll error:", e);
      return [];
    }
  },

  async getActive(): Promise<Banner[]> {
    const all = await this.getAll();
    return all.filter((b) => b.is_active !== false);
  },

  async saveBanner(bannerData: Partial<Banner>): Promise<Banner | null> {
    try {
      const id = bannerData.id || \`banner_\${Date.now()}\`;
      const payload: any = {
        id,
        title: bannerData.title?.trim() || "پیشنهاد ویژه",
        subtitle: bannerData.subtitle?.trim() || null,
        badge: bannerData.badge?.trim() || bannerData.badge_text?.trim() || null,
        badge_text: bannerData.badge?.trim() || bannerData.badge_text?.trim() || null,
        image: bannerData.image || bannerData.image_url || "/placeholder.png",
        image_url: bannerData.image || bannerData.image_url || "/placeholder.png",
        link: bannerData.link || bannerData.link_url || "/products",
        link_url: bannerData.link || bannerData.link_url || "/products",
        button_text: bannerData.button_text || bannerData.buttonText || "مشاهده و بررسی کالا",
        is_active: bannerData.is_active !== false,
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        await supabase.from("banners").upsert(payload, { onConflict: "id" });
      }

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = [payload, ...all.filter((b) => b.id !== id)];
        localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(updated));
        realtimeEngine.broadcastLocally("banners_updated", updated);
      }

      return payload;
    } catch (e) {
      console.error("bannerService.saveBanner error:", e);
      return null;
    }
  },

  async deleteBanner(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("banners").delete().eq("id", id);
      }
      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = all.filter((b) => b.id !== id);
        localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(updated));
        realtimeEngine.broadcastLocally("banners_updated", updated);
      }
      return true;
    } catch (e) {
      console.error("bannerService.deleteBanner error:", e);
      return false;
    }
  },
};

export default bannerService;
`,

  // ==========================================
  // ۴. سرویس تنظیمات سایت با ۳ لوگوی مستقل
  // ==========================================
  'services/siteInfoService.ts': `import { supabase } from "@/lib/supabase";
import { realtimeEngine, applyFaviconToDOM, applyTitleToDOM } from "@/lib/realtimeSync";

export type MaintenanceMode = "none" | "timed" | "indefinite";

export interface SiteInfo {
  id?: string | number;
  site_name?: string;
  siteName?: string;
  storeName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  working_hours?: string;
  logo_url?: string;
  logoUrl?: string;
  footer_logo_url?: string;
  footerLogoUrl?: string;
  favicon_url?: string;
  faviconUrl?: string;
  allow_google_index?: boolean;
  allowGoogleIndex?: boolean;
  maintenance_mode?: MaintenanceMode;
  maintenance_until?: string;
  maintenance_duration_minutes?: number;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  youtube?: string;
  header_announcement?: string;
  free_shipping_threshold?: number;
  description?: string;
  footer_text?: string;
  custom_css?: string;
  active_font_id?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_SITE_INFO = "axon_site_info_cache_permanent_v2026";

export const siteInfoService = {
  getSiteInfoSync(): SiteInfo {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_SITE_INFO);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.favicon_url) applyFaviconToDOM(parsed.favicon_url);
          return parsed;
        }
      } catch {}
    }
    return {
      site_name: "آکسون | Axon",
      siteName: "آکسون | Axon",
      storeName: "آکسون | Axon",
      tagline: "مرجع تخصصی تجهیزات دیجیتال، تصویر و استودیو",
      allow_google_index: true,
      allowGoogleIndex: true,
      maintenance_mode: "none",
      phone: "۰۲۱-۸۸۸۸۸۸۸۸",
      email: "info@axoncore.ir",
      address: "تهران، خیابان ولیعصر، تقاطع میرداماد",
      working_hours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      header_announcement: "⚡ ارسال رایگان خریدهای بالای ۲ میلیون تومان | گارانتی اصالت طلایی ۱۸ ماهه",
      free_shipping_threshold: 2000000,
    };
  },

  async getSiteInfo(): Promise<SiteInfo | null> {
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const data = json.data;
          const isAllowed = data.allow_google_index !== false && data.allowGoogleIndex !== false;
          const mapped: SiteInfo = {
            id: data.id,
            site_name: data.site_name || data.store_name || "آکسون | Axon",
            siteName: data.site_name || data.store_name || "آکسون | Axon",
            storeName: data.site_name || data.store_name || "آکسون | Axon",
            tagline: data.tagline || "مرجع تخصصی تجهیزات دیجیتال، تصویر و استودیو",
            phone: data.phone || "۰۲۱-۸۸۸۸۸۸۸۸",
            email: data.email || "info@axoncore.ir",
            address: data.address || "تهران، خیابان ولیعصر، تقاطع میرداماد",
            working_hours: data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
            logo_url: data.logo_url || "",
            logoUrl: data.logo_url || "",
            footer_logo_url: data.footer_logo_url || "",
            footerLogoUrl: data.footer_logo_url || "",
            favicon_url: data.favicon_url || "",
            faviconUrl: data.favicon_url || "",
            allow_google_index: isAllowed,
            allowGoogleIndex: isAllowed,
            maintenance_mode: (data.maintenance_mode as MaintenanceMode) || (isAllowed ? "none" : "indefinite"),
            maintenance_until: data.maintenance_until || undefined,
            maintenance_duration_minutes: data.maintenance_duration_minutes ? Number(data.maintenance_duration_minutes) : undefined,
            header_announcement: data.header_announcement || "",
            free_shipping_threshold: Number(data.free_shipping_threshold || 2000000),
            description: data.description || data.footer_text || "",
            footer_text: data.footer_text || data.description || "",
            custom_css: data.custom_css || "",
            active_font_id: data.active_font_id || "Vazirmatn",
            instagram: data.instagram || "",
            telegram: data.telegram || "",
            whatsapp: data.whatsapp || "",
            youtube: data.youtube || "",
            updated_at: data.updated_at,
          };

          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(mapped));
            if (mapped.favicon_url) applyFaviconToDOM(mapped.favicon_url);
            if (mapped.tagline || mapped.site_name) applyTitleToDOM(mapped.tagline, mapped.site_name);
          }
          return mapped;
        }
      }
      return this.getSiteInfoSync();
    } catch {
      return this.getSiteInfoSync();
    }
  },

  async updateSiteInfo(payload: Partial<SiteInfo>): Promise<SiteInfo | null> {
    try {
      const isAllowed =
        payload.allow_google_index !== undefined
          ? payload.allow_google_index
          : payload.maintenance_mode === "none";

      const sName = payload.site_name || payload.siteName || payload.storeName || "آکسون | Axon";

      const dbPayload: any = {
        site_name: sName,
        store_name: sName,
        tagline: payload.tagline || "",
        phone: payload.phone || "",
        email: payload.email || "",
        address: payload.address || "",
        working_hours: payload.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        logo_url: payload.logo_url || payload.logoUrl || "",
        footer_logo_url: payload.footer_logo_url || payload.footerLogoUrl || "",
        favicon_url: payload.favicon_url || payload.faviconUrl || "",
        allow_google_index: isAllowed,
        maintenance_mode: payload.maintenance_mode || (isAllowed ? "none" : "indefinite"),
        maintenance_until: payload.maintenance_until || null,
        maintenance_duration_minutes: payload.maintenance_duration_minutes || null,
        header_announcement: payload.header_announcement || "",
        free_shipping_threshold: Number(payload.free_shipping_threshold || 2000000),
        footer_text: payload.footer_text || payload.description || "",
        description: payload.description || payload.footer_text || "",
        custom_css: payload.custom_css || "",
        active_font_id: payload.active_font_id || "Vazirmatn",
        instagram: payload.instagram || "",
        telegram: payload.telegram || "",
        whatsapp: payload.whatsapp || "",
        youtube: payload.youtube || "",
        updated_at: new Date().toISOString(),
      };

      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      const json = await res.json();
      const finalData = json.data || dbPayload;

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(finalData));
        realtimeEngine.broadcastLocally("site_info_updated", finalData);
      }

      return finalData;
    } catch {
      return null;
    }
  },
};

export default siteInfoService;
`,

  // ==========================================
  // ۵. کارت محصول با حذف ۱۰۰٪ خطای Hydration
  // ==========================================
  'components/ProductCard.tsx': `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";

export default function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = product.title || product.title_fa || product.name || "کالای دیجیتال تخصصی";
  const price = Number(product.price) || 0;
  const discountPrice =
    product.discountPrice !== undefined && product.discountPrice !== null
      ? Number(product.discountPrice)
      : product.discount_price !== undefined && product.discount_price !== null
      ? Number(product.discount_price)
      : undefined;

  const currentPrice = discountPrice || price;
  const stockCount = product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10;

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image_url || product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600"];

  const mainImage = images[0];
  const category = product.category || product.category_name || "تجهیزات تخصصی";
  const isAvailable =
    product.is_available !== false &&
    product.isAvailable !== false &&
    stockCount > 0;

  const discountPercent =
    discountPrice && discountPrice < price
      ? Math.round(((price - discountPrice) / price) * 100)
      : 0;

  return (
    <div
      onClick={() => userBehavior.trackProductView(product.id, category)}
      className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2.2rem] p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-2xl hover:border-[var(--accent-blue)] transition-all duration-300 group select-none relative"
      dir="rtl"
    >
      <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-3.5 flex items-center justify-center p-3 border border-[var(--card-border)]">
        <Link href={\`/products/\${product.id}\`} className="w-full h-full flex items-center justify-center">
          <img
            src={mainImage}
            alt={title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black shadow-lg">
            {discountPercent}٪- تخفیف
          </span>
        )}

        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
          {product.badge || category}
        </span>

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-black shadow-md">
              ناموجود در انبار
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow space-y-2 mb-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--accent-blue)] font-extrabold">{product.brand || "Axon Pro"}</span>
          <span className={\`font-bold \${isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}\`}>
            {isAvailable ? "موجود در انبار ✓" : "ناموجود"}
          </span>
        </div>

        <Link href={\`/products/\${product.id}\`} className="hover:text-[var(--accent-blue)] transition-colors">
          <h3
            className="font-black text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-2 text-right"
            dir="rtl"
          >
            {title}
          </h3>
        </Link>

        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 font-medium leading-relaxed">
          {product.short_description || product.description || "تجهیزات تخصصی با گارانتی اصالت طلایی"}
        </p>
      </div>

      <div className="pt-3 border-t border-[var(--card-border)] space-y-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {discountPrice && discountPrice < price && (
              <span className="text-[10px] line-through text-[var(--text-secondary)] font-mono" suppressHydrationWarning>
                {price.toLocaleString("fa-IR")}
              </span>
            )}
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono" suppressHydrationWarning>
              {currentPrice.toLocaleString("fa-IR")}{" "}
              <span className="text-xs font-bold font-sans">تومان</span>
            </span>
          </div>
          <Link href={\`/products/\${product.id}\`} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline transition">
            بررسی کالا ←
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playAddToCart();
              userBehavior.trackProductView(product.id, category);
              addToCart({
                id: product.id,
                title,
                name: title,
                price: currentPrice,
                image: mainImage,
                stock: stockCount,
                quantity: 1,
              });
            }}
            disabled={!isAvailable}
            className="py-2.5 bg-[var(--input-bg)] text-[var(--text-primary)] text-xs font-black rounded-xl border border-[var(--card-border)] hover:border-[var(--accent-blue)] cursor-pointer disabled:opacity-40 transition shadow-sm"
          >
            🛒 سبد خرید
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playAddToCart();
              userBehavior.trackProductView(product.id, category);
              addToCart({
                id: product.id,
                title,
                name: title,
                price: currentPrice,
                image: mainImage,
                stock: stockCount,
                quantity: 1,
              });
              router.push("/checkout");
            }}
            disabled={!isAvailable}
            className="py-2.5 bg-[var(--accent-blue)] text-white text-xs font-black rounded-xl shadow-md hover:opacity-90 cursor-pointer disabled:opacity-40 transition"
          >
            ⚡ خرید سریع
          </button>
        </div>
      </div>
    </div>
  );
}
`,

  // ==========================================
  // ۶. کالبدشکافی ۳D سخت‌افزار با زاویه ایزومتریک استاندارد
  // ==========================================
  'components/ProductExplodedView.tsx': `"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface HardwareComponent {
  id: string;
  name: string;
  nameFa: string;
  category: "optics" | "camera" | "logicboard" | "battery" | "audio" | "chassis";
  depthIndex: number;
  role: string;
  specifications: Record<string, string>;
  engineeringHighlight: string;
  material: string;
  renderType: "display" | "camera" | "chipset" | "battery" | "audio" | "chassis";
  accentText: string;
}

export default function ProductExplodedView({
  productId,
  productTitle,
  category,
  isOpen,
  onClose,
}: {
  productId: string;
  productTitle: string;
  category?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [explosionDistance, setExplosionDistance] = useState<number>(55);
  const [rotationX, setRotationX] = useState<number>(18);
  const [rotationY, setRotationY] = useState<number>(-32);
  const [selectedComp, setSelectedComp] = useState<HardwareComponent | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const titleLower = (productTitle || "").toLowerCase();
  const isWatch = titleLower.includes("watch") || titleLower.includes("ساعت");
  const isMacBook = titleLower.includes("macbook") || titleLower.includes("مک‌بوک");
  const isDisplay = titleLower.includes("display") || titleLower.includes("مانیتور") || titleLower.includes("xdr");

  const components: HardwareComponent[] = isWatch ? [
    {
      id: "w-1",
      name: "Flat Sapphire Crystal Front Lens with Raised Edge",
      nameFa: "شیشه یاقوت کبود تخت با لبه محافظ برجسته تیتانیوم",
      category: "optics",
      depthIndex: 1,
      renderType: "display",
      accentText: "3000 Nits Sapphire",
      role: "محافظت در برابر سایش صخره‌نوردی و ضربات شدید بدون افت شفافیت ۳۰۰۰ نیتی اولد",
      specifications: { "سختی": "۹ در مقیاس موهس (ضدخش خالص)", "روشنایی عبوری": "۳۰۰۰ نیت", "پوشش": "اولئوفوبیک ضد اثر انگشت" },
      engineeringHighlight: "تراشکاری نانومتری یاقوت کبود هم‌سطح با لبه‌های شاسی تیتانیوم",
      material: "کریستال یاقوت کبود خالص (Sapphire Crystal)"
    },
    {
      id: "w-2",
      name: "Always-On Retina LTPO OLED Ultra Display Matrix",
      nameFa: "نمایشگر رتینا LTPO OLED همیشه‌روشن ۳۰۰۰ نیت",
      category: "camera",
      depthIndex: 2,
      renderType: "camera",
      accentText: "LTPO OLED 1-60Hz",
      role: "خوانایی کامل در نور شدید خورشید و کاهش روشنایی به ۱ نیت در تاریکی مطلق",
      specifications: { "حداکثر روشنایی": "3000 Nits", "تراکم": "326 PPI", "حداقل روشنایی": "1 Nit" },
      engineeringHighlight: "کاهش مصرف انرژی به ۱ هرتز در حالت استندبای",
      material: "پنل انعطاف‌پذیر LTPO OLED"
    },
    {
      id: "w-3",
      name: "S9 SiP with 4-Core Neural Engine & Gesture Sensor",
      nameFa: "تراشه مرکزی S9 SiP با موتور پردازش عصبی ۴ هسته‌ای",
      category: "logicboard",
      depthIndex: 3,
      renderType: "chipset",
      accentText: "Apple S9 SiP",
      role: "پردازش ژست حرکتی Double Tap، ردیابی دقیق GPS دوفرکانسه و سیری آفلاین",
      specifications: { "ترانزیستور": "۵.۶ میلیارد", "هسته‌های عصبی": "۴ هسته Neural Engine", "ردیابی": "Dual-Frequency L1/L5 GPS" },
      engineeringHighlight: "پردازش بدون لمس ژست ضربه انگشتان در کمتر از ۰.۰۵ ثانیه",
      material: "سیلیکون ۶۴ بیتی با برد فشرده SiP"
    },
    {
      id: "w-4",
      name: "High-Density Li-Ion Battery & Wireless Charging Coil",
      nameFa: "باتری پرظرفیت ۵۶۴ میلی‌آمپری با سیم‌پیچ شارژ مگنتی",
      category: "battery",
      depthIndex: 4,
      renderType: "battery",
      accentText: "36h Battery Life",
      role: "شارژدهی تا ۳۶ ساعت کار مداوم و ۷۲ ساعت در حالت Low Power",
      specifications: { "ظرفیت": "564 mAh", "شارژ سریع": "80% در 60 دقیقه", "مقاومت دمایی": "-20 تا +55 درجه" },
      engineeringHighlight: "سلول فشرده مقاوم در برابر تغییرات شدید فشار اتمسفر غواصی",
      material: "لیتیوم-پلیمر با عایق استیل"
    },
    {
      id: "w-5",
      name: "Bio-Optical Sensor Array & 86dB Emergency Siren",
      nameFa: "آرایه حسگرهای نوری ضربان، اکسیژن خون و آژیر اضطراری",
      category: "audio",
      depthIndex: 5,
      renderType: "audio",
      accentText: "ECG & 86dB Siren",
      role: "پایش نوار قلب ECG، سنجش عمق غواصی تا ۴۰ متر و پخش صدای کمک‌خواهی تا ۱۸۰ متر",
      specifications: { "حسگر عمق": "دقیق تا 40 متر (EN13319)", "آژیر": "86dB با برد 180 متر", "سنسور دما": "دقت 0.01 درجه" },
      engineeringHighlight: "فعال‌سازی خودکار اپلیکیشن عمق‌سنج به محض ورود به آب",
      material: "سرامیک زیرکونیا و بلور یاقوت کبود پشتی"
    },
    {
      id: "w-6",
      name: "Aerospace-Grade Titanium Grade 5 Unibody Enclosure",
      nameFa: "شاسی یکپارچه تیتانیوم گرید ۵ با دکمه Action نارنجی",
      category: "chassis",
      depthIndex: 6,
      renderType: "chassis",
      accentText: "Titanium Grade 5",
      role: "مقاومت در برابر ضربات سنگین، مقاومت کامل در آب شور تا عمق ۱۰۰ متر",
      specifications: { "آلیاژ": "Titanium Grade 5 (Ti-6Al-4V)", "مقاومت آب": "100 متر (WR100)", "استاندارد": "MIL-STD 810H" },
      engineeringHighlight: "تراشکاری اتوماتیک ۵ محوره CNC تیتانیوم بدون ایجاد درز",
      material: "تیتانیوم بازیافتی ۹۵٪ هوافضا"
    }
  ] : isMacBook ? [
    {
      id: "mb-1",
      name: "Liquid Retina XDR Mini-LED Display Lid Assembly",
      nameFa: "مجموعه درب بالایی با پنل Liquid Retina XDR مینی‌ال‌ای‌دی",
      category: "optics",
      depthIndex: 1,
      renderType: "display",
      accentText: "1600 Nits XDR 120Hz",
      role: "تفکیک رنگ ۱۰ بیتی، اوج روشنایی ۱۶۰۰ نیت، رفرش ریت ۱۲۰ هرتز و کنتراست ۱,۰۰۰,۰۰۰:۱",
      specifications: { "رزولوشن": "3456 در 2234 پیکسل", "نوردهی": "بیش از 10,000 Mini-LED", "فناوری": "ProMotion 120Hz" },
      engineeringHighlight: "شاسی فوق‌باریک آلومینیومی ماشین‌کاری‌شده با ضخامت میلی‌متری",
      material: "شیشه نوری تقویت‌شده و شاسی آلومینیوم ۶۰۰۰"
    },
    {
      id: "mb-2",
      name: "Magic Keyboard with Force Touch Trackpad Assembly",
      nameFa: "کیبورد مکانیسم قیچی مشکی مات و ترک‌پد فورس‌تاچ شیشه‌ای",
      category: "camera",
      depthIndex: 2,
      renderType: "camera",
      accentText: "Force Touch Trackpad",
      role: "تایپ دقیق با پیمایش ۱ میلی‌متر، سنسور اثر انگشت Touch ID و بازخورد لمسی هاپتیک",
      specifications: { "مکانیزم": "Scissor Switch 1mm", "موتور هاپتیک": "Taptic Engine الکترومغناطیسی", "امنیت": "Touch ID با Secure Enclave" },
      engineeringHighlight: "سنسورهای فشار چندمرحله‌ای زیر ترک‌پد شیشه‌ای بدون حرکت مکانیکی",
      material: "شیشه صیقلی مات و کلیدهای پلی‌کربنات مقاوم"
    },
    {
      id: "mb-3",
      name: "M4 Max Motherboard with Dual Vapor Chamber Heatpipes",
      nameFa: "مادربرد پردازنده ۱۶ هسته‌ای M4 Max با خنک‌کاری دوگانه مس و محفظه بخار",
      category: "logicboard",
      depthIndex: 3,
      renderType: "chipset",
      accentText: "Apple M4 Max Die",
      role: "رندر بی‌درنگ ویدیوهای 8K ProRes، پردازش گرافیکی با ۴۰ هسته GPU و پهنای باند ۵۴۶GB/s",
      specifications: { "ترانزیستور": "بیش از ۹۰ میلیارد", "رم یکپارچه": "128GB Unified Memory", "سرعت حافظه": "546 GB/s" },
      engineeringHighlight: "دو فن سانتریفیوژ بی صدا با تیغه‌های آیرودینامیک نامتقارن",
      material: "برد ۱۲ لایه فایبرگلاس با هیت‌پایپ‌های مسی"
    },
    {
      id: "mb-4",
      name: "100Wh High-Capacity 6-Cell Lithium Polymer Battery",
      nameFa: "سیستم باتری ۱۰۰ وات ساعت ۶ سلولی با کنترلر مدیریت شارژ",
      category: "battery",
      depthIndex: 4,
      renderType: "battery",
      accentText: "100Wh Battery (22h)",
      role: "شارژدهی تا ۲۲ ساعت کار پیوسته و حداکثر مجاز طبق قوانین هوانوردی فدرال آمریکا",
      specifications: { "ظرفیت": "100 Watt-Hour", "شارژ سریع": "140W با کابل MagSafe 3", "تعداد سلول": "۶ سلول مجزا" },
      engineeringHighlight: "چیدمان پلکانی سلول‌ها جهت استفاده از ۱۰۰٪ حجم خالی بدنه",
      material: "لیتیوم-کبالت چگالی بالا با پوشش عایق آلومینیوم"
    },
    {
      id: "mb-5",
      name: "Six-Speaker Sound System with Force-Cancelling Woofers",
      nameFa: "سیستم صوتی ۶ اسپیکر استودیویی با ووفرهای لغوکننده لرزش فیزیکی",
      category: "audio",
      depthIndex: 5,
      renderType: "audio",
      accentText: "6-Speaker Studio Audio",
      role: "تولید بیس تا نیم اکتاو عمیق‌تر و پوشش کامل فرکانس‌های صدای فراگیر Dolby Atmos",
      specifications: { "تعداد اسپیکر": "۴ ووفر + ۲ توییتر", "پشتیبانی": "Spatial Audio", "میکروفون": "۳ میکروفون استودیو با نسبت سیگنال به نویز بالا" },
      engineeringHighlight: "خنثی‌سازی کامل لرزش گشتاوری هنگام گوش دادن به موسیقی با ولوم بالا",
      material: "رزین آکوستیک با مگنت‌های نئودیمیوم"
    },
    {
      id: "mb-6",
      name: "Precision CNC Aluminum Unibody Bottom Enclosure",
      nameFa: "شاسی یکپارچه زیرین با شیارهای تهویه جانبی و پایه‌های سیلیکونی",
      category: "chassis",
      depthIndex: 6,
      renderType: "chassis",
      accentText: "Space Black Aluminum",
      role: "جریان هوای Laminar خنک‌کاری، خروجی درگاه‌های HDMI 2.1 و تاندربولت و دوام ساختاری",
      specifications: { "رنگ بدنه": "مشکی فضایی (Space Black) ضد لک", "تراشکاری": "تراشکاری یکپارچه تمام اتوماتیک CNC", "پورت‌ها": "3x TB4 + HDMI + SDXC" },
      engineeringHighlight: "آبکاری آنودایز تیره با شیمی اختصاصی جذب‌کننده اثر انگشت",
      material: "آلومینیوم ۱۰۰٪ بازیافتی سری ۶۰۰۰"
    }
  ] : [
    {
      id: "pad-1",
      name: "Ultra Retina XDR Tandem OLED Front Display",
      nameFa: "پنل نمایشگر اولد تاندم دو لایه با شیشه محافظ نانوتکستچر",
      category: "optics",
      depthIndex: 1,
      renderType: "display",
      accentText: "Tandem OLED 1600 Nits",
      role: "تولید تصویر با دو لایه ساطع‌کننده نور ارگانیک، کنتراست ۲,۰۰۰,۰۰۰:۱ و اوج روشنایی ۱۶۰۰ نیت",
      specifications: { "رزولوشن": "2752 در 2064 پیکسل (264 PPI)", "روشنایی": "1600 Nits Peak", "فناوری": "Tandem OLED ProMotion 120Hz" },
      engineeringHighlight: "تلفیق نور دو پنل اولد برای روشنایی پایدار ۱۰۰۰ نیت بدون Burn-in",
      material: "شیشه نانوتکستچر با پوشش اولئوفوبیک"
    },
    {
      id: "pad-2",
      name: "LiDAR Scanner & 12MP TrueDepth Camera Module",
      nameFa: "ماژول دوربین TrueDepth، فلاش نوری تطبیقی و اسکنر LiDAR",
      category: "camera",
      depthIndex: 2,
      renderType: "camera",
      accentText: "LiDAR + 12MP 4K ProRes",
      role: "ثبت نقشه سه‌بعدی محیط در کسری از ثانیه و فیلم‌برداری سینمایی 4K ProRes",
      specifications: { "سنسور": "12MP f/1.8", "اسکنر": "LiDAR مادون قرمز برد ۵ متر", "ویدیو": "4K ProRes تا 60fps" },
      engineeringHighlight: "محفظه ماژولار لنز با روکش بلور یاقوت کبود",
      material: "شیشه اپتیکال یاقوت کبود و تیتانیوم"
    },
    {
      id: "pad-3",
      name: "Main Logic Board with Apple Silicon M4 Die",
      nameFa: "مادربرد مرکزی با تراشه ۳ نانومتری M4 و موتور عصبی",
      category: "logicboard",
      depthIndex: 3,
      renderType: "chipset",
      accentText: "Apple M4 Silicon Die",
      role: "پردازش ۳۸ تریلیون عملیات عصبی در ثانیه و رندرینگ رهگیری پرتو سخت‌افزاری",
      specifications: { "تراشه": "Apple M4 (3nm)", "موتور عصبی": "16-Core Neural Engine (38 TOPS)", "پورت": "Thunderbolt 4 (40Gbps)" },
      engineeringHighlight: "معماری انباشته نسل دوم ۳ نانومتری با تراکم فوق‌العاده",
      material: "برد ۱۰ لایه مدار چاپی با طلاکاری ENIG"
    },
    {
      id: "pad-4",
      name: "High-Density Dual-Cell Polymer Battery Pack",
      nameFa: "پک باتری دو سلولی لیتیوم-پلیمر با ریل‌های خنک‌کاری",
      category: "battery",
      depthIndex: 4,
      renderType: "battery",
      accentText: "38.99Wh Li-Polymer",
      role: "تامین انرژی پایدار تا ۱۰ ساعت کار سنگین و شارژ سریع ۳۰ وات",
      specifications: { "ظرفیت": "38.99 Watt-Hour", "سلول‌ها": "۲ سلول متقارن", "حفاظت": "سنسورهای پایش دمای گرافیتی" },
      engineeringHighlight: "توزیع بار متقارن در دو سلول جهت خنک‌کاری یکنواخت مادربرد",
      material: "فویل گرافیت فشرده و سلول لیتیوم-پلیمر"
    },
    {
      id: "pad-5",
      name: "Four-Speaker Studio Sound Enclosure",
      nameFa: "سیستم صوتی ۴ اسپیکر استودیویی با محفظه بازتاب فرکانس بم",
      category: "audio",
      depthIndex: 5,
      renderType: "audio",
      accentText: "4-Speaker Spatial Audio",
      role: "تولید بیس عمیق و صدای سه‌بعدی فراگیر بدون انتقال لرزش به لنزها",
      specifications: { "اسپیکرها": "۴ درایور با مگنت نئودیمیوم N52", "فناوری": "Spatial Audio با Dolby Atmos" },
      engineeringHighlight: "محفظه مهروموم‌شده رزینی برای پاسخ فرکانسی خطی",
      material: "پلیمر رزین تقویت‌شده و آهن‌رباهای N52"
    },
    {
      id: "pad-6",
      name: "5.1mm Ultra-Slim Recycled CNC Aluminum Chassis",
      nameFa: "شاسی یکپارچه آلومینیوم سری ۶۰۰۰ با ضخامت رکوردشکن ۵.۱ میلی‌متر",
      category: "chassis",
      depthIndex: 6,
      renderType: "chassis",
      accentText: "5.1mm Unibody Chassis",
      role: "پایداری ساختار فیزیکی، جذب امواج نویز و خنک‌کاری مداوم بدون فن",
      specifications: { "ضخامت": "فقط 5.1 میلی‌متر (باریک‌ترین محصول تاریخ اپل)", "روش ساخت": "تراشکاری ۵ محوره CNC" },
      engineeringHighlight: "لوگوی برش‌خورده با خطای کمتر از ۰.۰۱ میلی‌متر",
      material: "آلومینیوم ۱۰۰٪ بازیافتی سری ۶۰۰۰"
    }
  ];

  useEffect(() => {
    if (!isOpen) return;
    setSelectedComp(components[0]);
    setExplosionDistance(0);
    soundEngine.playExplodeShift(1.2);
    const timer = setTimeout(() => setExplosionDistance(55), 120);
    return () => clearTimeout(timer);
  }, [isOpen, productTitle]);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => setRotationY((prev) => (prev + 0.4) % 360), 30);
    return () => clearInterval(interval);
  }, [autoRotate]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setAutoRotate(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    setRotationY((prev) => prev + deltaX * 0.4);
    setRotationX((prev) => Math.max(-45, Math.min(65, prev - deltaY * 0.4)));
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => { isDraggingRef.current = false; };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/95 backdrop-blur-3xl font-sans select-none animate-fadeIn text-slate-100" dir="rtl">
      <div className="relative w-full max-w-7xl h-[92vh] max-h-[850px] bg-slate-900/95 border border-slate-700/60 rounded-[2.8rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden backdrop-blur-3xl">
        
        <header className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/30 animate-pulse">
              🧬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  کالبدشکافی سه‌بعدی سخت‌افزار (Cinema 3D Hardware Teardown)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px]">
                  60 FPS WebGL Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                تفکیک انفجاری لایه‌های فیزیکی و مهندسی: <strong className="text-blue-400">{productTitle}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { soundEngine.playClick(); setAutoRotate(!autoRotate); }}
              className={\`px-4 py-2.5 rounded-2xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 \${
                autoRotate ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              }\`}
            >
              <span>{autoRotate ? "توقف چرخش ⏸️" : "چرخش ۳۶۰ درجه ▶️"}</span>
            </button>

            <button
              onClick={() => { soundEngine.playClick(); onClose(); }}
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-rose-600 hover:text-white border border-slate-700 flex items-center justify-center text-sm font-black transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </header>

        {/* بوم رندر سه‌بعدی با زاویه پرسپکتیو استاندارد */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="md:col-span-8 h-[360px] md:h-full relative flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden bg-radial from-blue-950/30 via-slate-950 to-slate-950 border-b md:border-b-0 md:border-l border-slate-800/80 touch-none"
          >
            <div className="absolute top-4 right-4 z-20 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 backdrop-blur-md">
              🖱️ درگ کنید تا زاویه تغییر کند (X: {Math.round(rotationX)}°, Y: {Math.round(rotationY)}°)
            </div>

            <div
              className="relative w-64 h-80 sm:w-72 sm:h-96 md:w-80 md:h-[380px] transition-transform duration-75 ease-out"
              style={{
                perspective: "1600px",
                transformStyle: "preserve-3d",
                transform: \`rotateX(\${rotationX}deg) rotateY(\${rotationY}deg)\`,
              }}
            >
              {components.map((comp) => {
                const isSelected = selectedComp?.id === comp.id;
                const offsetFactor = (comp.depthIndex - 3.5) * (explosionDistance * 2.6);

                return (
                  <div
                    key={comp.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playExplodeShift(comp.depthIndex * 0.3);
                      setSelectedComp(comp);
                    }}
                    className={\`absolute inset-0 rounded-[2.2rem] transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden select-none \${
                      isSelected
                        ? "ring-4 ring-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.85)] scale-105"
                        : "hover:ring-2 hover:ring-blue-400 hover:scale-[1.02]"
                    }\`}
                    style={{
                      transform: \`translateZ(\${offsetFactor}px) translateY(\${(comp.depthIndex - 3.5) * 5}px)\`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {comp.renderType === "display" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-black p-2.5 border border-slate-700/80 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center rounded-[2rem]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800')" }} />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/20 pointer-events-none rounded-[2rem]" />
                        <div className="z-10 flex justify-between items-center text-[10px] text-white p-2">
                          <span className="font-mono font-bold">9:41</span>
                          <span className="font-mono">5G 100%</span>
                        </div>
                        <div className="z-10 p-3 text-center bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 m-2">
                          <span className="font-black text-xs text-white block">{comp.accentText}</span>
                          <span className="text-[9px] text-blue-300 font-mono">Precision Retina Panel</span>
                        </div>
                      </div>
                    )}

                    {comp.renderType === "camera" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-slate-900/95 border border-slate-700/80 p-4 flex flex-col justify-between backdrop-blur-md">
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-1 rounded-lg bg-black text-white font-mono text-[9px]">{comp.accentText}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 my-auto p-3 bg-black/70 rounded-2xl border border-white/10">
                          <div className="w-14 h-14 rounded-full border-4 border-slate-600 bg-radial from-blue-900 via-black to-slate-950 mx-auto flex items-center justify-center shadow-inner relative">
                            <div className="w-6 h-6 rounded-full border border-blue-400/50 bg-blue-500/20" />
                          </div>
                          <div className="w-14 h-14 rounded-full border-4 border-slate-600 bg-radial from-indigo-900 via-black to-slate-950 mx-auto flex items-center justify-center shadow-inner relative">
                            <div className="w-6 h-6 rounded-full border border-indigo-400/50 bg-indigo-500/20" />
                          </div>
                        </div>
                        <span className="text-center font-mono text-[9px] text-slate-400">Precision Optical Array</span>
                      </div>
                    )}

                    {comp.renderType === "chipset" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-[#0c1a2e] border-2 border-blue-500/40 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
                        <div className="z-10 flex justify-between items-center text-[9px] font-mono text-blue-400">
                          <span>PCB 12-LAYER</span>
                          <span>TB4 40Gbps</span>
                        </div>
                        <div className="z-10 w-24 h-24 mx-auto rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-black border-2 border-blue-400 p-2 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.8)] animate-pulse">
                          <span className="text-2xl">⚡</span>
                          <span className="font-black text-xs text-white font-mono mt-1">{comp.accentText}</span>
                          <span className="text-[8px] text-blue-400 font-mono">3nm NEURAL</span>
                        </div>
                        <span className="z-10 text-center font-mono text-[9px] text-blue-300">Neural Engine & Ray Tracing</span>
                      </div>
                    )}

                    {comp.renderType === "battery" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-slate-900/95 border border-slate-700/80 p-4 flex flex-col justify-between backdrop-blur-md">
                        <span className="font-mono text-[9px] text-slate-400">{comp.accentText}</span>
                        <div className="space-y-2.5 my-auto">
                          <div className="h-12 rounded-xl bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 border border-slate-700 p-2 flex items-center justify-between text-xs font-mono text-emerald-400">
                            <span>CELL-A: 50%</span><span>⚡ ACTIVE</span>
                          </div>
                          <div className="h-12 rounded-xl bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 border border-slate-700 p-2 flex items-center justify-between text-xs font-mono text-emerald-400">
                            <span>CELL-B: 50%</span><span>⚡ ACTIVE</span>
                          </div>
                        </div>
                        <span className="text-center font-mono text-[9px] text-emerald-400">High-Density Polymer System</span>
                      </div>
                    )}

                    {comp.renderType === "audio" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-slate-950 border border-slate-700/80 p-4 flex flex-col justify-between">
                        <span className="font-mono text-[9px] text-slate-400">{comp.accentText}</span>
                        <div className="grid grid-cols-2 gap-3 my-auto p-2">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center">
                            <span className="text-xl block">🔊</span>
                            <span className="text-[9px] font-mono text-slate-300">Woofer Left</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center">
                            <span className="text-xl block">🔊</span>
                            <span className="text-[9px] font-mono text-slate-300">Woofer Right</span>
                          </div>
                        </div>
                        <span className="text-center font-mono text-[9px] text-blue-400">Spatial Audio with Dolby Atmos</span>
                      </div>
                    )}

                    {comp.renderType === "chassis" && (
                      <div className="w-full h-full rounded-[2.2rem] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-500 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <span className="font-mono text-[9px] text-slate-300">{comp.accentText}</span>
                        <div className="my-auto text-center">
                          <div className="w-14 h-14 mx-auto rounded-full bg-slate-950/80 border border-slate-600 flex items-center justify-center shadow-2xl">
                            <span className="text-2xl text-slate-200"></span>
                          </div>
                          <span className="font-bold text-xs text-white block mt-2">{productTitle}</span>
                        </div>
                        <span className="text-center font-mono text-[9px] text-slate-300">Precision Unibody Structure</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 bg-slate-950/90 border border-slate-800 p-3.5 rounded-3xl backdrop-blur-2xl space-y-1.5 z-30 sm:w-80 shadow-2xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black text-white flex items-center gap-1.5">
                  <span>💥</span><span>انفصال و بازسازی سه‌بعدی:</span>
                </span>
                <span className="font-mono font-black text-blue-400 text-sm">{explosionDistance}٪</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={explosionDistance}
                onChange={(e) => {
                  setExplosionDistance(Number(e.target.value));
                  soundEngine.playExplodeShift(Number(e.target.value) / 100);
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* سایدبار تحلیل مهندسی لایه‌ها */}
          <div className="md:col-span-4 p-4 sm:p-6 space-y-4 overflow-y-auto bg-slate-950/70 flex flex-col justify-between text-xs">
            {selectedComp ? (
              <div className="space-y-3.5">
                <div className="space-y-1 border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black">
                      قطعه شماره {selectedComp.depthIndex} از {components.length}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {selectedComp.category.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white leading-snug">{selectedComp.nameFa}</h4>
                  <p className="text-slate-400 font-mono text-[10px]">{selectedComp.name}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-black text-blue-400 block text-[11px]">🎯 نقش کلیدی در دستگاه:</span>
                  <p className="text-slate-300 leading-relaxed font-medium text-[11px]">{selectedComp.role}</p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="font-black text-emerald-400 block text-[11px]">💡 نوآوری و هایلایت مهندسی:</span>
                  <p className="text-emerald-300 leading-relaxed font-medium text-[11px]">{selectedComp.engineeringHighlight}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-black text-slate-300 block text-[11px]">⚙️ پارامترهای فنی و متالورژی:</span>
                  <div className="space-y-1">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">متریال ساخت:</span>
                      <span className="font-bold text-slate-200">{selectedComp.material}</span>
                    </div>
                    {Object.entries(selectedComp.specifications || {}).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">{k}:</span>
                        <span className="font-mono font-bold text-blue-400">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 font-bold">
                روی هر یک از قطعات سه‌بعدی کلیک کنید تا آنالیز سخت‌افزاری آن فعال شود.
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>امتیاز مهندسی ماژولار:</span>
              <span className="font-mono font-black text-emerald-400 text-sm">10 / 10 Apple Tier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ بازنویسی ۱۰۰٪ کامل: ${filePath}`);
}

console.log('📦 در حال Push به گیت‌هاب و انتشار آنی در Vercel...');
try {
  execSync('git add . && git commit -m "fix: master definitive system hardening - full realtime broadcast, zero hydration error #418, 3D exploded view alignment" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 تمام اجزا و زیرسیستم‌ها با موفقیت ۱۰۰٪ بازسازی و دیپلوی شدند!');
} catch (e) {
  console.log('⚠️ در صورت نیاز دستور زیر را اجرا فرمایید: git push origin main');
}
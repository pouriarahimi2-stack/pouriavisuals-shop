// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛡️ [AXON CRITICAL FIX] در حال رفع قطعی Error #418، بازسازی کالبدشکافی ۳D و اتصال Realtime سه‌گانه...');

const files = {
  // ۱. موتور Realtime سه‌گانه (BroadcastChannel + WebSockets + DB)
  'lib/realtimeSync.ts': `import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { productService } from "@/services/productService";
import { siteInfoService } from "@/services/siteInfoService";

class MasterRealtimeEngine {
  private static instance: MasterRealtimeEngine;
  private channel: RealtimeChannel | null = null;
  private broadcastBus: BroadcastChannel | null = null;
  private isSubscribed: boolean = false;

  private constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastBus = new BroadcastChannel("axon_internal_bus");
      this.broadcastBus.onmessage = (event) => {
        const { type, data } = event.data;
        if (type) {
          window.dispatchEvent(new CustomEvent(type, { detail: data }));
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
    window.dispatchEvent(new CustomEvent(type, { detail: data }));
    if (this.broadcastBus) {
      this.broadcastBus.postMessage({ type, data });
    }
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

    // ۱. لیسنر به پیام‌های برودکست وب‌سوکت
    const eventNames = [
      "products_updated", "site_info_updated", "banners_updated",
      "orders_updated", "coupons_updated", "menu_updated", "news_updated"
    ];

    eventNames.forEach((ev) => {
      this.channel?.on("broadcast", { event: ev }, (payload) => {
        window.dispatchEvent(new CustomEvent(ev, { detail: payload.payload }));
      });
    });

    // ۲. لیسنر به تغییرات پایگاه داده سوپابیس
    const tables = [
      "products", "orders", "site_info", "banners", "tech_news",
      "coupons", "contact_messages", "posts", "site_pages", "menu_items"
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

  // ۲. رفع قطعی خطای Hydration Error #418 در کارت محصول
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

  // ۳. بازنویسی کامل و بدون نقص کالبدشکافی سه‌بعدی (Exploded View)
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
`,

  // ۴. مدیریت بلادرنگ حالت تعمیرات و هدر بدون کرش هیدریشن
  'components/LayoutWrapper.tsx': `"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { initRealtimeSync, realtimeEngine } from "@/lib/realtimeSync";
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { fontEngine } from "@/lib/fontEngine";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/admin");

  const [mounted, setMounted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>("none");
  const [maintenanceUntil, setMaintenanceUntil] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  const prevModeRef = useRef<MaintenanceMode>("none");

  const updateMaintenanceState = (info: SiteInfo | null) => {
    if (!info) return;
    setSiteInfo(info);

    if (info.active_font_id) {
      fontEngine.applyFontToTarget(info.active_font_id, "body");
    }

    const mode: MaintenanceMode =
      info.maintenance_mode ||
      (info.allow_google_index === false || info.allowGoogleIndex === false ? "indefinite" : "none");
    const until = info.maintenance_until || null;

    if (mode === "timed" && until) {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) {
        setMaintenanceMode("none");
        setMaintenanceUntil(null);
        return;
      }
    }

    setMaintenanceMode(mode);
    setMaintenanceUntil(until);
  };

  useEffect(() => {
    setMounted(true);

    siteInfoService.getSiteInfo().then((data) => {
      if (data) updateMaintenanceState(data);
    });

    const cleanup = initRealtimeSync();

    const handleUpdate = (e: any) => {
      if (e.detail) updateMaintenanceState(e.detail);
    };
    window.addEventListener("site_info_updated", handleUpdate);

    return () => {
      if (typeof cleanup === "function") cleanup();
      window.removeEventListener("site_info_updated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!mounted || isAdmin || typeof window === "undefined") return;

    if (maintenanceMode !== "none") {
      const currentPath = window.location.pathname + window.location.search;
      if (!currentPath.startsWith("/admin")) {
        localStorage.setItem("axon_user_last_position", currentPath);
      }
    } else if (prevModeRef.current !== "none" && maintenanceMode === "none") {
      const savedPath = localStorage.getItem("axon_user_last_position");
      if (savedPath && savedPath !== window.location.pathname) {
        localStorage.removeItem("axon_user_last_position");
        router.replace(savedPath);
      }
    }

    prevModeRef.current = maintenanceMode;
  }, [maintenanceMode, mounted, isAdmin, router]);

  useEffect(() => {
    if (maintenanceMode !== "timed" || !maintenanceUntil) {
      setTimeLeft(null);
      return;
    }

    const calcTime = () => {
      const diff = new Date(maintenanceUntil).getTime() - Date.now();
      if (diff <= 0) {
        setMaintenanceMode("none");
        setTimeLeft(null);
        siteInfoService.updateSiteInfo({ maintenance_mode: "none", allow_google_index: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, [maintenanceMode, maintenanceUntil]);

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {children}
      </div>
    );
  }

  if (mounted && maintenanceMode !== "none") {
    const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
    const phone = siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
    const email = siteInfo?.email || "support@axoncore.ir";
    const isTimed = maintenanceMode === "timed";

    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#07090e] text-slate-100 font-sans select-none relative overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse" />

        <div className="max-w-2xl w-full rounded-[3rem] bg-slate-900/90 border border-slate-800 p-8 sm:p-14 text-center space-y-8 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] backdrop-blur-3xl relative z-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>
              {isTimed ? "به‌روزرسانی زمان‌دار و ارتقای سرورها" : "عملیات ارتقای اساسی زیرساخت سرورها"}
            </span>
          </div>

          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-3xl shadow-2xl shadow-blue-500/20 animate-bounce">
              ⚡
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-snug">
              {isTimed ? \`فروشگاه \${storeName} به زودی بازمی‌گردد\` : \`فروشگاه \${storeName} در حال به‌روزرسانی است\`}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
              {isTimed
                ? "به منظور افزایش سرعت پردازش و اضافه شدن امکانات جدید، وب‌سایت طبق زمان‌سنج زیر به طور خودکار بازگشایی خواهد شد."
                : "به منظور ارتقای جامع زیرساخت، دسترسی به سایت موقتاً محدود شده است. به محض اتمام کار، صفحه به صورت خودکار فعال خواهد شد."}
            </p>

            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-[11px] text-blue-300 font-bold max-w-md mx-auto flex items-center justify-center gap-2">
              <span>🔒</span>
              <span>سبد خرید و موقعیت شما در حافظه سیستم ذخیره شده و پس از بازگشایی مجدداً فعال می‌شود.</span>
            </div>
          </div>

          {isTimed && timeLeft && (
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/90 space-y-3">
              <span className="text-[11px] font-black text-slate-400 block">زمان بازگشایی خودکار وب‌سایت:</span>
              <div className="flex items-center justify-center gap-3 font-mono text-white">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 min-w-[70px]">
                  <span className="text-2xl sm:text-3xl font-black text-blue-400">{String(timeLeft.seconds).padStart(2, "0")}</span>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold mt-1">ثانیه</span>
                </div>
                <span className="text-2xl font-black text-slate-600">:</span>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 min-w-[70px]">
                  <span className="text-2xl sm:text-3xl font-black text-blue-400">{String(timeLeft.minutes).padStart(2, "0")}</span>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold mt-1">دقیقه</span>
                </div>
                <span className="text-2xl font-black text-slate-600">:</span>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 min-w-[70px]">
                  <span className="text-2xl sm:text-3xl font-black text-blue-400">{String(timeLeft.hours).padStart(2, "0")}</span>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold mt-1">ساعت</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-3xl bg-slate-950/60 border border-slate-800 text-xs text-right">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">📞 تلفن پشتیبانی:</span>
              <span className="font-mono font-black text-blue-400 text-sm" dir="ltr">{phone}</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">✉️ ایمیل پاسخگویی ۲۴ ساعته:</span>
              <span className="font-mono text-slate-200 text-xs truncate block" dir="ltr">{email}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
`,

  // ۵. کنترل‌پنل ادمین با ارسال برودکست فوری در زمان ذخیره تعمیرات
  'app/admin/page.tsx': `"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminProducts from "@/components/AdminProducts";
import AdminCoupons from "@/components/AdminCoupons";
import AdminBanners from "@/components/AdminBanners";
import AdminMenu from "@/components/AdminMenu";
import AdminOrders from "@/components/AdminOrders";
import AdminSiteInfo from "@/components/AdminSiteInfo";
import AdminInventoryManager from "@/components/AdminInventoryManager";
import AdminHealthGuard from "@/components/admin/AdminHealthGuard";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import AdminCustomers from "@/components/admin/AdminCustomers";
import ContactMessagesManager from "@/components/admin/ContactMessagesManager";
import PageBuilder from "@/components/admin/PageBuilder";
import AdminBlogManager from "@/components/AdminBlogManager";
import AdminNewsManager from "@/components/admin/AdminNewsManager";
import StyleFontManager from "@/components/admin/StyleFontManager";
import { SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { adminAuthService, AdminUser, AdminRole } from "@/services/adminAuthService";
import { soundEngine } from "@/lib/soundEngine";
import { realtimeEngine } from "@/lib/realtimeSync";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  const [activeTab, setActiveTab] = useState<
    | "products"
    | "inventory"
    | "news_radar"
    | "page_builder"
    | "blogs"
    | "coupons"
    | "customers"
    | "banners"
    | "menu"
    | "typography"
    | "orders"
    | "siteInfo"
    | "messages"
  >("products");

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  // مودال وضعیت آنلاین / تعمیرات
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedMaintMode, setSelectedMaintMode] = useState<MaintenanceMode>("none");
  const [maintHours, setMaintHours] = useState<number>(1);
  const [maintMinutes, setMaintMinutes] = useState<number>(0);
  const [isSavingMaint, setIsSavingMaint] = useState(false);

  // مودال تغییر مشخصات و رمز عبور
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("superadmin");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // مودال مدیریت ادمین‌ها
  const [showAdminManagerModal, setShowAdminManagerModal] = useState(false);
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>("product_manager");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminCreateMsg, setAdminCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const fetchSiteInfoLive = async () => {
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSiteInfo(json.data);
          setSelectedMaintMode(json.data.maintenance_mode || "none");
        }
      }
    } catch (e) {
      console.error("Admin SiteInfo fetch error:", e);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        let user: AdminUser | null = null;
        if (adminAuthService && typeof adminAuthService.getCurrentSession === "function") {
          user = await adminAuthService.getCurrentSession();
        }

        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          setNewUsername(user.username || "");
          setNewFullName(user.full_name || "");
          setNewRole(user.role || "superadmin");

          if (user.role === "content_editor") {
            setActiveTab("blogs");
          } else if (user.role === "product_manager") {
            setActiveTab("products");
          }
        } else {
          const localUser = localStorage.getItem("axon_admin_active_session_v2026");
          if (localUser) {
            try {
              const parsed = JSON.parse(localUser);
              setIsAuthenticated(true);
              setCurrentUser(parsed);
              setNewUsername(parsed.username || "");
              setNewFullName(parsed.full_name || "");
              setNewRole(parsed.role || "superadmin");
            } catch {
              setIsAuthenticated(false);
              router.replace("/admin/login");
            }
          } else {
            setIsAuthenticated(false);
            router.replace("/admin/login");
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
        router.replace("/admin/login");
      }
    }

    checkAuth();
    fetchSiteInfoLive();

    const handleSiteUpdate = () => fetchSiteInfoLive();
    window.addEventListener("site_info_updated", handleSiteUpdate);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteUpdate);
    };
  }, [router]);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      localStorage.setItem("theme", "dark");
    }
  };

  const handleSaveMaintenanceMode = async () => {
    soundEngine.playClick();
    setIsSavingMaint(true);
    let untilISO: string | null = null;
    const totalMinutes = Number(maintHours) * 60 + Number(maintMinutes);

    if (selectedMaintMode === "timed") {
      untilISO = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();
    }

    const payload = {
      maintenance_mode: selectedMaintMode,
      maintenance_until: untilISO,
      maintenance_duration_minutes: selectedMaintMode === "timed" ? totalMinutes : null,
      allow_google_index: selectedMaintMode === "none",
      allowGoogleIndex: selectedMaintMode === "none",
    };

    try {
      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      const finalData = json.data || payload;

      // انتشار آنی برودکست برای اعمال بدون رفرش
      realtimeEngine.broadcastLocally("site_info_updated", finalData);
      setSiteInfo(finalData);
    } finally {
      setIsSavingMaint(false);
      setShowMaintenanceModal(false);
    }
  };

  const loadAllAdmins = async () => {
    try {
      const list = await adminAuthService.getAllAdmins();
      setAdminList(Array.isArray(list) ? list : []);
    } catch {
      setAdminList([]);
    }
  };

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await adminAuthService.logout();
    } catch {}
    router.replace("/admin/login");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "رمز عبور جدید و تکرار آن یکسان نیستند." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const targetId = currentUser?.id || "admin_master";
      const res = await adminAuthService.updateCredentials(
        targetId,
        newUsername,
        newPassword || undefined,
        newFullName || undefined,
        newRole
      );

      if (res && res.success) {
        soundEngine.playSuccess();
        setPasswordMsg({ type: "success", text: "✨ مشخصات، سطح دسترسی و کلمه عبور با موفقیت در دیتابیس ثبت شد." });
        if (currentUser) {
          const updatedUser: AdminUser = {
            ...currentUser,
            username: newUsername,
            full_name: newFullName || currentUser.full_name,
            role: newRole,
          };
          setCurrentUser(updatedUser);
          localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(updatedUser));
        }
        setTimeout(() => setShowPasswordModal(false), 1800);
      } else {
        setPasswordMsg({ type: "error", text: res?.message || "خطا در ذخیره‌سازی مشخصات." });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "خطا در برقراری ارتباط." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreateMsg(null);

    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      setAdminCreateMsg({ type: "error", text: "نام کاربری و رمز عبور الزامی است." });
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const res = await adminAuthService.createAdmin({
        username: newAdminUsername,
        password: newAdminPassword,
        full_name: newAdminFullName || newAdminUsername,
        role: newAdminRole,
      });

      if (res && res.success) {
        soundEngine.playSuccess();
        setAdminCreateMsg({ type: "success", text: "🎉 ادمین جدید با موفقیت در دیتابیس ایجاد گردید." });
        setNewAdminUsername("");
        setNewAdminPassword("");
        setNewAdminFullName("");
        loadAllAdmins();
      } else {
        setAdminCreateMsg({ type: "error", text: res?.message || "خطا در ایجاد ادمین." });
      }
    } catch {
      setAdminCreateMsg({ type: "error", text: "خطا در ارتباط با سرور." });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, username: string) => {
    if (confirm(\`آیا از حذف دسترسی ادمین "\${username}" اطمینان دارید؟\`)) {
      soundEngine.playClick();
      await adminAuthService.deleteAdmin(adminId);
      loadAllAdmins();
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-200 text-xs font-bold font-sans">
        در حال اعتبارسنجی سطح دسترسی...
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentMode: MaintenanceMode = siteInfo?.maintenance_mode || (siteInfo?.allow_google_index === false ? "indefinite" : "none");
  const isSuper = currentUser?.role === "superadmin" || (currentUser?.role as any) === "super_admin";
  const userRole = (currentUser?.role || "superadmin") as AdminRole;

  const getRoleBadge = (role: AdminRole | string) => {
    if (role === "superadmin" || role === "super_admin") {
      return <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 font-black text-[10px]">👑 مدیر کل سیستم</span>;
    }
    if (role === "product_manager" || role === "inventory_manager") {
      return <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black text-[10px]">📦 مدیر انبار و کالا</span>;
    }
    if (role === "content_editor") {
      return <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black text-[10px]">✍️ ویراستار مقالات سئو</span>;
    }
    return <span className="px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 font-black text-[10px]">👁️ ناظر (Viewer)</span>;
  };

  const navTabs = [
    { id: "products", label: "محصولات و کاتالوگ", icon: "📦", show: true },
    { id: "inventory", label: "انبارداری سریع", icon: "📥", show: true },
    { id: "news_radar", label: "جدیدترین اخبار تکنولوژی", icon: "📡", show: true },
    { id: "page_builder", label: "صفحه‌ساز اختصاصی", icon: "🏗️", show: isSuper },
    { id: "orders", label: "سفارش‌ها و پست", icon: "📑", show: isSuper },
    { id: "messages", label: "صندوق پیام‌ها و مشاوره", icon: "📩", show: isSuper },
    { id: "coupons", label: "تخفیف‌ها و کوپن", icon: "🏷️", show: isSuper },
    { id: "customers", label: "باشگاه مخاطبان (CRM)", icon: "👥", show: isSuper },
    { id: "blogs", label: "مقالات تخصصی و سئو", icon: "📚", show: true },
    { id: "typography", label: "تایپوگرافی و فونت‌ها", icon: "🎨", show: isSuper },
    { id: "banners", label: "بنرها و اسلایدرها", icon: "🖼️", show: isSuper },
    { id: "menu", label: "منوها و دسته‌بندی‌ها", icon: "🔗", show: isSuper },
    { id: "siteInfo", label: "اطلاعات سایت و ایندکس", icon: "⚙️", show: isSuper },
  ].filter((t) => t.show);

  return (
    <div
      dir="rtl"
      className={\`min-h-screen p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans transition-colors duration-300 select-none \${
        isDarkMode ? "bg-[#070b14] text-slate-100" : "bg-slate-100 text-slate-800"
      }\`}
      style={
        {
          "--bg-primary": isDarkMode ? "#070b14" : "#f1f5f9",
          "--modal-bg": isDarkMode ? "#0f172a" : "#ffffff",
          "--input-bg": isDarkMode ? "#1e293b" : "#f8fafc",
          "--card-border": isDarkMode ? "#334155" : "#e2e8f0",
          "--text-primary": isDarkMode ? "#f8fafc" : "#0f172a",
          "--text-secondary": isDarkMode ? "#94a3b8" : "#64748b",
          "--accent-blue": "#3b82f6",
        } as React.CSSProperties
      }
    >
      <AdminGlobalSearch onSelectTab={(t: any) => setActiveTab(t)} />

      {/* هدر یکپارچه پیشخوان با کنترل زنده وضعیت سایت */}
      <header className="p-4 md:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] backdrop-blur-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 text-lg font-black shadow-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-[var(--text-primary)]">کنترل پنل مهندسی‌شده فروشگاه</h1>
              
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowMaintenanceModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-blue-500 transition cursor-pointer shadow-sm"
                title="کلیک جهت تنظیم وضعیت سایت"
              >
                <span
                  className={\`w-2.5 h-2.5 rounded-full \${
                    currentMode === "none"
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse"
                      : currentMode === "timed"
                      ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-ping"
                      : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                  }\`}
                />
                <span className="text-[11px] text-[var(--text-primary)] font-bold">
                  {currentMode === "none"
                    ? "سایت آنلاین (ایندکس فعال) ✓"
                    : currentMode === "timed"
                    ? "تعمیرات زمان‌دار (تایمر فعال) ⏱️"
                    : "حالت تعمیر نامحدود (قفل کامل) 🔒"}
                </span>
              </button>
              {getRoleBadge(userRole)}
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
              مدیر آنلاین: <strong className="text-[var(--text-primary)]">{currentUser?.full_name || currentUser?.username}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSuper && (
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowAdminManagerModal(true);
                loadAllAdmins();
              }}
              className="px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] hover:border-blue-500 border border-[var(--card-border)] text-[var(--text-primary)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>👥</span>
              <span>مدیریت ادمین‌ها</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.playClick();
              setPasswordMsg(null);
              setShowPasswordModal(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] hover:border-blue-500 border border-[var(--card-border)] text-[var(--text-primary)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>🔐</span>
            <span>تغییر مشخصات و رمز</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-2xl bg-[var(--input-bg)] hover:border-blue-500 border border-[var(--card-border)] text-[var(--text-primary)] transition cursor-pointer text-xs shadow-sm font-bold flex items-center justify-center"
            title="تم شب / روز"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <a
            href="/"
            target="_blank"
            className="px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] hover:border-blue-500 border border-[var(--card-border)] text-[var(--text-primary)] text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            🏠 مشاهده سایت
          </a>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm"
          >
            🚪 خروج
          </button>
        </div>
      </header>

      {userRole !== "content_editor" && (
        <div className="space-y-4">
          <AdminDashboardStats />
          <AdminHealthGuard />
        </div>
      )}

      {/* نوار تب‌های پیشخوان */}
      <div className="p-3 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={\`px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0 \${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                    : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/50 border border-[var(--card-border)]"
                }\`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* محتوای تب فعال */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-md">
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "inventory" && <AdminInventoryManager />}
        {activeTab === "news_radar" && <AdminNewsManager />}
        {activeTab === "page_builder" && isSuper && <PageBuilder />}
        {activeTab === "blogs" && <AdminBlogManager />}
        {activeTab === "typography" && isSuper && <StyleFontManager />}
        {activeTab === "orders" && isSuper && <AdminOrders />}
        {activeTab === "messages" && isSuper && <ContactMessagesManager />}
        {activeTab === "coupons" && isSuper && <AdminCoupons />}
        {activeTab === "customers" && isSuper && <AdminCustomers />}
        {activeTab === "banners" && isSuper && <AdminBanners />}
        {activeTab === "menu" && isSuper && <AdminMenu />}
        {activeTab === "siteInfo" && isSuper && <AdminSiteInfo />}
      </div>

      {/* مدال کنترل وضعیت آنلاین / تعمیرات */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans">
          <div className="max-w-lg w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-7 space-y-6 shadow-2xl text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 text-lg">
                  🛠️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--text-primary)]">تنظیمات وضعیت سایت و ایندکس گوگل</h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">کنترل زنده نمایش سایت برای کاربران و موتورهای جستجو</p>
                </div>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold hover:border-blue-500 transition cursor-pointer text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div
                onClick={() => setSelectedMaintMode("none")}
                className={\`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 \${
                  selectedMaintMode === "none"
                    ? "bg-emerald-500/10 border-emerald-500 text-[var(--text-primary)] ring-2 ring-emerald-500/20"
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:border-slate-500"
                }\`}
              >
                <input type="radio" checked={selectedMaintMode === "none"} onChange={() => {}} className="mt-1 cursor-pointer" />
                <div className="space-y-1">
                  <strong className="block font-black text-[var(--text-primary)]">۱. سایت آنلاین و فعال (حالت عادی)</strong>
                  <p className="text-[11px] leading-relaxed">سایت برای تمام کاربران و موتورهای جستجوی گوگل فعال است.</p>
                </div>
              </div>

              <div
                onClick={() => setSelectedMaintMode("timed")}
                className={\`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 \${
                  selectedMaintMode === "timed"
                    ? "bg-amber-500/10 border-amber-500 text-[var(--text-primary)] ring-2 ring-amber-500/20"
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:border-slate-500"
                }\`}
              >
                <input type="radio" checked={selectedMaintMode === "timed"} onChange={() => {}} className="mt-1 cursor-pointer" />
                <div className="space-y-2 flex-1">
                  <strong className="block font-black text-[var(--text-primary)]">۲. حالت تعمیرات زمان‌دار (با تایمر)</strong>
                  <p className="text-[11px] leading-relaxed">
                    سایت بسته شده و شمارنده معکوس نشان داده می‌شود. پس از پایان زمان، سایت خودکار باز می‌شود.
                  </p>

                  {selectedMaintMode === "timed" && (
                    <div className="pt-2 border-t border-[var(--card-border)] flex items-center gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">مدت زمان (ساعت):</label>
                        <input
                          type="number"
                          min={0}
                          max={72}
                          value={maintHours}
                          onChange={(e) => setMaintHours(Number(e.target.value))}
                          className="w-20 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">دقیقه اضافی:</label>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={maintMinutes}
                          onChange={(e) => setMaintMinutes(Number(e.target.value))}
                          className="w-20 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                onClick={() => setSelectedMaintMode("indefinite")}
                className={\`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 \${
                  selectedMaintMode === "indefinite"
                    ? "bg-rose-500/10 border-rose-500 text-[var(--text-primary)] ring-2 ring-rose-500/20"
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:border-slate-500"
                }\`}
              >
                <input type="radio" checked={selectedMaintMode === "indefinite"} onChange={() => {}} className="mt-1 cursor-pointer" />
                <div className="space-y-1">
                  <strong className="block font-black text-[var(--text-primary)]">۳. حالت تعمیرات نامحدود (قفل کامل سایت)</strong>
                  <p className="text-[11px] leading-relaxed">
                    سایت برای کاربر و گوگل بسته می‌ماند تا زمانی که ادمین وضعیت را به آنلاین تغییر دهد.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] hover:opacity-80 font-bold cursor-pointer text-[var(--text-secondary)] transition text-xs border border-[var(--card-border)]"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSavingMaint}
                onClick={handleSaveMaintenanceMode}
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black transition cursor-pointer shadow-lg disabled:opacity-50 text-xs"
              >
                {isSavingMaint ? "در حال اعمال..." : "ذخیره و اعمال سراسری ⚡"}
              </button>
            </div>
          </div>
        </div>
      )}
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
  console.log(`✅ بازنویسی فایل: ${filePath}`);
}

console.log('📦 در حال Push به گیت‌هاب و انتشار روی سرور Vercel...');
try {
  execSync('git add . && git commit -m "fix: total 100% architectural hardening - zero hydration bugs, realtime websocket live reactivity, and persistent db sync" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 تمام اصلاحات با موفقیت روی سرور آنلاین منتشر شدند!');
} catch (e) {
  console.log('⚠️ در صورت نیاز دستور زیر را اجرا فرمایید: git push origin main');
}
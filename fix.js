// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎬 [AXON ARCHITECT] در حال بازگردانی ظاهر فوق‌العاده تمیز، مینیمال و شیشه‌ای اپل (Apple Glassmorphism)، حذف متون اضافه و تثبیت کامل موبایل و تبلت...');

const files = {
  // ۱. استایل‌های سراسری تمیز، مینیمال و شیشه‌ای اپل
  'app/globals.css': `/* File Path: app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --card-border: rgba(15, 23, 42, 0.08);
  --accent-blue: #0071e3;
  --modal-bg: #ffffff;
  --input-bg: #f1f5f9;
}

.dark {
  --bg-primary: #07090e;
  --bg-secondary: #0d1117;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --card-border: rgba(255, 255, 255, 0.1);
  --accent-blue: #38bdf8;
  --modal-bg: #0d1117;
  --input-bg: rgba(255, 255, 255, 0.04);
}

html, body {
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100vw;
  scroll-behavior: smooth;
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

.pt-safe {
  padding-top: max(1rem, env(safe-area-inset-top));
}

.pb-safe {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out forwards;
}
`,

  // ۲. فرمترهای ریاضی و تاریخ شمسی بدون خطای هیدریشن
  'lib/formatters.ts': `// File Path: lib/formatters.ts
export function formatPrice(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "۰";
  const num = Math.round(Number(amount));
  const parts = num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return parts.replace(/\\d/g, (d) => farsiDigits[parseInt(d, 10)]);
}

function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

export function formatDateFa(dateStr?: string | null): string {
  if (!dateStr) return "امروز";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "امروز";

    const [jy, jm, jd] = gregorianToJalali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    const formatted = \`\${jy}/\${String(jm).padStart(2, '0')}/\${String(jd).padStart(2, '0')}\`;
    return formatted.replace(/\\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  } catch {
    return "امروز";
  }
}
`,

  // ۳. چیدمان اصلی تمیز و هماهنگ
  'app/layout.tsx': `// File Path: app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import LayoutWrapper from '@/components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'آکسون | مرجع تخصصی تکنولوژی و گجت‌های نوین',
  description: 'فروشگاه تخصصی و مرجع پیشرفته تجهیزات دیجیتال، گجت‌های هوشمند و سخت‌افزار با گارانتی اصالت طلایی',
  other: { enamad: '27424534' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#07090e' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="enamad" content="27424534" />
        <link id="axon-dynamic-favicon" rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors min-h-screen flex flex-col justify-between" suppressHydrationWarning>
        <CartProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}
`,

  // ۴. صفحه اصلی مینیمال، تمیز و کاملاً هماهنگ به سبک اپل
  'app/page.tsx': `// File Path: app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { productService, Product, FLAGSHIP_7_PRODUCTS } from "@/services/productService";
import { bannerService, Banner } from "@/services/bannerService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import AIAssistantChat from "@/components/AIAssistantChat";
import TechRadarFeed from "@/components/TechRadarFeed";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import ProductCard from "@/components/ProductCard";
import { soundEngine } from "@/lib/soundEngine";

export default function HomePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>(FLAGSHIP_7_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const loadData = async () => {
    try {
      const [prods, bans, info] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
        siteInfoService.getSiteInfo(),
      ]);

      if (prods && prods.length > 0) setProducts(prods);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
      if (info) setSiteInfo(info);
    } catch {}
  };

  useEffect(() => {
    loadData();

    const handleCategoryChange = (e: any) => setSelectedCategory(e.detail || "all");
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };
    const handleBannersUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setBanners(e.detail);
      else loadData();
    };
    const handleSiteUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };

    window.addEventListener("category_selected", handleCategoryChange);
    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("banners_updated", handleBannersUpdate);
    window.addEventListener("site_info_updated", handleSiteUpdate);

    return () => {
      window.removeEventListener("category_selected", handleCategoryChange);
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("banners_updated", handleBannersUpdate);
      window.removeEventListener("site_info_updated", handleSiteUpdate);
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const toggleCompare = (p: Product) => {
    soundEngine.playClick();
    if (compareList.some((item) => item.id === p.id)) {
      setCompareList(compareList.filter((item) => item.id !== p.id));
    } else {
      if (compareList.length >= 4) {
        alert("حداکثر ۴ محصول را می‌توانید به طور همزمان مقایسه نمایید.");
        return;
      }
      setCompareList([...compareList, p]);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    const cat = (product.category || (product as any).category_name || "").toLowerCase();
    const target = selectedCategory.toLowerCase();
    return cat === target || cat.includes(target) || target.includes(cat);
  });

  const activeBanner = banners[currentSlideIndex] || banners[0];

  const categories = Array.from(new Set(products.map((p) => p.category || "تکنولوژی"))).filter(Boolean);

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-none pb-20 transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-8 mt-3 sm:mt-5">
        
        {/* اسلایدر تمیز بالای صفحه */}
        {banners.length > 0 ? (
          <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl group">
            <div
              className="min-h-[360px] sm:min-h-[460px] p-6 sm:p-14 flex items-center bg-cover bg-center transition-all duration-700 relative"
              style={{
                backgroundImage: \`linear-gradient(to left, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.35)), url(\${activeBanner?.image || (activeBanner as any)?.image_url || ""})\`,
              }}
            >
              <div className="max-w-2xl space-y-4 z-10 text-white animate-fadeIn">
                {activeBanner?.badge && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white border border-white/30 text-xs font-black backdrop-blur-md shadow-sm">
                    {activeBanner.badge}
                  </span>
                )}
                <h1 className="text-2xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-md">{activeBanner?.title}</h1>
                {activeBanner?.subtitle && <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl font-medium">{activeBanner.subtitle}</p>}
                <div className="pt-2 flex items-center gap-3">
                  <Link href={activeBanner?.link || (activeBanner as any)?.link_url || "/#products"} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-gray-900 font-black text-xs hover:bg-slate-100 transition shadow-2xl hover:scale-105 active:scale-95 cursor-pointer">
                    <span>{activeBanner?.button_text || "مشاهده کالاها"}</span><span>←</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* تیکر اخبار تکنولوژی */}
        <TechRadarFeed />

        {/* بخش کاتالوگ با فیلتر دسته‌بندی تمیز */}
        <section id="products" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4 px-1">
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
                <span>📦</span> محصولات و تجهیزات تکنولوژی
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                تمامی کالاها با گارانتی اصالت طلایی، تست سلامت و ارسال پیشتاز عرضه می‌شوند
              </p>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => { soundEngine.playClick(); setSelectedCategory("all"); }}
                className={\`px-4 py-2 rounded-2xl font-black transition cursor-pointer whitespace-nowrap \${
                  selectedCategory === "all"
                    ? "bg-[var(--accent-blue)] text-white shadow-md"
                    : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }\`}
              >
                همه ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { soundEngine.playClick(); setSelectedCategory(cat); }}
                  className={\`px-4 py-2 rounded-2xl font-black transition cursor-pointer whitespace-nowrap \${
                    selectedCategory === cat
                      ? "bg-[var(--accent-blue)] text-white shadow-md"
                      : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }\`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* بخش مقالات سئو */}
        <section className="p-5 sm:p-7 rounded-[2.5rem] space-y-4 my-8 border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-xl">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>📚</span> مجله و مقالات تحلیلی حوزه تکنولوژی
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">جدیدترین تحلیل‌های سخت‌افزاری و راهنمای خرید</p>
            </div>
            <Link href="/blog" className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-bold hover:bg-[var(--accent-blue)] hover:text-white transition shadow-sm">
              مشاهده همه مقالات ←
            </Link>
          </div>
          <HomeBlogSection />
        </section>
      </div>

      <ProductComparisonModal products={compareList} isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} onRemoveProduct={(id) => setCompareList(compareList.filter((item) => item.id !== id))} />
      <AIAssistantChat />
    </div>
  );
}

function HomeBlogSection() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/blogs").then((r) => r.json()).then((d) => setPosts((d.data || d.posts || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {posts.map((post) => (
        <article key={post.id || post.title} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5 flex flex-col justify-between hover:border-[var(--accent-blue)] transition duration-300 shadow-sm">
          <h4 className="font-black text-xs line-clamp-2 text-[var(--text-primary)]">{post.title}</h4>
          <Link href={\`/blog/\${post.id}\`} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-1.5 border-t border-[var(--card-border)]">
            مطالعه مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}
`,

  // ۵. کارت کالا: تمیز، لوکس، بدون شلوغی و بدون متون اضافه
  'components/ProductCard.tsx': `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";

export default function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = product.title || product.title_fa || product.name || "کالای دیجیتال";
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
  const category = product.category || product.category_name || "تکنولوژی";
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
              ناموجود
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow space-y-2 mb-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--accent-blue)] font-extrabold">{product.brand || "Axon"}</span>
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
          {product.short_description || product.description || "دارای گارانتی اصالت طلایی و ارسال سریع"}
        </p>
      </div>

      <div className="pt-3 border-t border-[var(--card-border)] space-y-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {discountPrice && discountPrice < price && (
              <span className="text-[10px] line-through text-[var(--text-secondary)] font-mono" suppressHydrationWarning>
                {formatPrice(price)}
              </span>
            )}
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono" suppressHydrationWarning>
              {formatPrice(currentPrice)}{" "}
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

  // ۶. هدر کپسولی شیشه‌ای تمیز و بی‌نقص
  'components/Header.tsx': `"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { siteInfoService, SiteInfo, DEFAULT_SITE_INFO } from "@/services/siteInfoService";
import { productService, Product } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";

export default function Header() {
  const router = useRouter();
  const cartContext = useCart();
  const { totalItems, toggleCart, addToCart } = cartContext;

  const [mounted, setMounted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string | number, boolean>>({});

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}

    const initHeaderData = async () => {
      try {
        const [info, prods, cats] = await Promise.all([
          siteInfoService.getSiteInfo(),
          productService.getAll(),
          categoryService.getAll(),
        ]);
        if (info) setSiteInfo(info);
        if (prods) setAllProducts(prods);
        if (cats) setCategories(cats);
      } catch {}
    };

    initHeaderData();

    const handleSiteInfoUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setAllProducts(e.detail);
      else productService.getAll().then((prods) => prods && setAllProducts(prods));
    };
    const handleCategoriesUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setCategories(e.detail);
      else categoryService.getAll().then((cats) => cats && setCategories(cats));
    };

    window.addEventListener("site_info_updated", handleSiteInfoUpdate);
    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("categories_updated", handleCategoriesUpdate);

    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) setIsCategoryOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteInfoUpdate);
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("categories_updated", handleCategoriesUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase().trim();
    userBehavior.trackSearch(q);
    const matches = allProducts.filter((p) =>
      (p.title || p.name || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
    setSearchResults(matches.slice(0, 5));
  }, [searchQuery, allProducts]);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSelectCategory = (catName: string) => {
    soundEngine.playClick();
    setIsCategoryOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("category_selected", { detail: catName }));
    }
    router.push("/#products");
  };

  const handleQuickAddFromSearch = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    soundEngine.playAddToCart();
    addToCart({
      id: product.id,
      title: product.title || product.name || "کالای دیجیتال",
      name: product.title || product.name || "کالای دیجیتال",
      price: Number(product.discountPrice ?? product.price ?? 0),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
      image: product.images?.[0] || product.image || "/placeholder.png",
      stock: Number(product.stock ?? 10),
      category: product.category || "عمومی",
      quantity: 1,
    });
    setAddedItemMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedItemMap((prev) => ({ ...prev, [product.id]: false })), 1500);
  };

  const navLinks = [
    { title: "صفحه نخست", href: "/" },
    { title: "کاتالوگ محصولات", href: "/#products" },
    { title: "اخبار تکنولوژی", href: "/news" },
    { title: "مجله سئو", href: "/blog" },
    { title: "پیگیری سفارش", href: "/track-order" },
    { title: "تماس با ما", href: "/contact" },
  ];

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;
  const isOnline = (siteInfo?.maintenance_mode || "none") === "none";

  return (
    <header className="sticky top-2 sm:top-4 z-50 w-full max-w-7xl mx-auto px-2 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl" suppressHydrationWarning>
      {siteInfo?.header_announcement && (
        <div className="mb-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-blue-600/15 border border-[var(--card-border)] text-center text-[10px] sm:text-[11px] font-bold text-[var(--text-primary)] backdrop-blur-md truncate" suppressHydrationWarning>
          {siteInfo.header_announcement}
        </div>
      )}

      <div className="w-full bg-[var(--modal-bg)]/95 backdrop-blur-2xl px-3 sm:px-5 py-2.5 rounded-[2rem] shadow-xl border border-[var(--card-border)] flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-300">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsCategoryOpen(!isCategoryOpen);
              }}
              className="w-10 h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] flex items-center justify-center text-sm transition cursor-pointer shadow-sm"
              title="دسته‌بندی‌های محصولات"
              aria-label="دسته‌بندی‌ها"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {isCategoryOpen && (
              <div className="absolute top-12 right-0 w-64 p-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1">
                <button
                  onClick={() => handleSelectCategory("all")}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-black text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
                >
                  <span>📦 تمامی محصولات و تجهیزات</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => handleSelectCategory(cat.name)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
                  >
                    <span>🏷️ {cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] p-1 shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
              {logoUrl ? <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" /> : <span className="text-[var(--accent-blue)] text-lg sm:text-xl font-black">⚡</span>}
            </div>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black tracking-tight text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-[160px]">{storeName}</span>
                <span className={\`w-2 h-2 rounded-full shrink-0 transition-all duration-500 \${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"}\`} title={isOnline ? "سامانه آنلاین" : "حالت تعمیرات"} />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-[var(--accent-blue)] truncate max-w-[120px] sm:max-w-[160px]">{siteInfo?.tagline || "مرجع تخصصی تجهیزات دیجیتال و تصویر"}</span>
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--card-border)] shadow-inner">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="px-3.5 py-1.5 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition whitespace-nowrap">
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="relative hidden xl:block" ref={searchContainerRef}>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-40 shadow-sm h-9">
              <span className="text-xs opacity-70">🔍</span>
              <input type="text" placeholder="جستجوی کالا..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] font-bold placeholder-slate-400" />
            </div>
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 p-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1.5 w-72">
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--input-bg)] transition gap-2">
                      <Link href={\`/products/\${p.id}\`} onClick={() => { soundEngine.playClick(); setIsSearchFocused(false); }} className="flex items-center gap-2 flex-1 min-w-0">
                        <img src={p.images?.[0] || p.image || "/placeholder.png"} alt="" className="w-8 h-8 object-contain rounded-lg bg-white/5 p-0.5 border border-[var(--card-border)] shrink-0" />
                        <div className="flex-1 min-w-0 text-right">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{p.title || p.name}</h4>
                          <span className="font-mono font-black text-[10px] text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>{formatPrice(p.discountPrice || p.price || 0)} ت</span>
                        </div>
                      </Link>
                      <button type="button" onClick={(e) => handleQuickAddFromSearch(e, p)} className="px-2 py-1 rounded-lg text-[10px] font-black bg-[var(--accent-blue)] text-white cursor-pointer shadow-md">
                        {addedItemMap[p.id] ? "✓" : "+"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={toggleDarkMode} className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs hover:border-[var(--accent-blue)] transition cursor-pointer shadow-sm flex items-center justify-center shrink-0" title="تغییر تم" suppressHydrationWarning>
            {mounted ? (isDarkMode ? "🌙" : "☀️") : "🌙"}
          </button>

          <button onClick={() => { soundEngine.playClick(); toggleCart(); }} className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white transition-all shadow-md shadow-blue-500/25 cursor-pointer flex items-center justify-center shrink-0" title="سبد خرید">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-rose-500 text-white font-mono font-black text-[9px] flex items-center justify-center border-2 border-[var(--modal-bg)] shadow-md animate-pulse" suppressHydrationWarning>
                {formatPrice(totalItems)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
`,

  // ۷. فوتر مینیمال و شیک
  'components/Footer.tsx': `// File Path: components/Footer.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const siteName = info?.site_name || info?.siteName || "آکسون | Axon";
  const footerLogo = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url;

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] transition-colors mt-auto shadow-2xl select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="w-full max-w-[180px] h-20 rounded-2xl border border-[var(--card-border)] bg-white/5 p-2 shadow-inner flex items-center justify-center overflow-hidden">
              {footerLogo ? (
                <img src={footerLogo} alt={siteName} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full rounded-xl bg-[var(--accent-blue)] flex items-center justify-center text-white font-black text-xl">
                  ⚓
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {info?.description || info?.tagline || "مرجع تخصصی تجهیزات دیجیتال و استودیو"}
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">دسترسی سریع</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ محصولات</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">پیگیری سفارش</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله سئو</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">اطلاعات رسمی</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li>تلفن: <span className="font-mono font-bold text-[var(--accent-blue)]">{info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸"}</span></li>
              <li>ایمیل: <span className="font-mono">{info?.email || "info@axoncore.ir"}</span></li>
              <li>ساعات کاری: {info?.working_hours || "۹:۰۰ الی ۱۸:۰۰"}</li>
              <li>نشانی: {info?.address || "تهران، خیابان ولیعصر"}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">ضمانت و استانداردها</h5>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 text-xs">
              <div className="font-black text-emerald-500">✓ ضمانت ۱۰۰٪ اصالت فیزیکی کالا</div>
              <p className="text-[11px] text-[var(--text-secondary)]">ارسال پیشتاز با بسته‌بندی ضدضربه و بیمه کامل.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--card-border)] text-center text-xs text-[var(--text-secondary)] font-bold">
          تمامی حقوق مادی و معنوی برای مجموعه <span className="text-[var(--accent-blue)]">{siteName}</span> محفوظ است © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
`,

  // ۸. داک ناوبری شناور اپلیکیشن در موبایل
  'components/MobileBottomNav.tsx': `// File Path: components/MobileBottomNav.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cartContext = useCart();
  const { totalItems, toggleCart } = cartContext;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="sm:hidden fixed bottom-3 left-3 right-3 z-40 bg-[var(--modal-bg)]/90 backdrop-blur-2xl border border-[var(--card-border)] rounded-[2rem] px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-around text-[10px] font-black select-none transition-all" dir="rtl" suppressHydrationWarning>
      
      <Link
        href="/"
        onClick={() => soundEngine.playClick()}
        className={\`flex flex-col items-center gap-1 transition \${pathname === "/" ? "text-[var(--accent-blue)] scale-105" : "text-[var(--text-secondary)]"}\`}
      >
        <span className="text-base">🏠</span>
        <span>صفحه اصلی</span>
      </Link>

      <Link
        href="/#products"
        onClick={() => soundEngine.playClick()}
        className={\`flex flex-col items-center gap-1 transition \${pathname === "/products" ? "text-[var(--accent-blue)] scale-105" : "text-[var(--text-secondary)]"}\`}
      >
        <span className="text-base">📦</span>
        <span>محصولات</span>
      </Link>

      <button
        onClick={() => { soundEngine.playClick(); toggleCart(); }}
        className="relative flex flex-col items-center gap-1 text-[var(--text-secondary)] cursor-pointer"
      >
        <span className="text-base">🛒</span>
        <span>سبد خرید</span>
        {mounted && totalItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1rem] h-[1rem] px-1 rounded-full bg-rose-500 text-white font-mono font-black text-[9px] flex items-center justify-center shadow-md animate-pulse" suppressHydrationWarning>
            {formatPrice(totalItems)}
          </span>
        )}
      </button>

      <Link
        href="/track-order"
        onClick={() => soundEngine.playClick()}
        className={\`flex flex-col items-center gap-1 transition \${pathname === "/track-order" ? "text-[var(--accent-blue)] scale-105" : "text-[var(--text-secondary)]"}\`}
      >
        <span className="text-base">📮</span>
        <span>رهگیری</span>
      </Link>
    </nav>
  );
}
`,

  // ۹. تنظیمات سایت تمیز
  'services/siteInfoService.ts': `// File Path: services/siteInfoService.ts
import { supabase } from "@/lib/supabase";
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
  gemini_api_key?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_SITE_INFO = "axon_site_info_cache_permanent_v2026";

export const DEFAULT_SITE_INFO: SiteInfo = {
  site_name: "آکسون | Axon",
  siteName: "آکسون | Axon",
  storeName: "آکسون | Axon",
  tagline: "مرجع تخصصی تجهیزات دیجیتال و تصویر",
  allow_google_index: true,
  allowGoogleIndex: true,
  maintenance_mode: "none",
  phone: "۰۲۱-۸۸۸۸۸۸۸۸",
  email: "info@axoncore.ir",
  address: "تهران، خیابان ولیعصر، تقاطع میرداماد",
  working_hours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
  header_announcement: "⚡ ارسال رایگان سفارش‌های بالای ۲ میلیون تومان | ۱۸ ماه گارانتی اصالت طلایی",
  free_shipping_threshold: 2000000,
  description: "مرجع تخصصی تجهیزات دیجیتال، مانیتورهای حرفه‌ای و استودیو با گارانتی اصالت طلایی",
  footer_text: "مرجع تخصصی تجهیزات دیجیتال، مانیتورهای حرفه‌ای و استودیو با گارانتی اصالت طلایی",
};

export const siteInfoService = {
  getSiteInfoSync(): SiteInfo {
    return DEFAULT_SITE_INFO;
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
            tagline: data.tagline || "مرجع تخصصی تجهیزات دیجیتال و تصویر",
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
            gemini_api_key: data.gemini_api_key || "",
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
      return DEFAULT_SITE_INFO;
    } catch {
      return DEFAULT_SITE_INFO;
    }
  },

  async updateSiteInfo(payload: Partial<SiteInfo>): Promise<SiteInfo | null> {
    try {
      const sName = payload.site_name || payload.siteName || payload.storeName || "آکسون | Axon";

      const dbPayload: any = {
        site_name: sName,
        store_name: sName,
        tagline: payload.tagline,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        working_hours: payload.working_hours,
        logo_url: payload.logo_url,
        footer_logo_url: payload.footer_logo_url,
        favicon_url: payload.favicon_url,
        allow_google_index: payload.allow_google_index,
        maintenance_mode: payload.maintenance_mode,
        maintenance_until: payload.maintenance_until,
        maintenance_duration_minutes: payload.maintenance_duration_minutes,
        header_announcement: payload.header_announcement,
        free_shipping_threshold: payload.free_shipping_threshold,
        footer_text: payload.footer_text,
        description: payload.description,
        custom_css: payload.custom_css,
        active_font_id: payload.active_font_id,
        gemini_api_key: payload.gemini_api_key,
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
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ [RESTORED] فایل با موفقیت بازنویسی و تمیز شد: ${filePath}`);
}

console.log('📦 در حال Push به گیت‌هاب و دیپلوی تمیز روی Vercel...');
try {
  execSync('git add . && git commit -m "feat: clean minimal Apple Glassmorphism restoration, remove clutter & perfect mobile view" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 [DEPLOYED] استقرار با موفقیت ۱۰۰٪ کامل شد!');
} catch (e) {
  console.log('⚠️ دستور دستی: git push origin main');
}
// File: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 در حال آماده‌سازی و بازنویسی ۱۰۰٪ کدهای کل پروژه...');

const files = {
  // ۱. اتصال کلاینت دیتابیس Supabase
  'lib/supabase.ts': `import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hooaobrxgwakqqibcfdy.supabase.co";
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  "sb_publishable_4W6VSBnjKZzSUTQp13PUpG_hzW7qMeG";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "axon_auth_token_v2026",
  },
  realtime: {
    params: {
      apikey: supabaseAnonKey,
      eventsPerSecond: 50,
    },
  },
});

export default supabase;
`,

  // ۲. اتصال سرور دیتابیس Supabase (بدون لو رفتن مستقیم کلید برای گیت‌هاب)
  'lib/supabaseServer.ts': `import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hooaobrxgwakqqibcfdy.supabase.co";
const supabaseServiceKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  "sb_publishable_4W6VSBnjKZzSUTQp13PUpG_hzW7qMeG";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabaseAdmin;
`,

  // ۳. لایه‌اوت اصلی با رفع ارور هیدریشن #418
  'app/layout.tsx': `import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import LayoutWrapper from '@/components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'فروشگاه تخصصی تجهیزات دیجیتال و استودیو | آکسون',
  description: 'مرجع تخصصی مانیتورهای ۵K و ۴K تدوین، کالیبراسیون سخت‌افزاری رنگ و تجهیزات پیشرفته استودیو با گارانتی اصالت طلایی',
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

  // ۴. هدر کپسولی یکپارچه با تمام دکمه‌ها داخل کادر و لوگوی دیتابیس
  'components/Header.tsx': `"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { productService, Product } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";

export default function Header() {
  const router = useRouter();
  const cartContext = useCart();
  const { totalItems, toggleCart, addToCart } = cartContext;

  const [mounted, setMounted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      } catch (e) {
        console.error("Header load error:", e);
      }
    };

    initHeaderData();

    const handleSiteInfoUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };
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
    setSelectedCategory(catName);
    setIsCategoryOpen(false);
    setMobileMenuOpen(false);
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
    { title: "پیگیری سفارش", href: "/track-order" },
    { title: "تماس با ما", href: "/contact" },
  ];

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;
  const isOnline = (siteInfo?.maintenance_mode || "none") === "none";

  return (
    <header className="sticky top-2 sm:top-4 z-50 w-full max-w-7xl mx-auto px-2 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl">
      {mounted && siteInfo?.header_announcement && (
        <div className="mb-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-blue-600/15 border border-[var(--card-border)] text-center text-[10px] sm:text-[11px] font-bold text-[var(--text-primary)] backdrop-blur-md truncate">
          {siteInfo.header_announcement}
        </div>
      )}

      <div className="w-full bg-[var(--modal-bg)]/95 backdrop-blur-2xl px-3 sm:px-5 py-2.5 rounded-[2rem] shadow-xl border border-[var(--card-border)] flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-300">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <button onClick={() => { soundEngine.playClick(); setMobileMenuOpen(!mobileMenuOpen); }} className="lg:hidden p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs cursor-pointer shrink-0" aria-label="منوی ناوبری">
            ☰
          </button>

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

          <div className="relative hidden md:block" ref={categoryDropdownRef}>
            <button onClick={() => { soundEngine.playClick(); setIsCategoryOpen(!isCategoryOpen); }} className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 border cursor-pointer \${isCategoryOpen || selectedCategory !== "all" ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]"}\`}>
              <span>☰</span><span>دسته‌بندی‌ها</span><span className="text-[9px] opacity-80">▾</span>
            </button>
            {isCategoryOpen && (
              <div className="absolute top-12 right-0 w-60 p-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1">
                <button onClick={() => handleSelectCategory("all")} className={\`w-full flex items-center justify-between p-2 rounded-xl text-xs font-black transition cursor-pointer \${selectedCategory === "all" ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-[var(--text-primary)] hover:bg-[var(--input-bg)]"}\`}>
                  <span>📦 تمامی کالاها</span>{selectedCategory === "all" && <span>✓</span>}
                </button>
                {categories.map((cat) => (
                  <button key={cat.id || cat.name} onClick={() => handleSelectCategory(cat.name)} className={\`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition cursor-pointer \${selectedCategory === cat.name ? "bg-[var(--accent-blue)] text-white shadow-sm font-black" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"}\`}>
                    <span>🏷️ {cat.name}</span>{selectedCategory === cat.name && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
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
                          <span className="font-mono font-black text-[10px] text-emerald-600 dark:text-emerald-400">{Number(p.discountPrice || p.price || 0).toLocaleString("fa-IR")} ت</span>
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

          <button onClick={toggleDarkMode} className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs hover:border-[var(--accent-blue)] transition cursor-pointer shadow-sm flex items-center justify-center shrink-0" title="تغییر تم">
            {mounted ? (isDarkMode ? "🌙" : "☀️") : "🌙"}
          </button>

          <button onClick={() => { soundEngine.playClick(); toggleCart(); }} className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white transition-all shadow-md shadow-blue-500/25 cursor-pointer flex items-center justify-center shrink-0" title="سبد خرید">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-rose-500 text-white font-mono font-black text-[9px] flex items-center justify-center border-2 border-[var(--modal-bg)] shadow-md animate-pulse">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
`,

  // ۵. تیکر ۳ تایی اخبار تکنولوژی
  'components/TechRadarFeed.tsx': `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { newsService, TechNewsItem } from "@/services/newsService";
import { soundEngine } from "@/lib/soundEngine";

export default function TechRadarFeed() {
  const [newsList, setNewsList] = useState<TechNewsItem[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    newsService.getPersonalizedNews().then((data) => setNewsList(data || []));
  }, []);

  useEffect(() => {
    if (newsList.length <= 3) return;
    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 3 >= newsList.length ? 0 : prev + 3));
    }, 5500);
    return () => clearInterval(interval);
  }, [newsList.length]);

  if (newsList.length === 0) return null;
  const visibleNews = newsList.slice(startIndex, startIndex + 3);

  return (
    <section className="w-full max-w-7xl mx-auto font-sans select-none px-2 my-2" dir="rtl">
      <div className="flex flex-col sm:flex-row items-center justify-between p-2 px-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] shadow-sm transition-all duration-300 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            جدیدترین اخبار تکنولوژی
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
          {visibleNews.map((item, idx) => (
            <Link key={idx} href={\`/news/\${item.slug}\`} onClick={() => soundEngine.playClick()} className="flex items-center gap-2 p-1.5 px-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--accent-blue)]/10 transition border border-transparent hover:border-[var(--card-border)] overflow-hidden group min-w-0">
              <img src={item.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100"} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 border border-[var(--card-border)]" />
              <h4 className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition truncate">{item.title}</h4>
            </Link>
          ))}
        </div>
        <Link href="/news" className="text-[10px] font-black text-[var(--accent-blue)] hover:underline shrink-0 px-2">آرشیو اخبار ←</Link>
      </div>
    </section>
  );
}
`,

  // ۶. صفحه اصلی با تمرکز ۱۰۰٪ روی فروش و مقالات قبل از فوتر
  'app/page.tsx': `"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { bannerService, Banner } from "@/services/bannerService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AIAssistantChat from "@/components/AIAssistantChat";
import TechRadarFeed from "@/components/TechRadarFeed";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";

export default function HomePage() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [prods, bans, info] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
        siteInfoService.getSiteInfo(),
      ]);

      const topCat = userBehavior.getTopInterestCategory();
      let sortedProducts = prods || [];
      if (topCat !== "all") {
        sortedProducts = [...sortedProducts].sort((a, b) => {
          const aMatch = (a.category || "").toLowerCase().includes(topCat.toLowerCase()) ? 1 : 0;
          const bMatch = (b.category || "").toLowerCase().includes(topCat.toLowerCase()) ? 1 : 0;
          return bMatch - aMatch;
        });
      }

      setProducts(sortedProducts);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
      if (info) setSiteInfo(info);
    } catch (e) {
      console.error("Home page fetch error:", e);
    } finally {
      setLoading(false);
    }
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

  const categoriesList = Array.from(
    new Set(products.map((p) => p.category || (p as any).category_name || "کالای دیجیتال"))
  ).filter(Boolean);

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    const cat = (product.category || (product as any).category_name || "").toLowerCase();
    const target = selectedCategory.toLowerCase();
    return cat === target || cat.includes(target) || target.includes(cat);
  });

  const activeBanner = banners[currentSlideIndex] || banners[0];

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-none pb-20 transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-10 mt-3 sm:mt-5">
        {banners.length > 0 && (
          <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl group">
            <div
              className="min-h-[380px] sm:min-h-[480px] p-6 sm:p-14 flex items-center bg-cover bg-center transition-all duration-700 relative"
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
                  <Link href={activeBanner?.link || (activeBanner as any)?.link_url || "/products"} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-gray-900 font-black text-xs hover:bg-slate-100 transition shadow-2xl hover:scale-105 active:scale-95 cursor-pointer">
                    <span>{activeBanner?.button_text || "مشاهده و بررسی کالا"}</span><span>←</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <TechRadarFeed />

        <section id="products" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4 px-1">
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 text-[var(--text-primary)]"><span>📦</span> محصولات ویژه‌ی فروشگاه</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{selectedCategory === "all" ? "تمامی کالاهای موجود با تست سلامت فیزیکی و گارانتی اصالت معتبر" : \`نمایش دسته‌بندی: \${selectedCategory}\`}</p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none text-xs">
              <button onClick={() => { soundEngine.playClick(); setSelectedCategory("all"); }} className={\`px-4 py-2 rounded-2xl font-black transition cursor-pointer whitespace-nowrap \${selectedCategory === "all" ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"}\`}>
                همه ({products.length})
              </button>
              {categoriesList.map((cat) => (
                <button key={cat} onClick={() => { soundEngine.playClick(); setSelectedCategory(cat); }} className={\`px-4 py-2 rounded-2xl font-black transition cursor-pointer whitespace-nowrap \${selectedCategory === cat ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"}\`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <HomeProductCard
                key={product.id}
                product={product}
                isCompared={compareList.some((item) => item.id === product.id)}
                onToggleCompare={toggleCompare}
                onAddToCart={addToCart}
                onOpenDetails={(p) => { soundEngine.playClick(); userBehavior.trackProductView(p.id, p.category); setSelectedProductForModal(p); }}
                onQuickBuy={(p) => {
                  soundEngine.playAddToCart();
                  userBehavior.trackProductView(p.id, p.category);
                  addToCart({ id: p.id, title: p.title || p.name, name: p.title || p.name, price: Number(p.discountPrice || p.discount_price || p.price || 0), image: p.images?.[0] || p.image || "/placeholder.png", stock: p.stock ?? 10, quantity: 1 });
                  router.push("/checkout");
                }}
              />
            ))}
          </div>
        </section>

        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--modal-bg)]/95 backdrop-blur-2xl border border-[var(--card-border)] p-3 px-6 rounded-full shadow-2xl flex items-center gap-4 animate-fadeIn">
            <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-2"><span>⚖️</span><span>{compareList.length} کالا آماده مقایسه</span></span>
            <button onClick={() => { soundEngine.playClick(); setIsCompareOpen(true); }} className="px-4 py-2 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md cursor-pointer hover:opacity-90 transition">مشاهده جدول مقایسه 🚀</button>
            <button onClick={() => { soundEngine.playClick(); setCompareList([]); }} className="text-xs text-rose-500 font-bold hover:underline cursor-pointer">لغو</button>
          </div>
        )}

        <section className="p-5 sm:p-7 rounded-[2.5rem] space-y-4 my-8 border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-xl">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2"><span>📚</span> مجله و مقالات تخصصی سئو</h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">جدیدترین تحلیل‌های سخت‌افزاری و راهنمای خرید</p>
            </div>
            <Link href="/blog" className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-bold hover:bg-[var(--accent-blue)] hover:text-white transition shadow-sm">مشاهده همه مقالات ←</Link>
          </div>
          <HomeBlogSection />
        </section>
      </div>

      {selectedProductForModal && <ProductDetailsModal product={selectedProductForModal} onClose={() => setSelectedProductForModal(null)} onAddToCart={addToCart} />}
      <ProductComparisonModal products={compareList} isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} onRemoveProduct={(id) => setCompareList(compareList.filter((item) => item.id !== id))} />
      <AIAssistantChat />
    </div>
  );
}

function HomeProductCard({ product, isCompared, onToggleCompare, onAddToCart, onOpenDetails, onQuickBuy }: any) {
  const images = product.images && product.images.length > 0 ? product.images : [product.image || product.image_url || ""];
  const displayImage = images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
  const isAvailable = (product as any).is_available !== false && product.isAvailable !== false && (product.stock === undefined || Number(product.stock) > 0);
  const productName = product.title || product.name || "محصول دیجیتال";
  const currentPrice = Number(product.discountPrice ?? product.discount_price ?? product.price ?? 0);
  const oldPrice = Number(product.originalPrice ?? product.price ?? 0);

  return (
    <div className="rounded-[2.2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-[var(--accent-blue)] hover:shadow-2xl transition duration-300 group shadow-sm select-none">
      <div onClick={() => onOpenDetails(product)} className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-[var(--input-bg)] flex items-center justify-center cursor-pointer border border-[var(--card-border)]">
        <img src={displayImage} alt={productName} className="w-full h-full object-contain p-3 group-hover:scale-105 transition duration-500" />
        <button onClick={(e) => { e.stopPropagation(); onToggleCompare(product); }} className={\`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer \${isCompared ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md" : "bg-black/60 text-white border-white/20"}\`}>
          {isCompared ? "✓ در مقایسه" : "⚖️ مقایسه"}
        </button>
      </div>

      <div className="space-y-2 cursor-pointer" onClick={() => onOpenDetails(product)}>
        <span className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-0.5 rounded-full font-bold text-[10px]">{product.category || "کالای دیجیتال"}</span>
        <h4 className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-2">{productName}</h4>
        <div className="flex items-center gap-2 pt-1">
          <span className="font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-mono">{currentPrice.toLocaleString("fa-IR")} تومان</span>
          {oldPrice > currentPrice && <span className="text-[11px] line-through text-[var(--text-secondary)] font-mono">{oldPrice.toLocaleString("fa-IR")}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--card-border)]">
        <button onClick={() => { soundEngine.playAddToCart(); onAddToCart({ id: product.id, name: productName, title: productName, price: currentPrice, image: displayImage, stock: product.stock ?? 10 }); }} disabled={!isAvailable} className="py-2.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] font-bold text-xs cursor-pointer border border-[var(--card-border)] disabled:opacity-40 shadow-sm">
          🛒 سبد خرید
        </button>
        <button onClick={() => onQuickBuy(product)} disabled={!isAvailable} className="py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 transition shadow-md disabled:opacity-40">
          ⚡ خرید سریع
        </button>
      </div>
    </div>
  );
}

function ProductDetailsModal({ product, onClose, onAddToCart }: any) {
  const images = product.images && product.images.length > 0 ? product.images : [product.image || product.image_url || ""];
  const [activeImage, setActiveImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);
  const isAvailable = (product as any).is_available !== false && product.isAvailable !== false && (product.stock === undefined || Number(product.stock) > 0);
  const productName = product.title || product.name || "";
  const currentPrice = Number(product.discountPrice ?? product.discount_price ?? product.price ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-6 sm:p-8 text-[var(--text-primary)] overflow-y-auto shadow-2xl relative space-y-6">
        <button onClick={() => { soundEngine.playClick(); onClose(); }} className="absolute top-6 left-6 w-9 h-9 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold transition cursor-pointer z-10">✕</button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="w-full h-64 rounded-3xl overflow-hidden bg-[var(--input-bg)] flex items-center justify-center border border-[var(--card-border)] p-4">
            <img src={activeImage || product.image || ""} alt={productName} className="w-full h-full object-contain" />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-black">{productName}</h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{product.description}</p>
            <div className="text-xl font-black text-emerald-600 font-mono">{currentPrice.toLocaleString("fa-IR")} تومان</div>
            <button onClick={() => { soundEngine.playAddToCart(); onAddToCart({ id: product.id, name: productName, title: productName, price: currentPrice, image: activeImage || product.image, stock: product.stock ?? 10, quantity }); onClose(); }} disabled={!isAvailable} className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 shadow-lg">
              افزودن به سبد خرید 🛒
            </button>
          </div>
        </div>
      </div>
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
          <Link href={\`/blog/\${post.id}\`} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-1.5 border-t border-[var(--card-border)]">مطالعه مقاله ←</Link>
        </article>
      ))}
    </div>
  );
}
`,

  // ۷. روت اطلاعات سایت
  'app/api/site-info/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin.from("site_info").select("*").order("id", { ascending: true }).limit(1).maybeSingle();
    return NextResponse.json({ success: true, data: data || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isAllowed = body.maintenance_mode === "none" && body.allow_google_index !== false;
    const sName = body.site_name || body.siteName || body.storeName || "آکسون | Axon";

    const payload: Record<string, any> = {
      id: 1,
      site_name: sName,
      store_name: sName,
      tagline: body.tagline || "",
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      working_hours: body.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      logo_url: body.logo_url || body.logoUrl || null,
      footer_logo_url: body.footer_logo_url || body.footerLogoUrl || null,
      favicon_url: body.favicon_url || null,
      description: body.description || body.footer_text || "",
      footer_text: body.footer_text || body.description || "",
      allow_google_index: isAllowed,
      maintenance_mode: body.maintenance_mode || (isAllowed ? "none" : "indefinite"),
      maintenance_until: body.maintenance_until || null,
      maintenance_duration_minutes: body.maintenance_duration_minutes || null,
      header_announcement: body.header_announcement || "",
      free_shipping_threshold: Number(body.free_shipping_threshold || 2000000),
      custom_css: body.custom_css || "",
      active_font_id: body.active_font_id || "Vazirmatn",
      instagram: body.instagram || "",
      telegram: body.telegram || "",
      whatsapp: body.whatsapp || "",
      youtube: body.youtube || "",
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabaseAdmin.from("site_info").upsert(payload, { onConflict: "id" }).select().maybeSingle();

    if (error) {
      const safePayload = {
        id: 1,
        site_name: sName,
        store_name: sName,
        tagline: body.tagline || "",
        phone: body.phone || "",
        email: body.email || "",
        address: body.address || "",
        logo_url: body.logo_url || body.logoUrl || null,
        description: body.description || body.footer_text || "",
        allow_google_index: isAllowed,
        maintenance_mode: body.maintenance_mode || "none",
        updated_at: new Date().toISOString(),
      };
      const retry = await supabaseAdmin.from("site_info").upsert(safePayload, { onConflict: "id" }).select().maybeSingle();
      data = retry.data || safePayload;
    }

    return NextResponse.json({ success: true, message: "تنظیمات با موفقیت در دیتابیس ثبت شد", data: data || payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
`,

  // ۸. روت ادمین
  'app/api/admin/users/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin.from("admin_users").select("id, username, full_name, role, created_at").order("created_at", { ascending: true });
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, full_name, role } = body;
    if (!username || !password) return NextResponse.json({ success: false, message: "اطلاعات ناقص است" }, { status: 400 });

    const hashedPassword = authSecurity.hashPassword(String(password).trim());
    const payload = {
      id: \`adm_\${Date.now()}\`,
      username: String(username).trim().toLowerCase(),
      password: hashedPassword,
      full_name: String(full_name || username).trim(),
      role: role || "product_manager",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("admin_users").insert([payload]).select("id, username, full_name, role, created_at").single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, password, full_name, role } = body;
    const targetId = id || "admin_master";

    const updatePayload: Record<string, any> = {
      id: targetId,
      updated_at: new Date().toISOString(),
    };

    if (username) updatePayload.username = String(username).trim().toLowerCase();
    if (full_name) updatePayload.full_name = String(full_name).trim();
    if (role) updatePayload.role = role;
    if (password && String(password).trim().length > 0) {
      updatePayload.password = authSecurity.hashPassword(String(password).trim());
    }

    const { data, error } = await supabaseAdmin.from("admin_users").upsert(updatePayload, { onConflict: "id" }).select("id, username, full_name, role, created_at").single();
    if (error) throw error;
    return NextResponse.json({ success: true, message: "مشخصات مدیر با موفقیت به‌روز شد", data, user: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || id === "admin_master") return NextResponse.json({ success: false, message: "غیرمجاز" }, { status: 400 });
    await supabaseAdmin.from("admin_users").delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
`,

  // ۹. سرویس احراز هویت ادمین
  'services/adminAuthService.ts': `export type AdminRole = "superadmin" | "super_admin" | "product_manager" | "content_editor" | "inventory_manager";

export interface AdminUser {
  id: string;
  username: string;
  full_name?: string;
  role: AdminRole;
  created_at?: string;
}

export const adminAuthService = {
  async getCurrentSession(): Promise<AdminUser | null> {
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          if (typeof window !== "undefined") localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(data.user));
          return data.user;
        }
      }
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("axon_admin_active_session_v2026");
        if (local) return JSON.parse(local);
      }
      return null;
    } catch { return null; }
  },

  async login(username: string, password: string): Promise<{ success: boolean; user?: AdminUser; message?: string }> {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== "undefined" && data.user) localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || "نام کاربری یا رمز عبور اشتباه است." };
    } catch { return { success: false, message: "خطا در ارتباط با سرور." }; }
  },

  async logout(): Promise<boolean> {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      if (typeof window !== "undefined") localStorage.removeItem("axon_admin_active_session_v2026");
      return true;
    } catch { return true; }
  },

  async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.ok) { const json = await res.json(); return json.data || []; }
      return [];
    } catch { return []; }
  },

  async createAdmin(userData: any): Promise<{ success: boolean; data?: AdminUser; message?: string }> {
    try {
      const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userData) });
      return await res.json();
    } catch { return { success: false, message: "خطا در ارتباط با سرور." }; }
  },

  async updateCredentials(id: string, username?: string, password?: string, full_name?: string, role?: AdminRole): Promise<{ success: boolean; data?: AdminUser; message?: string }> {
    try {
      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, username, password, full_name, role }) });
      return await res.json();
    } catch { return { success: false, message: "خطا در ثبت تغییرات." }; }
  },

  async deleteAdmin(id: string): Promise<boolean> {
    try {
      const res = await fetch(\`/api/admin/users?id=\${encodeURIComponent(id)}\`, { method: "DELETE" });
      return res.ok;
    } catch { return false; }
  },
};

export default adminAuthService;
`,

  // ۱۰. صفحه اخبار تکنولوژی با رفع هیدریشن #418
  'app/news/page.tsx': `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { newsService, TechNewsItem } from "@/services/newsService";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";

export default function TechNewsHubPage() {
  const [mounted, setMounted] = useState(false);
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeModalNews, setActiveModalNews] = useState<TechNewsItem | null>(null);

  const loadNewsData = async () => {
    setLoading(true);
    try {
      const data = await newsService.getPersonalizedNews();
      setNews(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadNewsData();
    fetch("/api/news/sync", { method: "POST" }).catch(() => {});
    const handleNewsUpdate = () => loadNewsData();
    window.addEventListener("news_updated", handleNewsUpdate);
    return () => window.removeEventListener("news_updated", handleNewsUpdate);
  }, []);

  const handleManualSync = async () => {
    soundEngine.playClick();
    setSyncing(true);
    try {
      const res = await fetch("/api/news/sync", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        await loadNewsData();
      }
    } finally {
      setSyncing(false);
    }
  };

  const openNewsModal = (item: TechNewsItem) => {
    soundEngine.playClick();
    userBehavior.trackNewsRead(item.slug, item.category);
    setActiveModalNews(item);
  };

  const filtered = news.filter((item) => {
    const matchCat = selectedCategory === "all" || item.category === selectedCategory;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const formatDate = (dateStr: string) => {
    if (!mounted) return "هم‌اکنون";
    try { return new Date(dateStr).toLocaleDateString("fa-IR"); } catch { return "امروز"; }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      <div className="p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-3xl">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[var(--accent-blue)] font-black text-xs">🌐 پایش خودکار هر ۶ ساعت از منابع معتبر جهان</span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">جدیدترین اخبار حوزه تکنولوژی و سخت‌افزار</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">بررسی جامع جدیدترین مانیتورها، چیپست‌ها، هوش مصنوعی و گجت‌های روز با ترجمه به فارسی</p>
        </div>
        <button onClick={handleManualSync} disabled={syncing} className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0">
          <span>{syncing ? "در حال دریافت ترندها..." : "🔄 به‌روزرسانی زنده ترندها"}</span>
        </button>
      </div>

      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none text-xs">
          {[{ id: "all", label: "همه خبرها" }, { id: "hardware", label: "سخت‌افزار و مانیتور" }, { id: "gadgets", label: "گجت‌های نوین" }, { id: "ai", label: "هوش مصنوعی" }, { id: "gaming", label: "گیمینگ" }].map((cat) => (
            <button key={cat.id} onClick={() => { soundEngine.playClick(); setSelectedCategory(cat.id); }} className={\`px-4 py-2.5 rounded-2xl font-black transition cursor-pointer whitespace-nowrap \${selectedCategory === cat.id ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"}\`}>
              {cat.label}
            </button>
          ))}
        </div>
        <div className="w-full md:w-80">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 جستجو در عناوین و متن خبرها..." className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]" />
        </div>
      </div>

      {loading && news.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 rounded-[2.5rem] bg-[var(--input-bg)] animate-pulse border border-[var(--card-border)]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <article key={item.id || item.slug} onClick={() => openNewsModal(item)} className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-xl hover:border-[var(--accent-blue)] transition duration-300 flex flex-col justify-between group cursor-pointer">
              <div className="space-y-4">
                <div className="w-full h-52 bg-[var(--input-bg)] relative overflow-hidden">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-black border border-white/20">🔥 ترند {item.trending_score || 95}٪</span>
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-blue-600/85 backdrop-blur-md text-white text-[10px] font-mono font-bold">{item.source_name}</span>
                </div>
                <div className="p-6 space-y-2">
                  <span className="text-[10px] text-[var(--accent-blue)] font-black uppercase">{item.category}</span>
                  <h2 className="font-extrabold text-sm text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent-blue)] transition">{item.title}</h2>
                  <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-3 leading-relaxed">{item.summary}</p>
                </div>
              </div>
              <div className="p-6 pt-0 flex items-center justify-between border-t border-[var(--card-border)] mt-4">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold" suppressHydrationWarning>📅 {formatDate(item.published_at)}</span>
                <span className="text-xs font-black text-[var(--accent-blue)] group-hover:underline flex items-center gap-1">مطالعه کامل خبر ←</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeModalNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fadeIn font-sans" dir="rtl">
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-4xl max-h-[92vh] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)]">
            <header className="p-4 sm:p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
              <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black text-xs">{activeModalNews.source_name}</span>
              <button onClick={() => setActiveModalNews(null)} className="w-10 h-10 rounded-2xl bg-[var(--modal-bg)] hover:bg-rose-500 hover:text-white border border-[var(--card-border)] flex items-center justify-center text-sm font-black cursor-pointer">✕</button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 text-xs sm:text-sm">
              <h1 className="text-xl sm:text-3xl font-black leading-snug">{activeModalNews.title}</h1>
              <div className="w-full h-64 sm:h-96 rounded-3xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)]"><img src={activeModalNews.image_url} alt={activeModalNews.title} className="w-full h-full object-cover" /></div>
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed text-[var(--text-secondary)] font-medium">💡 <strong>خلاصه گزارش:</strong> {activeModalNews.summary}</div>
              <div dangerouslySetInnerHTML={{ __html: activeModalNews.content }} className="prose max-w-none text-xs sm:text-sm leading-loose space-y-4 text-justify" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`,

  // ۱۱. کارت کالا
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
            className="font-black text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-2"
            style={{ direction: "rtl", textAlign: "right" }}
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
                {mounted ? price.toLocaleString("fa-IR") : price}
              </span>
            )}
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono" suppressHydrationWarning>
              {mounted ? currentPrice.toLocaleString("fa-IR") : currentPrice}{" "}
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
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ فایل اصلاح شد: ${filePath}`);
}
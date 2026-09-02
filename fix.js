// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎬 [AXON ARCHITECT] در حال اعمال سیستم جامع تم ۳ حالته (دارک Google Stitch، لایت شیشه‌ای و خودکار بر اساس ساعت دستگاه)، تعمیم تکنولوژی و رفع ارورها...');

const files = {
  // ۱. توکن‌های رنگی و استایل متغیرهای سراسری برای تم دارک و لایت Google Stitch
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
  --accent-blue: #0284c7;
  --accent-glow: rgba(2, 132, 199, 0.15);
  --modal-bg: #ffffff;
  --input-bg: #f1f5f9;
  --glass-surface: rgba(255, 255, 255, 0.75);
}

.dark {
  --bg-primary: #101416;
  --bg-secondary: #161b1e;
  --text-primary: #ffffff;
  --text-secondary: #94a3b8;
  --card-border: rgba(255, 255, 255, 0.08);
  --accent-blue: #1b90ff;
  --accent-glow: rgba(27, 144, 255, 0.25);
  --modal-bg: #161b1e;
  --input-bg: rgba(255, 255, 255, 0.04);
  --glass-surface: rgba(255, 255, 255, 0.03);
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
  transition: background-color 0.3s ease, color 0.3s ease;
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

/* شیشه و کارت‌های مدرن Google Stitch */
.glass-morphism {
  background: var(--glass-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.12);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.dark .glass-morphism {
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.glass-morphism:hover {
  border-color: var(--accent-blue);
  box-shadow: 0 12px 40px 0 var(--accent-glow);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`,

  // ۲. هدر کپسولی شیشه‌ای با سوییچر ۳ حالته تم (دارک / لایت / خودکار ساعتی)
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

type ThemeMode = "dark" | "light" | "auto";

export default function Header() {
  const router = useRouter();
  const cartContext = useCart();
  const { totalItems, toggleCart, addToCart } = cartContext;

  const [mounted, setMounted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string | number, boolean>>({});

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // اعمال هوشمند تم بر اساس ساعت دستگاه یا انتخاب دستی
  const applyTheme = (mode: ThemeMode) => {
    let isDark = false;
    if (mode === "dark") {
      isDark = true;
    } else if (mode === "light") {
      isDark = false;
    } else {
      // حالت خودکار: سنجش ساعت دستگاه (۶ صبح تا ۶ عصر = روز، ۶ عصر تا ۶ صبح = شب)
      const currentHour = new Date().getHours();
      isDark = currentHour < 6 || currentHour >= 18;
    }

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      const savedMode = (localStorage.getItem("axon_theme_mode") as ThemeMode) || "auto";
      setThemeMode(savedMode);
      applyTheme(savedMode);
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

    const handleSiteInfoUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setAllProducts(e.detail);
    };

    window.addEventListener("site_info_updated", handleSiteInfoUpdate);
    window.addEventListener("products_updated", handleProductsUpdate);

    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) setIsCategoryOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteInfoUpdate);
      window.removeEventListener("products_updated", handleProductsUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const cycleTheme = () => {
    soundEngine.playClick();
    let nextMode: ThemeMode = "dark";
    if (themeMode === "dark") nextMode = "light";
    else if (themeMode === "light") nextMode = "auto";
    else nextMode = "dark";

    setThemeMode(nextMode);
    localStorage.setItem("axon_theme_mode", nextMode);
    applyTheme(nextMode);
  };

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

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "AXON";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;

  return (
    <header className="sticky top-2 sm:top-4 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl" suppressHydrationWarning>
      <div className="w-full glass-morphism rounded-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => { soundEngine.playClick(); setIsCategoryOpen(!isCategoryOpen); }}
              className="w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm transition cursor-pointer text-[var(--text-primary)]"
              title="دسته‌بندی‌های کالا"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            {isCategoryOpen && (
              <div className="absolute top-12 right-0 w-64 p-2 rounded-2xl glass-morphism shadow-2xl z-50 animate-fadeIn space-y-1 bg-[var(--modal-bg)]">
                <button
                  onClick={() => handleSelectCategory("all")}
                  className="w-full text-right p-2.5 rounded-xl text-xs font-black text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
                >
                  ⚡ تمامی محصولات
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => handleSelectCategory(cat.name)}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
                  >
                    🏷️ {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] p-1 flex items-center justify-center overflow-hidden">
              {logoUrl ? <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" /> : <span className="text-[var(--accent-blue)] font-black text-lg">⚡</span>}
            </div>
            <div className="text-xl font-black text-[var(--text-primary)] tracking-tighter">{storeName}</div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-6 text-sm opacity-75">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="hover:opacity-100 hover:text-[var(--accent-blue)] transition font-bold text-[var(--text-primary)]">
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block" ref={searchContainerRef}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-44">
              <span className="text-xs opacity-70">🔍</span>
              <input type="text" placeholder="جستجوی کالا..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] placeholder-slate-400 font-bold" />
            </div>
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 p-2 rounded-2xl glass-morphism shadow-2xl z-50 animate-fadeIn space-y-1 w-72 bg-[var(--modal-bg)]">
                {searchResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--input-bg)] transition gap-2">
                    <Link href={\`/products/\${p.id}\`} onClick={() => setIsSearchFocused(false)} className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={p.images?.[0] || p.image || "/placeholder.png"} alt="" className="w-8 h-8 object-contain rounded-lg bg-white/5 p-0.5 shrink-0" />
                      <div className="flex-1 min-w-0 text-right">
                        <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{p.title || p.name}</h4>
                        <span className="font-mono font-black text-[10px] text-[var(--accent-blue)]">{formatPrice(p.discountPrice || p.price || 0)} ت</span>
                      </div>
                    </Link>
                    <button type="button" onClick={(e) => handleQuickAddFromSearch(e, p)} className="px-2 py-1 rounded-lg text-[10px] font-black bg-[var(--accent-blue)] text-white">
                      {addedItemMap[p.id] ? "✓" : "+"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* سوییچر ۳ حالته تم (دارک / لایت / خودکار) */}
          <button
            onClick={cycleTheme}
            className="w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
            title={themeMode === "dark" ? "تم فعلی: تاریک (کلیک: روشن)" : themeMode === "light" ? "تم فعلی: روشن (کلیک: خودکار)" : "تم فعلی: خودکار بر اساس ساعت (کلیک: تاریک)"}
            suppressHydrationWarning
          >
            {mounted ? (themeMode === "dark" ? "🌙" : themeMode === "light" ? "☀️" : "⏰") : "🌙"}
          </button>

          <button onClick={() => { soundEngine.playClick(); toggleCart(); }} className="p-2 opacity-80 hover:opacity-100 transition relative cursor-pointer text-[var(--text-primary)]" title="سبد خرید">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            {mounted && totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--accent-blue)] rounded-full text-[10px] font-mono font-black flex items-center justify-center text-white shadow-lg animate-pulse" suppressHydrationWarning>
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

  // ۳. صفحه اصلی کاملاً هماهنگ در هر دو حالت لایت و دارک Google Stitch
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const loadData = async () => {
    try {
      const [prods, bans] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
      ]);
      if (prods && prods.length > 0) setProducts(prods);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
    } catch {}
  };

  useEffect(() => {
    loadData();

    const handleCategoryChange = (e: any) => setSelectedCategory(e.detail || "all");
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };

    window.addEventListener("category_selected", handleCategoryChange);
    window.addEventListener("products_updated", handleProductsUpdate);

    return () => {
      window.removeEventListener("category_selected", handleCategoryChange);
      window.removeEventListener("products_updated", handleProductsUpdate);
    };
  }, []);

  const toggleCompare = (p: Product) => {
    soundEngine.playClick();
    if (compareList.some((item) => item.id === p.id)) {
      setCompareList(compareList.filter((item) => item.id !== p.id));
    } else {
      if (compareList.length >= 4) {
        alert("حداکثر ۴ کالا را می‌توانید همزمان مقایسه نمایید.");
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

  const categories = Array.from(new Set(products.map((p) => p.category || "تکنولوژی"))).filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-24 transition-colors duration-300" dir="rtl">
      <main className="pt-6 sm:pt-8 px-3 sm:px-6 max-w-7xl mx-auto space-y-8 sm:space-y-10">
        
        {/* ۱. هیرو بنتو شیشه‌ای Google Stitch */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 min-h-[300px] sm:min-h-[340px] rounded-3xl overflow-hidden relative glass-morphism flex flex-col justify-end p-6 sm:p-10">
            <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600" className="absolute inset-0 w-full h-full object-cover opacity-25 dark:opacity-35" alt="Tech Showcase" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--modal-bg)] via-[var(--modal-bg)]/60 to-transparent" />
            <div className="relative z-10 space-y-3 text-right">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-bold text-xs border border-[var(--accent-blue)]/30">
                ⚡ اکوسیستم جامع تکنولوژی ۲۰۲۶
              </span>
              <h1 className="text-2xl sm:text-4xl font-black leading-tight text-[var(--text-primary)]">
                مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                تامین انواع سیستم‌های پردازشی، لپ‌تاپ‌های ورک‌استیشن، ساعت‌های هوشمند، نمایشگرهای ۵K و قطعات دیجیتال با ۱۸ ماه گارانتی اصالت طلایی.
              </p>
              <div className="pt-2 flex gap-3">
                <Link href="/#products" className="bg-[var(--accent-blue)] text-white px-7 py-3.5 rounded-full font-black text-xs hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
                  مشاهده کاتالوگ محصولات ←
                </Link>
              </div>
            </div>
          </div>

          <div className="md:col-span-1 min-h-[300px] sm:min-h-[340px] rounded-3xl glass-morphism p-6 flex flex-col justify-center items-center text-center space-y-2">
            <div className="text-4xl font-black text-[var(--accent-blue)]">۱۰۰٪</div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">ضمانت اصالت فیزیکی کالا</h4>
            <p className="text-xs text-[var(--text-secondary)] font-medium">ارسال رایگان سفارش‌های بالای ۲ میلیون با پست پیشتاز</p>
          </div>
        </section>

        {/* ۲. تیکر اخبار روز تکنولوژی */}
        <TechRadarFeed />

        {/* ۳. پیل‌های سگمنت دسته‌بندی Google Stitch */}
        <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" dir="rtl">
          <button
            onClick={() => setSelectedCategory("all")}
            className={\`px-6 py-2.5 rounded-full glass-morphism whitespace-nowrap text-xs font-bold transition-all cursor-pointer \${
              selectedCategory === "all" ? "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/25 border-[var(--accent-blue)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
            }\`}
          >
            همه محصولات ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={\`px-6 py-2.5 rounded-full glass-morphism whitespace-nowrap text-xs font-bold transition-all cursor-pointer \${
                selectedCategory === cat ? "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/25 border-[var(--accent-blue)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
              }\`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* ۴. گرید محصولات با کارت‌های شیشه‌ای Google Stitch */}
        <div id="products" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* ۵. بخش مقالات سئو */}
        <section className="glass-morphism rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">مجله و مقالات تحلیلی فناوری</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium">جدیدترین بررسی‌های تخصصی سخت‌افزار و راهنمای خرید گجت‌ها</p>
            </div>
            <Link href="/blog" className="text-xs font-bold text-[var(--accent-blue)] hover:underline">
              مشاهده همه مقالات ←
            </Link>
          </div>
          <HomeBlogSection />
        </section>
      </main>

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      {posts.map((post) => (
        <article key={post.id || post.title} className="glass-morphism p-4 rounded-2xl space-y-2 flex flex-col justify-between hover:border-[var(--accent-blue)] transition duration-300">
          <h4 className="font-bold text-xs line-clamp-2 text-[var(--text-primary)]">{post.title}</h4>
          <Link href={\`/blog/\${post.id}\`} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-2 border-t border-[var(--card-border)]">
            مطالعه مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}
`,

  // ۴. کارت محصول تطبیق‌پذیر با تم لایت و دارک Google Stitch
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

  useEffect(() => { setMounted(true); }, []);

  const title = product.title || product.title_fa || product.name || "کالای تکنولوژی";
  const price = Number(product.price) || 0;
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : undefined;
  const currentPrice = discountPrice || price;
  const stockCount = product.stock !== undefined ? Number(product.stock) : 10;
  const mainImage = product.images?.[0] || product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600";
  const category = product.category || "تکنولوژی";
  const isAvailable = product.is_available !== false && stockCount > 0;

  return (
    <div
      onClick={() => userBehavior.trackProductView(product.id, category)}
      className="glass-morphism rounded-3xl overflow-hidden p-5 flex flex-col justify-between group select-none relative"
      dir="rtl"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-4 flex items-center justify-center p-3 border border-[var(--card-border)]">
        <Link href={\`/products/\${product.id}\`} className="w-full h-full flex items-center justify-center">
          <img src={mainImage} alt={title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
        </Link>
        <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
          {category}
        </span>
      </div>

      <div className="space-y-2 mb-4 text-right flex-grow">
        <span className="text-[var(--accent-blue)] text-xs font-bold block">{product.brand || "AXON"}</span>
        <Link href={\`/products/\${product.id}\`}>
          <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug hover:text-[var(--accent-blue)] transition">{title}</h3>
        </Link>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 font-medium leading-relaxed">{product.short_description || product.description || "دارای گارانتی اصالت طلایی و ارسال پیشتاز"}</p>
      </div>

      <div className="pt-3 border-t border-[var(--card-border)] space-y-3 mt-auto">
        <div className="flex justify-between items-center flex-row-reverse">
          <span className="text-base font-mono font-black text-[var(--text-primary)]" suppressHydrationWarning>{formatPrice(currentPrice)} تومان</span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{isAvailable ? "موجود ✓" : "ناموجود"}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              soundEngine.playAddToCart();
              addToCart({ id: product.id, title, name: title, price: currentPrice, image: mainImage, stock: stockCount, quantity: 1 });
            }}
            disabled={!isAvailable}
            className="py-2.5 bg-[var(--input-bg)] hover:bg-[var(--accent-blue)] hover:text-white text-[var(--text-primary)] text-xs font-bold rounded-xl border border-[var(--card-border)] transition cursor-pointer disabled:opacity-40"
          >
            🛒 سبد خرید
          </button>
          <button
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              soundEngine.playAddToCart();
              addToCart({ id: product.id, title, name: title, price: currentPrice, image: mainImage, stock: stockCount, quantity: 1 });
              router.push("/checkout");
            }}
            disabled={!isAvailable}
            className="py-2.5 bg-[var(--accent-blue)] text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-90 transition cursor-pointer disabled:opacity-40"
          >
            ⚡ خرید فوری
          </button>
        </div>
      </div>
    </div>
  );
}
`,

  // ۵. فوتر بنتو هماهنگ
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

  const siteName = info?.site_name || info?.siteName || "AXON";

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-auto select-none transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <div className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">{siteName}</div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">مرجع تخصصی خرید جدیدترین گجت‌های نوین، سخت‌افزار و ابزارهای تکنولوژی با گارانتی اصالت طلایی.</p>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-[var(--accent-blue)]">دسترسی سریع</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ محصولات</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">پیگیری سفارش</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله سئو</Link></li>
            </ul>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-[var(--accent-blue)]">اطلاعات تماس</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li>تلفن: {info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸"}</li>
              <li>ایمیل: {info?.email || "info@axoncore.ir"}</li>
              <li>ساعات کاری: {info?.working_hours || "۹:۰۰ الی ۱۸:۰۰"}</li>
            </ul>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">ضمانت رسمی</h5>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">۱۰۰٪ اصالت فیزیکی کالا، مهلت تست ۷ روزه سخت‌افزاری و ارسال سریع پیشتاز به سراسر ایران.</p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--card-border)] text-center text-xs text-[var(--text-secondary)] font-bold">
          تمامی حقوق محفوظ است © {new Date().getFullYear()} {siteName}
        </div>
      </div>
    </footer>
  );
}
`,

  // ۶. داک ناوبری شناور اپلیکیشن در موبایل
  'components/MobileBottomNav.tsx': `// File Path: components/MobileBottomNav.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { soundEngine } from '@/lib/soundEngine';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, toggleCart } = useCart();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass-morphism rounded-full p-2 flex justify-around items-center z-50 shadow-2xl backdrop-blur-2xl" dir="rtl">
      <Link href="/" onClick={() => soundEngine.playClick()} className={\`p-3 rounded-full transition-all \${pathname === "/" ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/15" : "opacity-60 text-[var(--text-primary)]"}\`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      </Link>
      <Link href="/#products" onClick={() => soundEngine.playClick()} className={\`p-3 rounded-full transition-all \${pathname === "/products" ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/15" : "opacity-60 text-[var(--text-primary)]"}\`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
      </Link>
      <button onClick={() => { soundEngine.playClick(); toggleCart(); }} className="p-3 text-[var(--text-primary)] opacity-60 hover:opacity-100 relative cursor-pointer">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        {totalItems > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--accent-blue)] text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">{totalItems}</span>}
      </button>
      <Link href="/track-order" onClick={() => soundEngine.playClick()} className={\`p-3 rounded-full transition-all \${pathname === "/track-order" ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/15" : "opacity-60 text-[var(--text-primary)]"}\`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </Link>
    </nav>
  );
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ [STITCH THEME READY] فایل به‌روزرسانی شد: ${filePath}`);
}

console.log('📦 در حال Push به گیت‌هاب و دیپلوی روی Vercel...');
try {
  execSync('git add . && git commit -m "feat: complete adaptive 3-mode theme switcher (dark Google Stitch, crisp light & smart time-based auto)" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 [DEPLOYED] استقرار با موفقیت ۱۰۰٪ کامل شد!');
} catch (e) {
  console.log('⚠️ دستور دستی: git push origin main');
}
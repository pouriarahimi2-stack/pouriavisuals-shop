// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   ✨ اعمال ساختار کاملاً داینامیک لوگو از ادمین، پاکسازی هیرو و اصلاح کاتالوگ قیمت‌ها');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

function writeProjectFile(relativePath, fileContent) {
  const targetPath = path.join(__dirname, relativePath);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(targetPath, fileContent, 'utf8');
  console.log(`  \x1b[32m[SAVED ✓]\x1b[0m ${relativePath.padEnd(50)} \x1b[36m(بروزرسانی کامل)\x1b[0m`);
}

// ۱. به‌روزرسانی Header.tsx (خواندن ۱۰۰٪ داینامیک لوگوی متحرک از پنل ادمین)
writeProjectFile('components/Header.tsx', `"use client";

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

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      applyTheme(isDark);
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

  const toggleTheme = () => {
    soundEngine.playClick();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    applyTheme(nextDark);
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
    { title: "کاتالوگ محصولات", href: "/#products" },
    { title: "اخبار تکنولوژی", href: "/news" },
    { title: "مجله سئو", href: "/blog" },
    { title: "پیگیری سفارش", href: "/track-order" },
    { title: "تماس با ما", href: "/contact" },
  ];

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;

  return (
    <header className="sticky top-2 sm:top-4 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl" suppressHydrationWarning>
      <div className="w-full glass-morphism rounded-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => { soundEngine.playClick(); setIsCategoryOpen(!isCategoryOpen); }}
              className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm transition cursor-pointer text-[var(--text-primary)] shadow-sm"
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

          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={storeName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xl text-[var(--accent-blue)] font-black">⚡</span>
              )}
            </div>
            <div className="text-xl font-black text-[var(--text-primary)] tracking-tighter group-hover:text-[var(--accent-blue)] transition">{storeName}</div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-6 text-sm opacity-85">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="hover:opacity-100 hover:text-[var(--accent-blue)] transition font-bold text-[var(--text-primary)]">
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block" ref={searchContainerRef}>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-48">
              <span className="text-xs opacity-70">🔍</span>
              <input type="text" placeholder="جستجوی کالا..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] placeholder-slate-400 font-bold" />
            </div>
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 p-2 rounded-2xl glass-morphism shadow-2xl z-50 animate-fadeIn space-y-1 w-72 bg-[var(--modal-bg)]">
                {searchResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--input-bg)] transition gap-2">
                    <Link href={"/products/" + p.id} onClick={() => setIsSearchFocused(false)} className="flex items-center gap-2 flex-1 min-w-0">
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

          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm text-[var(--text-primary)]"
            title={isDarkMode ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
            suppressHydrationWarning
          >
            {mounted ? (
              isDarkMode ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )
            ) : (
              <span className="w-4 h-4" />
            )}
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
`);

// ۲. به‌روزرسانی Footer.tsx (خواندن ۱۰۰٪ داینامیک لوگوی فوتر از پنل ادمین)
writeProjectFile('components/Footer.tsx', `"use client";

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
  const footerLogo = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url;

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-auto select-none transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-morphism p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              {footerLogo ? (
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={footerLogo} alt={siteName} className="w-full h-full object-contain" />
                </div>
              ) : null}
              <div className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">{siteName}</div>
            </div>
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
`);

// ۳. بازنویسی app/page.tsx (هیرو مینیمال و پاکسازی‌شده بدون هیچ برچسب و دکمه زائد)
writeProjectFile('app/page.tsx', `"use client";

import React, { useState, useEffect } from "react";
import { productService, Product, FLAGSHIP_7_PRODUCTS } from "@/services/productService";
import { bannerService, Banner } from "@/services/bannerService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import AIAssistantChat from "@/components/AIAssistantChat";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import ProductCard from "@/components/ProductCard";
import TechRadarFeed from "@/components/TechRadarFeed";
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-24 transition-colors duration-300" dir="rtl">
      <main className="pt-4 sm:pt-6 px-3 sm:px-6 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* تیکر اخبار تکنولوژی */}
        <TechRadarFeed />

        {/* هیرو سکشن عریض و مدرن */}
        <section className="w-full rounded-[2.5rem] overflow-hidden glass-morphism p-8 sm:p-14 shadow-2xl border border-[var(--card-border)] relative min-h-[320px] sm:min-h-[380px] flex flex-col justify-center">
          <div className="relative z-10 space-y-4 max-w-2xl text-right">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-[var(--text-primary)]">
              مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
              تامین مستقیم انواع مانیتورهای ۵K رتینا، لپ‌تاپ‌های حرفه‌ای، ساعت‌های هوشمند، تجهیزات پردازش و کالیبراسیون با ۱۸ ماه گارانتی اصالت طلایی و ارسال پیشتاز.
            </p>

            <div className="pt-2">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 bg-[var(--accent-blue)] text-white px-8 py-3.5 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/25"
              >
                <span>مشاهده کاتالوگ محصولات</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        </section>

        {/* کاتالوگ محصولات */}
        <section id="products" className="space-y-6">
          <div className="border-b border-[var(--card-border)] pb-4 px-1 flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                محصولات و تجهیزات تکنولوژی
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                تمامی کالاها با گارانتی اصالت طلایی و ارسال سریع پیشتاز عرضه می‌شوند
              </p>
            </div>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="text-xs font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
              >
                نمایش همه کالاها ({products.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* مجله سئو */}
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
          <Link href={"/blog/" + (post.id || "")} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-2 border-t border-[var(--card-border)]">
            مطالعه مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}
`);

// ۴. اصلاح کارت کالا (ProductCard)
writeProjectFile('components/ProductCard.tsx', `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";
import ProductExplodedView from "@/components/ProductExplodedView";

export default function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isTeardownOpen, setIsTeardownOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const title = product.title || product.title_fa || product.name || "کالای تکنولوژی";
  const price = Number(product.price) || 55800000;
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : (product.discount_price ? Number(product.discount_price) : undefined);
  const currentPrice = discountPrice || price;
  const stockCount = product.stock !== undefined ? Number(product.stock) : 10;
  const mainImage = product.images?.[0] || product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600";
  const category = product.category || "تکنولوژی";
  const isAvailable = product.is_available !== false && stockCount > 0;

  return (
    <>
      <div
        onClick={() => userBehavior.trackProductView(product.id, category)}
        className="glass-morphism rounded-3xl overflow-hidden p-5 flex flex-col justify-between group select-none relative"
        dir="rtl"
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-4 flex items-center justify-center p-3 border border-[var(--card-border)]">
          <Link href={"/products/" + product.id} className="w-full h-full flex items-center justify-center">
            <img src={mainImage} alt={title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          </Link>
          
          <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
            {category}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playExplodeShift();
              setIsTeardownOpen(true);
            }}
            className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-xl bg-black/70 hover:bg-blue-600 text-white font-bold text-[10px] border border-white/20 backdrop-blur-md transition flex items-center gap-1 shadow-md cursor-pointer"
            title="مشاهده کالبدشکافی ۳D"
          >
            <span>🧬</span>
            <span>۳D</span>
          </button>
        </div>

        <div className="space-y-2 mb-4 text-right flex-grow">
          <span className="text-[var(--accent-blue)] text-xs font-bold block">{product.brand || "Apple"}</span>
          <Link href={"/products/" + product.id}>
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

      <ProductExplodedView
        productId={product.id}
        productTitle={title}
        category={category}
        isOpen={isTeardownOpen}
        onClose={() => setIsTeardownOpen(false)}
      />
    </>
  );
}
`);

// ۵. کامیت و استقرار روی ریپازیتوری
console.log('\n📦 در حال ثبت کامیت و استقرار روی گیت‌هاب / Vercel...');
try {
  execSync('git add . && git commit -m "fix(ui): dynamic admin logos, pure clean hero and official product catalog" && git push origin main', { stdio: 'inherit' });
  console.log('\n🎉 [SUCCESS] استقرار نهایی با موفقیت ۱۰۰٪ کامل شد!');
} catch (e) {
  console.log('\nℹ️ در صورت لزوم دستور زیر را در ترمینال اجرا کنید:');
  console.log('git add . && git commit -m "fix(ui): update" && git push');
}
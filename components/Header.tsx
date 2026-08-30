// File Path: components/Header.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { productService, Product } from "@/services/productService";
import { menuService, MenuItem } from "@/services/menuService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";

export default function Header() {
  const router = useRouter();
  const cartContext = useCart();
  const { totalItems, toggleCart, addToCart } = cartContext;

  const [mounted, setMounted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
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
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}

    const initHeaderData = async () => {
      const [info, prods, menus, cats] = await Promise.all([
        siteInfoService.getSiteInfo(),
        productService.getAll(),
        menuService.getAll(),
        categoryService.getAll(),
      ]);
      if (info) setSiteInfo(info);
      if (prods) setAllProducts(prods);
      if (menus) setMenuItems(menus);
      if (cats) setCategories(cats);
    };

    initHeaderData();

    const handleSiteInfoUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setAllProducts(e.detail);
      else productService.getAll().then((prods) => prods && setAllProducts(prods));
    };
    const handleMenuUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setMenuItems(e.detail);
      else menuService.getAll().then((menus) => menus && setMenuItems(menus));
    };
    const handleCategoriesUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setCategories(e.detail);
      else categoryService.getAll().then((cats) => cats && setCategories(cats));
    };

    window.addEventListener("site_info_updated", handleSiteInfoUpdate);
    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("menu_updated", handleMenuUpdate);
    window.addEventListener("categories_updated", handleCategoriesUpdate);

    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteInfoUpdate);
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("menu_updated", handleMenuUpdate);
      window.removeEventListener("categories_updated", handleCategoriesUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
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
    setTimeout(() => {
      setAddedItemMap((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  // عنوان‌های مینیمال شده هدر سایت
  const navLinks = [
    { title: "صفحه نخست", href: "/" },
    { title: "کاتالوگ محصولات", href: "/#products" },
    { title: "پیگیری سفارش", href: "/track-order" },
    { title: "تماس با ما", href: "/contact" },
  ];

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;
  const isOnline = siteInfo?.maintenance_mode === "none";

  return (
    <header className="sticky top-2 sm:top-4 z-40 w-full max-w-7xl mx-auto px-2 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl">
      {siteInfo?.header_announcement && (
        <div className="mb-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-blue-600/15 border border-[var(--card-border)] text-center text-[10px] sm:text-[11px] font-bold text-[var(--text-primary)] backdrop-blur-md truncate">
          {siteInfo.header_announcement}
        </div>
      )}

      {/* نوار اصلی کپسول هدر - بدون بیرون‌زدگی دکمه‌ها و قرارگیری کامل درون قاب شیشه‌ای */}
      <div className="w-full bg-[var(--modal-bg)]/95 backdrop-blur-2xl px-3 sm:px-5 py-2 rounded-[2rem] shadow-xl border border-[var(--card-border)] flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-300">
        
        {/* لوگوی ثبت‌شده و نام برند */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <button
            onClick={() => {
              soundEngine.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs cursor-pointer shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            ☰
          </button>

          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] p-1 shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-[var(--accent-blue)] text-lg sm:text-xl font-black">⚡</span>
              )}
            </div>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black tracking-tight text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-[160px]" suppressHydrationWarning>
                  {storeName}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 transition-all duration-500 ${
                    isOnline
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse"
                      : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"
                  }`}
                  title={isOnline ? "سامانه آنلاین" : "حالت تعمیرات"}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-[var(--accent-blue)] truncate max-w-[120px] sm:max-w-[160px]" suppressHydrationWarning>
                {siteInfo?.tagline || "مرجع تخصصی تجهیزات دیجیتال و تصویر"}
              </span>
            </div>
          </Link>

          {/* دراپ‌داون دسته‌بندی‌ها */}
          <div className="relative hidden md:block" ref={categoryDropdownRef}>
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsCategoryOpen(!isCategoryOpen);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 border cursor-pointer ${
                isCategoryOpen || selectedCategory !== "all"
                  ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]"
              }`}
            >
              <span>☰</span>
              <span>دسته‌بندی‌ها</span>
              <span className="text-[9px] opacity-80">▾</span>
            </button>

            {isCategoryOpen && (
              <div className="absolute top-11 right-0 w-60 p-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1">
                <button
                  onClick={() => handleSelectCategory("all")}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-[var(--accent-blue)] text-white shadow-sm"
                      : "text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
                  }`}
                >
                  <span>📦 تمامی کالاها</span>
                  {selectedCategory === "all" && <span>✓</span>}
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => handleSelectCategory(cat.name)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedCategory === cat.name
                        ? "bg-[var(--accent-blue)] text-white shadow-sm font-black"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
                    }`}
                  >
                    <span>🏷️ {cat.name}</span>
                    {selectedCategory === cat.name && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* منوی مینیمال ناوبری در دسکتاپ */}
        <nav className="hidden lg:flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--card-border)] shadow-inner">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition whitespace-nowrap"
            >
              {link.title}
            </Link>
          ))}
        </nav>

        {/* دکمه‌های جستجو، تغییر تم و دکمه سبد خرید که کاملاً درون هدر قرار دارند */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="relative hidden xl:block" ref={searchContainerRef}>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-40 shadow-sm h-9">
              <span className="text-xs opacity-70">🔍</span>
              <input
                type="text"
                placeholder="جستجوی کالا..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] font-bold placeholder-slate-400"
              />
            </div>

            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-11 left-0 p-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1.5 w-72">
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--input-bg)] transition gap-2">
                      <Link
                        href={`/products/${p.id}`}
                        onClick={() => {
                          soundEngine.playClick();
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <img
                          src={p.images?.[0] || p.image || "/placeholder.png"}
                          alt=""
                          className="w-8 h-8 object-contain rounded-lg bg-white/5 p-0.5 border border-[var(--card-border)] shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-right">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{p.title || p.name}</h4>
                          <span className="font-mono font-black text-[10px] text-emerald-600 dark:text-emerald-400">
                            {Number(p.discountPrice || p.price || 0).toLocaleString("fa-IR")} ت
                          </span>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAddFromSearch(e, p)}
                        className="px-2 py-1 rounded-lg text-[10px] font-black bg-[var(--accent-blue)] text-white cursor-pointer shadow-md"
                      >
                        {addedItemMap[p.id] ? "✓" : "+"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* دکمه لایت‌مود و دارک‌مود درون کپسول هدر */}
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs hover:border-[var(--accent-blue)] transition cursor-pointer shadow-sm flex items-center justify-center shrink-0"
            title="تغییر تم"
          >
            {mounted ? (isDarkMode ? "🌙" : "☀️") : "🌙"}
          </button>

          {/* دکمه آیکونی سبد خرید کاملاً درون کپسول هدر */}
          <button
            onClick={() => {
              soundEngine.playClick();
              toggleCart();
            }}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white transition-all shadow-md shadow-blue-500/25 cursor-pointer flex items-center justify-center shrink-0"
            title="مشاهده سبد خرید"
            aria-label="سبد خرید"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-rose-500 text-white font-mono font-black text-[9px] flex items-center justify-center border-2 border-[var(--modal-bg)] shadow-md animate-pulse">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* منوی ریسپانسیو موبایل */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 p-3.5 bg-[var(--modal-bg)] rounded-2xl border border-[var(--card-border)] shadow-2xl space-y-1.5 animate-fadeIn">
          <div className="flex flex-col space-y-1 text-xs font-bold">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-[var(--input-bg)] flex items-center justify-between text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition"
              >
                <span>{link.title}</span>
                <span className="text-xs opacity-60">←</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
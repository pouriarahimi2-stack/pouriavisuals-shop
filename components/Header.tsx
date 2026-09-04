"use client";

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
import AnimatedLogo from "@/components/AnimatedLogo";

export default function Header() {
  const router = useRouter();
  const cartContext = useCart();
  const { totalItems, toggleCart, addToCart } = cartContext;

  const [mounted, setMounted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // استیت‌های حساب کاربری
  const [userSession, setUserSession] = useState<{ phone: string } | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string | number, boolean>>({});

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const checkUserAuth = () => {
    try {
      const saved = localStorage.getItem("axon_user_session");
      if (saved) setUserSession(JSON.parse(saved));
      else setUserSession(null);
    } catch {
      setUserSession(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkUserAuth();

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
    const handleUserAuthChanged = () => checkUserAuth();

    window.addEventListener("site_info_updated", handleSiteInfoUpdate);
    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("user_auth_changed", handleUserAuthChanged);

    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) setIsCategoryOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setIsSearchFocused(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteInfoUpdate);
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("user_auth_changed", handleUserAuthChanged);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    soundEngine.playClick();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
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

  const handleUserLogout = () => {
    soundEngine.playClick();
    localStorage.removeItem("axon_user_session");
    setUserSession(null);
    setIsUserMenuOpen(false);
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
    <header className="sticky top-2 sm:top-3 z-50 w-full max-w-[1440px] mx-auto px-3 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl" suppressHydrationWarning>
      <div className="w-full glass-morphism rounded-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-xl">
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
            <AnimatedLogo customLogoUrl={logoUrl} size={38} />
            <div className="text-xl font-black text-[var(--text-primary)] tracking-tight group-hover:text-[var(--accent-blue)] transition">{storeName}</div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-sm opacity-85">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="hover:opacity-100 hover:text-[var(--accent-blue)] transition font-bold text-[var(--text-primary)]">
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden sm:block" ref={searchContainerRef}>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-48 lg:w-56">
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

          {/* آیکون و کنترلر ورود و حساب کاربری کاربر */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                soundEngine.playClick();
                if (userSession) {
                  setIsUserMenuOpen(!isUserMenuOpen);
                } else {
                  router.push("/login");
                }
              }}
              className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm text-[var(--text-primary)] relative active:scale-95"
              title={userSession ? `حساب کاربری: ${userSession.phone}` : "ورود به حساب کاربری"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>

              {userSession && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1 right-1 border-2 border-[var(--modal-bg)] shadow-md" />
              )}
            </button>

            {isUserMenuOpen && userSession && (
              <div className="absolute top-12 left-0 w-52 p-3 rounded-2xl glass-morphism shadow-2xl z-50 animate-fadeIn space-y-2.5 bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs text-right">
                <div className="border-b border-[var(--card-border)] pb-2">
                  <span className="text-[10px] text-[var(--text-secondary)] block">حساب متصل:</span>
                  <span className="font-mono font-black text-[var(--text-primary)] text-xs" dir="ltr">
                    {userSession.phone}
                  </span>
                </div>

                <Link
                  href="/track-order"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-[var(--input-bg)] font-bold transition text-[var(--text-primary)]"
                >
                  <span>📦</span>
                  <span>پیگیری سفارشات من</span>
                </Link>

                <button
                  onClick={handleUserLogout}
                  className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-rose-500 hover:bg-rose-500/15 font-bold transition cursor-pointer"
                >
                  <span>🚪</span>
                  <span>خروج از حساب</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm text-[var(--text-primary)] active:scale-95"
            title={isDarkMode ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
            suppressHydrationWarning
          >
            {mounted ? (
              isDarkMode ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
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

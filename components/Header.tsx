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
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";

// الگوریتم رسمی و بدون نقص اعتبارسنجی کد پستی ۱۰ رقمی ایران
function isValidIranianPostalCode(postalCode: string): { valid: boolean; message?: string } {
  if (!postalCode) return { valid: false, message: "کد پستی ۱۰ رقمی الزامی است." };
  const cleanCode = postalCode
    .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
    .replace(/\D/g, "");

  if (cleanCode.length !== 10) {
    return { valid: false, message: "کد پستی باید دقیقاً ۱۰ رقم عددی باشد." };
  }

  const firstDigit = cleanCode.charAt(0);
  if (firstDigit === "0" || firstDigit === "2") {
    return { valid: false, message: "کد پستی وارد شده ساختار معتبر مناطق پستی ایران را ندارد." };
  }

  if (/^(\d)\1{9}$/.test(cleanCode)) {
    return { valid: false, message: "کد پستی نمی‌تواند از ارقام یکسان تشکیل شده باشد." };
  }

  const sequentialPatterns = ["0123456789", "1234567890", "2345678901", "9876543210", "8765432109"];
  if (sequentialPatterns.includes(cleanCode)) {
    return { valid: false, message: "کد پستی نمی‌تواند متوالی باشد." };
  }

  if (cleanCode.substring(5) === "00000") {
    return { valid: false, message: "بخش دوم کد پستی نامعتبر است." };
  }

  return { valid: true };
}

export default function Header() {
  const router = useRouter();
  const cartContext = useCart();
  const cartItems = cartContext?.cartItems || [];
  const isCartOpen = cartContext?.isCartOpen || false;
  const toggleCart = cartContext?.toggleCart || (() => {});
  const addToCart = cartContext?.addToCart || (() => {});
  const removeFromCart = cartContext?.removeFromCart || (() => {});
  const updateQuantity = cartContext?.updateQuantity || (() => {});
  const appliedCoupon = cartContext?.appliedCoupon || null;
  const applyCoupon = cartContext?.applyCoupon || (() => Promise.resolve({ success: false, message: "" }));
  const removeCoupon = cartContext?.removeCoupon || (() => {});
  const submitOrder = cartContext?.submitOrder;

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

  // فرم ثبت مشخصات خریدار درون دراور سبد خرید
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // احراز هویت پیامکی ۲ مرحله‌ای با کد ۶ رقمی OTP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userOtpInput, setUserOtpInput] = useState("");
  const [otpTimer, setOtpTimer] = useState(120);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const rawTotal = cartItems.reduce(
    (acc, item) => acc + (item.discountPrice ?? item.price) * item.quantity,
    0
  );

  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = Math.round((rawTotal * appliedCoupon.discountPercent) / 100);
    if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
      discountAmount = appliedCoupon.maxDiscount;
    }
  }

  const finalTotal = Math.max(0, rawTotal - discountAmount);

  // تایمر ۲ دقیقه‌ای شمارنده معکوس کد OTP
  useEffect(() => {
    let interval: any;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

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

    const initData = async () => {
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

    initData();

    const handleSiteInfoUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };
    const handleProductsUpdate = (e: any) => {
      if (e.detail) setAllProducts(e.detail);
      else productService.getAll().then((prods) => prods && setAllProducts(prods));
    };

    window.addEventListener("site_info_updated", handleSiteInfoUpdate);
    window.addEventListener("products_updated", handleProductsUpdate);

    const channel = supabase
      .channel("header-unified-realtime-master-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, (payload: any) => {
        if (payload?.new) setSiteInfo(payload.new);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        productService.getAll().then((prods) => prods && setAllProducts(prods));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => {
        menuService.getAll().then((menus) => menus && setMenuItems(menus));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        categoryService.getAll().then((cats) => cats && setCategories(cats));
      })
      .subscribe();

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
      document.removeEventListener("mousedown", handleClickOutside);
      supabase.removeChannel(channel);
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

  const handleInitiateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !address.trim() || !postalCode.trim()) {
      setValidationError("لطفاً تمامی مشخصات گیرنده و آدرس پستی را تکمیل نمایید.");
      return;
    }

    const cleanPhone = phone
      .trim()
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/\D/g, "");

    if (!/^09\d{9}$/.test(cleanPhone)) {
      setValidationError("شماره موبایل وارد شده باید ۱۱ رقمی و با ۰۹ شروع شود.");
      return;
    }

    const postalCheck = isValidIranianPostalCode(postalCode);
    if (!postalCheck.valid) {
      setValidationError(postalCheck.message || "کد پستی ۱۰ رقمی نامعتبر است.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, action: "send" }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedOtp(data.simulatedCode || "");
        setOtpTimer(120);
        setUserOtpInput("");
        setShowOtpModal(true);
      } else {
        setValidationError(data.message || "خطا در ارسال پیامک رمز تایید.");
      }
    } catch {
      setValidationError("خطا در برقراری ارتباط با سامانه پیامکی.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpAndProceed = async () => {
    if (userOtpInput.trim().length !== 6) {
      alert("لطفاً کد تایید ۶ رقمی پیامک‌شده را به طور کامل وارد نمایید.");
      return;
    }

    const cleanPhone = phone
      .trim()
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/\D/g, "");

    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: userOtpInput.trim(), action: "verify" }),
      });
      const data = await res.json();

      if (data.success && data.verified) {
        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        const orderData = {
          id: orderId,
          order_number: orderId,
          customer_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: cleanPhone,
          address: address.trim(),
          postal_code: postalCode.trim(),
          items: cartItems,
          total_amount: rawTotal,
          discount_amount: discountAmount,
          final_amount: finalTotal,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          status: "pending",
          payment_status: "pending",
        };

        if (typeof submitOrder === "function") {
          submitOrder(orderData);
        } else {
          const existing = JSON.parse(localStorage.getItem("axon_orders_registry_cache_v2026") || "[]");
          localStorage.setItem("axon_orders_registry_cache_v2026", JSON.stringify([orderData, ...existing]));
          sessionStorage.setItem("pending_payment_amount", String(finalTotal));
          sessionStorage.setItem("pending_payment_order_id", orderId);
        }

        setFirstName("");
        setLastName("");
        setPhone("");
        setPostalCode("");
        setAddress("");
        setShowCheckoutForm(false);
        setShowOtpModal(false);
        toggleCart();

        router.push(`/checkout/payment?orderId=${orderId}`);
      } else {
        alert(data.message || "کد ۶ رقمی وارد شده اشتباه یا منقضی شده است.");
      }
    } catch {
      alert("خطا در اعتبارسنجی پیامک.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const navLinks =
    menuItems.length > 0
      ? menuItems.map((m) => ({ title: m.title || m.label || "پیوند", href: m.url || m.href || "/" }))
      : [
          { title: "صفحه نخست", href: "/" },
          { title: "کاتالوگ محصولات", href: "/#products" },
          { title: "📡 اخبار تکنولوژی", href: "/news" },
          { title: "پیگیری سفارش", href: "/track-order" },
          { title: "مجله تخصصی سئو", href: "/blog" },
          { title: "تماس با ما", href: "/contact" },
        ];

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;
  const isOnline = siteInfo?.maintenance_mode === "none";

  return (
    <header className="sticky top-2 sm:top-4 z-40 w-full max-w-7xl mx-auto px-3 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl">
      {/* نوار اعلانات متحرک بالای هدر */}
      {siteInfo?.header_announcement && (
        <div className="mb-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-blue-600/15 border border-[var(--card-border)] text-center text-[11px] font-bold text-[var(--text-primary)] backdrop-blur-md">
          {siteInfo.header_announcement}
        </div>
      )}

      {/* بار اصلی هدر با ساختار کپسولی یکپارچه بدون بیرون‌زدگی دکمه‌ها */}
      <div className="w-full bg-[var(--modal-bg)]/95 backdrop-blur-2xl px-4 sm:px-6 py-2.5 rounded-[2rem] shadow-xl border border-[var(--card-border)] flex items-center justify-between gap-3 transition-colors duration-300">
        
        {/* راست: لوگو، نام برند و دسته‌بندی */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              soundEngine.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            ☰
          </button>

          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border border-[var(--card-border)] bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
              ) : (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              )}
            </div>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-[var(--text-primary)]" suppressHydrationWarning>
                  {storeName}
                </span>
                <span
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    isOnline
                      ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)] animate-pulse"
                      : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]"
                  }`}
                  title={isOnline ? "سامانه آنلاین و فعال" : "در حال تعمیرات"}
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--accent-blue)]" suppressHydrationWarning>
                {siteInfo?.tagline || "مرجع تخصصی تجهیزات دیجیتال و استودیو"}
              </span>
            </div>
          </Link>

          {/* دراپ‌داون انتخاب دسته‌بندی */}
          <div className="relative hidden md:block" ref={categoryDropdownRef}>
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsCategoryOpen(!isCategoryOpen);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-black transition-all duration-200 border cursor-pointer ${
                isCategoryOpen || selectedCategory !== "all"
                  ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]"
              }`}
            >
              <span>☰</span>
              <span>دسته‌بندی‌ها</span>
              <span className="text-[9px] opacity-70">▾</span>
            </button>

            {isCategoryOpen && (
              <div className="absolute top-12 right-0 w-64 p-2.5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1">
                <button
                  onClick={() => handleSelectCategory("all")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
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
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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

        {/* وسط: پیوندهای اصلی ناوبری */}
        <nav className="hidden xl:flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--card-border)] shadow-inner">
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

        {/* چپ: جستجو، تم و دکمه سبد خرید کاملاً درون کپسول هدر */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative hidden lg:block" ref={searchContainerRef}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-36 xl:w-44 shadow-sm h-10">
              <span className="text-xs opacity-70">🔍</span>
              <input
                type="text"
                placeholder="جستجو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] font-bold placeholder-slate-400"
              />
            </div>

            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 p-2.5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1.5 w-80">
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {searchResults.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--input-bg)] transition gap-2">
                      <Link
                        href={`/products/${p.id}`}
                        onClick={() => {
                          soundEngine.playClick();
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-2.5 flex-1 min-w-0"
                      >
                        <img
                          src={p.images?.[0] || p.image || "/placeholder.png"}
                          alt=""
                          className="w-10 h-10 object-contain rounded-lg bg-white/5 p-1 border border-[var(--card-border)] shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-right">
                          <h4 className="text-xs font-black text-[var(--text-primary)] truncate">{p.title || p.name}</h4>
                          <span className="font-mono font-black text-[10px] text-emerald-600 dark:text-emerald-400">
                            {Number(p.discountPrice || p.price || 0).toLocaleString("fa-IR")} ت
                          </span>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAddFromSearch(e, p)}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-[var(--accent-blue)] text-white cursor-pointer shadow-md"
                      >
                        {addedItemMap[p.id] ? "✓" : "+ خرید"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs hover:border-[var(--accent-blue)] transition cursor-pointer shadow-sm flex items-center justify-center shrink-0"
            title="تغییر تم"
          >
            {mounted ? (isDarkMode ? "🌙" : "☀️") : "🌙"}
          </button>

          {/* دکمه سبد خرید متصل به دراور */}
          <button
            onClick={() => {
              soundEngine.playClick();
              toggleCart();
            }}
            className="relative h-10 px-3.5 sm:px-4 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white font-black text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <span className="text-sm">🛒</span>
            <span className="font-bold hidden sm:inline">سبد خرید</span>
            {totalCartCount > 0 && (
              <span className="min-w-[1.2rem] h-[1.2rem] px-1 rounded-full bg-rose-500 text-white font-mono font-black text-[10px] flex items-center justify-center shadow-md animate-pulse">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* منوی ریسپانسیو موبایل */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 p-4 bg-[var(--modal-bg)] rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-2 animate-fadeIn">
          <div className="flex flex-col space-y-1.5 text-xs font-bold">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-[var(--input-bg)] flex items-center gap-2"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* دراور کامل سبد خرید و فرم تسویه داخل هدر */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md animate-fadeIn font-sans">
          <div className="w-full max-w-md h-full bg-[var(--modal-bg)] border-r border-[var(--card-border)] p-6 text-[var(--text-primary)] flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
                <h3 className="font-black text-lg flex items-center gap-2 text-[var(--text-primary)]">
                  <span>🛒</span> سبد خرید شما ({totalCartCount})
                </h3>
                <button
                  onClick={toggleCart}
                  className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-xs font-bold cursor-pointer transition text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-12 text-center text-[var(--text-secondary)] text-xs font-bold space-y-2">
                  <span className="text-3xl block">🛍️</span>
                  <p>سبد خرید شما در حال حاضر خالی است.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs gap-3 shadow-sm"
                    >
                      <img src={item.image} alt={item.title || item.name} className="w-12 h-12 object-contain rounded-xl bg-[var(--modal-bg)] p-1 border border-[var(--card-border)]" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-[var(--text-primary)] truncate">{item.title || item.name}</h4>
                        <span className="text-[var(--accent-blue)] font-black block font-mono">
                          {((item.discountPrice ?? item.price) * (item.quantity || 1)).toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl px-2 py-1 font-bold">
                        <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-[var(--accent-blue)] cursor-pointer px-1 font-bold">-</button>
                        <span className="font-mono text-[var(--text-primary)]">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-[var(--accent-blue)] cursor-pointer px-1 font-bold">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-rose-500 font-bold hover:text-rose-700 transition cursor-pointer p-1">🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[var(--card-border)] text-xs">
                {!appliedCoupon ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (couponCodeInput.trim()) applyCoupon(couponCodeInput.trim());
                      setCouponCodeInput("");
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="کد تخفیف..."
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs uppercase font-mono outline-none text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)]"
                    />
                    <button type="submit" className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer hover:opacity-90 transition shrink-0 shadow-md">
                      اعمال
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>کد تخفیف {appliedCoupon.code} فعال است ({appliedCoupon.discountPercent}٪)</span>
                    <button onClick={removeCoupon} className="text-rose-500 cursor-pointer font-black">✕</button>
                  </div>
                )}

                <div className="space-y-1.5 text-[var(--text-secondary)] font-medium">
                  <div className="flex justify-between">
                    <span>جمع کل اقلام:</span>
                    <span className="text-[var(--text-primary)] font-bold font-mono">
                      {rawTotal.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>تخفیف:</span>
                      <span className="font-mono">- {discountAmount.toLocaleString("fa-IR")} تومان</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-[var(--accent-blue)] pt-1 border-t border-[var(--card-border)]">
                    <span>مبلغ قابل پرداخت:</span>
                    <span className="font-mono">{finalTotal.toLocaleString("fa-IR")} تومان</span>
                  </div>
                </div>

                {!showCheckoutForm ? (
                  <button
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 transition shadow-xl shadow-blue-500/25"
                  >
                    ادامه و تکمیل مشخصات تحویل 🚀
                  </button>
                ) : (
                  <form onSubmit={handleInitiateOtp} className="space-y-3 pt-3 border-t border-[var(--card-border)] animate-fadeIn">
                    {validationError && (
                      <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-[11px] leading-relaxed">
                        ⚠️ {validationError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">نام تحویل‌گیرنده *</label>
                        <input
                          type="text"
                          placeholder="مثلاً: پوریا"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">نام خانوادگی *</label>
                        <input
                          type="text"
                          placeholder="مثلاً: رحیمی"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">شماره موبایل *</label>
                        <input
                          type="text"
                          placeholder="09123456789"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)] text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">کد پستی ۱۰ رقمی *</label>
                        <input
                          type="text"
                          placeholder="کد ۱۰ رقمی"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--accent-blue)] text-center font-bold text-[var(--text-primary)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">نشانی دقیق پستی تحویل *</label>
                      <textarea
                        rows={2}
                        placeholder="استان، شهر، خیابان، پلاک، واحد..."
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none text-[var(--text-primary)] font-medium focus:border-[var(--accent-blue)]"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer transition shadow-md disabled:opacity-50"
                      >
                        {isSendingOtp ? "در حال ارسال پیامک..." : "📲 تایید شماره با پیامک ۶ رقمی"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCheckoutForm(false);
                          setValidationError(null);
                        }}
                        className="py-3.5 px-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-bold text-xs cursor-pointer hover:border-[var(--accent-blue)] transition"
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* مدال تایید پیامکی ۶ رقمی (OTP) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-sans">
          <div className="max-w-sm w-full bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 text-[var(--text-primary)] space-y-5 shadow-2xl relative">
            <div className="text-center space-y-2">
              <span className="text-3xl block">📱</span>
              <h3 className="font-black text-base text-[var(--text-primary)]">تایید هویت و شماره موبایل</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                کد تایید ۶ رقمی به شماره <span className="font-mono font-bold text-[var(--accent-blue)]">{phone}</span> پیامک شد.
              </p>
            </div>

            {generatedOtp && (
              <div className="p-3.5 rounded-2xl bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-center space-y-1 animate-pulse">
                <span className="text-[10px] text-[var(--accent-blue)] block font-extrabold">📩 کد تایید ارسالی:</span>
                <span className="font-mono font-black text-xl text-[var(--accent-blue)] tracking-widest">{generatedOtp}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1 text-center font-bold">کد ۶ رقمی را وارد کنید:</label>
              <input
                type="text"
                maxLength={6}
                value={userOtpInput}
                onChange={(e) => setUserOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="------"
                className="w-full p-3.5 text-center text-xl font-mono tracking-widest rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)] font-black"
              />
            </div>

            <div className="text-center text-[11px] text-[var(--text-secondary)] font-medium">
              {otpTimer > 0 ? (
                <span>
                  زمان باقی‌مانده:{" "}
                  <strong className="font-mono text-[var(--text-primary)] font-bold">
                    {Math.floor(otpTimer / 60)}:{("0" + (otpTimer % 60)).slice(-2)}
                  </strong>
                </span>
              ) : (
                <button
                  onClick={handleInitiateOtp}
                  className="text-[var(--accent-blue)] font-bold hover:underline cursor-pointer"
                >
                  🔄 ارسال مجدد کد تایید پیامکی
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleVerifyOtpAndProceed}
                disabled={isVerifyingOtp}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isVerifyingOtp ? "در حال تایید..." : "تایید و صدور فاکتور رسمی 💳"}
              </button>
              <button
                onClick={() => setShowOtpModal(false)}
                className="py-3.5 px-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-bold text-xs hover:border-[var(--accent-blue)] transition cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
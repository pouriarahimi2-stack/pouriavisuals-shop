// components/Header.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { menuService, MenuItem } from "@/services/menuService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { categoryService, Category } from "@/services/categoryService";
import { productService, Product } from "@/services/productService";
import { supabase } from "@/lib/supabase";

function isValidIranianPostalCode(postalCode: string): { valid: boolean; message?: string } {
  if (!postalCode) return { valid: false, message: "کد پستی ۱۰ رقمی الزامی است." };
  const cleanCode = postalCode
    .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
    .replace(/\D/g, "");

  if (cleanCode.length !== 10) {
    return { valid: false, message: "کد پستی باید دقیقاً ۱۰ رقم عددی بدون خط تیره باشد." };
  }

  const firstDigit = cleanCode.charAt(0);
  if (firstDigit === "0" || firstDigit === "2") {
    return { valid: false, message: "کد پستی با ارقام ۰ یا ۲ در محدوده مناطق پستی ایران تعریف نشده است." };
  }

  if (/^(\d)\1{9}$/.test(cleanCode)) {
    return { valid: false, message: "کد پستی نمی‌تواند از ۱۰ رقم کاملاً تکراری تشکیل شده باشد." };
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
  const applyCoupon = cartContext?.applyCoupon || (() => ({ success: false, message: "" }));
  const removeCoupon = cartContext?.removeCoupon || (() => {});
  const submitOrder = cartContext?.submitOrder;

  const [mounted, setMounted] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string | number, boolean>>({});

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userOtpInput, setUserOtpInput] = useState("");
  const [otpTimer, setOtpTimer] = useState(120);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const rawTotal = cartItems.reduce(
    (acc, item) => acc + (item.discountPrice ?? item.price) * item.quantity,
    0
  );

  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = (rawTotal * appliedCoupon.discountPercent) / 100;
    if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
      discountAmount = appliedCoupon.maxDiscount;
    }
  }

  const finalTotal = Math.max(0, rawTotal - discountAmount);

  async function fetchAllHeaderData() {
    try {
      const [info, menus, cats, prods] = await Promise.all([
        siteInfoService.getSiteInfo(),
        menuService.getAll(),
        categoryService.getAll(),
        productService.getAll(),
      ]);
      if (info) setSiteInfo(info);
      if (menus) setMenuItems(menus.filter((m: any) => m.isActive !== false && m.is_active !== false));
      if (cats) setCategories(cats);
      if (prods) setAllProducts(prods);
    } catch (e) {
      console.error("Header fetch error:", e);
    }
  }

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme !== "light";
    setIsDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    fetchAllHeaderData();

    const handleSiteInfoUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
      else fetchAllHeaderData();
    };

    window.addEventListener("site_info_updated", handleSiteInfoUpdate);

    const channel = supabase
      .channel("header-realtime-master-v15")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => fetchAllHeaderData())
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => fetchAllHeaderData())
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => fetchAllHeaderData())
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchAllHeaderData())
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
      document.removeEventListener("mousedown", handleClickOutside);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = allProducts.filter((p) =>
      (p.title || p.name || "").toLowerCase().includes(q) ||
      (p.title_fa || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q)
    );
    setSearchResults(matches.slice(0, 6));
  }, [searchQuery, allProducts]);

  useEffect(() => {
    let timer: any;
    if (showOtpModal && otpTimer > 0) {
      timer = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, otpTimer]);

  const toggleDarkMode = () => {
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

    if (!firstName.trim() || !lastName.trim() || !phone || !address.trim() || !postalCode) {
      setValidationError("لطفاً تمامی مشخصات گیرنده و آدرس پستی را به طور کامل تکمیل نمایید.");
      return;
    }

    if (!/^09\d{9}$/.test(phone.trim())) {
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
        body: JSON.stringify({ phone, action: "send" }),
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

    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: userOtpInput.trim(), action: "verify" }),
      });
      const data = await res.json();

      if (data.success && data.verified) {
        if (!submitOrder) {
          router.push(`/checkout/payment?orderId=ORD-${Date.now().toString().slice(-6)}`);
          return;
        }

        const newOrder = submitOrder({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          address: address.trim(),
          postalCode,
          isPhoneVerified: true,
          otpHash: data.token || `OTP-VERIFIED`,
          otpSentAt: new Date().toISOString(),
        });

        setFirstName("");
        setLastName("");
        setPhone("");
        setPostalCode("");
        setAddress("");
        setShowCheckoutForm(false);
        setShowOtpModal(false);

        router.push(`/checkout/payment?orderId=${newOrder.id}`);
      } else {
        alert(data.message || "کد ۶ رقمی وارد شده اشتباه یا منقضی شده است.");
      }
    } catch {
      alert("خطا در اعتبارسنجی پیامک.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const currentStoreName = siteInfo?.site_name || siteInfo?.siteName || siteInfo?.storeName || "آکسون | Axon";
  const currentLogoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;
  const headerAnnouncement = siteInfo?.header_announcement;

  if (!mounted) {
    return <header className="h-20" />;
  }

  return (
    <header className="sticky top-2 sm:top-3.5 z-40 max-w-7xl mx-auto px-3 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl">
      
      {headerAnnouncement && !announcementDismissed && (
        <div className="w-full mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-[11px] font-black py-2 px-4 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex-1 flex items-center justify-center gap-2">
            <span>📢</span>
            <span>{headerAnnouncement}</span>
          </div>
          <button
            onClick={() => setAnnouncementDismissed(true)}
            className="text-white/80 hover:text-white text-xs font-bold cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* بدنه اصلی هدر با دکمه‌های متقارن و بدون ارور */}
      <div className="bg-[var(--modal-bg)]/90 backdrop-blur-2xl px-4 sm:px-6 py-2.5 rounded-[2rem] shadow-2xl border border-[var(--card-border)] relative">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          
          {/* راست: لوگو، عنوان و دسته‌ها */}
          <div className="flex items-center gap-3.5 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs cursor-pointer"
            >
              ☰
            </button>

            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-[var(--card-border)] bg-white/5 p-1 shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                {currentLogoUrl ? (
                  <img src={currentLogoUrl} alt={currentStoreName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-[var(--accent-blue)]">⚡</span>
                )}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-sm sm:text-base font-black tracking-tight text-[var(--text-primary)]">
                  {currentStoreName}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[var(--accent-blue)] mt-0.5">
                  {siteInfo?.tagline || "مرجع تخصصی تجهیزات دیجیتال"}
                </span>
              </div>
            </Link>

            <div className="relative hidden md:block" ref={categoryDropdownRef}>
              <button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 border cursor-pointer ${
                  isCategoryOpen || selectedCategory !== "all"
                    ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]"
                }`}
              >
                <span>☰</span>
                <span>دسته‌بندی‌ها</span>
                <span className="text-[9px] opacity-70">▾</span>
              </button>

              {isCategoryOpen && (
                <div className="absolute top-14 right-0 w-60 p-2 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1">
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

          {/* وسط: منوی پیوندها */}
          <nav className="hidden xl:flex items-center gap-1 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--card-border)] shadow-inner">
            {menuItems.length > 0 ? (
              menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.url || "#"}
                  className="px-3.5 py-2 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition whitespace-nowrap"
                >
                  {item.title}
                </Link>
              ))
            ) : (
              <>
                <Link href="/" className="px-3.5 py-2 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition">صفحه نخست</Link>
                <Link href="/products" className="px-3.5 py-2 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition">کاتالوگ محصولات</Link>
                <Link href="/news" className="px-3.5 py-2 rounded-xl text-xs font-black text-[var(--accent-blue)] hover:text-white hover:bg-[var(--accent-blue)] transition">📡 رادار اخبار تکنولوژی</Link>
                <Link href="/track-order" className="px-3.5 py-2 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition">پیگیری مرسوله پستی</Link>
                <Link href="/blog" className="px-3.5 py-2 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition">مجله تخصصی</Link>
                <Link href="/contact" className="px-3.5 py-2 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition">تماس با ما</Link>
              </>
            )}
          </nav>

          {/* چپ: جستجو، تم و دکمه سبد خرید بازطراحی‌شده */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="relative hidden lg:block" ref={searchContainerRef}>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-40 xl:w-52 shadow-sm h-11">
                <span className="text-xs opacity-70">🔍</span>
                <input
                  type="text"
                  placeholder="جستجوی مدل، برند..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] font-bold placeholder-slate-400"
                />
              </div>

              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-14 left-0 right-0 p-2.5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1.5 w-80">
                  <div className="max-h-64 overflow-y-auto space-y-1.5">
                    {searchResults.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--input-bg)] transition gap-2">
                        <Link href={`/products/${p.id}`} onClick={() => setIsSearchFocused(false)} className="flex items-center gap-2.5 flex-1 min-w-0">
                          <img src={p.images?.[0] || p.image || "/placeholder.png"} alt="" className="w-10 h-10 object-contain rounded-lg bg-white/5 p-1 border border-[var(--card-border)] shrink-0" />
                          <div className="flex-1 min-w-0 text-right">
                            <h4 className="text-xs font-black text-[var(--text-primary)] truncate">{p.title || p.name}</h4>
                            <span className="font-mono font-black text-[10px] text-emerald-600 dark:text-emerald-400">{Number(p.discountPrice || p.price || 0).toLocaleString("fa-IR")} ت</span>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => handleQuickAddFromSearch(e, p)}
                          className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-[var(--accent-blue)] text-white cursor-pointer shadow-md"
                        >
                          {addedItemMap[p.id] ? "✓ اضافه شد" : "+ خرید"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleDarkMode}
              className="w-11 h-11 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs hover:border-[var(--accent-blue)] transition cursor-pointer shadow-sm flex items-center justify-center shrink-0"
              title="تغییر تم شب و روز"
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>

            {/* دکمه سبد خرید با استایل اپلی */}
            <button
              onClick={toggleCart}
              className="relative h-11 px-4 sm:px-5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white font-black text-xs transition-all shadow-lg shadow-blue-500/25 cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap"
            >
              <div className="relative flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalCartCount > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 min-w-[1.2rem] h-[1.2rem] px-1 rounded-full bg-rose-500 text-white font-mono font-black text-[10px] flex items-center justify-center border-2 border-[var(--modal-bg)] shadow-md animate-pulse">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold">سبد خرید</span>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="xl:hidden mt-2 p-5 bg-[var(--modal-bg)] rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex flex-col space-y-2 text-xs font-bold">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[var(--input-bg)] flex items-center gap-2">🏠 صفحه نخست</Link>
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[var(--input-bg)] flex items-center gap-2">📦 کاتالوگ تجهیزات</Link>
            <Link href="/news" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[var(--input-bg)] flex items-center gap-2 text-[var(--accent-blue)]">📡 رادار اخبار تکنولوژی روز دنیا</Link>
            <Link href="/track-order" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[var(--input-bg)] flex items-center gap-2">🚚 استعلام مرسوله پستی</Link>
            <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[var(--input-bg)] flex items-center gap-2">📚 مجله تخصصی سئو</Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[var(--input-bg)] flex items-center gap-2">📞 تماس با ما</Link>
          </div>
        </div>
      )}

      {/* دراور سبد خرید */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
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
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs gap-3 shadow-sm"
                    >
                      <img src={item.image} alt={item.title || item.name} className="w-12 h-12 object-contain rounded-xl bg-[var(--modal-bg)] p-1 border border-[var(--card-border)]" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-[var(--text-primary)] truncate">{item.title || item.name}</h4>
                        <span className="text-[var(--accent-blue)] font-black block font-mono">
                          {(item.discountPrice ?? item.price).toLocaleString("fa-IR")} تومان
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
                  <form onSubmit={(e) => { e.preventDefault(); if (couponCodeInput.trim()) applyCoupon(couponCodeInput.trim()); setCouponCodeInput(""); }} className="flex gap-2">
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
                    <span className="text-[var(--text-primary)] font-bold font-mono">{rawTotal.toLocaleString("fa-IR")} تومان</span>
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
                        <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">شماره موبایل (۱۱ رقم) *</label>
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
                          placeholder="کد ۱۰ رقمی پستی"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--accent-blue)] text-center font-bold"
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
                        onClick={() => { setShowCheckoutForm(false); setValidationError(null); }}
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
                <span>زمان باقی‌مانده: <strong className="font-mono text-[var(--text-primary)] font-bold">{Math.floor(otpTimer / 60)}:{("0" + (otpTimer % 60)).slice(-2)}</strong></span>
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
                {isVerifyingOtp ? "در حال تایید..." : "تایید و انتقال به درگاه بانکی 💳"}
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
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { menuService, MenuItem } from "@/services/menuService";
import { siteInfoService } from "@/services/siteInfoService";
import { categoryService, Category } from "@/services/categoryService";
import { productService } from "@/services/productService";

function isValidIranianPostalCode(postalCode: string): { valid: boolean; message?: string } {
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
    return { valid: false, message: "کد پستی نمی‌تواند از ارقام کاملاً تکراری تشکیل شده باشد." };
  }

  const sequentialPatterns = ["0123456789", "1234567890", "2345678901", "9876543210", "8765432109"];
  if (sequentialPatterns.includes(cleanCode)) {
    return { valid: false, message: "کد پستی وارد شده نمی‌تواند عدد الکی یا پشت سر هم باشد." };
  }

  if (cleanCode.substring(5) === "00000") {
    return { valid: false, message: "بخش دوم کد پستی معتبر نیست." };
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

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // متغیرهای جستجوی آنی در هدر
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string | number, boolean>>({});
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  async function fetchLiveSiteInfo() {
    try {
      const [info, menus, cats] = await Promise.all([
        siteInfoService.getSiteInfo ? siteInfoService.getSiteInfo() : (siteInfoService as any).getAll(),
        menuService.getAll ? menuService.getAll() : [],
        categoryService && categoryService.getAll ? categoryService.getAll() : (productService as any).getCategories(),
      ]);
      if (info) setSiteInfo(info);
      if (menus) setMenuItems(menus.filter((m: any) => m.isActive !== false && m.is_active !== false));
      if (cats && cats.length > 0) {
        if (typeof cats[0] === "string") {
          setCategories(cats.map((c: any, index: number) => ({ id: String(index), name: c, slug: c })));
        } else {
          setCategories(cats);
        }
      }
    } catch (e) {
      console.error("Header init error:", e);
    }
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (dark: boolean) => {
      setIsDarkMode(dark);
      if (dark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    if (savedTheme) {
      applyTheme(savedTheme === "dark");
    } else {
      applyTheme(mediaQuery.matches);
    }

    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        applyTheme(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handler);
    fetchLiveSiteInfo();

    const handleUpdate = () => fetchLiveSiteInfo();
    window.addEventListener("site_info_updated", handleUpdate);

    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // هندلر کلیک خارج از باکس سرچ
    const handleClickOutsideSearch = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideSearch);

    // بارگذاری لیست محصولات برای شاخص سرچ
    const loadAllProducts = async () => {
      try {
        const prods = await productService.getAll();
        setAllProducts(prods || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadAllProducts();

    return () => {
      mediaQuery.removeEventListener("change", handler);
      window.removeEventListener("site_info_updated", handleUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutsideSearch);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = allProducts.filter((p) => {
      return (
        (p.title || p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    });
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

  const handleSelectCategory = (catSlug: string) => {
    setSelectedCategory(catSlug);
    setIsCategoryOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("category_selected", { detail: catSlug }));
    }
  };

  // عملیات افزودن فوری کالا به سبد خرید از داخل پاپ‌آپ سرچ
  const handleQuickAdd = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      id: product.id,
      name: product.name || product.title || "کالای دیجیتال",
      title: product.title || product.name || "کالای دیجیتال",
      price: Number(product.discountPrice ?? product.price ?? 0),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
      image: product.images?.[0] || product.image || product.image_url || "/placeholder.png",
      stock: Number(product.stock ?? 1),
      category: product.category || "عمومی",
      quantity: 1,
    });

    setAddedItemMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemMap((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const toEnglishDigits = (str: string) => {
    return str
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
  };

  const handleNameChange = (val: string, setter: (v: string) => void) => {
    const cleanVal = val.replace(/[0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?~`-]/g, "");
    setter(cleanVal);
  };

  const handlePhoneChange = (val: string) => {
    const cleanDigits = toEnglishDigits(val).replace(/\D/g, "");
    if (cleanDigits.length <= 11) {
      setPhone(cleanDigits);
    }
  };

  const handlePostalCodeChange = (val: string) => {
    const cleanDigits = toEnglishDigits(val).replace(/\D/g, "");
    if (cleanDigits.length <= 10) {
      setPostalCode(cleanDigits);
    }
  };

  const handleInitiateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!firstName.trim() || !lastName.trim() || !phone || !address.trim() || !postalCode) {
      setValidationError("لطفاً تمامی فیلدها را به طور کامل تکمیل کنید.");
      return;
    }

    const mobileRegex = /^09\d{9}$/;
    if (!mobileRegex.test(phone)) {
      setValidationError("شماره موبایل نامعتبر است! باید ۱۱ رقم بوده و با 09 شروع شود.");
      return;
    }

    const postalCheck = isValidIranianPostalCode(postalCode);
    if (!postalCheck.valid) {
      setValidationError(postalCheck.message || "کد پستی وارد شده معتبر نیست.");
      return;
    }

    if (address.trim().length < 5) {
      setValidationError("لطفاً آدرس دقیق ارسال را وارد کنید (حداقل ۵ حرف).");
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
        setValidationError(data.message || "خطا در ارسال پیامک.");
      }
    } catch {
      setValidationError("خطا در برقراری ارتباط با سرور پیامک.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpAndProceed = async () => {
    if (userOtpInput.trim().length !== 6) {
      alert("لطفاً کد ۶ رقمی را کامل وارد کنید.");
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
        if (!submitOrder) return;

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
        alert(data.message || "کد ۶ رقمی وارد شده اشتباه یا منقضی است.");
      }
    } catch {
      alert("خطا در اعتبارسنجی پیامک.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const isGoogleIndexAllowed = siteInfo?.allowGoogleIndex !== false;
  const currentStoreName = siteInfo?.storeName || siteInfo?.site_name || siteInfo?.siteName || siteInfo?.name || "آکسون | Axon";
  const currentLogoUrl = siteInfo?.logoUrl || siteInfo?.logo_url;

  return (
    <header className="sticky top-4 z-40 max-w-6xl mx-auto px-4 select-none font-sans text-[var(--text-primary)]">
      <div className="liquid-glass-card px-6 py-3.5 flex items-center justify-between gap-4 rounded-3xl backdrop-blur-2xl shadow-xl border border-[var(--card-border)] relative">
        
        {/* راست: لوگو، نام سایت و دکمه شکیل دسته‌بندی‌ها */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-black text-lg">
            {currentLogoUrl ? (
              <img src={currentLogoUrl} alt={currentStoreName} className="w-8 h-8 object-contain rounded-lg" />
            ) : (
              <span className="w-8 h-8 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center text-sm font-bold shadow-md">⚡</span>
            )}
            <span className="text-[var(--text-primary)]">
              {currentStoreName}
            </span>
          </Link>

          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              isGoogleIndexAllowed
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse"
                : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"
            }`}
          />

          {/* دکمه منوی دسته‌بندی سه‌خط مدرن */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
                isCategoryOpen || selectedCategory !== "all"
                  ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
                  : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]"
              }`}
            >
              <div className="flex flex-col gap-0.5 justify-center items-center w-4 h-4">
                <span className={`h-0.5 w-3.5 rounded-full transition-all ${isCategoryOpen || selectedCategory !== "all" ? "bg-white" : "bg-[var(--text-primary)]"}`}></span>
                <span className={`h-0.5 w-2.5 rounded-full transition-all ${isCategoryOpen || selectedCategory !== "all" ? "bg-white" : "bg-[var(--text-primary)]"}`}></span>
                <span className={`h-0.5 w-3.5 rounded-full transition-all ${isCategoryOpen || selectedCategory !== "all" ? "bg-white" : "bg-[var(--text-primary)]"}`}></span>
              </div>
              <span>دسته‌بندی‌ها</span>
              <span className="text-[10px] opacity-70">▾</span>
            </button>

            {/* دراپ داون مدرن شیشه‌ای دسته‌بندی‌ها */}
            {isCategoryOpen && (
              <div className="absolute top-12 right-0 w-56 p-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-black text-[var(--text-secondary)] border-b border-[var(--card-border)] mb-1 flex items-center justify-between">
                  <span>منوی کالاها</span>
                  <span className="text-[9px] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] px-2 py-0.5 rounded-full">
                    {categories.length + 1} دسته
                  </span>
                </div>

                <button
                  onClick={() => handleSelectCategory("all")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-[var(--accent-blue)] text-white shadow-sm"
                      : "text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-2">📦 همه کالاها</span>
                  {selectedCategory === "all" && <span>✓</span>}
                </button>

                {categories.map((cat) => {
                  const slug = cat.slug || cat.name;
                  const isActive = selectedCategory === slug;
                  return (
                    <button
                      key={cat.id || cat.name}
                      onClick={() => handleSelectCategory(slug)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? "bg-[var(--accent-blue)] text-white shadow-sm"
                          : "text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-2">🏷️ {cat.name}</span>
                      {isActive && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* وسط: منوی ناوبری لینک‌های اصلی */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-bold text-[var(--text-secondary)]">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.url || (item as any).href || "#"}
                className="hover:text-[var(--accent-blue)] transition font-bold"
              >
                {item.title || (item as any).label}
              </Link>
            ))
          ) : (
            <>
              <Link href="/" className="hover:text-[var(--accent-blue)] transition font-bold">صفحه نخست</Link>
              <Link href="/products" className="hover:text-[var(--accent-blue)] transition font-bold">کاتالوگ محصولات</Link>
              <Link href="/track-order" className="hover:text-[var(--accent-blue)] transition font-bold">پیگیری سفارش پستی</Link>
              <Link href="/blog" className="hover:text-[var(--accent-blue)] transition font-bold">مجله و مقالات سئو</Link>
              <Link href="/contact" className="hover:text-[var(--accent-blue)] transition font-bold">تماس با ما</Link>
            </>
          )}
        </nav>

        {/* چپ: کنترل تم، سرچ و سبد خرید */}
        <div className="flex items-center gap-3">
          {/* باکس جستجوی آنی و شیک با خرید مستقیم */}
          <div className="relative hidden sm:block" ref={searchContainerRef}>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-44 md:w-56">
              <span className="text-xs">🔍</span>
              <input
                type="text"
                placeholder="جستجوی سریع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] font-bold placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[10px] text-slate-400 hover:text-rose-500 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* دراپ داون نتایج جستجوی زنده به همراه دکمه خرید سریع */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 p-2.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1.5 w-72 md:w-80">
                <div className="px-2 pb-1.5 border-b border-[var(--card-border)] text-[10px] text-[var(--text-secondary)] font-black text-right flex justify-between items-center">
                  <span>نتایج جستجوی آنی</span>
                  <span className="text-[9px] text-[var(--accent-blue)]">{searchResults.length} کالا</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1.5 scrollbar-none">
                  {searchResults.map((p) => {
                    const isAdded = addedItemMap[p.id];
                    const itemTitle = p.title || p.name || "کالا";
                    const itemPrice = Number(p.discountPrice || p.price || 0);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition group gap-2"
                      >
                        <Link
                          href={`/products/${p.id}`}
                          onClick={() => setIsSearchFocused(false)}
                          className="flex items-center gap-2.5 flex-1 min-w-0"
                        >
                          <img
                            src={p.images?.[0] || p.image || p.image_url || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100"}
                            alt=""
                            className="w-9 h-9 object-contain rounded-lg bg-slate-50 dark:bg-slate-800 p-1 shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-right">
                            <h4 className="text-xs font-black text-[var(--text-primary)] truncate group-hover:text-[var(--accent-blue)] transition">
                              {itemTitle}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-[var(--accent-blue)] font-extrabold">{p.category || "تجهیزات"}</span>
                              <span className="font-mono font-black text-[10px] text-emerald-600 dark:text-emerald-400">
                                {itemPrice.toLocaleString("fa-IR")} ت
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* دکمه خرید سریع */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, p)}
                          className={`p-1.5 px-2 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                            isAdded
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white"
                          }`}
                          title="خرید سریع و افزودن به سبد"
                        >
                          {isAdded ? (
                            <>
                              <span>✓</span>
                              <span>ثبت شد</span>
                            </>
                          ) : (
                            <>
                              <span>+</span>
                              <span>خرید</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] transition cursor-pointer text-xs border border-[var(--card-border)] text-[var(--text-primary)] font-bold"
            title="تغییر تم"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button
            onClick={toggleCart}
            className="relative px-4 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition shadow-md cursor-pointer flex items-center gap-2"
          >
            <span>🛒 سبد خرید</span>
            {totalCartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[var(--accent-blue)] flex items-center justify-center text-[10px] font-black shadow-sm">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* سایدبار کشویی سبد خرید */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
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
                <div className="p-12 text-center text-[var(--text-secondary)] text-xs font-bold">سبد خرید شما خالی است.</div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs gap-3 shadow-sm"
                    >
                      <img src={item.image} alt={item.title || item.name} className="w-12 h-12 object-contain rounded-xl bg-[var(--modal-bg)] p-1 border border-[var(--card-border)]" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-[var(--text-primary)]">{item.title || item.name}</h4>
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
                    <span>جمع کل:</span>
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
                    className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 transition shadow-lg"
                  >
                    ادامه و ورود مشخصات تحویل 🚀
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
                        <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">نام (حروف)</label>
                        <input
                          type="text"
                          placeholder="مثلاً: پوریا"
                          required
                          value={firstName}
                          onChange={(e) => handleNameChange(e.target.value, setFirstName)}
                          className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">نام خانوادگی (حروف)</label>
                        <input
                          type="text"
                          placeholder="مثلاً: احمدی"
                          required
                          value={lastName}
                          onChange={(e) => handleNameChange(e.target.value, setLastName)}
                          className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">شماره موبایل (۱۱ رقم)</label>
                        <input
                          type="text"
                          placeholder="09123456789"
                          required
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">کد پستی ده رقمی معتبر</label>
                        <input
                          type="text"
                          placeholder="مثلاً: 1417753114"
                          required
                          value={postalCode}
                          onChange={(e) => handlePostalCodeChange(e.target.value)}
                          className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 font-bold">آدرس دقیق ارسال</label>
                      <textarea
                        rows={2}
                        placeholder="خیابان، کوچه، پلاک، واحد..."
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

      {/* مودال تایید پیامکی */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="max-w-sm w-full bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 text-[var(--text-primary)] space-y-5 shadow-2xl relative">
            <div className="text-center space-y-2">
              <span className="text-3xl block">📱</span>
              <h3 className="font-black text-base text-[var(--text-primary)]">تایید شماره تلفن همراه</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                کد تایید ۶ رقمی به شماره <span className="font-mono font-bold text-[var(--accent-blue)]">{phone}</span> ارسال شد.
              </p>
            </div>

            {generatedOtp && (
              <div className="p-3.5 rounded-2xl bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-center space-y-1 animate-pulse">
                <span className="text-[10px] text-[var(--accent-blue)] block font-extrabold">📩 کد تایید ارسالی سرور:</span>
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
                  🔄 ارسال مجدد کد پیامکی
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleVerifyOtpAndProceed}
                disabled={isVerifyingOtp}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isVerifyingOtp ? "در حال تایید..." : "تایید و انتقال به درگاه 💳"}
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
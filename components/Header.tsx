"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { menuService, MenuItem } from "@/services/menuService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

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
  const removeFromCart = cartContext?.removeFromCart || (() => {});
  const updateQuantity = cartContext?.updateQuantity || (() => {});
  const appliedCoupon = cartContext?.appliedCoupon || null;
  const applyCoupon = cartContext?.applyCoupon || (() => ({ success: false, message: "" }));
  const removeCoupon = cartContext?.removeCoupon || (() => {});
  const submitOrder = cartContext?.submitOrder;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  useEffect(() => {
    // دریافت داینامیک آیتم‌های فعال منوی هدر و برندینگ سایت از ادمین
    const headerMenu = menuService
      .getMenuItems()
      .filter((item) => item.location === "header" && item.isActive);
    setMenuItems(headerMenu);
    setSiteInfo(siteInfoService.getSiteInfo());

    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    let timer: any;
    if (showOtpModal && otpTimer > 0) {
      timer = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, otpTimer]);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
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

  const handleInitiateOtp = (e: React.FormEvent) => {
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

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpTimer(120);
    setUserOtpInput("");
    setShowOtpModal(true);
  };

  const handleVerifyOtpAndProceed = () => {
    if (userOtpInput.trim() !== generatedOtp) {
      alert("کد ۶ رقمی وارد شده اشتباه است. لطفاً دوباره تلاش کنید.");
      return;
    }

    if (!submitOrder) return;

    const newOrder = submitOrder({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      address: address.trim(),
      postalCode,
      isPhoneVerified: true,
      otpHash: `OTP-${generatedOtp}-HASH`,
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
  };

  return (
    <header className="sticky top-4 z-40 max-w-6xl mx-auto px-4 select-none font-sans">
      <div className="liquid-glass-card px-6 py-3.5 flex items-center justify-between gap-4 border border-[var(--glass-border)] backdrop-blur-2xl shadow-2xl">
        <Link href="/" className="flex items-center gap-2.5 font-black text-lg">
          {siteInfo?.logoUrl ? (
            <img src={siteInfo.logoUrl} alt={siteInfo.storeName} className="w-8 h-8 object-contain rounded-lg" />
          ) : (
            <span className="w-8 h-8 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center text-sm font-bold shadow-md">⚡</span>
          )}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            {siteInfo?.storeName || "فروشگاه"}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold opacity-80">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.url || item.href || "#"} className="hover:text-[var(--accent-blue)] transition">
              {item.title || item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={toggleDarkMode} className="p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition cursor-pointer text-xs" title="تغییر تم">
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button onClick={toggleCart} className="relative px-3.5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition shadow-md cursor-pointer flex items-center gap-2">
            <span>🛒 سبد خرید</span>
            {totalCartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[var(--accent-blue)] flex items-center justify-center text-[10px] font-black">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-full bg-slate-900/95 border-r border-white/10 p-6 text-white flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <span>🛒</span> سبد خرید شما ({totalCartCount})
                </h3>
                <button onClick={toggleCart} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold cursor-pointer transition">
                  ✕
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-12 text-center opacity-60 text-xs">سبد خرید شما خالی است.</div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 text-xs gap-3">
                      <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-xl" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold">{item.title}</h4>
                        <span className="text-[var(--accent-blue)] font-bold block">
                          {(item.discountPrice ?? item.price).toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 rounded-xl px-2 py-1 font-bold">
                        <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-[var(--accent-blue)] cursor-pointer px-1">-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-[var(--accent-blue)] cursor-pointer px-1">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 font-bold hover:text-red-600 transition cursor-pointer p-1">🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/10 text-xs">
                {!appliedCoupon ? (
                  <form onSubmit={(e) => { e.preventDefault(); if (couponCodeInput.trim()) applyCoupon(couponCodeInput.trim()); setCouponCodeInput(""); }} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="کد تخفیف..."
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs uppercase font-mono outline-none"
                    />
                    <button type="submit" className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer hover:opacity-90 transition shrink-0">
                      اعمال
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold">
                    <span>کد تخفیف {appliedCoupon.code} فعال است ({appliedCoupon.discountPercent}٪)</span>
                    <button onClick={removeCoupon} className="text-red-400 cursor-pointer">✕</button>
                  </div>
                )}

                <div className="space-y-1 opacity-80">
                  <div className="flex justify-between">
                    <span>جمع کل:</span>
                    <span>{rawTotal.toLocaleString("fa-IR")} تومان</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-400 font-bold">
                      <span>تخفیف:</span>
                      <span>- {discountAmount.toLocaleString("fa-IR")} تومان</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-[var(--accent-blue)] pt-1">
                    <span>مبلغ قابل پرداخت:</span>
                    <span>{finalTotal.toLocaleString("fa-IR")} تومان</span>
                  </div>
                </div>

                {!showCheckoutForm ? (
                  <button
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full py-3.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs cursor-pointer hover:opacity-90 transition shadow-lg"
                  >
                    ادامه و ورود مشخصات تحویل 🚀
                  </button>
                ) : (
                  <form onSubmit={handleInitiateOtp} className="space-y-2 pt-2 border-t border-white/10 animate-fadeIn">
                    {validationError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[11px] leading-relaxed">
                        ⚠️ {validationError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] opacity-70 mb-0.5">نام (حروف)</label>
                        <input
                          type="text"
                          placeholder="مثلاً: پوریا"
                          required
                          value={firstName}
                          onChange={(e) => handleNameChange(e.target.value, setFirstName)}
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] opacity-70 mb-0.5">نام خانوادگی (حروف)</label>
                        <input
                          type="text"
                          placeholder="مثلاً: احمدی"
                          required
                          value={lastName}
                          onChange={(e) => handleNameChange(e.target.value, setLastName)}
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] opacity-70 mb-0.5">شماره موبایل (۱۱ رقم)</label>
                        <input
                          type="text"
                          placeholder="09123456789"
                          required
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] opacity-70 mb-0.5">کد پستی ده رقمی معتبر</label>
                        <input
                          type="text"
                          placeholder="مثلاً: 1417753114"
                          required
                          value={postalCode}
                          onChange={(e) => handlePostalCodeChange(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] opacity-70 mb-0.5">آدرس دقیق ارسال</label>
                      <textarea
                        rows={2}
                        placeholder="خیابان، کوچه، پلاک، واحد..."
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-xs cursor-pointer hover:opacity-90 transition shadow-md"
                      >
                        📲 تایید شماره با پیامک ۶ رقمی
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCheckoutForm(false); setValidationError(null); }}
                        className="py-3 px-4 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer hover:bg-white/20 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-sm w-full bg-slate-900 border border-white/20 rounded-3xl p-6 text-white space-y-5 shadow-2xl relative">
            <div className="text-center space-y-2">
              <span className="text-3xl block">📱</span>
              <h3 className="font-black text-base">تایید شماره تلفن همراه</h3>
              <p className="text-xs opacity-70">
                کد تایید ۶ رقمی به شماره <span className="font-mono font-bold text-[var(--accent-blue)]">{phone}</span> ارسال شد.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center space-y-1 animate-pulse">
              <span className="text-[10px] opacity-70 block font-bold">📩 پیامک دریافتی (شبیه‌سازی شده):</span>
              <span className="font-mono font-black text-lg text-[var(--accent-blue)] tracking-widest">{generatedOtp}</span>
            </div>

            <div>
              <label className="block text-[10px] opacity-70 mb-1 text-center font-bold">کد ۶ رقمی را وارد کنید:</label>
              <input
                type="text"
                maxLength={6}
                value={userOtpInput}
                onChange={(e) => setUserOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="------"
                className="w-full p-3 text-center text-xl font-mono tracking-widest rounded-xl bg-white/5 border border-white/20 outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="text-center text-[11px] opacity-70">
              {otpTimer > 0 ? (
                <span>زمان باقی‌مانده: <strong className="font-mono">{Math.floor(otpTimer / 60)}:{("0" + (otpTimer % 60)).slice(-2)}</strong></span>
              ) : (
                <button
                  onClick={() => {
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedOtp(code);
                    setOtpTimer(120);
                  }}
                  className="text-[var(--accent-blue)] font-bold hover:underline cursor-pointer"
                >
                  🔄 ارسال مجدد کد پیامکی
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleVerifyOtpAndProceed}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-xs hover:bg-green-600 transition cursor-pointer shadow-lg"
              >
                تایید و انتقال به درگاه 💳
              </button>
              <button
                onClick={() => setShowOtpModal(false)}
                className="py-3 px-4 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition cursor-pointer"
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
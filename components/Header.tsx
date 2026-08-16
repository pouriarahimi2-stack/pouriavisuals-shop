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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

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

    async function fetchLiveSiteInfo() {
      try {
        const [info, menus] = await Promise.all([
          siteInfoService.getAll(),
          menuService.getAll(),
        ]);
        setSiteInfo(info);
        setMenuItems(menus.filter((m) => m.isActive));
      } catch (e) {
        console.error("Header init error:", e);
      }
    }
    fetchLiveSiteInfo();

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

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

  return (
    <header className="sticky top-4 z-40 max-w-6xl mx-auto px-4 select-none font-sans text-[var(--text-primary)]">
      <div className="liquid-glass-card px-6 py-3.5 flex items-center justify-between gap-4 rounded-3xl backdrop-blur-2xl shadow-xl border border-[var(--card-border)]">
        
        {/* برند و لوگو و نشانگر وضعیت گوگل */}
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 font-black text-lg">
            {siteInfo?.logoUrl ? (
              <img src={siteInfo.logoUrl} alt={siteInfo.storeName} className="w-8 h-8 object-contain rounded-lg" />
            ) : (
              <span className="w-8 h-8 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center text-sm font-bold shadow-md">⚡</span>
            )}
            <span className="text-[var(--text-primary)]">
              {siteInfo?.storeName || "فروشگاه"}
            </span>
          </Link>

          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              isGoogleIndexAllowed
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse"
                : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"
            }`}
          />
        </div>

        {/* منوی ناوبری هدر */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[var(--text-secondary)]">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.url || (item as any).href || "#"}
              className="hover:text-[var(--accent-blue)] transition font-bold"
            >
              {item.title || (item as any).label}
            </Link>
          ))}
        </nav>

        {/* دکمه‌های کنترل تم و سبد خرید */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] transition cursor-pointer text-xs border border-[var(--card-border)] text-[var(--text-primary)] font-bold"
            title="تغییر حالت تم (روشن / تاریک)"
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
                      <img src={item.image} alt={item.title} className="w-12 h-12 object-contain rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-[var(--text-primary)]">{item.title}</h4>
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
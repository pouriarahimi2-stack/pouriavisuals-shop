"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { couponService, CouponValidationResult } from "@/services/couponService";

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
    return { valid: false, message: "کد پستی وارد شده نمی‌تواند عدد متوالی و غیرواقعی باشد." };
  }

  if (cleanCode.substring(5) === "00000") {
    return { valid: false, message: "بخش دوم کد پستی معتبر نیست." };
  }

  return { valid: true };
}

export default function CheckoutPage() {
  const router = useRouter();
  const cartContext = useCart() as any;

  const rawCart = cartContext?.cart || cartContext?.cartItems || [];
  const totalAmount = cartContext?.totalAmount ?? rawCart.reduce(
    (acc: number, item: any) => acc + (item.discountPrice ?? item.price ?? 0) * (item.quantity || 1),
    0
  );

  // فیلدهای اطلاعات مشتری
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    province: "تهران",
    city: "تهران",
    address: "",
    postalCode: "",
    note: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // محاسبه هزینه‌ها
  const rawTotal = totalAmount;
  const discountAmount = couponResult?.isValid ? couponResult.discountAmount : 0;
  const shippingCost = rawTotal > 20000000 ? 0 : 75000; // ارسال رایگان برای سفارش‌های بالای ۲۰ میلیون تومان
  const finalPayable = Math.max(0, rawTotal - discountAmount + shippingCost);

  const toEnglishDigits = (str: string) => {
    return str
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let cleanValue = value;

    if (name === "phone") {
      cleanValue = toEnglishDigits(value).replace(/\D/g, "").slice(0, 11);
    } else if (name === "postalCode") {
      cleanValue = toEnglishDigits(value).replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    if (errorMessage) setErrorMessage("");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    const result = await couponService.validateCoupon(couponCode, rawTotal);
    setCouponResult(result);
    setIsValidatingCoupon(false);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawCart.length === 0) {
      setErrorMessage("سبد خرید شما خالی است.");
      return;
    }

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMessage("لطفاً تمامی فیلدهای الزامی (نام، شماره تماس و آدرس) را تکمیل کنید.");
      return;
    }

    if (!/^09\d{9}$/.test(formData.phone)) {
      setErrorMessage("شماره موبایل وارد شده نامعتبر است (باید ۱۱ رقم و با 09 شروع شود).");
      return;
    }

    if (formData.postalCode) {
      const postalCheck = isValidIranianPostalCode(formData.postalCode);
      if (!postalCheck.valid) {
        setErrorMessage(postalCheck.message || "کد پستی وارد شده معتبر نیست.");
        return;
      }
    }

    // ذخیره موقت اطلاعات سفارش جهت انتقال به صفحه فاکتور و پرداخت
    const checkoutDraft = {
      customer: formData,
      items: rawCart,
      summary: {
        rawTotal,
        discountAmount,
        couponCode: couponResult?.isValid ? couponResult.coupon?.code : null,
        shippingCost,
        finalPayable,
      },
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("apple_shop_checkout_draft", JSON.stringify(checkoutDraft));
    }
    router.push("/checkout/payment");
  };

  if (rawCart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 px-4 text-center select-none font-sans text-[var(--text-primary)]">
        <div className="w-20 h-20 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-zinc-400">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-[var(--text-primary)]">سبد خرید شما خالی است</h2>
        <p className="text-[var(--text-secondary)] text-xs max-w-sm font-medium">برای ثبت سفارش ابتدا کالاهای مدنظر خود را به سبد خرید اضافه کنید.</p>
        <Link href="/" className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md">
          مشاهده محصولات فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans text-[var(--text-primary)] select-none">
      
      {/* هدر صفحه تسویه */}
      <div className="mb-8 border-b border-[var(--card-border)] pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">تسویه حساب و ثبت اطلاعات</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">مشخصات گیرنده سفارش را وارد نموده و وارد مرحله پرداخت شوید.</p>
        </div>
        <Link href="/" className="text-xs font-bold text-[var(--accent-blue)] hover:underline">
          ← بازگشت به خرید
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-bold animate-fadeIn">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleProceedToPayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ستون اطلاعات گیرنده */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 md:p-8 rounded-3xl liquid-glass-card border border-[var(--card-border)] space-y-5 shadow-xl">
            <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-blue)]"></span>
              اطلاعات تحویل‌گیرنده
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="مثال: پوریا رحیمی"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs focus:outline-none focus:border-[var(--accent-blue)] transition font-bold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  شماره موبایل (جهت پیامک فاکتور) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="09123456789"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono focus:outline-none focus:border-[var(--accent-blue)] transition font-bold text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">استان</label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs focus:outline-none focus:border-[var(--accent-blue)] transition font-bold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شهر</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs focus:outline-none focus:border-[var(--accent-blue)] transition font-bold text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                نشانی دقیق پستی <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="address"
                rows={3}
                required
                placeholder="خیابان، کوچه، پلاک، واحد..."
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs focus:outline-none focus:border-[var(--accent-blue)] transition resize-none text-[var(--text-primary)] font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">کد پستی (۱۰ رقمی)</label>
                <input
                  type="text"
                  name="postalCode"
                  placeholder="1234567890"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono focus:outline-none focus:border-[var(--accent-blue)] transition font-bold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">ایمیل (اختیاری)</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs focus:outline-none focus:border-[var(--accent-blue)] transition text-[var(--text-primary)] font-mono"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-[var(--text-secondary)] mb-1.5">یادداشت برای ارسال</label>
              <input
                type="text"
                name="note"
                placeholder="توضیحات تکمیلی یا زمان تحویل دلخواه"
                value={formData.note}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs focus:outline-none focus:border-[var(--accent-blue)] transition text-[var(--text-primary)] font-medium"
              />
            </div>
          </div>
        </div>

        {/* ستون خلاصه سفارش و تخفیف */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* کارت اقلام خرید */}
          <div className="p-6 md:p-8 rounded-3xl liquid-glass-card border border-[var(--card-border)] space-y-4 shadow-xl">
            <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center justify-between">
              <span>خلاصه اقلام سفارش</span>
              <span className="text-xs font-bold text-[var(--text-secondary)]">{rawCart.length} محصول</span>
            </h2>

            <div className="divide-y divide-[var(--card-border)] max-h-60 overflow-y-auto pr-1">
              {rawCart.map((item: any, idx: number) => {
                const itemImg = item.image || item.images?.[0] || "";
                const itemPrice = item.discountPrice ?? item.price ?? 0;
                return (
                  <div key={idx} className="py-3 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] overflow-hidden shrink-0">
                      {itemImg && <Image src={itemImg} alt={item.name || item.title || "محصول"} fill className="object-contain p-1.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold text-[var(--text-primary)] truncate">{item.name || item.title}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                        {item.quantity || 1} × {Number(itemPrice).toLocaleString("fa-IR")} تومان
                        {item.selectedColor && <span className="mr-2 text-[var(--accent-blue)] font-bold">({item.selectedColor})</span>}
                      </p>
                    </div>
                    <span className="text-xs font-black font-mono text-[var(--text-primary)]">
                      {(itemPrice * (item.quantity || 1)).toLocaleString("fa-IR")}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* بخش کد تخفیف */}
            <div className="pt-3 border-t border-[var(--card-border)] text-xs">
              <label className="block font-bold text-[var(--text-secondary)] mb-1.5">کد تخفیف</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: WELCOME"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs uppercase font-mono focus:outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)] font-bold"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponCode.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-extrabold hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isValidatingCoupon ? "بررسی..." : "اعمال"}
                </button>
              </div>

              {couponResult && (
                <p className={`text-[11px] mt-2 font-bold ${couponResult.isValid ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                  {couponResult.message}
                </p>
              )}
            </div>

            {/* ریزمحاسبه نهایی */}
            <div className="pt-3 border-t border-[var(--card-border)] space-y-2.5 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)] font-medium">
                <span>جمع کل اقلام:</span>
                <span className="font-mono text-[var(--text-primary)] font-bold">{rawTotal.toLocaleString("fa-IR")} تومان</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>تخفیف اعمال‌شده:</span>
                  <span className="font-mono">- {discountAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
              )}

              <div className="flex justify-between text-[var(--text-secondary)] font-medium">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span className="font-mono text-[var(--text-primary)] font-bold">{shippingCost === 0 ? "رایگان (سفارش ویژه)" : `${shippingCost.toLocaleString("fa-IR")} تومان`}</span>
              </div>

              <div className="pt-3 border-t border-[var(--card-border)] flex justify-between items-baseline text-sm font-black text-[var(--text-primary)]">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="text-base font-mono text-[var(--accent-blue)]">{finalPayable.toLocaleString("fa-IR")} تومان</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white font-extrabold text-xs transition shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "در حال پردازش..." : "تأیید و رفتن به مرحله پرداخت →"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
// File Path: app/checkout/page.tsx
"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { orderService } from "@/services/orderService";
import { couponService, Coupon } from "@/services/couponService";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { IRAN_PROVINCES } from "@/lib/iranProvinces";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("تهران");
  const [city, setCity] = useState("تهران");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const rawTotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percent" || appliedCoupon.discount_type === "percent") {
      discountAmount = Math.round((rawTotal * (appliedCoupon.value || 0)) / 100);
      if (appliedCoupon.max_discount && discountAmount > appliedCoupon.max_discount) {
        discountAmount = appliedCoupon.max_discount;
      }
    } else {
      discountAmount = appliedCoupon.value || 0;
    }
  }

  const finalPayable = Math.max(0, rawTotal - discountAmount);

  const handleProvinceChange = (provName: string) => {
    setProvince(provName);
    const p = IRAN_PROVINCES.find((x) => x.name === provName);
    if (p && p.cities.length > 0) {
      setCity(p.cities[0]);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    soundEngine.playClick();
    setCheckingCoupon(true);
    setCouponError("");

    try {
      const res = await couponService.validateCoupon(couponCode, rawTotal);
      if (res.valid && res.coupon) {
        soundEngine.playSuccess();
        setAppliedCoupon(res.coupon);
      } else {
        setCouponError(res.message || "کد تخفیف نامعتبر یا منقضی شده است.");
      }
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage("");

    if (cartItems.length === 0) {
      setErrorMessage("سبد خرید شما خالی است.");
      return;
    }

    const cleanPhone = phone
      .trim()
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/\D/g, "");

    if (!/^09\d{9}$/.test(cleanPhone)) {
      setErrorMessage("شماره موبایل وارد شده باید ۱۱ رقمی و با ۰۹ شروع شود.");
      return;
    }

    if (postalCode.trim() && !/^\d{10}$/.test(postalCode.trim())) {
      setErrorMessage("کد پستی وارد شده باید ۱۰ رقم عددی باشد.");
      return;
    }

    setSubmitting(true);
    try {
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const fullAddress = `استان ${province}، شهر ${city}، ${address.trim()}`;

      const orderPayload = {
        id: orderId,
        order_number: orderId,
        customer: {
          fullName: customerName.trim(),
          name: customerName.trim(),
          phone: cleanPhone,
          province,
          city,
          address: fullAddress,
          postalCode: postalCode.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        customer_name: customerName.trim(),
        phone: cleanPhone,
        province,
        city,
        address: fullAddress,
        postal_code: postalCode.trim() || undefined,
        items: cartItems.map((item) => ({
          productId: item.id,
          product_id: item.id,
          title: item.title || item.name || "کالا",
          name: item.name || item.title || "کالا",
          price: item.price,
          quantity: item.quantity || 1,
          image: item.image,
        })),
        total_amount: rawTotal,
        totalAmount: rawTotal,
        discount_amount: discountAmount > 0 ? discountAmount : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        final_amount: finalPayable,
        finalAmount: finalPayable,
        status: "pending" as const,
        payment_status: "pending" as const,
        paymentStatus: "pending" as const,
      };

      const created = await orderService.create(orderPayload);
      if (created) {
        clearCart();
        router.push(`/checkout/payment?orderId=${created.orderNumber || created.id}`);
      } else {
        setErrorMessage("خطا در ثبت نهایی فاکتور. لطفاً مجدداً تلاش فرمایید.");
      }
    } catch {
      setErrorMessage("خطا در برقراری ارتباط با سرور.");
    } finally {
      setSubmitting(false);
    }
  };

  const citiesList = IRAN_PROVINCES.find((p) => p.name === province)?.cities || [];

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4 font-sans select-none" dir="rtl">
        <div className="text-5xl">🛒</div>
        <h2 className="text-xl font-black text-[var(--text-primary)]">سبد خرید شما خالی است!</h2>
        <p className="text-xs text-[var(--text-secondary)]">برای ثبت سفارش ابتدا کالایی را به سبد خرید اضافه کنید.</p>
        <Link
          href="/#products"
          className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-lg"
        >
          ← مشاهده لیست کالاها
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-black">تکمیل اطلاعات و صدور فاکتور رسمی</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium">نشانی و مشخصات گیرنده مرسوله را با دقت وارد کنید</p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleCheckoutSubmit} className="lg:col-span-2 p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h3 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📍 مشخصات تحویل‌گیرنده و نشانی پستی
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی تحویل‌گیرنده *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="مثال: رضا محمدی"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شماره موبایل (جهت دریافت پیامک رهگیری) *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] text-right"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">استان تحویل *</label>
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer"
              >
                {IRAN_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شهرستان / شهر *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer"
              >
                {citiesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد پستی ۱۰ رقمی (اختیاری)</label>
              <input
                type="text"
                maxLength={10}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="مثال: 1234567890"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] text-right"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) *</label>
              <textarea
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="خیابان اصلی، کوچه، پلاک، طبقه، واحد..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] leading-relaxed focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">توضیحات و یادداشت سفارش (اختیاری)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="نکته خاص در زمان تحویل یا هماهنگی..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm hover:opacity-90 transition shadow-2xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            <span>{submitting ? "در حال ثبت فاکتور..." : "تأیید اطلاعات و اتصال به درگاه پرداخت 💳"}</span>
          </button>
        </form>

        <div className="space-y-6">
          <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3 text-xs">
            <h4 className="font-black text-xs text-[var(--text-primary)]">🏷️ کد تخفیف دارید؟</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="مثال: OFF10"
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono uppercase font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={checkingCoupon}
                className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                اعمال
              </button>
            </div>
            {couponError && <p className="text-[10px] text-rose-500 font-bold">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ کد تخفیف {appliedCoupon.code} با موفقیت اعمال شد.
              </p>
            )}
          </div>

          <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
            <h4 className="font-black text-xs text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
              📋 خلاصه اقلام فاکتور
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cartItems.map((it) => (
                <div key={it.id} className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)] font-medium">
                    {it.title} (×{it.quantity || 1})
                  </span>
                  <span className="font-mono font-bold">
                    {((it.price || 0) * (it.quantity || 1)).toLocaleString("fa-IR")} ت
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--card-border)] pt-3 space-y-2">
              <div className="flex justify-between text-[var(--text-secondary)] font-bold">
                <span>جمع کل اقلام:</span>
                <span className="font-mono">{rawTotal.toLocaleString("fa-IR")} تومان</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-500 font-bold">
                  <span>سود شما از تخفیف:</span>
                  <span className="font-mono">- {discountAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
              )}

              <div className="flex justify-between text-[var(--text-secondary)] font-bold">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">رایگان (پیشتاز)</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[var(--card-border)] text-sm font-black">
                <span className="text-[var(--text-primary)]">مبلغ نهایی فاکتور:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  {finalPayable.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
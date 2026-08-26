// components/CheckoutModal.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { orderService } from "@/services/orderService";
import { couponService, Coupon } from "@/services/couponService";
import { soundEngine } from "@/lib/soundEngine";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const { cartItems, cart, totalPrice, clearCart } = useCart() as any;

  const items = cartItems || cart || [];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  if (!isOpen) return null;

  const basePrice = typeof totalPrice === "number" ? totalPrice : items.reduce(
    (sum: number, item: any) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage({ type: "error", text: "لطفاً کد تخفیف را وارد کنید." });
      return;
    }

    soundEngine.playClick();
    setCouponLoading(true);
    setCouponMessage(null);

    try {
      const res = await couponService.validateCoupon(couponCode, basePrice);
      if (res.valid && res.coupon) {
        soundEngine.playSuccess();
        setDiscountAmount(res.discount);
        setAppliedCoupon(res.coupon);
        setCouponMessage({ type: "success", text: res.message });
      } else {
        setCouponMessage({ type: "error", text: res.message });
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch {
      setCouponMessage({ type: "error", text: "خطا در بررسی کد تخفیف." });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    soundEngine.playClick();
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
    setCouponMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setFormError("");

    const cleanPhone = phone.trim().replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).replace(/\D/g, "");
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      setFormError("شماره همراه باید ۱۱ رقم و با ۰۹ شروع شود.");
      return;
    }

    const cleanPostal = postalCode.trim().replace(/\D/g, "");
    if (cleanPostal.length !== 10) {
      setFormError("کد پستی ۱۰ رقمی ایران باید دقیقاً ۱۰ رقم عددی باشد.");
      return;
    }

    if (!address.trim() || address.trim().length < 8) {
      setFormError("لطفاً نشانی پستی دقیق خود را وارد نمایید.");
      return;
    }

    setSubmitting(true);

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || "خریدار محترم";

    const orderData = {
      id: orderId,
      order_number: orderId,
      customer: {
        fullName,
        name: fullName,
        phone: cleanPhone,
        address: `${address.trim()}${notes.trim() ? ` (توضیحات: ${notes.trim()})` : ""}`,
        postalCode: cleanPostal,
      },
      customer_name: fullName,
      phone: cleanPhone,
      address: address.trim(),
      postal_code: cleanPostal,
      items: items,
      total_amount: basePrice,
      discount_amount: discountAmount,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      final_amount: finalPrice,
      status: "pending",
      payment_status: "pending",
      created_at: new Date().toISOString(),
    };

    try {
      await orderService.create(orderData);
      if (typeof clearCart === "function") clearCart();
      onClose();
      router.push(`/checkout/payment?orderId=${orderId}`);
    } catch {
      setFormError("خطا در ثبت اطلاعات سفارش در سیستم.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="relative w-full max-w-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2.5rem] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-6 border-b border-[var(--card-border)] pb-4 text-right">
          <span className="text-xl">🛡️</span>
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)]">
              اطلاعات تحویل و انتقال به درگاه شاپرک
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">
              آدرس دقیق پستی جهت صدور بارنامه پیشتاز
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] mb-6 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)] font-bold">
              اقلام سفارش ({items.length} قلم):
            </span>
            <span className="font-mono font-bold">
              {Number(basePrice).toLocaleString("fa-IR")} تومان
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold border-t border-[var(--card-border)] pt-2">
              <span>تخفیف اعمال شده:</span>
              <span className="font-mono">
                - {Number(discountAmount).toLocaleString("fa-IR")} تومان
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-black text-[var(--accent-blue)] border-t border-[var(--card-border)] pt-2">
            <span>مبلغ نهایی قابل پرداخت:</span>
            <span className="font-mono text-base">
              {Number(finalPrice).toLocaleString("fa-IR")} تومان
            </span>
          </div>
        </div>

        {/* اعمال کد تخفیف */}
        <div className="mb-6 p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--modal-bg)] space-y-2 text-xs">
          <label className="block font-bold text-[var(--text-secondary)] text-right">کد تخفیف دارید؟</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="کد تخفیف..."
              value={couponCode}
              disabled={!!appliedCoupon}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] transition disabled:opacity-60 text-right uppercase"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="px-4 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold hover:bg-rose-500/25 transition cursor-pointer"
              >
                حذف
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {couponLoading ? "بررسی..." : "اعمال تخفیف"}
              </button>
            )}
          </div>

          {couponMessage && (
            <div
              className={`p-2.5 rounded-xl text-[11px] font-bold text-right ${
                couponMessage.type === "success"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              }`}
            >
              {couponMessage.text}
            </div>
          )}
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-right">
            ⚠️ {formError}
          </div>
        )}

        {/* فرم تحویل */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-right">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام گیرنده *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: پوریا"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)] transition text-right"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام خانوادگی *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: کریمی"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)] transition text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره تلفن همراه (۱۱ رقم) *</label>
              <input
                type="tel"
                required
                maxLength={11}
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold focus:border-[var(--accent-blue)] transition text-center"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">کد پستی ۱۰ رقمی ایران *</label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="کد ۱۰ رقمی بدون خط تیره"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold focus:border-[var(--accent-blue)] transition text-center"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">نشانی دقیق پستی تحویل *</label>
            <textarea
              rows={2}
              required
              placeholder="تهران، خیابان ولیعصر، تقاطع میرداماد، پلاک..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium leading-relaxed focus:border-[var(--accent-blue)] transition text-right"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">توضیحات تحویل مرسوله (اختیاری)</label>
            <input
              type="text"
              placeholder="مثال: تحویل در ساعات اداری..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium focus:border-[var(--accent-blue)] transition text-right"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs transition cursor-pointer shadow-xl shadow-blue-500/25 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? "در حال انتقال به درگاه شاپرک..." : "تایید اطلاعات و اتصال به درگاه پرداخت 💳"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
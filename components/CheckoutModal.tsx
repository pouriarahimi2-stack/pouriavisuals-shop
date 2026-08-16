"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { orderService } from "@/services/orderService";
import { couponService, Coupon } from "@/services/couponService";

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

  // استیت‌های سیستم تخفیف هوشمند
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

  // بررسی و اعمال هوشمند کد تخفیف
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage({ type: "error", text: "لطفاً کد تخفیف را وارد کنید." });
      return;
    }

    setCouponLoading(true);
    setCouponMessage(null);

    try {
      let validCoupon: Coupon | null = null;

      if (typeof couponService.getByCode === "function") {
        validCoupon = await couponService.getByCode(couponCode.trim());
      }

      if (!validCoupon) {
        const localCoupons: Coupon[] = JSON.parse(
          localStorage.getItem("site_coupons") ||
          localStorage.getItem("admin_coupons_cache") ||
          "[]"
        );
        validCoupon = localCoupons.find(
          (c) => c.code.toLowerCase() === couponCode.trim().toLowerCase() && c.is_active !== false
        ) || null;
      }

      if (!validCoupon) {
        setCouponMessage({ type: "error", text: "کد تخفیف وارد شده معتبر نیست یا منقضی شده است." });
        setDiscountAmount(0);
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      // محاسبه میزان تخفیف (درصدی یا مبلغ ثابت)
      let calculatedDiscount = 0;
      if (validCoupon.type === "percent" || validCoupon.discount_type === "percent" || validCoupon.percent) {
        const pct = Number(validCoupon.percent || validCoupon.value || 0);
        calculatedDiscount = Math.round((basePrice * pct) / 100);
        if (validCoupon.max_discount && calculatedDiscount > Number(validCoupon.max_discount)) {
          calculatedDiscount = Number(validCoupon.max_discount);
        }
      } else {
        calculatedDiscount = Number(validCoupon.value || validCoupon.amount || 0);
      }

      if (calculatedDiscount > basePrice) {
        calculatedDiscount = basePrice;
      }

      setDiscountAmount(calculatedDiscount);
      setAppliedCoupon(validCoupon);
      setCouponMessage({
        type: "success",
        text: `تخفیف ${Number(calculatedDiscount).toLocaleString("fa-IR")} تومان با موفقیت اعمال شد!`,
      });
    } catch (err) {
      console.error(err);
      setCouponMessage({ type: "error", text: "خطا در بررسی کد تخفیف." });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
    setCouponMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cleanPhone = phone.trim().replace(/[^\d]/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setFormError("شماره همراه باید ۱۱ رقم و با فرمت معتبر باشد.");
      return;
    }

    const cleanPostal = postalCode.trim().replace(/[^\d]/g, "");
    if (cleanPostal.length !== 10) {
      setFormError("کد پستی ۱۰ رقمی ایران الزامی و باید دقیقاً ۱۰ رقم باشد.");
      return;
    }

    if (!address.trim() || address.trim().length < 8) {
      setFormError("لطفاً نشانی دقیق پستی را به صورت کامل وارد نمایید.");
      return;
    }

    setSubmitting(true);

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || "خریدار محترم";

    const orderData = {
      id: orderId,
      customer_name: fullName,
      customer_phone: cleanPhone,
      postal_code: cleanPostal,
      shipping_address: `${address.trim()}${notes.trim() ? ` (توضیحات: ${notes.trim()})` : ""}`,
      items: items,
      base_amount: basePrice,
      discount_amount: discountAmount,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      total_amount: finalPrice,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    try {
      // ذخیره در Supabase Database
      if (typeof orderService.createOrder === "function") {
        await orderService.createOrder(orderData);
      }

      // ذخیره در LocalStorage به عنوان کش پشتیبان
      const existingOrders = JSON.parse(localStorage.getItem("site_orders") || "[]");
      localStorage.setItem("site_orders", JSON.stringify([orderData, ...existingOrders]));
      localStorage.setItem("admin_orders_cache", JSON.stringify([orderData, ...existingOrders]));
      localStorage.setItem("pending_order", JSON.stringify(orderData));

      if (typeof clearCart === "function") {
        clearCart();
      }

      onClose();
      router.push(`/checkout/payment?orderId=${orderId}`);
    } catch (err) {
      console.error("Order creation failed:", err);
      setFormError("خطا در ثبت اطلاعات سفارش در سیستم. لطفاً دوباره تلاش کنید.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans select-none text-[var(--text-primary)]">
      <div className="relative w-full max-w-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        
        {/* دکمه بستن */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition cursor-pointer"
        >
          ✕
        </button>

        {/* سربرگ */}
        <div className="flex items-center gap-2 mb-6 border-b border-[var(--card-border)] pb-4 text-right">
          <span className="text-xl">🛡️</span>
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)]">
              اطلاعات تحویل و انتقال به درگاه پرداخت
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">
              آدرس دقیق پستی جهت صدور بارنامه پستی شاپرک
            </p>
          </div>
        </div>

        {/* خلاصه اقلام سفارش و مبالغ */}
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

        {/* بخش اعمال هوشمند کد تخفیف */}
        <div className="mb-6 p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--modal-bg)] space-y-2 text-xs">
          <label className="block font-bold text-[var(--text-secondary)] text-right">کد تخفیف دارید؟</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="کد تخفیف..."
              value={couponCode}
              disabled={!!appliedCoupon}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] transition disabled:opacity-60 text-right"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="px-4 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold hover:bg-rose-500/25 transition cursor-pointer"
              >
                حذف تخفیف
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center min-w-[90px]"
              >
                {couponLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  "اعمال تخفیف"
                )}
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

        {/* فرم مشخصات خریدار و تحویل پستی */}
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
                placeholder="کد ۱۰ رقمی استاندارد پستی"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold focus:border-[var(--accent-blue)] transition text-center"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">نشانی دقیق پستی (استان، شهر، خیابان، پلاک، واحد) *</label>
            <textarea
              rows={2}
              required
              placeholder="تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium leading-relaxed focus:border-[var(--accent-blue)] transition text-right"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">توضیحات و نکات تحویل مرسوله (اختیاری)</label>
            <input
              type="text"
              placeholder="مثال: تحویل به نگهبانی یا تماس قبل از تحویل..."
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
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <span>تایید اطلاعات و اتصال به درگاه پرداخت 💳</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
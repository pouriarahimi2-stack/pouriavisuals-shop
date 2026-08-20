"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { orderService } from "@/services/orderService";
import { couponService } from "@/services/couponService";
import { productService } from "@/services/productService";
import { smsService } from "@/services/smsService";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const router = useRouter();
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMsg(null);

    const result = await couponService.validateAndApply(couponCode.trim(), totalPrice);
    if (result.isValid) {
      setDiscountAmount(result.discountAmount);
      setAppliedCoupon(couponCode.trim().toUpperCase());
      setCouponMsg({ type: "success", text: `کد تخفیف اعمال شد (${result.discountAmount.toLocaleString("fa-IR")} تومان کسر گردید).` });
    } else {
      setCouponMsg({ type: "error", text: result.message || "کد تخفیف نامعتبر یا منقضی شده است." });
    }
  };

  const finalPayable = Math.max(0, totalPrice - discountAmount);

  const handleFinalCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !address.trim() || cartItems.length === 0) return;

    setSubmitting(true);
    try {
      // ۱. ثبت فاکتور و سفارش در دیتابیس Supabase
      const newOrder = await orderService.create({
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        postalCode: postalCode.trim() || undefined,
        items: cartItems.map((item) => ({
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        totalAmount: finalPayable,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        couponCode: appliedCoupon || undefined,
        status: "processing",
      });

      if (newOrder) {
        // ۲. کسر موجودی فیزیکی از انبار
        for (const item of cartItems) {
          try {
            const currentProd = await productService.getById(item.id);
            if (currentProd) {
              const newStk = Math.max(0, (currentProd.stock ?? 1) - item.quantity);
              await productService.update(item.id, {
                stock: newStk,
                is_available: newStk > 0,
              });
            }
          } catch (err) {
            console.error("Stock update error:", err);
          }
        }

        // ۳. ارسال پیامک وضعیت سفارش به مشتری
        await smsService.sendOrderStatusChange(phone.trim(), newOrder.id, "در حال پردازش و انبارداری");

        // ۴. پاکسازی سبد خرید و هدایت به برگه رهگیری
        clearCart();
        setIsCartOpen(false);
        router.push(`/track-order?orderId=${newOrder.id}&success=true`);
      }
    } catch {
      alert("خطا در ثبت نهایی فاکتور. لطفاً مجدداً تلاش نمایید.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md font-sans select-none animate-fadeIn" dir="rtl">
      <div className="w-full max-w-lg bg-[var(--modal-bg)] border-r border-[var(--card-border)] h-full shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)]">
        
        {/* هدر کشو */}
        <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h3 className="font-black text-sm text-[var(--text-primary)]">سبد خرید شما</h3>
            <span className="px-2 py-0.5 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-mono font-bold text-xs">
              {cartItems.length} قلم
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold text-xs hover:border-[var(--accent-blue)] transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* لیست اقلام سبد خرید */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {cartItems.length === 0 ? (
            <div className="py-24 text-center text-[var(--text-secondary)] space-y-2 font-bold">
              <span className="text-4xl block">🛍️</span>
              <p>سبد خرید شما در حال حاضر خالی است.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-contain bg-[var(--modal-bg)] p-1" />
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-[var(--text-primary)] line-clamp-1">{item.title}</h4>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                          {(item.price || 0).toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-xs hover:text-[var(--accent-blue)]"
                        >
                          +
                        </button>
                        <span className="font-mono font-black text-xs px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-xs hover:text-[var(--accent-blue)]"
                        >
                          -
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 rounded-xl bg-rose-500/15 text-rose-600 hover:bg-rose-500 hover:text-white transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* فرم تخفیف */}
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <span className="font-bold text-[11px] text-[var(--text-secondary)] block">کد تخفیف دارید؟</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="مثال: OFF100"
                    className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition"
                  >
                    اعمال
                  </button>
                </div>
                {couponMsg && (
                  <p className={`text-[10px] font-bold ${couponMsg.type === "success" ? "text-emerald-600" : "text-rose-500"}`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* فرم اطلاعات ارسال */}
              <form id="checkout-form" onSubmit={handleFinalCheckout} className="space-y-3 pt-2">
                <span className="font-black text-xs text-[var(--accent-blue)] block">📋 مشخصات دریافت‌کننده و نشانی پستی:</span>
                
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="نام و نام خانوادگی تحویل‌گیرنده *"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)]"
                />

                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="شماره موبایل جهت پیامک رهگیری پستی *"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)]"
                />

                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="نشانی دقیق پستی (استان، شهر، خیابان، پلاک، واحد) *"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-xs focus:border-[var(--accent-blue)]"
                />

                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="کد پستی ۱۰ رقمی (اختیاری)"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)]"
                />
              </form>
            </>
          )}
        </div>

        {/* فوتر سبد و دکمه پرداخت */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-[var(--card-border)] bg-[var(--input-bg)] space-y-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>جمع کل اقلام:</span>
                <span className="font-mono font-bold">{totalPrice.toLocaleString("fa-IR")} تومان</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-500 font-bold">
                  <span>تخفیف اعمال‌شده:</span>
                  <span className="font-mono">-{discountAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black pt-1 border-t border-[var(--card-border)]">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {finalPayable.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>

            <button
              form="checkout-form"
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>💳</span>
              <span>{submitting ? "در حال ثبت سفارش..." : "تکمیل نهایی و صدور فاکتور رسمی"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
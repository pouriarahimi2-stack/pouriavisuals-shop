"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { orderService } from "@/services/orderService";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    totalDiscount,
    totalAmount,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);

    // ثبت سفارش جدید در سرویس سفارش‌ها
    const newOrderList = orderService.createOrder({
      customerName: "کاربر مهمان",
      phone: "09120000000",
      items: cart,
      totalAmount: totalAmount,
    });

    const latestOrder = newOrderList[0];

    setTimeout(() => {
      setIsSubmitting(false);
      clearCart();
      setIsCartOpen(false);
      alert(`پرداخت با موفقیت انجام شد! 🎉\nکد پیگیری سفارش شما: ${latestOrder.id}`);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      {/* بک‌دراپ */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => setIsCartOpen(false)}
      />

      {/* کشوی سبد خرید */}
      <div className="relative w-full max-w-md h-full liquid-glass-card border-r-0 rounded-l-3xl p-6 flex flex-col justify-between shadow-2xl z-10 select-none">
        {/* هدر */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="text-lg font-bold">سبد خرید شما</h2>
            <span className="text-xs bg-[var(--accent-blue)] text-white px-2 py-0.5 rounded-full">
              {totalItems} عدد
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-zinc-800 hover:opacity-80 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* لیست محصولات */}
        <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60 space-y-2">
              <span className="text-5xl">🛍️</span>
              <p className="font-semibold">سبد خرید شما خالی است</p>
              <p className="text-xs">محصولات مورد نظر خود را اضافه کنید.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-[var(--glass-border)]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 object-cover rounded-xl border border-[var(--glass-border)]"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-[var(--accent-blue)]">
                      {(item.discountPrice ?? item.price).toLocaleString("fa-IR")}{" "}
                      تومان
                    </span>
                    {item.discountPrice && (
                      <span className="text-[10px] line-through opacity-50">
                        {item.price.toLocaleString("fa-IR")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-red-500 hover:opacity-75 transition cursor-pointer"
                  >
                    حذف
                  </button>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 rounded-lg px-2 py-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-5 h-5 flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-5 h-5 flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* صورت‌حساب و ثبت سفارش */}
        {cart.length > 0 && (
          <div className="pt-4 border-t border-[var(--glass-border)] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between opacity-80">
                <span>مبلغ کل:</span>
                <span>{subtotal.toLocaleString("fa-IR")} تومان</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-500 font-medium">
                  <span>سود شما از خرید:</span>
                  <span>{totalDiscount.toLocaleString("fa-IR")} تومان</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-[var(--glass-border)]">
                <span>مبلغ قابل پرداخت:</span>
                <span className="text-[var(--accent-blue)]">
                  {totalAmount.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-sm cursor-pointer hover:opacity-90 transition shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? "در حال ثبت سفارش..." : "تکمیل فرآیند خرید 💳"}
            </button>
            <button
              onClick={clearCart}
              className="w-full py-2 text-xs text-red-400 hover:underline text-center cursor-pointer"
            >
              خالی کردن سبد خرید
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
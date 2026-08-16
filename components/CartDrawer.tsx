"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import CheckoutModal from "@/components/CheckoutModal";

export default function CartDrawer() {
  const cartContext = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  const items = cartContext.cartItems || cartContext.cart || [];
  const isOpen = cartContext.isCartOpen ?? false;

  const closeCart = () => {
    if (typeof cartContext.toggleCart === "function") {
      cartContext.toggleCart();
    } else if (typeof cartContext.setIsCartOpen === "function") {
      cartContext.setIsCartOpen(false);
    }
  };

  const handleOpenCheckout = () => {
    closeCart(); // کشوی سبد خرید بسته می‌شود تا مدال پرداخت روی صفحه به صورت شفاف باز شود
    setCheckoutOpen(true);
  };

  const handleUpdateQuantity = (id: string, newQty: number, delta?: number) => {
    if (typeof cartContext.updateQuantity === "function") {
      if (delta !== undefined) {
        cartContext.updateQuantity(id, delta);
      } else {
        cartContext.updateQuantity(id, newQty);
      }
    }
  };

  const handleRemove = (id: string) => {
    if (typeof cartContext.removeFromCart === "function") {
      cartContext.removeFromCart(id);
    }
  };

  const totalCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
  const rawSubtotal = items.reduce(
    (sum: number, item: any) => sum + (item.discountPrice ?? item.price) * (item.quantity || 1),
    0
  );

  return (
    <>
      {/* پیام موفقیت ثبت سفارش با بالاترین لایه (z-[80]) */}
      {orderSuccessId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none font-sans">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center space-y-4 shadow-2xl">
            <span className="text-4xl block">🎉</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">سفارش شما با موفقیت ثبت گردید!</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              کد پیگیری سفارش شما: <strong className="font-mono text-[var(--text-primary)] text-sm">{orderSuccessId}</strong>
            </p>
            <button
              onClick={() => setOrderSuccessId(null)}
              className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs shadow-md cursor-pointer hover:opacity-90 transition"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* مدال تسویه‌حساب و پرداخت فاکتور */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(id) => {
          setOrderSuccessId(id);
        }}
      />

      {/* کشوی سبد خرید (فقط زمانی که isOpen فعال است باز می‌شود) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm font-sans text-[var(--text-primary)] animate-fadeIn select-none">
          {/* بک‌دراپ تیره برای بستن با کلیک خارج از کادر */}
          <div className="absolute inset-0 cursor-pointer" onClick={closeCart} />

          {/* سایدبار سبد خرید */}
          <div className="relative w-full max-w-md h-full bg-[var(--modal-bg)] border-r border-[var(--card-border)] rounded-l-3xl p-6 flex flex-col justify-between shadow-2xl z-10">
            
            {/* هدر */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <h2 className="text-base font-black text-[var(--text-primary)]">سبد خرید شما</h2>
                <span className="text-xs bg-[var(--accent-blue)] text-white font-bold px-2 py-0.5 rounded-full">
                  {totalCount} عدد
                </span>
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:opacity-80 transition cursor-pointer font-bold text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            {/* لیست اقلام سبد خرید */}
            <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1 scrollbar-none">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)] space-y-2">
                  <span className="text-5xl">🛍️</span>
                  <p className="font-bold text-[var(--text-primary)]">سبد خرید شما خالی است</p>
                  <p className="text-xs">محصولات مورد نظر خود را اضافه کنید.</p>
                </div>
              ) : (
                items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-sm"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title || item.name}
                        className="w-16 h-16 object-contain rounded-xl border border-[var(--card-border)] bg-[var(--modal-bg)] p-1 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs truncate text-[var(--text-primary)]">
                        {item.title || item.name}
                      </h4>
                      {item.selectedColor && (
                        <span className="text-[10px] text-[var(--accent-blue)] font-bold block mt-0.5">
                          رنگ: {item.selectedColor}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-[var(--accent-blue)] font-mono">
                          {(item.discountPrice ?? item.price).toLocaleString("fa-IR")} تومان
                        </span>
                        {item.discountPrice && (
                          <span className="text-[10px] line-through text-[var(--text-muted)] font-mono">
                            {item.price.toLocaleString("fa-IR")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-[11px] font-bold text-rose-500 hover:opacity-75 transition cursor-pointer"
                      >
                        حذف
                      </button>
                      <div className="flex items-center gap-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl px-2 py-1">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              handleUpdateQuantity(item.id, item.quantity - 1, -1);
                            } else {
                              handleRemove(item.id);
                            }
                          }}
                          className="w-5 h-5 flex items-center justify-center font-bold cursor-pointer text-[var(--text-primary)] hover:text-[var(--accent-blue)]"
                        >
                          -
                        </button>
                        <span className="text-xs font-black w-4 text-center font-mono text-[var(--text-primary)]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, 1)}
                          className="w-5 h-5 flex items-center justify-center font-bold cursor-pointer text-[var(--text-primary)] hover:text-[var(--accent-blue)]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* فاکتور و دکمه تسویه‌حساب */}
            {items.length > 0 && (
              <div className="pt-4 border-t border-[var(--card-border)] space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-secondary)] font-bold">جمع کل اقلام:</span>
                  <span className="font-black text-sm text-[var(--accent-blue)] font-mono">
                    {rawSubtotal.toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                <button
                  onClick={handleOpenCheckout}
                  className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs cursor-pointer hover:opacity-90 transition shadow-lg text-center"
                >
                  ادامه فرآیند خرید و تسویه‌حساب 💳
                </button>
                
                {typeof cartContext.clearCart === "function" && (
                  <button
                    onClick={cartContext.clearCart}
                    className="w-full py-1 text-[11px] text-rose-500 hover:underline text-center cursor-pointer font-bold"
                  >
                    خالی کردن سبد خرید
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
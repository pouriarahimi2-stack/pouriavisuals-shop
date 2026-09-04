// File Path: components/AddToCartButton.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  product: {
    id: string | number;
    title: string;
    price: number;
    image: string;
    stock?: number;
    category?: string;
  };
  className?: string;
  showCounter?: boolean;
}

export default function AddToCartButton({
  product,
  className = "",
  showCounter = true,
}: AddToCartButtonProps) {
  const { cartItems, addToCart, openCart } = useCart();
  const [animState, setAnimState] = useState<"idle" | "adding">("idle");
  const [bumpCounter, setBumpCounter] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItem = cartItems.find((i) => String(i.id) === String(product.id));
  const currentCount = cartItem?.quantity || 0;
  const stockLimit = product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10;
  const isAvailable = stockLimit > 0;
  const isMaxReached = currentCount >= stockLimit;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable || isMaxReached || animState !== "idle") return;

    soundEngine.playAddToCart();
    setAnimState("adding");

    // افزودن کالا به وضعیت سبد خرید (بدون باز شدن ناگهانی کشو)
    addToCart(
      {
        id: product.id,
        title: product.title,
        name: product.title,
        price: product.price,
        image: product.image,
        stock: stockLimit,
        category: product.category || "تکنولوژی",
        quantity: 1,
      },
      false
    );

    // انیمیشن جهش فنری شمارنده
    setTimeout(() => {
      setBumpCounter(true);
      setTimeout(() => setBumpCounter(false), 500);
    }, 550);

    // پس از پایان کامل چرخه ۱۲۵۰ میلی‌ثانیه‌ای انیمیشن: بازنشانی دکمه و باز شدن کشوی سبد
    setTimeout(() => {
      setAnimState("idle");
      openCart();
    }, 1250);
  };

  const isAnimating = animState === "adding";

  return (
    <div className={`flex flex-col items-center gap-1.5 w-full select-none ${className}`} dir="rtl" suppressHydrationWarning>
      
      {/* دکمه کپسولی: در تم روشن مشکی با آیکون سفید، در تم تاریک سفید با آیکون مشکی */}
      <button
        type="button"
        disabled={!isAvailable || isMaxReached}
        onClick={handleAddToCart}
        className={`relative w-full h-[50px] rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center cursor-pointer shadow-xl active:scale-[0.98] border ${
          !isAvailable || isMaxReached
            ? "bg-slate-800/40 opacity-40 cursor-not-allowed text-slate-400 border-transparent"
            : "bg-black text-white border-black/10 hover:bg-neutral-900 shadow-black/10 dark:bg-white dark:text-black dark:border-white/20 dark:hover:bg-neutral-100 dark:shadow-white/10"
        }`}
      >
        <div className="relative w-full h-full flex items-center justify-center px-4 overflow-hidden">
          
          {/* کانتینر سبد خرید و بسته متحرک */}
          <div
            className={`flex items-center justify-center transition-all duration-300 ${
              isAnimating
                ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-kinetic-cart-left z-20"
                : "translate-x-0"
            }`}
          >
            {/* بسته محصول سفید با روبان آبی که به درون سبد سقوط می‌کند */}
            {isAnimating && (
              <div className="absolute -top-3.5 left-[8px] z-30 pointer-events-none animate-kinetic-item-drop">
                <div className="w-3.5 h-3.5 rounded-[3px] bg-white dark:bg-slate-900 shadow-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center relative">
                  <span className="w-full h-[1.5px] bg-blue-500 absolute top-1/2 -translate-y-1/2" />
                  <span className="h-full w-[1.5px] bg-blue-500 absolute left-1/2 -translate-x-1/2" />
                </div>
              </div>
            )}

            {/* آیکون چرخ‌دستی که به سمت چپ حرکت می‌کند */}
            <svg
              className="w-5 h-5 shrink-0 drop-shadow-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3H5.2L7.1 14.2C7.25 15.1 8 15.8 8.9 15.8H18.2C19.1 15.8 19.85 15.1 20 14.2L21.4 7.2C21.55 6.4 20.95 5.7 20.15 5.7H6.2"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9.5"
                cy="19.5"
                r="1.8"
                fill="currentColor"
                className={isAnimating ? "animate-kinetic-wheel-left origin-[9.5px_19.5px]" : ""}
              />
              <circle
                cx="17.5"
                cy="19.5"
                r="1.8"
                fill="currentColor"
                className={isAnimating ? "animate-kinetic-wheel-left origin-[17.5px_19.5px]" : ""}
              />
            </svg>
          </div>

          {/* متن دکمه که هنگام کلیک با ترنزیشن محو می‌شود */}
          <span
            className={`font-black text-xs tracking-wider uppercase mr-2.5 transition-all duration-300 whitespace-nowrap ${
              isAnimating
                ? "opacity-0 scale-75 -translate-x-6 pointer-events-none w-0 overflow-hidden"
                : "opacity-100 scale-100 translate-x-0"
            }`}
          >
            {isMaxReached
              ? "حداکثر موجودی انبار"
              : !isAvailable
              ? "ناموجود در انبار"
              : "افزودن به سبد خرید"}
          </span>
        </div>
      </button>

      {/* شمارنده زیر دکمه با جهش فنری */}
      {showCounter && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] font-sans" suppressHydrationWarning>
          <span
            className={`font-mono font-black transition-all duration-300 ${
              bumpCounter ? "animate-kinetic-counter-bump text-emerald-500 font-extrabold" : "text-[var(--text-primary)]"
            }`}
          >
            {mounted ? currentCount : 0}
          </span>
          <span>عدد در سبد شما</span>
        </div>
      )}
    </div>
  );
}

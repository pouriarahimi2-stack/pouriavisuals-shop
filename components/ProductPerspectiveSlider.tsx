// File Path: components/ProductPerspectiveSlider.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";
import AddToCartButton from "@/components/AddToCartButton";
import ProductExplodedView from "@/components/ProductExplodedView";

interface ProductItem {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
  image: string;
  images?: string[];
  brand?: string;
  category?: string;
  stock?: number;
  description?: string;
  short_description?: string;
  specs?: Record<string, string>;
  highlights?: string[];
  is_available?: boolean;
}

interface ProductPerspectiveSliderProps {
  products: ProductItem[];
  customTitle?: string;
  customSubtitle?: string;
  cardScale?: "compact" | "standard" | "large";
}

export default function ProductPerspectiveSlider({
  products,
  customTitle,
  customSubtitle,
  cardScale = "standard",
}: ProductPerspectiveSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [teardownProduct, setTeardownProduct] = useState<ProductItem | null>(null);

  if (!products || products.length === 0) return null;

  const total = products.length;

  const handleNext = () => {
    soundEngine.playClick();
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    soundEngine.playClick();
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  // تنظیم پویا ابعاد کارت‌ها بر اساس انتخاب در کنترل‌پنل ادمین
  const cardSizeClasses =
    cardScale === "compact"
      ? "w-[260px] sm:w-[300px] h-[410px] sm:h-[450px]"
      : cardScale === "large"
      ? "w-[310px] sm:w-[370px] h-[490px] sm:h-[540px]"
      : "w-[290px] sm:w-[340px] h-[450px] sm:h-[490px]";

  const containerHeightClass =
    cardScale === "compact"
      ? "h-[440px] sm:h-[480px]"
      : cardScale === "large"
      ? "h-[520px] sm:h-[580px]"
      : "h-[480px] sm:h-[530px]";

  return (
    <section id="products" className="w-full py-4 select-none font-sans space-y-4" dir="rtl">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
          {customTitle || "نمایشگاه سه‌بعدی تجهیزات پرچمدار"}
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          {customSubtitle || "پیمایش با درگ یا کلیدهای کنترل جهت بررسی دقیق مشخصات متالورژی و نوری"}
        </p>
      </div>

      {/* کاروسل ۳D کارت‌ها */}
      <div className={`relative w-full max-w-5xl mx-auto flex items-center justify-center overflow-hidden [perspective:1200px] ${containerHeightClass}`}>
        {products.map((p, idx) => {
          let offset = idx - activeIndex;
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;

          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          const translateX = offset * (cardScale === "compact" ? 180 : cardScale === "large" ? 230 : 210);
          const translateZ = -Math.abs(offset) * 170;
          const rotateY = -offset * 22;
          const opacity = isActive ? 1 : Math.max(0.2, 0.65 - Math.abs(offset) * 0.25);
          const filter = isActive ? "none" : "grayscale(95%) opacity(50%) blur(0.5px)";
          const zIndex = 20 - Math.abs(offset);

          const isAvail = (p.stock ?? 10) > 0 && p.is_available !== false;
          const finalPrice = p.discountPrice || p.discount_price || p.price;

          return (
            <div
              key={p.id}
              onClick={() => {
                if (!isActive) {
                  soundEngine.playClick();
                  setActiveIndex(idx);
                }
              }}
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
                opacity,
                filter,
                zIndex,
              }}
              className={`absolute rounded-[2.5rem] p-5 sm:p-6 glass-morphism border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between cursor-pointer ${cardSizeClasses} ${
                isActive
                  ? "border-[var(--accent-blue)] shadow-[0_20px_60px_rgba(2,132,199,0.35)] scale-100 ring-2 ring-blue-500/20"
                  : "border-[var(--card-border)] scale-95"
              }`}
            >
              <div className="space-y-2.5 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[10px] border border-white/10">
                    {p.category || "تکنولوژی"}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--accent-blue)] font-black uppercase">
                    {p.brand || "AXON"}
                  </span>
                </div>

                <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-[var(--input-bg)] p-3 border border-[var(--card-border)] flex items-center justify-center overflow-hidden group">
                  <Link href={`/products/${p.id}`} className="w-full h-full flex items-center justify-center">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                    />
                  </Link>

                  {/* دکمه کالبدشکافی ۳D */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      soundEngine.playExplodeShift();
                      setTeardownProduct(p);
                    }}
                    className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-blue-600 text-white font-bold text-[10px] border border-white/20 backdrop-blur-md transition flex items-center gap-1 shadow-md cursor-pointer z-10"
                    title="کالبدشکافی سه‌بعدی لایه‌ها"
                  >
                    <span>🧬</span>
                    <span>کالبدشکافی ۳D</span>
                  </button>
                </div>

                <div>
                  <Link href={`/products/${p.id}`}>
                    <h3 className="font-extrabold text-sm text-[var(--text-primary)] line-clamp-2 leading-snug hover:text-[var(--accent-blue)] transition">
                      {p.title}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 font-medium mt-1">
                    {p.short_description || p.description || "دارای ۱۸ ماه گارانتی اصالت طلایی"}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[var(--card-border)]">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                    {formatPrice(finalPrice)} تومان
                  </span>
                  <span className={`text-[10px] font-bold ${isAvail ? "text-emerald-500" : "text-rose-500"}`}>
                    {isAvail ? "موجود در انبار ✓" : "ناموجود"}
                  </span>
                </div>

                {isActive ? (
                  <AddToCartButton product={p} />
                ) : (
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-[var(--input-bg)] text-xs font-bold text-[var(--text-secondary)]"
                  >
                    انتخاب کالا
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ناوبری اسلایدر با شمارنده */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm font-black transition cursor-pointer shadow-sm active:scale-90"
            title="قبلی"
          >
            →
          </button>

          <span className="font-mono font-black text-sm text-[var(--text-primary)] tracking-widest px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm font-black transition cursor-pointer shadow-sm active:scale-90"
            title="بعدی"
          >
            ←
          </button>
        </div>
      </div>

      {/* مدال کالبدشکافی ۳D */}
      {teardownProduct && (
        <ProductExplodedView
          productId={teardownProduct.id}
          productTitle={teardownProduct.title}
          category={teardownProduct.category}
          isOpen={!!teardownProduct}
          onClose={() => setTeardownProduct(null)}
        />
      )}
    </section>
  );
}

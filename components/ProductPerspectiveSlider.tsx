// File Path: components/ProductPerspectiveSlider.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";
import AddToCartButton from "@/components/AddToCartButton";

interface ProductItem {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  image: string;
  brand?: string;
  specs?: Record<string, string>;
  highlights?: string[];
}

export default function ProductPerspectiveSlider({ products }: { products: ProductItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

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

  const current = products[activeIndex];

  return (
    <section className="w-full py-6 select-none font-sans" dir="rtl">
      <div className="text-center space-y-2 mb-8">
        <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[var(--accent-blue)] text-xs font-black">
          AXON FLAGSHIP SHOWCASE • {total} محصول برگزیده
        </span>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">
          نمایشگاه سه‌بعدی تجهیزات پرچمدار
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          پیمایش با درگ یا کلیدهای کنترل جهت بررسی دقیق مشخصات متالورژی و نوری
        </p>
      </div>

      {/* کاروسل کارت‌های پرسپکتیو ۳D */}
      <div className="relative w-full max-w-5xl mx-auto h-[440px] sm:h-[500px] flex items-center justify-center overflow-hidden [perspective:1200px]">
        {products.map((p, idx) => {
          let offset = idx - activeIndex;
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;

          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          const translateX = offset * 180;
          const translateZ = -Math.abs(offset) * 160;
          const rotateY = -offset * 24;
          const opacity = isActive ? 1 : Math.max(0.25, 0.7 - Math.abs(offset) * 0.25);
          const filter = isActive ? "none" : "grayscale(90%) contrast(90%) blur(0.5px)";
          const zIndex = 20 - Math.abs(offset);

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
              className={`absolute w-[280px] sm:w-[340px] h-[400px] sm:h-[460px] rounded-[2.5rem] p-6 glass-morphism border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between cursor-pointer ${
                isActive
                  ? "border-[var(--accent-blue)] shadow-[0_20px_60px_rgba(2,132,199,0.35)] scale-100 ring-2 ring-blue-500/20"
                  : "border-[var(--card-border)] scale-95"
              }`}
            >
              <div className="space-y-3 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[10px] text-[var(--accent-blue)] font-black uppercase">
                    {p.brand || "AXON STUDIO"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/40 text-white font-mono text-[10px] font-bold">
                    {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                  </span>
                </div>

                <div className="w-full h-44 sm:h-52 rounded-2xl bg-[var(--input-bg)] p-3 border border-[var(--card-border)] flex items-center justify-center overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                  />
                </div>

                <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)] line-clamp-2 leading-snug">
                  {p.title}
                </h3>
              </div>

              <div className="space-y-3 pt-3 border-t border-[var(--card-border)]">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[var(--text-secondary)] font-bold">قیمت رسمی:</span>
                  <span className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                    {formatPrice(p.discountPrice || p.price)} تومان
                  </span>
                </div>

                {isActive ? (
                  <AddToCartButton product={p} />
                ) : (
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-[var(--input-bg)] text-xs font-bold text-[var(--text-secondary)]"
                  >
                    مشاهده کالا
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* کنترلر و شمارنده عددی (برگرفته از ویدیو ۱) */}
      <div className="flex flex-col items-center gap-3 mt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="w-11 h-11 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm font-black transition cursor-pointer shadow-md active:scale-90"
            title="قبلی"
          >
            →
          </button>

          <span className="font-mono font-black text-base text-[var(--text-primary)] tracking-widest px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          <button
            onClick={handleNext}
            className="w-11 h-11 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm font-black transition cursor-pointer shadow-md active:scale-90"
            title="بعدی"
          >
            ←
          </button>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)]">
          DRAG • SCROLL • ARROWS
        </span>
      </div>
    </section>
  );
}

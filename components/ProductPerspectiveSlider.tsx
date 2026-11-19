// File Path: components/ProductPerspectiveSlider.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

interface Props {
  products?: any[];
  customTitle?: string;
  customSubtitle?: string;
}

function toSafeImgUrl(url?: string): string {
  const u = String(url || "").trim();
  if (!u) return "/placeholder.png";
  if (u.includes(".supabase.co/"))
    return "/api/media-proxy?url=" + encodeURIComponent(u);
  return u;
}

export default function ProductPerspectiveSlider({
  products: propProducts,
  customTitle,
  customSubtitle,
}: Props = {}) {
  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderConfig, setSliderConfig] = useState({
    opacity: 30,
    customBg: "",
  });

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((p) => (p + 1) % products.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [products.length]);

  useEffect(() => {
    fetch("/api/theme-builder?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const bg = json?.config?.globalBackground || {};
        setSliderConfig({
          opacity: Number(bg.sliderBgOpacity ?? 30),
          customBg: bg.sliderCustomBgUrl || "",
        });
      })
      .catch(() => {});

    if (propProducts && propProducts.length > 0) {
      setProducts(propProducts.slice(0, 6));
      return;
    }
    fetch("/api/products?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json.data) ? json.data : json.products || [];
        setProducts(list.slice(0, 6));
      })
      .catch(() => {});
  }, [propProducts]);

  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX);

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 40) {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    } else if (distance < -40) {
      setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (products.length === 0) return null;

  const activeProd = products[currentIndex] || products[0];
  const finalPrice = Number(
    activeProd.discount_price || activeProd.price || 0
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-6 space-y-4">
      {(customTitle || customSubtitle) && (
        <div className="text-center space-y-1.5 mb-2">
          {customTitle && (
            <h2 className="text-lg sm:text-2xl font-black text-[var(--text-primary)]">
              {customTitle}
            </h2>
          )}
          {customSubtitle && (
            <p className="text-xs text-[var(--text-secondary)]">
              {customSubtitle}
            </p>
          )}
        </div>
      )}

      {/* کانتینر بدون برش و بدون نمایش لبه اسلاید مجاور */}
      <div
        className="relative w-full h-[380px] sm:h-[420px] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-2xl touch-pan-y select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        dir="rtl"
      >
        {/* لایه پس‌زمینه محوشده */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ opacity: sliderConfig.opacity / 100 }}
        >
          <img
            src={
              sliderConfig.customBg
                ? toSafeImgUrl(sliderConfig.customBg)
                : toSafeImgUrl(activeProd.image_url || activeProd.image)
            }
            alt=""
            className="w-full h-full object-cover blur-2xl scale-110 transition-all duration-700"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--modal-bg)] via-[var(--modal-bg)]/80 to-[var(--modal-bg)]/30" />
        </div>

        {/* اسلاید فعال */}
        <div
          key={activeProd.id}
          className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-between px-8 sm:px-14 py-8 pb-14 gap-6 md:gap-12 animate-fadeIn"
        >
          <div className="w-44 h-44 md:w-64 md:h-64 flex items-center justify-center shrink-0">
            <img
              src={toSafeImgUrl(activeProd.image_url || activeProd.image)}
              className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
              alt={activeProd.title}
              draggable={false}
            />
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-right space-y-3.5 flex-1 min-w-0">
            <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[11px] font-black">
              {activeProd.category || "پیشنهاد ویژه"}
            </span>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-[var(--text-primary)] leading-tight line-clamp-2">
              {activeProd.title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2 max-w-xl">
              {activeProd.short_description ||
                activeProd.description ||
                "عرضه تخصصی با ضمانت اصالت فیزیکی و ارسال سریع در آکسون کور"}
            </p>

            <div className="w-full pt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="text-lg sm:text-2xl font-black text-emerald-500 font-mono">
                {finalPrice.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-sans">تومان</span>
              </div>
              <Link
                href={"/products/" + activeProd.id}
                onClick={() => soundEngine.playClick()}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg hover:opacity-90 transition text-center"
              >
                مشاهده و خرید محصول ←
              </Link>
            </div>
          </div>
        </div>

        {/* دکمه‌های قبلی / بعدی */}
        {products.length > 1 && (
          <>
            <button
              type="button"
              aria-label="اسلاید قبلی"
              onClick={() => {
                soundEngine.playClick();
                setCurrentIndex(
                  (prev) => (prev - 1 + products.length) % products.length
                );
              }}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[var(--input-bg)]/80 border border-[var(--card-border)] hover:border-[var(--accent-blue)] items-center justify-center text-xs font-black cursor-pointer transition"
            >
              →
            </button>
            <button
              type="button"
              aria-label="اسلاید بعدی"
              onClick={() => {
                soundEngine.playClick();
                setCurrentIndex((prev) => (prev + 1) % products.length);
              }}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[var(--input-bg)]/80 border border-[var(--card-border)] hover:border-[var(--accent-blue)] items-center justify-center text-xs font-black cursor-pointer transition"
            >
              ←
            </button>
          </>
        )}

        {/* نقطه‌های ناوبری */}
        {products.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-2">
            {products.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`اسلاید ${idx + 1}`}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? "w-6 bg-[var(--accent-blue)] shadow-md shadow-blue-500/50"
                    : "w-1.5 bg-gray-400/40 hover:bg-gray-400/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
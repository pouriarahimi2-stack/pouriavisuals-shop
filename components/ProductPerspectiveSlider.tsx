"use client";
// File Path: components/ProductPerspectiveSlider.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  products?: any[];
  customTitle?: string;
  customSubtitle?: string;
}

function toSafeImgUrl(url?: string): string {
  const u = String(url || "").trim();
  if (!u) return "/placeholder.png";
  if (u.includes(".supabase.co/")) return "/api/media-proxy?url=" + encodeURIComponent(u);
  return u;
}

export default function ProductPerspectiveSlider({ products: propProducts, customTitle, customSubtitle }: Props = {}) {
  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [sliderConfig, setSliderConfig] = useState({ opacity: 30, customBg: "" });

  // استیت‌های مربوط به تاچ (سوایپ در موبایل)
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    fetch("/api/theme-builder", { cache: "no-store" })
      .then(r => r.json())
      .then(json => {
        const bg = json?.config?.globalBackground || {};
        setSliderConfig({
          opacity: Number(bg.sliderBgOpacity ?? 30),
          customBg: bg.sliderCustomBgUrl || ""
        });
      }).catch(() => {});

    if (propProducts && propProducts.length > 0) {
      setProducts(propProducts.slice(0, 5));
      return;
    }
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json.data) ? json.data : json.products || [];
        setProducts(list.slice(0, 5));
      })
      .catch(() => {});
  }, [propProducts]);

  const manualChangeSlide = (newIndex: number) => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setFade(true);
    }, 400);
  };

  // هندلرهای سوایپ لمسی
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    
    // اگر کاربر انگشتش را بیشتر از 50 پیکسل کشیده باشد
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      manualChangeSlide((currentIndex + 1) % products.length);
    }
    if (isRightSwipe) {
      manualChangeSlide((currentIndex - 1 + products.length) % products.length);
    }
    
    // ریست کردن تاچ
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (products.length === 0) return null;

  const prod = products[currentIndex];
  const finalPrice = Number(prod.discount_price || prod.price || 0);
  
  const backgroundUrl = sliderConfig.customBg ? toSafeImgUrl(sliderConfig.customBg) : toSafeImgUrl(prod.image_url || prod.image);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-8 space-y-4">
      {(customTitle || customSubtitle) && (
        <div className="text-center space-y-1.5 mb-2">
          {customTitle && <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{customTitle}</h2>}
          {customSubtitle && <p className="text-xs text-[var(--text-secondary)]">{customSubtitle}</p>}
        </div>
      )}

      {/* ناحیه حساس به تاچ */}
      <div 
        className="relative w-full min-h-[520px] md:h-[450px] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-2xl flex flex-col justify-between touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        
        {/* لایه تصویر پس‌زمینه */}
        <div
          className={`absolute inset-0 z-0 pointer-events-none transition-all duration-700 ease-in-out ${fade ? 'scale-100' : 'scale-105 opacity-0'}`}
          style={{ opacity: sliderConfig.opacity / 100 }}
        >
          <img
            src={backgroundUrl}
            alt=""
            className="w-full h-full object-cover blur-2xl"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--modal-bg)] via-[var(--modal-bg)]/70 to-transparent" />
        </div>

        {/* لایه محتوای محصول */}
        <div
          className={`relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-6 p-6 md:p-12 transition-all duration-500 ease-in-out ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* بخش تصویر محصول */}
          <div className="w-48 h-48 md:w-64 md:h-64 relative shrink-0 mt-2 md:mt-0 pointer-events-none">
            <div className="absolute inset-0 bg-[var(--bg-primary)] rounded-full blur-3xl opacity-60 animate-pulse" />
            <img
              src={toSafeImgUrl(prod.image_url || prod.image)}
              className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
              alt={prod.title}
              draggable={false}
            />
          </div>

          {/* بخش متون و دکمه خرید */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-right space-y-3 md:space-y-4 w-full max-w-lg">
            <div className="px-3 py-1.5 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[10px] sm:text-[11px] font-black">
              {prod.category || "پیشنهاد ویژه"}
            </div>
            <h2 className="text-lg sm:text-3xl font-black text-[var(--text-primary)] leading-tight line-clamp-2">
              {prod.title}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
              {prod.short_description || prod.description || "پرفروش‌ترین تجهیزات تخصصی در آکسون کور"}
            </p>
            
            <div className="w-full pt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="text-lg sm:text-xl font-black text-emerald-500 font-mono">
                {finalPrice.toLocaleString("fa-IR")} <span className="text-xs font-sans">تومان</span>
              </div>
              <Link
                href={"/products/" + prod.id}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform text-center"
              >
                مشاهده و خرید محصول ←
              </Link>
            </div>
          </div>
        </div>

        {/* نوار ناوبری پایین */}
        <div className="relative z-20 pb-5 md:pb-6 flex items-center justify-center gap-4">
          <button
            onClick={() => manualChangeSlide((currentIndex - 1 + products.length) % products.length)}
            className="w-10 h-10 rounded-full bg-[var(--input-bg)]/90 backdrop-blur border border-[var(--card-border)] flex items-center justify-center shadow-lg hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer font-bold"
          >
            →
          </button>
          <div className="flex gap-1.5">
            {products.map((_, idx) => (
              <span
                key={idx}
                onClick={() => manualChangeSlide(idx)}
                className={"h-2 cursor-pointer rounded-full transition-all " + (idx === currentIndex ? "w-6 bg-[var(--accent-blue)]" : "w-2 bg-[var(--card-border)]")}
              />
            ))}
          </div>
          <button
            onClick={() => manualChangeSlide((currentIndex + 1) % products.length)}
            className="w-10 h-10 rounded-full bg-[var(--input-bg)]/90 backdrop-blur border border-[var(--card-border)] flex items-center justify-center shadow-lg hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer font-bold"
          >
            ←
          </button>
        </div>
      </div>
    </div>
  );
}

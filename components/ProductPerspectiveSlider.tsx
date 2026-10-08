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
  const [sliderConfig, setSliderConfig] = useState({ opacity: 30, customBg: "" });

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

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    
    // سوایپ نرم بدون پرش
    if (distance > 40) {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    } else if (distance < -40) {
      setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (products.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-8 space-y-4">
      {(customTitle || customSubtitle) && (
        <div className="text-center space-y-1.5 mb-2">
          {customTitle && <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{customTitle}</h2>}
          {customSubtitle && <p className="text-xs text-[var(--text-secondary)]">{customSubtitle}</p>}
        </div>
      )}

      {/* کانتینر اصلی با ارتفاع کاملاً ثابت برای جلوگیری از هرگونه پرش (Layout Shift) */}
      <div 
        className="relative w-full h-[520px] md:h-[450px] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-2xl touch-pan-y select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        dir="rtl"
      >
        {/* لایه پس‌زمینه: تمام عکس‌ها از قبل رندر شده و فقط Opacity تغییر می‌کند تا پرش نداشته باشیم */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: sliderConfig.opacity / 100 }}>
          {products.map((p, idx) => (
            <img
              key={p.id}
              src={sliderConfig.customBg ? toSafeImgUrl(sliderConfig.customBg) : toSafeImgUrl(p.image_url || p.image)}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover blur-2xl scale-110 transition-opacity duration-700 ease-in-out ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
              draggable={false}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--modal-bg)] via-[var(--modal-bg)]/80 to-[var(--modal-bg)]/30" />
        </div>

        {/* Track افقی اسلایدر */}
        <div 
          className="relative z-10 flex w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translate3d(${currentIndex * 100}%, 0, 0)` }}
        >
          {products.map((prod) => {
            const finalPrice = Number(prod.discount_price || prod.price || 0);
            
            return (
              <div key={prod.id} className="min-w-full w-full h-full flex flex-col md:flex-row items-center justify-center p-6 pb-16 md:p-12 md:pb-12 gap-4 md:gap-12">
                
                {/* عکس محصول (دایره سیاه مخرب حذف شد) */}
                <div className="w-44 h-44 md:w-64 md:h-64 flex items-center justify-center shrink-0 pointer-events-none">
                  <img
                    src={toSafeImgUrl(prod.image_url || prod.image)}
                    className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                    alt={prod.title}
                    draggable={false}
                  />
                </div>

                {/* متون و دکمه */}
                <div className="flex flex-col items-center md:items-start text-center md:text-right space-y-3 md:space-y-4 w-full max-w-sm md:max-w-lg">
                  <div className="px-3 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[11px] font-black">
                    {prod.category || "پیشنهاد ویژه"}
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] leading-tight line-clamp-2">
                    {prod.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {prod.short_description || prod.description || "پرفروش‌ترین تجهیزات تخصصی در آکسون کور"}
                  </p>
                  
                  <div className="w-full pt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                    <div className="text-lg sm:text-xl font-black text-emerald-500 font-mono">
                      {finalPrice.toLocaleString("fa-IR")} <span className="text-xs font-sans">تومان</span>
                    </div>
                    <Link
                      href={"/products/" + prod.id}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg hover:scale-105 transition-transform text-center pointer-events-auto"
                    >
                      مشاهده و خرید محصول ←
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* نقطه‌های ناوبری ساده و ایمن در پایین صفحه */}
        <div className="absolute bottom-5 left-0 right-0 z-30 flex items-center justify-center gap-2 pointer-events-none">
          {products.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-6 bg-[var(--accent-blue)] shadow-md shadow-blue-500/50" : "w-1.5 bg-gray-400/40"}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

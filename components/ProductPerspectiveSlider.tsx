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

  // استیت‌های تاچ برای سوایپ موبایل
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    
    // در حالت RTL کشیدن به چپ (فاصله مثبت) یعنی رفتن به اسلاید بعدی
    if (distance > 40) {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    } else if (distance < -40) {
      setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (products.length === 0) return null;

  // انتخاب عکس پس زمینه (یا عکس سفارشی ادمین یا عکس محصول فعلی)
  const currentProd = products[currentIndex];
  const backgroundUrl = sliderConfig.customBg ? toSafeImgUrl(sliderConfig.customBg) : toSafeImgUrl(currentProd?.image_url || currentProd?.image);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-8 space-y-4">
      {/* هدر سفارشی اسلایدر */}
      {(customTitle || customSubtitle) && (
        <div className="text-center space-y-1.5 mb-2">
          {customTitle && <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{customTitle}</h2>}
          {customSubtitle && <p className="text-xs text-[var(--text-secondary)]">{customSubtitle}</p>}
        </div>
      )}

      {/* کانتینر اصلی اسلایدر */}
      <div 
        className="relative w-full min-h-[580px] md:min-h-[450px] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-2xl touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        dir="rtl"
      >
        {/* بک‌گراند بلور شده (خارج از Track برای اینکه ثابت بماند و فقط محو شود) */}
        <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-700 ease-in-out" style={{ opacity: sliderConfig.opacity / 100 }}>
          <img
            key={backgroundUrl} // تعویض نرم عکس با تغییر کلید
            src={backgroundUrl}
            alt=""
            className="w-full h-full object-cover blur-2xl scale-110 animate-fadeIn"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--modal-bg)] via-[var(--modal-bg)]/80 to-[var(--modal-bg)]/30" />
        </div>

        {/* Track افقی اسلایدر (حرکت نرم بدون پرش ارتفاع) */}
        <div 
          className="relative z-10 flex w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translate3d(${currentIndex * 100}%, 0, 0)` }}
        >
          {products.map((prod, idx) => {
            const finalPrice = Number(prod.discount_price || prod.price || 0);
            
            return (
              <div key={prod.id} className="min-w-full w-full h-full flex flex-col md:flex-row items-center justify-center p-6 pb-24 md:p-12 md:pb-12 gap-6 md:gap-12">
                
                {/* عکس محصول */}
                <div className="w-48 h-48 md:w-64 md:h-64 relative shrink-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-[var(--bg-primary)] rounded-full blur-3xl opacity-60 animate-pulse" />
                  <img
                    src={toSafeImgUrl(prod.image_url || prod.image)}
                    className="relative z-10 w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                    alt={prod.title}
                    draggable={false}
                  />
                </div>

                {/* متون و دکمه */}
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-right space-y-3 md:space-y-4 w-full max-w-lg">
                  <div className="px-3 py-1.5 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[11px] font-black">
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

        {/* نوار ناوبری (ثابت در پایین اسلایدر، جدا از محتوای اسلایدها) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-4 bg-[var(--modal-bg)]/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-[var(--card-border)] shadow-xl">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)}
            className="w-8 h-8 rounded-full bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer font-bold border border-[var(--card-border)]"
          >
            →
          </button>
          <div className="flex gap-2">
            {products.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={"h-2 cursor-pointer rounded-full transition-all duration-300 " + (idx === currentIndex ? "w-6 bg-[var(--accent-blue)]" : "w-2 bg-[var(--card-border)]")}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % products.length)}
            className="w-8 h-8 rounded-full bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer font-bold border border-[var(--card-border)]"
          >
            ←
          </button>
        </div>

      </div>
    </div>
  );
}

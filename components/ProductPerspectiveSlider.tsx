"use client";
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

  useEffect(() => {
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

  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      changeSlide((currentIndex + 1) % products.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [products.length, currentIndex]);

  const changeSlide = (newIndex: number) => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setFade(true);
    }, 400); // زمان لازم برای محو شدن قبل از نمایش اسلاید جدید
  };

  if (products.length === 0) return null;

  const prod = products[currentIndex];
  const finalPrice = Number(prod.discount_price || prod.price || 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-8 space-y-4">
      {/* نمایش عناوین سفارشی در بالای اسلایدر (دریافت شده از پنل ادمین) */}
      {(customTitle || customSubtitle) && (
        <div className="text-center space-y-1.5 mb-2" data-axon-leaf-role="showcase_header">
          {customTitle && <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{customTitle}</h2>}
          {customSubtitle && <p className="text-xs text-[var(--text-secondary)]">{customSubtitle}</p>}
        </div>
      )}

      <div className="relative w-full h-[400px] sm:h-[450px] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-2xl flex flex-col justify-center">
        
        {/* لایه پس‌زمینه: عکس شاخص محصول به صورت مات و فیت‌شده */}
        <div
          className={`absolute inset-0 z-0 pointer-events-none transition-all duration-700 ease-in-out ${fade ? 'scale-100' : 'scale-105 opacity-0'}`}
          style={{ opacity: fade ? "var(--axon-slider-bg-op, 0.3)" : 0 }}
        >
          <img
            src={toSafeImgUrl(prod.image_url || prod.image)}
            alt=""
            className="w-full h-full object-cover blur-2xl scale-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--modal-bg)] via-[var(--modal-bg)]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--modal-bg)] via-transparent to-[var(--modal-bg)] opacity-50" />
        </div>

        {/* لایه محتوا و اطلاعات محصول */}
        <div
          className={`relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-center md:justify-between gap-6 p-6 sm:p-12 transition-all duration-500 ease-in-out ${fade ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
        >
          {/* عکس محصول */}
          <div className="w-40 h-40 sm:w-64 sm:h-64 relative shrink-0">
            <div className="absolute inset-0 bg-[var(--bg-primary)] rounded-full blur-3xl opacity-60 animate-pulse" />
            <img
              src={toSafeImgUrl(prod.image_url || prod.image)}
              className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
              alt={prod.title}
            />
          </div>

          {/* توضیحات و دکمه خرید */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-right space-y-3 sm:space-y-4 max-w-lg w-full">
            <div data-axon-leaf-role="card_category" className="px-3 py-1.5 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[10px] sm:text-[11px] font-black">
              {prod.category || "پیشنهاد ویژه"}
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] leading-tight line-clamp-2">
              {prod.title}
            </h2>
            <p data-axon-leaf-role="card_subtitle" className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
              {prod.short_description || prod.description || "پرفروش‌ترین تجهیزات تخصصی در آکسون کور"}
            </p>
            
            <div className="w-full pt-3 sm:pt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="text-lg sm:text-xl font-black text-emerald-500 font-mono">
                {finalPrice.toLocaleString("fa-IR")} <span className="text-xs font-sans">تومان</span>
              </div>
              <Link
                href={"/products/" + prod.id}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform text-center"
              >
                مشاهده و خرید محصول ←
              </Link>
            </div>
          </div>
        </div>

        {/* دکمه‌های ناوبری */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          <button
            onClick={() => changeSlide((currentIndex - 1 + products.length) % products.length)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--input-bg)]/80 backdrop-blur border border-[var(--card-border)] flex items-center justify-center shadow-lg text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
          >
            →
          </button>
          <div className="flex gap-1.5">
            {products.map((_, idx) => (
              <span
                key={idx}
                className={"h-1.5 rounded-full transition-all " + (idx === currentIndex ? "w-6 bg-[var(--accent-blue)]" : "w-1.5 bg-[var(--card-border)]")}
              />
            ))}
          </div>
          <button
            onClick={() => changeSlide((currentIndex + 1) % products.length)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--input-bg)]/80 backdrop-blur border border-[var(--card-border)] flex items-center justify-center shadow-lg text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
          >
            ←
          </button>
        </div>
      </div>
    </div>
  );
}

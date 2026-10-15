"use client";
import React from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";

export default function DynamicHomeSections({ initialProducts, initialBanners }: any) {
  const products = Array.isArray(initialProducts) ? initialProducts : [];
  
  // دقیقاً همان منطق و دیتای دیشب (بدون دستکاری و تزریق هوش مصنوعی)
  const banners = Array.isArray(initialBanners) ? initialBanners : [];

  const categoryMap: Record<string, any[]> = {};
  products.forEach(p => {
    const cat = p.category || "سایر محصولات";
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(p);
  });

  return (
    <div className="space-y-10 sm:space-y-16">
      
      {/* ── اسلایدر اصلی: کادر سیاه زشت حذف شد و دکمه‌ها روی عکس قرار گرفت ── */}
      {banners.length > 0 && (
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] rounded-3xl overflow-hidden shadow-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none w-full h-full scroll-smooth">
              {banners.map((b: any, i: number) => (
                <a key={i} href={b.link_url || "#"} className="min-w-full h-full snap-center relative block">
                  <img src={b.image_url || b.image} alt={b.title || "Banner"} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-6 sm:p-10">
                    <h2 className="text-white font-black text-base sm:text-xl md:text-3xl drop-shadow-lg line-clamp-2">
                      {b.title}
                    </h2>
                  </div>
                </a>
              ))}
            </div>
            
            {/* نشانگرهای نقطه‌ای ساده و شیشه‌ای (جایگزین کادر سیاه موبایل) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full pointer-events-none">
              {banners.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ردیف محصولات (اسکرول افقی اپلیکیشنی + دکمه مشاهده همه در چپ) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 pb-10">
        {Object.entries(categoryMap).map(([category, catProducts]) => (
          <section key={category} className="space-y-4 sm:space-y-5">
            
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-1.5 sm:w-2 h-5 sm:h-6 rounded-full bg-[var(--accent-blue)] inline-block"></span>
                {category}
              </h2>
              <Link 
                href={`/products?category=${encodeURIComponent(category)}`} 
                className="text-[10px] sm:text-xs font-bold text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:bg-[var(--accent-blue)] hover:text-white transition whitespace-nowrap"
              >
                مشاهده همه ←
              </Link>
            </div>

            {/* اسکرول افقی محتوای دسته */}
            <div className="relative w-full">
              <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {catProducts.map(p => (
                  <div key={p.id} className="snap-start shrink-0 w-[160px] sm:w-[220px]">
                    <ProductCard product={p} />
                  </div>
                ))}
                
                {/* کارت نهایی در انتهای اسکرول افقی برای مشاهده کل دسته */}
                <div className="snap-start shrink-0 w-[160px] sm:w-[220px] flex items-center justify-center p-4">
                  <Link 
                    href={`/products?category=${encodeURIComponent(category)}`} 
                    className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-[200px] rounded-[1.5rem] bg-[var(--accent-blue)]/5 border-2 border-dashed border-[var(--accent-blue)]/30 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center text-xl group-hover:bg-white/20">
                      ←
                    </div>
                    <span className="font-bold text-xs">مشاهده همه</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

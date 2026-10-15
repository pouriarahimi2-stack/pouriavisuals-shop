"use client";
import React from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";

export default function DynamicHomeSections({ initialProducts, initialBanners }: any) {
  const products = Array.isArray(initialProducts) ? initialProducts : [];
  const banners = Array.isArray(initialBanners) ? initialBanners : [];

  // گروه‌بندی هوشمند محصولات بر اساس دسته‌بندی
  const categoryMap: Record<string, any[]> = {};
  products.forEach(p => {
    const cat = p.category || "سایر محصولات";
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(p);
  });

  return (
    <div className="space-y-10 sm:space-y-16">
      
      {/* ── اسلایدر اصلی (بنرها) ── */}
      {/* کادر سیاه و خاکستریِ زشتِ زیرِ اسلایدر کاملاً حذف شد */}
      {banners.length > 0 && (
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] rounded-3xl overflow-hidden shadow-xl bg-[var(--input-bg)]">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none w-full h-full">
              {banners.map((b, i) => (
                <a key={i} href={b.link_url || "#"} className="min-w-full h-full snap-center relative block group">
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <h2 className="text-white font-black text-lg md:text-2xl drop-shadow-md">{b.title}</h2>
                  </div>
                </a>
              ))}
            </div>
            
            {/* نشانگرهای تمیز و شیشه‌ای (Dots) روی خود عکس */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-none">
              {banners.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── قفسه‌های دسته‌بندی (اسکرول افقی با محدودیت ۸ محصول) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 pb-10">
        {Object.entries(categoryMap).map(([category, catProducts]) => {
          // جدا کردن حداکثر 8 محصول برای نمایش در ردیف
          const displayProducts = catProducts.slice(0, 8);
          
          return (
            <section key={category} className="space-y-4 sm:space-y-5">
              
              {/* هدرِ قفسه (عنوان در راست + دکمه مشاهده همه در چپ) */}
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-1.5 sm:w-2 h-5 sm:h-6 rounded-full bg-[var(--accent-blue)] inline-block shadow-md shadow-blue-500/20"></span>
                  {category}
                </h2>
                
                <Link 
                  href={`/products?category=${encodeURIComponent(category)}`} 
                  className="text-[10px] sm:text-xs font-bold text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:bg-[var(--accent-blue)] hover:text-white transition whitespace-nowrap"
                >
                  مشاهده همه ←
                </Link>
              </div>

              {/* اسکرولر افقی محصولات */}
              <div className="relative w-full">
                <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {displayProducts.map(p => (
                    <div key={p.id} className="snap-start shrink-0 w-[150px] sm:w-[220px]">
                      <ProductCard product={p} />
                    </div>
                  ))}
                  
                  {/* اگر محصولات بیشتر از 8 تا بود، یک کارت انتهایی برای ترغیب کاربر می‌گذاریم */}
                  {catProducts.length > 8 && (
                    <div className="snap-start shrink-0 w-[150px] sm:w-[220px] flex items-center justify-center p-4">
                      <Link 
                        href={`/products?category=${encodeURIComponent(category)}`} 
                        className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-[200px] rounded-[1.5rem] bg-[var(--accent-blue)]/5 border-2 border-dashed border-[var(--accent-blue)]/30 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white transition-colors cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center text-xl group-hover:bg-white/20">
                          ←
                        </div>
                        <span className="font-bold text-xs">مشاهده بقیه موارد</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

"use client";
import React from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";

export default function DynamicHomeSections({ initialProducts, initialBanners }: any) {
  const products = Array.isArray(initialProducts) ? initialProducts : [];
  const banners = Array.isArray(initialBanners) ? initialBanners : [];

  // گروه‌بندی محصولات بر اساس دسته‌بندی
  const categoryMap: Record<string, any[]> = {};
  products.forEach(p => {
    const cat = p.category || "سایر";
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(p);
  });

  return (
    <div className="space-y-8 sm:space-y-12">
      
      {/* اسلایدر اصلی (Hero Banner) - رفع باگ کادر مشکی زشت */}
      {banners.length > 0 && (
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] rounded-3xl overflow-hidden shadow-2xl bg-[var(--input-bg)]">
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
            {/* راهنمای اسکرول موبایل تمیز (بدون کادر مشکی) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
              {banners.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ردیف‌های دسته‌بندی (اسکرول افقی ۸‌تایی در کامپیوتر و موبایل) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 pb-10">
        {Object.entries(categoryMap).map(([category, catProducts]) => (
          <section key={category} className="space-y-4">
            
            {/* هدر دسته‌بندی */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-[var(--accent-blue)] inline-block"></span>
                {category}
              </h2>
              <Link href={`/products?category=${encodeURIComponent(category)}`} className="text-[11px] sm:text-xs font-bold text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 px-4 py-2 rounded-full hover:bg-[var(--accent-blue)] hover:text-white transition">
                مشاهده همه ←
              </Link>
            </div>

            {/* گالری اسکرولی محصولات (بدون به هم ریختگی گرید) */}
            <div className="relative w-full">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {catProducts.map(p => (
                  <div key={p.id} className="snap-start shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

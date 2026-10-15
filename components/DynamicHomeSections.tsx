"use client";
import React from "react";
import Link from "next/link";
import ProductCard, { getValidImageUrl } from "./ProductCard";

export default function DynamicHomeSections({ initialProducts, initialBanners }: any) {
  const products = Array.isArray(initialProducts) ? initialProducts : [];
  let displayBanners = Array.isArray(initialBanners) ? initialBanners : [];

  // بررسی هوشمندانه محصولات برای ساخت اسلایدر خودکار
  if (displayBanners.length === 0 && products.length > 0) {
    const validProds = products.filter(p => {
      const img = getValidImageUrl(p);
      return img && img !== "/placeholder.png";
    });
    
    displayBanners = validProds.slice(0, 5).map((prod, i) => ({
      id: `smart-${prod.id || i}`,
      title: prod.title,
      image_url: getValidImageUrl(prod),
      link_url: `/products/${prod.id}`,
      is_smart: true
    }));
  }

  const categoryMap: Record<string, any[]> = {};
  products.forEach(p => {
    const cat = p.category || "سایر محصولات";
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(p);
  });

  return (
    <div className="space-y-10 sm:space-y-16">
      {/* ── اسلایدر ── */}
      {displayBanners.length > 0 && (
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] rounded-3xl overflow-hidden shadow-xl bg-[var(--modal-bg)] border border-[var(--card-border)] group/slider">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none w-full h-full scroll-smooth">
              {displayBanners.map((b: any, i: number) => {
                const img = b.image_url || b.image || "/placeholder.png";
                return (
                  <a key={i} href={b.link_url || "#"} className="min-w-full h-full snap-center relative block flex-shrink-0">
                    {b.is_smart ? (
                       <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-tr from-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800">
                          <img src={img} alt={b.title} className="w-full h-full object-contain mix-blend-multiply drop-shadow-xl hover:scale-105 transition-transform duration-700" />
                       </div>
                    ) : (
                       <img src={img} alt={b.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end p-6 sm:p-10 pointer-events-none">
                      <h2 className="text-white font-black text-base sm:text-xl md:text-3xl drop-shadow-lg line-clamp-2 translate-y-2 group-hover/slider:translate-y-0 transition-transform">
                        {b.title}
                      </h2>
                    </div>
                  </a>
                );
              })}
            </div>
            {/* نشانگرهای شیشه‌ای روی عکس */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full pointer-events-none">
              {displayBanners.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── قفسه‌های محصولات ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 pb-10">
        {Object.entries(categoryMap).map(([category, catProducts]) => (
          <section key={category} className="space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-1.5 sm:w-2 h-5 sm:h-6 rounded-full bg-[var(--accent-blue)] inline-block"></span>
                {category}
              </h2>
              <Link href={`/products?category=${encodeURIComponent(category)}`} className="text-[10px] sm:text-xs font-bold text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:bg-[var(--accent-blue)] hover:text-white transition whitespace-nowrap">مشاهده همه ←</Link>
            </div>
            <div className="relative w-full">
              <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {catProducts.slice(0, 8).map(p => (
                  <div key={p.id} className="snap-start shrink-0 w-[160px] sm:w-[220px]">
                    <ProductCard product={p} />
                  </div>
                ))}
                {catProducts.length > 8 && (
                  <div className="snap-start shrink-0 w-[160px] sm:w-[220px] flex items-center justify-center p-4">
                    <Link href={`/products?category=${encodeURIComponent(category)}`} className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-[200px] rounded-[1.5rem] bg-[var(--accent-blue)]/5 border-2 border-dashed border-[var(--accent-blue)]/30 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white transition-colors cursor-pointer group">
                      <div className="w-12 h-12 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center text-xl group-hover:bg-white/20">←</div>
                      <span className="font-bold text-xs">مشاهده همه</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

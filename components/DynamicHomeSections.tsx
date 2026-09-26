"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import { useSiteInfo } from "@/context/SiteInfoContext";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";

interface Props { initialProducts: any[]; initialBanners: any[]; initialSiteInfo?: any; }

export default function DynamicHomeSections({ initialProducts, initialBanners }: Props) {
  const [products, setProducts]               = useState<any[]>(initialProducts || []);
  const [banners,  setBanners]                = useState<any[]>(initialBanners  || []);
  const [activeIdx, setActiveIdx]             = useState(0);
  const { siteInfo } = useSiteInfo();

  const silentSync = async () => {
    try {
      const [pr, br] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }).then(r => r.json()).catch(() => null),
        fetch("/api/public/banners", { cache: "no-store" }).then(r => r.json()).catch(() => null),
      ]);
      if (pr?.success  && Array.isArray(pr.data))      setProducts(pr.data);
      if (br?.success  && Array.isArray(br.banners))   setBanners(br.banners.filter((b: any) => b.is_active));
    } catch {}
  };

  useEffect(() => {
    silentSync();
    let t: ReturnType<typeof setTimeout>;
    const ch = supabase.channel("home-v5")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => { clearTimeout(t); t = setTimeout(silentSync, 2000); })
      .on("postgres_changes", { event: "*", schema: "public", table: "banners"  }, () => { clearTimeout(t); t = setTimeout(silentSync, 2000); })
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const iv = setInterval(() => setActiveIdx(p => (p + 1) % banners.length), 6000);
    return () => clearInterval(iv);
  }, [banners.length]);

  const lc = siteInfo?.homepage_layout_config;
  const heroTitle    = lc?.hero?.title    || "دنیای نوآوری، تکنولوژی مدرن و ابزارهای هوشمند";
  const heroSubtitle = lc?.hero?.subtitle || "مرجع تخصصی خرید آنلاین جدیدترین کالاهای تکنولوژی با تضمین اصالت و ارسال سریع.";

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
      {banners.length > 0 ? (
        <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] shadow-2xl aspect-[16/8] sm:aspect-[21/9] max-h-[460px]">
          {banners.map((b, idx) => (
            <div key={b.id || idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeIdx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}>
              <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-12 text-white space-y-3">
                <h2 className="text-xl sm:text-3xl font-black leading-tight max-w-2xl">{b.title}</h2>
                {b.link_url && (
                  <Link href={b.link_url} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-slate-200 transition w-fit shadow-lg">
                    مشاهده محصولات ←
                  </Link>
                )}
              </div>
            </div>
          ))}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-6 z-20 flex gap-2">
              {banners.map((_,i) => (
                <button key={i} onClick={() => setActiveIdx(i)} className={`h-2 rounded-full transition-all cursor-pointer ${i===activeIdx?"w-8 bg-blue-500":"w-2 bg-white/50"}`} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-[#070b14] to-slate-950 border border-[var(--card-border)] p-8 sm:p-14 text-center space-y-6 shadow-2xl">
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">{heroTitle}</h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">{heroSubtitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/products" onClick={() => soundEngine.playClick()} className="px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition shadow-xl">مشاهده محصولات ←</Link>
            <Link href="/news"     onClick={() => soundEngine.playClick()} className="px-8 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition">رادار اخبار 📡</Link>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="block lg:hidden">
          <ProductPerspectiveSlider products={products} customTitle="نمایشگاه محصولات" customSubtitle="پیمایش لمسی" />
        </div>
      )}

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg sm:text-2xl font-black text-[var(--text-primary)]">{lc?.productsSection?.title || "جدیدترین محصولات"}</h2>
          </div>
          <Link href="/products" className="text-xs font-black text-[var(--accent-blue)] hover:underline">مشاهده همه ({products.length}) ←</Link>
        </div>
        {products.length === 0 ? (
          <div className="p-16 text-center rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)]">
            <span className="text-4xl block mb-2">📦</span>
            <p className="text-xs font-bold text-[var(--text-secondary)]">محصولی قرار ندارد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((prod, idx) => (
              <div key={prod.id} className={"axon-reveal-scale stagger-" + (idx % 8)}>
                <ProductCard product={prod} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

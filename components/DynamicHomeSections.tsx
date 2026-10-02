// File Path: components/DynamicHomeSections.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import ProductList from "@/components/ProductList";
import TechRadarFeed from "@/components/TechRadarFeed";
import { useSiteInfo } from "@/context/SiteInfoContext";
import { DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";

interface Props {
  initialProducts?: any[];
  initialBanners?: any[];
  initialSiteInfo?: any;
}

export default function DynamicHomeSections({
  initialProducts = [],
  initialBanners = [],
}: Props) {
  const { siteInfo } = useSiteInfo();
  const layoutCfg = siteInfo?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;

  const [products, setProducts] = useState<any[]>(initialProducts);
  const [banners, setBanners] = useState<any[]>(initialBanners);
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchLiveHomeData = async () => {
    try {
      const [pRes, bRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }).catch(() => null),
        fetch("/api/public/banners", { cache: "no-store" }).catch(() => null),
      ]);
      if (pRes && pRes.ok) {
        const pJson = await pRes.json();
        const pList = pJson.data || pJson.products || [];
        if (Array.isArray(pList) && pList.length > 0) setProducts(pList);
      }
      if (bRes && bRes.ok) {
        const bJson = await bRes.json();
        const bList = (bJson.banners || bJson.data || []).filter((b: any) => b.is_active !== false);
        setBanners(bList);
      }
    } catch {}
  };

  useEffect(() => {
    if (initialProducts.length === 0) {
      fetchLiveHomeData();
    }

    const chProds = supabase
      .channel("realtime-home-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchLiveHomeData();
      })
      .subscribe();

    const chBanners = supabase
      .channel("realtime-home-banners")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        fetchLiveHomeData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chProds);
      supabase.removeChannel(chBanners);
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const heroCfg = layoutCfg.hero || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.hero;
  const showcaseCfg = layoutCfg.showcase3D || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.showcase3D;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 font-sans select-none" dir="rtl">
      {/* ۱. نوار رادار اخبار تکنولوژی */}
      {layoutCfg.newsTicker?.show !== false && <TechRadarFeed />}

      {/* ۲. اسلایدر بنرهای تبلیغاتی (در صورت وجود بنر فعال) */}
      {banners.length > 0 && (
        <section className="relative w-full h-52 sm:h-72 md:h-96 rounded-3xl overflow-hidden border border-[var(--card-border)] shadow-2xl bg-[var(--modal-bg)] group">
          {banners.map((b, idx) => (
            <Link
              key={b.id || idx}
              href={b.link_url || b.link || "/products"}
              onClick={() => soundEngine.playClick()}
              className={
                "absolute inset-0 transition-opacity duration-700 " +
                (idx === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")
              }
            >
              <img
                src={b.image_url || b.image}
                alt={b.title || "بنر فروشگاه"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 sm:p-8">
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white">
                  {b.title}
                </h2>
                <span className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs w-fit shadow-lg">
                  مشاهده و خرید محصول ←
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* ۳. سکشن هیرو اصلی سایت */}
      {heroCfg?.show !== false && (
        <section className="relative rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl overflow-hidden p-6 sm:p-12 text-center space-y-5">
          <Hero3DCanvas />
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] text-xs font-black">
              🚀 مرجع تخصصی تکنولوژی و گجت‌های هوشمند
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight text-[var(--text-primary)]">
              {heroCfg.title || "دنیای نوآوری، تکنولوژی مدرن و ابزارهای هوشمند"}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto font-medium">
              {heroCfg.subtitle ||
                "عرضه مستقیم جدیدترین گجت‌های هوشمند و تجهیزات دیجیتال با تضمین اصالت و ارسال سریع به سراسر ایران."}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={heroCfg.buttonLink || "/products"}
                onClick={() => soundEngine.playClick()}
                className="px-7 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs sm:text-sm shadow-xl hover:opacity-90 transition"
              >
                {heroCfg.buttonText || "مشاهده کاتالوگ محصولات"} ←
              </Link>
              <Link
                href="/track-order"
                className="px-6 py-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-xs sm:text-sm transition"
              >
                🚚 پیگیری سفارش
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ۴. نمایشگاه سه‌بعدی تعاملی محصولات */}
      {showcaseCfg?.show !== false && products.length > 0 && (
        <ProductPerspectiveSlider
          products={products}
          customTitle={showcaseCfg.title}
          customSubtitle={showcaseCfg.subtitle}
        />
      )}

      {/* ۵. کاتالوگ کامل محصولات در صفحه اصلی */}
      {layoutCfg.productsSection?.show !== false && (
        <ProductList initialProducts={products} />
      )}
    </div>
  );
}

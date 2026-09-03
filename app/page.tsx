"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";
import { bannerService, Banner } from "@/services/bannerService";
import { siteInfoService, SiteInfo, DEFAULT_HOMEPAGE_LAYOUT_CONFIG, HomepageLayoutConfig } from "@/services/siteInfoService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import AIAssistantChat from "@/components/AIAssistantChat";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import TechRadarFeed from "@/components/TechRadarFeed";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";

export default function HomePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>(FLAGSHIP_7_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState<HomepageLayoutConfig>(() => {
    return siteInfoService.getSiteInfoSync()?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  });

  const loadData = async () => {
    try {
      const [prods, bans, info] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
        siteInfoService.getSiteInfo(),
      ]);
      if (prods && prods.length > 0) setProducts(prods);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
      if (info?.homepage_layout_config) {
        setLayoutConfig(info.homepage_layout_config);
      }
    } catch {}
  };

  useEffect(() => {
    loadData();

    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };

    const handleSiteInfoUpdate = (e: any) => {
      if (e.detail?.homepage_layout_config) {
        setLayoutConfig(e.detail.homepage_layout_config);
      }
    };

    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("site_info_updated", handleSiteInfoUpdate);

    return () => {
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("site_info_updated", handleSiteInfoUpdate);
    };
  }, []);

  const heroCfg = layoutConfig.hero;
  const showcaseCfg = layoutConfig.showcase3D;
  const newsTickerCfg = layoutConfig.newsTicker;
  const blogCfg = layoutConfig.blogSection;

  // محاسبه کلاس‌های پویای ارتفاع هیرو
  const heroHeightClasses =
    heroCfg.heightMode === "cinematic"
      ? "min-h-[440px] sm:min-h-[520px]"
      : heroCfg.heightMode === "standard"
      ? "min-h-[300px] sm:min-h-[360px]"
      : "min-h-[200px] sm:min-h-[250px]";

  // محاسبه کلاس‌های پویای پدینگ هیرو
  const heroPaddingClasses =
    heroCfg.verticalPadding === "relaxed"
      ? "p-8 sm:p-14 lg:p-16"
      : heroCfg.verticalPadding === "normal"
      ? "p-6 sm:p-10 lg:p-12"
      : "p-5 sm:p-8 lg:p-10";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-12 transition-colors duration-300" dir="rtl">
      <main className="pt-1 px-3 sm:px-6 max-w-[1440px] mx-auto space-y-4 sm:space-y-6">
        
        {/* تیکر اخبار تکنولوژی با قابلیت خاموش/روشن بلادرنگ */}
        {newsTickerCfg.show && <TechRadarFeed />}

        {/* هیرو سکشن ماژولار با کنترل کامل ارتفاع، فواصل و بوم سه‌بعدی */}
        {heroCfg.show && (
          <section className={`w-full rounded-[2.2rem] sm:rounded-[2.5rem] overflow-hidden glass-morphism shadow-xl border border-[var(--card-border)] relative flex flex-col justify-center transition-all duration-300 ${heroHeightClasses} ${heroPaddingClasses}`}>
            {heroCfg.show3DCanvas && <Hero3DCanvas />}

            <div className="relative z-10 space-y-2.5 max-w-2xl text-right">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-[var(--text-primary)]">
                {heroCfg.title}
              </h1>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
                {heroCfg.subtitle}
              </p>

              <div className="pt-1">
                <Link
                  href={heroCfg.buttonLink || "/#products"}
                  className="inline-flex items-center gap-2 bg-[var(--accent-blue)] text-white px-7 py-3 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  <span>{heroCfg.buttonText}</span>
                  <span>←</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* نمایشگاه سه‌بعدی پرچمدار محصولات با کنترل اندازه کارت‌ها و تعداد کالاها */}
        {showcaseCfg.show && (
          <ProductPerspectiveSlider
            products={products.slice(0, showcaseCfg.limit || 7)}
            customTitle={showcaseCfg.title}
            customSubtitle={showcaseCfg.subtitle}
            cardScale={showcaseCfg.cardScale}
          />
        )}

        {/* مجله سئو با کنترل تعداد مقالات و لینک مشاهده همه */}
        {blogCfg.show && (
          <section className="glass-morphism rounded-3xl p-5 sm:p-7 space-y-3">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  {blogCfg.title}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                  {blogCfg.subtitle}
                </p>
              </div>
              {blogCfg.showViewAll && (
                <Link href="/blog" className="text-xs font-bold text-[var(--accent-blue)] hover:underline">
                  مشاهده همه مقالات ←
                </Link>
              )}
            </div>
            <HomeBlogSection count={blogCfg.count || 3} />
          </section>
        )}
      </main>

      <ProductComparisonModal products={compareList} isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} onRemoveProduct={(id) => setCompareList(compareList.filter((item) => item.id !== id))} />
      <AIAssistantChat />
    </div>
  );
}

function HomeBlogSection({ count = 3 }: { count?: number }) {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/blogs").then((r) => r.json()).then((d) => setPosts((d.data || d.posts || []).slice(0, count))).catch(() => {});
  }, [count]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 pt-1`}>
      {posts.map((post) => (
        <article key={post.id || post.title} className="glass-morphism p-4 rounded-2xl space-y-2 flex flex-col justify-between hover:border-[var(--card-border-hover)] transition duration-300">
          <h4 className="font-bold text-xs line-clamp-2 text-[var(--text-primary)]">{post.title}</h4>
          <Link href={"/blog/" + (post.id || "")} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-2 border-t border-[var(--card-border)]">
            مطالعه مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}

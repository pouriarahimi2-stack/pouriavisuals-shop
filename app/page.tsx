"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";
import { bannerService, Banner } from "@/services/bannerService";
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

  const loadData = async () => {
    try {
      const [prods, bans] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
      ]);
      if (prods && prods.length > 0) setProducts(prods);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
    } catch {}
  };

  useEffect(() => {
    loadData();

    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };

    window.addEventListener("products_updated", handleProductsUpdate);
    return () => {
      window.removeEventListener("products_updated", handleProductsUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-12 transition-colors duration-300" dir="rtl">
      <main className="pt-1 px-3 sm:px-6 max-w-[1440px] mx-auto space-y-4 sm:space-y-6">
        
        {/* تیکر اخبار تکنولوژی با حاشیه فشرده */}
        <TechRadarFeed />

        {/* هیرو سکشن فشرده‌شده با ارتفاع متناسب و بدون فاصله اضافه */}
        <section className="w-full rounded-[2.2rem] sm:rounded-[2.5rem] overflow-hidden glass-morphism p-5 sm:p-8 lg:p-10 shadow-xl border border-[var(--card-border)] relative min-h-[200px] sm:min-h-[250px] flex flex-col justify-center">
          <Hero3DCanvas />

          <div className="relative z-10 space-y-2.5 max-w-2xl text-right">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
              مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
              تامین مستقیم انواع مانیتورهای ۵K رتینا، لپ‌تاپ‌های حرفه‌ای M4 Max، ساعت‌های هوشمند اولترا و ابزارهای استودیو با ۱۸ ماه گارانتی اصالت طلایی و ارسال پیشتاز.
            </p>

            <div className="pt-1">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 bg-[var(--accent-blue)] text-white px-7 py-3 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/25"
              >
                <span>مشاهده کاتالوگ محصولات</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        </section>

        {/* نمایشگاه سه‌بعدی پرچمدار محصولات (ویترین اصلی کالاها بدون گرید تکراری) */}
        <ProductPerspectiveSlider products={products.slice(0, 7)} />

        {/* مجله سئو */}
        <section className="glass-morphism rounded-3xl p-5 sm:p-7 space-y-3">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">مجله و مقالات تحلیلی فناوری</h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">جدیدترین بررسی‌های تخصصی سخت‌افزار و راهنمای خرید گجت‌ها</p>
            </div>
            <Link href="/blog" className="text-xs font-bold text-[var(--accent-blue)] hover:underline">
              مشاهده همه مقالات ←
            </Link>
          </div>
          <HomeBlogSection />
        </section>
      </main>

      <ProductComparisonModal products={compareList} isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} onRemoveProduct={(id) => setCompareList(compareList.filter((item) => item.id !== id))} />
      <AIAssistantChat />
    </div>
  );
}

function HomeBlogSection() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/blogs").then((r) => r.json()).then((d) => setPosts((d.data || d.posts || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
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

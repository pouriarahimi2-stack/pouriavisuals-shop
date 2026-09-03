"use client";

import React, { useState, useEffect } from "react";
import { productService, Product, FLAGSHIP_7_PRODUCTS } from "@/services/productService";
import { bannerService, Banner } from "@/services/bannerService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import AIAssistantChat from "@/components/AIAssistantChat";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import ProductCard from "@/components/ProductCard";
import TechRadarFeed from "@/components/TechRadarFeed";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import { soundEngine } from "@/lib/soundEngine";

export default function HomePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>(FLAGSHIP_7_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

    const handleCategoryChange = (e: any) => setSelectedCategory(e.detail || "all");
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };

    window.addEventListener("category_selected", handleCategoryChange);
    window.addEventListener("products_updated", handleProductsUpdate);

    return () => {
      window.removeEventListener("category_selected", handleCategoryChange);
      window.removeEventListener("products_updated", handleProductsUpdate);
    };
  }, []);

  const toggleCompare = (p: Product) => {
    soundEngine.playClick();
    if (compareList.some((item) => item.id === p.id)) {
      setCompareList(compareList.filter((item) => item.id !== p.id));
    } else {
      if (compareList.length >= 4) {
        alert("حداکثر ۴ کالا را می‌توانید همزمان مقایسه نمایید.");
        return;
      }
      setCompareList([...compareList, p]);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    const cat = (product.category || (product as any).category_name || "").toLowerCase();
    const target = selectedCategory.toLowerCase();
    return cat === target || cat.includes(target) || target.includes(cat);
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-24 transition-colors duration-300" dir="rtl">
      <main className="pt-4 sm:pt-6 px-3 sm:px-6 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* هاب اخبار تکنولوژی ۶ ساعته */}
        <TechRadarFeed />

        {/* ۱. هیرو اسپلیت ۳D گرید واقعی (Right: تایپوگرافی شیشه‌ای | Left: کانواس ۳D کوانتومی) */}
        <section className="w-full rounded-[2.5rem] overflow-hidden glass-morphism p-6 sm:p-10 shadow-2xl border border-[var(--card-border)] relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* ستون راست: متن و دکمه‌های اقدام */}
          <div className="lg:col-span-7 space-y-4 text-right z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-bold text-xs border border-[var(--accent-blue)]/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>اکوسیستم تکنولوژی ۲۰۲۶ و کالبدشکافی ۳D اختصاصی</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight text-[var(--text-primary)]">
              مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
              تامین مستقیم انواع مانیتورهای ۵K رتینا، مک‌بوک‌های ورک‌استیشن M4 Max، ساعت‌های اولترا و تجهیزات ضبط استودیویی با ۱۸ ماه گارانتی اصالت طلایی و ارسال پیشتاز به سراسر ایران.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                href="/#products"
                className="bg-[var(--accent-blue)] text-white px-8 py-3.5 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/25 flex items-center gap-2"
              >
                <span>مشاهده کاتالوگ محصولات</span>
                <span>←</span>
              </Link>
              
              <Link
                href="/products/prod-studio-display-5k"
                className="bg-[var(--input-bg)] hover:bg-[var(--accent-blue)]/10 text-[var(--text-primary)] px-6 py-3.5 rounded-full font-bold text-xs border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition flex items-center gap-1.5"
              >
                <span>🧬</span>
                <span>تست کالبدشکافی ۳D کالا</span>
              </Link>
            </div>
          </div>

          {/* ستون چپ: بوم تعاملی سه‌بعدی Three.js کاملاً شفاف و درخشان */}
          <div className="lg:col-span-5 h-[320px] sm:h-[400px] w-full relative flex items-center justify-center rounded-3xl bg-[var(--input-bg)]/40 border border-[var(--card-border)] overflow-hidden shadow-inner">
            <div className="absolute top-3 right-4 z-20 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-blue-300 font-bold">
              ⚡ Three.js Quantum Core
            </div>
            <Hero3DCanvas />
          </div>
        </section>

        {/* ۲. گرید محصولات */}
        <section id="products" className="space-y-6">
          <div className="border-b border-[var(--card-border)] pb-4 px-1 flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                محصولات و تجهیزات تکنولوژی
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                تمامی کالاها با گارانتی اصالت طلایی و ارسال سریع پیشتاز عرضه می‌شوند
              </p>
            </div>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="text-xs font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
              >
                نمایش همه کالاها ({products.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* ۳. بخش مقالات سئو */}
        <section className="glass-morphism rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">مجله و مقالات تحلیلی فناوری</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium">جدیدترین بررسی‌های تخصصی سخت‌افزار و راهنمای خرید گجت‌ها</p>
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      {posts.map((post) => (
        <article key={post.id || post.title} className="glass-morphism p-4 rounded-2xl space-y-2 flex flex-col justify-between hover:border-[var(--accent-blue)] transition duration-300">
          <h4 className="font-bold text-xs line-clamp-2 text-[var(--text-primary)]">{post.title}</h4>
          <Link href={"/blog/" + (post.id || "")} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-2 border-t border-[var(--card-border)]">
            مطالعه مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}

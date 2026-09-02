// File Path: app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { productService, Product, FLAGSHIP_7_PRODUCTS } from "@/services/productService";
import { bannerService, Banner } from "@/services/bannerService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import AIAssistantChat from "@/components/AIAssistantChat";
import TechRadarFeed from "@/components/TechRadarFeed";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import ProductCard from "@/components/ProductCard";
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

  const categories = Array.from(new Set(products.map((p) => p.category || "تکنولوژی"))).filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-24 transition-colors duration-300" dir="rtl">
      <main className="pt-6 sm:pt-8 px-3 sm:px-6 max-w-7xl mx-auto space-y-8 sm:space-y-10">
        
        {/* ۱. هیرو بنتو شیشه‌ای Google Stitch */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 min-h-[300px] sm:min-h-[340px] rounded-3xl overflow-hidden relative glass-morphism flex flex-col justify-end p-6 sm:p-10">
            <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600" className="absolute inset-0 w-full h-full object-cover opacity-25 dark:opacity-35" alt="Tech Showcase" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--modal-bg)] via-[var(--modal-bg)]/60 to-transparent" />
            <div className="relative z-10 space-y-3 text-right">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-bold text-xs border border-[var(--accent-blue)]/30">
                ⚡ اکوسیستم جامع تکنولوژی ۲۰۲۶
              </span>
              <h1 className="text-2xl sm:text-4xl font-black leading-tight text-[var(--text-primary)]">
                مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                تامین انواع سیستم‌های پردازشی، لپ‌تاپ‌های ورک‌استیشن، ساعت‌های هوشمند، نمایشگرهای ۵K و قطعات دیجیتال با ۱۸ ماه گارانتی اصالت طلایی.
              </p>
              <div className="pt-2 flex gap-3">
                <Link href="/#products" className="bg-[var(--accent-blue)] text-white px-7 py-3.5 rounded-full font-black text-xs hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
                  مشاهده کاتالوگ محصولات ←
                </Link>
              </div>
            </div>
          </div>

          <div className="md:col-span-1 min-h-[300px] sm:min-h-[340px] rounded-3xl glass-morphism p-6 flex flex-col justify-center items-center text-center space-y-2">
            <div className="text-4xl font-black text-[var(--accent-blue)]">۱۰۰٪</div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">ضمانت اصالت فیزیکی کالا</h4>
            <p className="text-xs text-[var(--text-secondary)] font-medium">ارسال رایگان سفارش‌های بالای ۲ میلیون با پست پیشتاز</p>
          </div>
        </section>

        {/* ۲. تیکر اخبار روز تکنولوژی */}
        <TechRadarFeed />

        {/* ۳. پیل‌های سگمنت دسته‌بندی Google Stitch */}
        <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" dir="rtl">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-6 py-2.5 rounded-full glass-morphism whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "all" ? "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/25 border-[var(--accent-blue)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
            }`}
          >
            همه محصولات ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full glass-morphism whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat ? "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/25 border-[var(--accent-blue)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* ۴. گرید محصولات با کارت‌های شیشه‌ای Google Stitch */}
        <div id="products" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* ۵. بخش مقالات سئو */}
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
          <Link href={`/blog/${post.id}`} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-2 border-t border-[var(--card-border)]">
            مطالعه مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}

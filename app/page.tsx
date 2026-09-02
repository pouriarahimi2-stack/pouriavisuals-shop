// File Path: app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { bannerService, Banner } from "@/services/bannerService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import AIAssistantChat from "@/components/AIAssistantChat";
import TechRadarFeed from "@/components/TechRadarFeed";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import ProductCard from "@/components/ProductCard";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

export default function HomePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const loadData = async () => {
    try {
      const [prods, bans, info] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
        siteInfoService.getSiteInfo(),
      ]);

      if (prods) setProducts(prods);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
      if (info) setSiteInfo(info);
    } catch {}
  };

  useEffect(() => {
    loadData();

    const handleCategoryChange = (e: any) => setSelectedCategory(e.detail || "all");
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };
    const handleBannersUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setBanners(e.detail);
      else loadData();
    };
    const handleSiteUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };

    window.addEventListener("category_selected", handleCategoryChange);
    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("banners_updated", handleBannersUpdate);
    window.addEventListener("site_info_updated", handleSiteUpdate);

    return () => {
      window.removeEventListener("category_selected", handleCategoryChange);
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("banners_updated", handleBannersUpdate);
      window.removeEventListener("site_info_updated", handleSiteUpdate);
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const toggleCompare = (p: Product) => {
    soundEngine.playClick();
    if (compareList.some((item) => item.id === p.id)) {
      setCompareList(compareList.filter((item) => item.id !== p.id));
    } else {
      if (compareList.length >= 4) {
        alert("حداکثر ۴ محصول را می‌توانید به طور همزمان مقایسه نمایید.");
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

  const activeBanner = banners[currentSlideIndex] || banners[0];

  const techCategories = [
    { id: "all", name: "همه محصولات", icon: "⚡" },
    { id: "گجت‌های هوشمند", name: "گجت‌های هوشمند", icon: "⌚" },
    { id: "سخت‌افزار و پردازش", name: "سخت‌افزار و پردازش", icon: "💻" },
    { id: "لپ‌تاپ و اولترابوک", name: "لپ‌تاپ و اولترابوک", icon: "🖥️" },
    { id: "صوتی و تصویر", name: "صوتی و تصویر نوین", icon: "🎧" },
    { id: "هوش مصنوعی و دیجیتال", name: "ابزارهای هوش مصنوعی", icon: "🤖" },
  ];

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-none pb-20 transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-10 mt-3 sm:mt-5">
        
        {/* هیرو بنر ماژولار سبک Google Stitch با افکت شیشه‌ای */}
        <section className="relative overflow-hidden rounded-[2.8rem] border border-[var(--card-border)] shadow-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950/40 p-6 sm:p-14 group">
          <div className="max-w-3xl space-y-5 z-10 text-white animate-fadeIn">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 text-xs font-black backdrop-blur-md shadow-sm">
              <span>🚀</span>
              <span>اکوسیستم یکپارچه فناوری و گجت‌های هوشمند</span>
            </span>
            <h1 className="text-2xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-md">
              مرجع تخصصی خرید جدیدترین تجهیزات تکنولوژی و دیجیتال
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
              تامین‌کننده پیشرفته‌ترین سخت‌افزارها، گجت‌های پوشیدنی، تجهیزات پردازشی و سیستم‌های هوشمند با ضمانت اصالت فیزیکی و ارسال سریع پیشتاز به سراسر کشور
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/#products" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs transition shadow-2xl hover:scale-105 active:scale-95 cursor-pointer">
                <span>مشاهده کاتالوگ تکنولوژی</span><span>←</span>
              </Link>
              <Link href="/news" className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition">
                <span>📰 رادار اخبار تکنولوژی</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ۴ ویژگی ماژولار Google Stitch */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="stitch-card p-4 sm:p-5 rounded-3xl space-y-1.5 text-center sm:text-right">
            <span className="text-2xl block">🛡️</span>
            <strong className="text-xs sm:text-sm font-black text-[var(--text-primary)] block">گارانتی اصالت طلایی</strong>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">تضمین ۱۰۰٪ اصالت کلیه کالاها</p>
          </div>
          <div className="stitch-card p-4 sm:p-5 rounded-3xl space-y-1.5 text-center sm:text-right">
            <span className="text-2xl block">🚀</span>
            <strong className="text-xs sm:text-sm font-black text-[var(--text-primary)] block">ارسال اکسپرس پیشتاز</strong>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">ارسال رایگان خریدهای بالای ۲ میلیون</p>
          </div>
          <div className="stitch-card p-4 sm:p-5 rounded-3xl space-y-1.5 text-center sm:text-right">
            <span className="text-2xl block">🤖</span>
            <strong className="text-xs sm:text-sm font-black text-[var(--text-primary)] block">مشاوره هوش مصنوعی</strong>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">راهنمای فنی ۲۴ ساعته انتخاب گجت</p>
          </div>
          <div className="stitch-card p-4 sm:p-5 rounded-3xl space-y-1.5 text-center sm:text-right">
            <span className="text-2xl block">⚖️</span>
            <strong className="text-xs sm:text-sm font-black text-[var(--text-primary)] block">تضمین کمترین نرخ</strong>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">پایش مستمر قیمت در بازار ایران</p>
          </div>
        </div>

        {/* نوار اخبار تکنولوژی */}
        <TechRadarFeed />

        {/* کاتالوگ محصولات با دسته‌بندی‌های نوین */}
        <section id="products" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4 px-1">
            <div>
              <h3 className="text-lg sm:text-2xl font-black tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
                <span>📦</span> ویترین برترین محصولات حوزه تکنولوژی و دیجیتال
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                انتخاب دسته‌بندی دلخواه و مقایسه همزمان مشخصات سخت‌افزاری
              </p>
            </div>

            {/* پیل‌های سگمنت دسته‌بندی Google Stitch */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              {techCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-4 py-2.5 rounded-2xl font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? "bg-[var(--accent-blue)] text-white shadow-md scale-105"
                      : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* بخش مقالات سئو */}
        <section className="p-6 sm:p-8 rounded-[2.5rem] space-y-4 my-8 border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-xl">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>📚</span> مجله و مقالات تحلیلی حوزه فناوری
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">جدیدترین تحلیل‌های سخت‌افزاری و راهنمای خرید گجت‌ها</p>
            </div>
            <Link href="/blog" className="px-4 py-2 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-bold hover:bg-[var(--accent-blue)] hover:text-white transition shadow-sm">
              مشاهده همه مقالات ←
            </Link>
          </div>
          <HomeBlogSection />
        </section>
      </div>

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {posts.map((post) => (
        <article key={post.id || post.title} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5 flex flex-col justify-between hover:border-[var(--accent-blue)] transition duration-300 shadow-sm">
          <h4 className="font-black text-xs line-clamp-2 text-[var(--text-primary)]">{post.title}</h4>
          <Link href={`/blog/${post.id}`} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-1.5 border-t border-[var(--card-border)]">
            مطالعه مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}

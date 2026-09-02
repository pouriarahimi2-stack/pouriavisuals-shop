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

export default function HomePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
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

  const techCategories = [
    { id: "all", name: "همه محصولات", icon: "⚡", count: products.length },
    { id: "گجت‌های هوشمند", name: "گجت‌های هوشمند", icon: "⌚", count: products.filter(p => p.category?.includes("گجت")).length || 2 },
    { id: "سخت‌افزار و پردازش", name: "سخت‌افزار و پردازش", icon: "💻", count: products.filter(p => p.category?.includes("سخت‌افزار")).length || 1 },
    { id: "لپ‌تاپ و اولترابوک", name: "لپ‌تاپ و اولترابوک", icon: "🖥️", count: products.filter(p => p.category?.includes("لپ‌تاپ")).length || 1 },
    { id: "صوتی و تصویر", name: "صوتی و تصویر نوین", icon: "🎧", count: products.filter(p => p.category?.includes("صوتی")).length || 2 },
    { id: "هوش مصنوعی و دیجیتال", name: "ابزارهای هوش مصنوعی", icon: "🤖", count: products.filter(p => p.category?.includes("هوش")).length || 1 },
  ];

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-none pb-24 transition-colors duration-300" dir="rtl">
      
      {/* نور پس‌زمینه آمبینت به سبک Google Stitch */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulseGlow" />
      <div className="absolute top-40 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulseGlow" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-8 mt-3 sm:mt-5 relative z-10">
        
        {/* ۱. ماتریس بنتو هیرو Google Stitch (Bento Hero Showcase) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          
          {/* بنتو تایل اصلی: کانون معرفی تکنولوژی */}
          <div className="lg:col-span-8 stitch-bento rounded-[2.5rem] p-6 sm:p-10 flex flex-col justify-between space-y-6 relative overflow-hidden group bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/60 text-white">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 text-[11px] font-black backdrop-blur-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Google Stitch UI & Apple Glass Ecosystem</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[10px] font-mono font-bold">
                  v2026.5 Pro
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight drop-shadow-md">
                مرجع جامع خرید پیشرفته‌ترین گجت‌ها، سخت‌افزار و تکنولوژی
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
                تامین تخصصی انواع سیستم‌های پردازشی، لپ‌تاپ‌های ورک‌استیشن، ساعت‌های هوشمند تیتانیومی، نمایشگرهای ۵K و تجهیزات استودیویی با ۱۸ ماه گارانتی اصالت طلایی.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/#products" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer">
                <span>کاوش در کاتالوگ تکنولوژی</span><span>←</span>
              </Link>
              <Link href="/track-order" className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition">
                <span>📦 رهگیری سفارش با پست پیشتاز</span>
              </Link>
            </div>
          </div>

          {/* بنتو تایل جانبی: کارت هوشمند دستیار فناوری */}
          <div className="lg:col-span-4 stitch-bento rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-gradient-to-tr from-slate-900 to-indigo-950/40 text-white">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">
                🤖
              </div>
              <h3 className="text-base font-black text-white">مشاور هوش مصنوعی تکنولوژی</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                پرسش‌های فنی، استعلام سازگاری قطعات و مقایسه دقیق مانیتورها و لپ‌تاپ‌ها را به صورت زنده بپرسید.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-[11px] text-blue-400 font-bold">نمونه پرسش‌های آماده:</div>
              <div className="flex flex-wrap gap-1.5">
                {["بهترین لپ‌تاپ امسال", "ساعت ضدضربه", "مانیتور ۵K"].map((q, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-300">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ۲. تایل‌های ۴ گانه امکانات و ضمانت‌ها به سبک Google Stitch */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="stitch-bento p-4 sm:p-5 rounded-3xl space-y-1.5 text-center sm:text-right">
            <span className="text-2xl block">🛡️</span>
            <strong className="text-xs sm:text-sm font-black text-[var(--text-primary)] block">گارانتی اصالت طلایی</strong>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">تضمین ۱۰۰٪ اصالت و تست فیزیکی</p>
          </div>
          <div className="stitch-bento p-4 sm:p-5 rounded-3xl space-y-1.5 text-center sm:text-right">
            <span className="text-2xl block">🚀</span>
            <strong className="text-xs sm:text-sm font-black text-[var(--text-primary)] block">ارسال اکسپرس پیشتاز</strong>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">رایگان برای سفارش‌های بالای ۲ میلیون</p>
          </div>
          <div className="stitch-bento p-4 sm:p-5 rounded-3xl space-y-1.5 text-center sm:text-right">
            <span className="text-2xl block">⚡</span>
            <strong className="text-xs sm:text-sm font-black text-[var(--text-primary)] block">پایش زنده قیمت‌ها</strong>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">تضمین کمترین نرخ در بین ۵ پلتفرم</p>
          </div>
          <div className="stitch-bento p-4 sm:p-5 rounded-3xl space-y-1.5 text-center sm:text-right">
            <span className="text-2xl block">🔄</span>
            <strong className="text-xs sm:text-sm font-black text-[var(--text-primary)] block">۷ روز ضمانت بازگشت</strong>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">مهلت تست کامل سخت‌افزاری</p>
          </div>
        </div>

        {/* ۳. تیکر هوشمند اخبار روز تکنولوژی */}
        <TechRadarFeed />

        {/* ۴. کاتالوگ محصولات با سوییچر کپسولی Google Stitch */}
        <section id="products" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4 px-1">
            <div>
              <h3 className="text-lg sm:text-2xl font-black tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
                <span>📦</span> کاتالوگ تخصصی تجهیزات و گجت‌های هوشمند
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                کالاهای اورجینال با بسته‌بندی ضدضربه و ارسال فوری به سراسر ایران
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

        {/* ۵. بخش مجله سئو به سبک بنتو تایل */}
        <section className="stitch-bento p-6 sm:p-8 rounded-[2.8rem] space-y-4 my-8">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>📚</span> مجله تخصصی و مقالات تحلیلی فناوری
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">بررسی موشکافانه سخت‌افزارها، تراشه‌ها و راهنمای خرید</p>
            </div>
            <Link href="/blog" className="px-4 py-2 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-bold hover:bg-[var(--accent-blue)] hover:text-white transition shadow-sm">
              آرشیو مقالات مجله ←
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
            مطالعه کامل مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}

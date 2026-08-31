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
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

export default function HomePage() {
  const { addToCart } = useCart();

  // استیت اولیه پایدار و ۱۰۰٪ یکسان با SSR سرور
  const [products, setProducts] = useState<Product[]>(FLAGSHIP_7_PRODUCTS);
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

      if (prods && prods.length > 0) setProducts(prods);
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

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-none pb-20 transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-10 mt-3 sm:mt-5">
        {banners.length > 0 && (
          <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl group">
            <div
              className="min-h-[380px] sm:min-h-[480px] p-6 sm:p-14 flex items-center bg-cover bg-center transition-all duration-700 relative"
              style={{
                backgroundImage: `linear-gradient(to left, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.35)), url(${activeBanner?.image || (activeBanner as any)?.image_url || ""})`,
              }}
            >
              <div className="max-w-2xl space-y-4 z-10 text-white animate-fadeIn">
                {activeBanner?.badge && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white border border-white/30 text-xs font-black backdrop-blur-md shadow-sm">
                    {activeBanner.badge}
                  </span>
                )}
                <h1 className="text-2xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-md">{activeBanner?.title}</h1>
                {activeBanner?.subtitle && <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl font-medium">{activeBanner.subtitle}</p>}
                <div className="pt-2 flex items-center gap-3">
                  <Link href={activeBanner?.link || (activeBanner as any)?.link_url || "/products"} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-gray-900 font-black text-xs hover:bg-slate-100 transition shadow-2xl hover:scale-105 active:scale-95 cursor-pointer">
                    <span>{activeBanner?.button_text || "مشاهده و بررسی کالا"}</span><span>←</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <TechRadarFeed />

        <section id="products" className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4 px-1">
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
                <span>📦</span> کاتالوگ تجهیزات تخصصی و مانیتورها
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                {selectedCategory === "all" ? "تمامی کالاهای اورجینال با تست سلامت فیزیکی و گارانتی اصالت طلایی" : `فیلتر فعال: ${selectedCategory}`}
              </p>
            </div>
            {selectedCategory !== "all" && (
              <button onClick={() => setSelectedCategory("all")} className="text-xs font-bold text-[var(--accent-blue)] hover:underline cursor-pointer">
                مشاهده همه کالاها ({products.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <HomeProductCard
                key={product.id}
                product={product}
                isCompared={compareList.some((item) => item.id === product.id)}
                onToggleCompare={toggleCompare}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </section>

        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--modal-bg)]/95 backdrop-blur-2xl border border-[var(--card-border)] p-3 px-6 rounded-full shadow-2xl flex items-center gap-4 animate-fadeIn">
            <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-2"><span>⚖️</span><span>{compareList.length} کالا آماده مقایسه</span></span>
            <button onClick={() => { soundEngine.playClick(); setIsCompareOpen(true); }} className="px-4 py-2 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md cursor-pointer hover:opacity-90 transition">مشاهده جدول مقایسه 🚀</button>
            <button onClick={() => { soundEngine.playClick(); setCompareList([]); }} className="text-xs text-rose-500 font-bold hover:underline cursor-pointer">لغو</button>
          </div>
        )}

        <section className="p-5 sm:p-7 rounded-[2.5rem] space-y-4 my-8 border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-xl">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2"><span>📚</span> مجله و مقالات تخصصی سئو</h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">جدیدترین تحلیل‌های سخت‌افزاری و راهنمای خرید</p>
            </div>
            <Link href="/blog" className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-bold hover:bg-[var(--accent-blue)] hover:text-white transition shadow-sm">مشاهده همه مقالات ←</Link>
          </div>
          <HomeBlogSection />
        </section>
      </div>

      <ProductComparisonModal products={compareList} isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} onRemoveProduct={(id) => setCompareList(compareList.filter((item) => item.id !== id))} />
      <AIAssistantChat />
    </div>
  );
}

function HomeProductCard({ product, isCompared, onToggleCompare, onAddToCart }: any) {
  const images = product.images && product.images.length > 0 ? product.images : [product.image || product.image_url || ""];
  const displayImage = images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
  const isAvailable = (product as any).is_available !== false && product.isAvailable !== false && (product.stock === undefined || Number(product.stock) > 0);
  const productName = product.title || product.name || "محصول دیجیتال";
  const currentPrice = Number(product.discountPrice ?? product.discount_price ?? product.price ?? 0);
  const oldPrice = Number(product.originalPrice ?? product.price ?? 0);

  return (
    <div className="rounded-[2.2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-[var(--accent-blue)] hover:shadow-2xl transition duration-300 group shadow-sm select-none">
      <Link href={`/products/${product.id}`} className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-[var(--input-bg)] flex items-center justify-center cursor-pointer border border-[var(--card-border)]">
        <img src={displayImage} alt={productName} className="w-full h-full object-contain p-3 group-hover:scale-105 transition duration-500" />
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleCompare(product); }} className={`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer ${isCompared ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md" : "bg-black/60 text-white border-white/20"}`}>
          {isCompared ? "✓ در مقایسه" : "⚖️ مقایسه"}
        </button>
      </Link>

      <Link href={`/products/${product.id}`} className="space-y-2 cursor-pointer block">
        <span className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-0.5 rounded-full font-bold text-[10px]">{product.category || "کالای دیجیتال"}</span>
        <h4 className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-2 text-right">{productName}</h4>
        <div className="flex items-center gap-2 pt-1">
          <span className="font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-mono" suppressHydrationWarning>{formatPrice(currentPrice)} تومان</span>
          {oldPrice > currentPrice && <span className="text-[11px] line-through text-[var(--text-secondary)] font-mono" suppressHydrationWarning>{formatPrice(oldPrice)}</span>}
        </div>
      </Link>

      <div className="pt-2 border-t border-[var(--card-border)]">
        <button onClick={() => { soundEngine.playAddToCart(); onAddToCart({ id: product.id, name: productName, title: productName, price: currentPrice, image: displayImage, stock: product.stock ?? 10 }); }} disabled={!isAvailable} className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 active:scale-95 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-40">
          <span>🛒</span><span>افزودن به سبد خرید</span>
        </button>
      </div>
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
          <Link href={`/blog/${post.id}`} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-1.5 border-t border-[var(--card-border)]">مطالعه مقاله ←</Link>
        </article>
      ))}
    </div>
  );
}

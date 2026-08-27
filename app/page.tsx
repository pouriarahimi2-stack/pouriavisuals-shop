// File Path: app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { bannerService, Banner } from "@/services/bannerService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AIAssistantChat from "@/components/AIAssistantChat";
import TechRadarFeed from "@/components/TechRadarFeed";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import { soundEngine } from "@/lib/soundEngine";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // سیستم مقایسه تعاملی چند کالا
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const { addToCart } = useCart();

  const loadData = async () => {
    try {
      const [prods, bans, info] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
        siteInfoService.getSiteInfo(),
      ]);

      setProducts(prods || []);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
      if (info) setSiteInfo(info);
    } catch (e) {
      console.error("Home page realtime fetch error:", e);
    }
  };

  useEffect(() => {
    loadData();

    const handleCategoryChange = (e: any) => {
      setSelectedCategory(e.detail || "all");
    };
    window.addEventListener("category_selected", handleCategoryChange);

    const channel = supabase
      .channel("home-master-realtime-channel-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => loadData())
      .subscribe();

    return () => {
      window.removeEventListener("category_selected", handleCategoryChange);
      supabase.removeChannel(channel);
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

  const categoriesList = Array.from(
    new Set(products.map((p) => p.category || (p as any).category_name || "کالای دیجیتال"))
  ).filter(Boolean);

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    const cat = (product.category || (product as any).category_name || "").toLowerCase();
    const target = selectedCategory.toLowerCase();
    return cat === target || cat.includes(target) || target.includes(cat);
  });

  const activeBanner = banners[currentSlideIndex] || banners[0];

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-none pb-20 transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 space-y-14 mt-6">
        
        {/* ۱. اسلایدر هوشمند بنرهای داینامیک برآمده از دیتابیس */}
        {banners.length > 0 && (
          <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl group">
            <div
              className="min-h-[380px] sm:min-h-[480px] p-8 sm:p-16 flex items-center bg-cover bg-center transition-all duration-700 relative"
              style={{
                backgroundImage: `linear-gradient(to left, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.3)), url(${activeBanner?.image || (activeBanner as any)?.image_url || ""})`,
              }}
            >
              <div className="max-w-2xl space-y-4 z-10 text-white animate-fadeIn">
                <div className="flex items-center gap-2 flex-wrap">
                  {activeBanner?.badge && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white border border-white/30 text-xs font-black backdrop-blur-md shadow-sm">
                      {activeBanner.badge}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-md">
                  {activeBanner?.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl font-medium drop-shadow-sm">
                  {activeBanner?.subtitle}
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href={activeBanner?.link || (activeBanner as any)?.link_url || "/products"}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-gray-900 font-black text-xs hover:bg-slate-100 transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{activeBanner?.button_text || "مشاهده و بررسی کالا"}</span>
                    <span>←</span>
                  </Link>
                </div>
              </div>

              {banners.length > 1 && (
                <div className="absolute bottom-6 left-8 flex items-center gap-2 z-20">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        soundEngine.playClick();
                        setCurrentSlideIndex(idx);
                      }}
                      className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        currentSlideIndex === idx ? "w-8 bg-[var(--accent-blue)]" : "w-2.5 bg-white/40 hover:bg-white/70"
                      }`}
                      title={`اسلاید ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ۲. رادار زنده اخبار و ترندهای تکنولوژی روز دنیا */}
        <TechRadarFeed />

        {/* ۳. فیلتر دسته‌بندی‌ها و کاتالوگ محصولات */}
        <section id="products" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4 px-1">
            <div>
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
                <span>📦</span> محصولات ویژه‌ی فروشگاه
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                {selectedCategory === "all" ? "تمامی کالاهای موجود با تست سلامت فیزیکی و گارانتی معتبر" : `نمایش دسته‌بندی: ${selectedCategory}`}
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedCategory("all");
                }}
                className={`px-4 py-2 rounded-2xl font-black transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-[var(--accent-blue)] text-white shadow-md"
                    : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                همه ({products.length})
              </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedCategory(cat);
                  }}
                  className={`px-4 py-2 rounded-2xl font-black transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-[var(--accent-blue)] text-white shadow-md"
                      : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl p-16 text-center text-[var(--text-secondary)] text-xs font-bold space-y-2 bg-[var(--modal-bg)] border border-[var(--card-border)]">
              <span className="text-3xl block">📦</span>
              <p>محصولی در این دسته‌بندی یافت نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <HomeProductCard
                  key={product.id}
                  product={product}
                  isCompared={compareList.some((item) => item.id === product.id)}
                  onToggleCompare={toggleCompare}
                  onAddToCart={addToCart}
                  onOpenDetails={(p) => {
                    soundEngine.playClick();
                    setSelectedProductForModal(p);
                  }}
                  onQuickBuy={(p) => {
                    soundEngine.playAddToCart();
                    addToCart({
                      id: p.id,
                      title: p.title || p.name,
                      name: p.title || p.name,
                      price: Number(p.discountPrice || p.discount_price || p.price || 0),
                      image: p.images?.[0] || p.image || "/placeholder.png",
                      stock: p.stock ?? 10,
                      quantity: 1,
                    });
                    router.push("/checkout");
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* نوار شناور مقایسه فعال */}
        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--modal-bg)]/95 backdrop-blur-2xl border border-[var(--card-border)] p-3 px-6 rounded-full shadow-2xl flex items-center gap-4 animate-fadeIn">
            <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-2">
              <span>⚖️</span>
              <span>{compareList.length} کالا آماده مقایسه</span>
            </span>
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsCompareOpen(true);
              }}
              className="px-4 py-2 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md cursor-pointer hover:opacity-90 transition"
            >
              مشاهده جدول مقایسه 🚀
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setCompareList([]);
              }}
              className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
            >
              لغو
            </button>
          </div>
        )}

        {/* ۴. بخش مجله تخصصی، راهنمای خرید و مقالات سئو */}
        <section className="p-8 rounded-[2.5rem] space-y-6 my-12 border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-xl">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
            <div>
              <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>📚</span> مجله تخصصی و راهنمای خرید سخت‌افزار
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">جدیدترین تحلیل‌های فنی و مقایسه نمایشگرها</p>
            </div>
            <Link
              href="/blog"
              className="px-4 py-2 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-bold hover:bg-[var(--accent-blue)] hover:text-white transition shadow-sm"
            >
              مشاهده همه مقالات ←
            </Link>
          </div>

          <HomeBlogSection />
        </section>
      </div>

      {selectedProductForModal && (
        <ProductDetailsModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* مدال مقایسه ساید‌بای‌ساید */}
      <ProductComparisonModal
        products={compareList}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onRemoveProduct={(id) => setCompareList(compareList.filter((item) => item.id !== id))}
      />

      <AIAssistantChat />
    </div>
  );
}

function HomeProductCard({
  product,
  isCompared,
  onToggleCompare,
  onAddToCart,
  onOpenDetails,
  onQuickBuy,
}: {
  product: Product;
  isCompared: boolean;
  onToggleCompare: (product: Product) => void;
  onAddToCart: (item: any) => void;
  onOpenDetails: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
}) {
  const images = product.images && product.images.length > 0 ? product.images : [product.image || product.image_url || ""];
  const displayImage = images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
  const isAvailable = (product as any).is_available !== false && product.isAvailable !== false && (product.stock === undefined || Number(product.stock) > 0);
  const productName = product.title || product.name || "محصول دیجیتال";
  const currentPrice = Number(product.discountPrice ?? product.discount_price ?? product.price ?? 0);
  const oldPrice = Number(product.originalPrice ?? product.price ?? 0);

  const discountPercent = product.discountPrice && Number(product.discountPrice) < Number(product.price)
    ? Math.round(((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100)
    : 0;

  return (
    <div className="rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-[var(--accent-blue)] hover:shadow-2xl transition duration-300 group shadow-sm select-none">
      <div
        onClick={() => onOpenDetails(product)}
        className="relative w-full h-56 rounded-2xl overflow-hidden bg-[var(--input-bg)] flex items-center justify-center cursor-pointer border border-[var(--card-border)]"
      >
        <img
          src={displayImage}
          alt={productName}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition duration-500"
        />

        {discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-rose-500 text-white text-[11px] px-2.5 py-1 rounded-full font-black shadow-lg">
            {discountPercent}٪- تخفیف
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare(product);
          }}
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
            isCompared
              ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
              : "bg-black/60 text-white border-white/20 hover:bg-black/80"
          }`}
          title="افزودن به مقایسه"
        >
          {isCompared ? "✓ در مقایسه" : "⚖️ مقایسه"}
        </button>
      </div>

      <div className="space-y-2 cursor-pointer" onClick={() => onOpenDetails(product)}>
        <div className="flex items-center justify-between text-[10px]">
          <span className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-0.5 rounded-full font-bold">
            {product.category || "کالای دیجیتال"}
          </span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full ${
              isAvailable
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
            }`}
          >
            {isAvailable ? "موجود در انبار ✓" : "ناموجود"}
          </span>
        </div>

        <h4 className="font-extrabold text-sm hover:text-[var(--accent-blue)] transition text-[var(--text-primary)] leading-snug line-clamp-1">
          {productName}
        </h4>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-medium">
          {(product as any).title_fa || product.short_description || product.description}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <span className="font-black text-base text-emerald-600 dark:text-emerald-400 font-mono">
            {currentPrice.toLocaleString("fa-IR")} تومان
          </span>
          {oldPrice > currentPrice && (
            <span className="text-xs line-through text-[var(--text-secondary)] font-mono">
              {oldPrice.toLocaleString("fa-IR")}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--card-border)]">
        <button
          onClick={() => {
            soundEngine.playAddToCart();
            onAddToCart({
              id: product.id,
              name: productName,
              title: productName,
              price: currentPrice,
              image: displayImage,
              stock: product.stock ?? 10,
            });
          }}
          disabled={!isAvailable}
          className="py-2.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] font-bold text-xs cursor-pointer border border-[var(--card-border)] disabled:opacity-40"
        >
          🛒 سبد خرید
        </button>

        <button
          onClick={() => onQuickBuy(product)}
          disabled={!isAvailable}
          className="py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 transition shadow-md disabled:opacity-40"
        >
          ⚡ خرید سریع
        </button>
      </div>
    </div>
  );
}

function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: any) => void;
}) {
  const images = product.images && product.images.length > 0 ? product.images : [product.image || product.image_url || ""];
  const [activeImage, setActiveImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "desc" | "shipping" | "comparison">("specs");

  const specsEntries = product.specs ? Object.entries(product.specs) : [];
  const isAvailable = (product as any).is_available !== false && product.isAvailable !== false && (product.stock === undefined || Number(product.stock) > 0);
  const productName = product.title || product.name || "";
  const currentPrice = Number(product.discountPrice ?? product.discount_price ?? product.price ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-6 sm:p-8 text-[var(--text-primary)] overflow-y-auto shadow-2xl relative space-y-6">
        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-6 left-6 w-9 h-9 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold transition cursor-pointer z-10"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="w-full h-72 md:h-96 rounded-3xl overflow-hidden bg-[var(--input-bg)] flex items-center justify-center border border-[var(--card-border)] p-4">
              <img
                src={activeImage || product.image || ""}
                alt={productName}
                className="w-full h-full object-contain"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveImage(imgUrl);
                    }}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 cursor-pointer transition shrink-0 bg-[var(--input-bg)] p-1 ${
                      activeImage === imgUrl
                        ? "border-[var(--accent-blue)] scale-105 shadow-md"
                        : "border-[var(--card-border)] opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-1 rounded-full font-bold">
                  {product.category || "کالای دیجیتال"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    isAvailable
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {isAvailable ? "موجود در انبار" : "ناموجود"}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black mt-1 leading-snug text-[var(--text-primary)]">{productName}</h2>
              {(product as any).title_fa && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{(product as any).title_fa}</p>
              )}
            </div>

            <div className="flex gap-2 border-b border-[var(--card-border)] pb-3 overflow-x-auto scrollbar-none text-xs">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab("specs");
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === "specs"
                    ? "bg-[var(--accent-blue)] text-white shadow-md font-black"
                    : "bg-[var(--input-bg)] text-[var(--text-secondary)]"
                }`}
              >
                ⚙️ مشخصات فنی
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab("desc");
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === "desc"
                    ? "bg-[var(--accent-blue)] text-white shadow-md font-black"
                    : "bg-[var(--input-bg)] text-[var(--text-secondary)]"
                }`}
              >
                📝 توضیحات
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab("shipping");
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === "shipping"
                    ? "bg-[var(--accent-blue)] text-white shadow-md font-black"
                    : "bg-[var(--input-bg)] text-[var(--text-secondary)]"
                }`}
              >
                🚚 ارسال و گارانتی
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab("comparison");
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === "comparison"
                    ? "bg-[var(--accent-blue)] text-white shadow-md font-black"
                    : "bg-[var(--input-bg)] text-[var(--text-secondary)]"
                }`}
              >
                📊 مقایسه بازار
              </button>
            </div>

            <div className="min-h-[140px] text-xs">
              {activeTab === "specs" && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {specsEntries.length > 0 ? (
                    specsEntries.map(([key, val], idx) => (
                      <div key={idx} className="flex justify-between p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                        <span className="text-[var(--text-secondary)] font-bold">{key}:</span>
                        <span className="font-semibold text-[var(--text-primary)]">{String(val)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)]">مشخصات فنی ثبت نشده است.</p>
                  )}
                </div>
              )}

              {activeTab === "desc" && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line font-medium max-h-48 overflow-y-auto">
                  {product.description || "توضیحات تکمیلی برای این محصول ثبت نشده است."}
                </p>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
                  <p>✅ {product.warranty || "۱۸ ماه گارانتی شرکتی و سلامت فیزیکی"}</p>
                  <p>✅ ارسال سریع اکسپرس با بسته‌بندی ایمن ضدضربه</p>
                  <p>✅ ضمانت ۱۰۰٪ اصالت فیزیکی کالا</p>
                </div>
              )}

              {activeTab === "comparison" && (
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-[var(--accent-blue)]">قیمت ما در مقایسه با بازار:</p>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ تضمین کمترین قیمت بازار به همراه گارانتی اصالت طلایی
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت نهایی:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {currentPrice.toLocaleString("fa-IR")} تومان
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-2 bg-[var(--modal-bg)] rounded-xl px-3 py-2 border border-[var(--card-border)] font-bold text-xs">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-1 text-sm font-black cursor-pointer">-</button>
                  <span className="font-mono text-sm">{quantity}</span>
                  <button onClick={() => setQuantity((q) => q + 1)} className="px-1 text-sm font-black cursor-pointer">+</button>
                </div>

                <button
                  onClick={() => {
                    soundEngine.playAddToCart();
                    for (let i = 0; i < quantity; i++) {
                      onAddToCart({
                        id: product.id,
                        name: productName,
                        title: productName,
                        price: currentPrice,
                        image: activeImage || product.image || "",
                        stock: product.stock ?? 10,
                      });
                    }
                    onClose();
                  }}
                  disabled={!isAvailable}
                  className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 transition shadow-lg disabled:opacity-40"
                >
                  افزودن به سبد خرید ({quantity}) 🛒
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeBlogSection() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function loadBlogs() {
      try {
        const res = await fetch("/api/blogs");
        const data = await res.json();
        const items = data.data || data.posts || [];
        setPosts(items.filter((p: any) => p.isVisible !== false && p.isPublished !== false).slice(0, 3));
      } catch (e) {
        console.error("Error loading blogs:", e);
      }
    }
    loadBlogs();
  }, []);

  if (posts.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-[var(--text-secondary)] font-bold">
        هنوز مقاله‌ای در مجله منتشر نشده است.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {posts.map((post) => (
        <article
          key={post.id || post.title}
          className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between hover:border-[var(--accent-blue)] transition duration-300"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-bold">
              <span>📅 {post.createdAt || "امروز"}</span>
              <span className="text-[var(--accent-blue)] font-black">{post.category || "مقاله تخصصی"}</span>
            </div>
            <h4 className="font-black text-xs line-clamp-2 text-[var(--text-primary)] leading-snug">
              {post.title}
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-medium">
              {post.metaDescription || (post.content ? post.content.replace(/<[^>]*>?/gm, "").substring(0, 90) + "..." : "")}
            </p>
          </div>
          <Link
            href={`/blog/${post.id}`}
            className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-2 border-t border-[var(--card-border)]"
          >
            مطالعه کامل مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}
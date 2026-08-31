"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productService, Product, ProductVariant } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import ProductReviews from "@/components/ProductReviews";
import ProductExplodedView from "@/components/ProductExplodedView";
import ColorGamutSimulator from "@/components/ColorGamutSimulator";
import LiveMarketArbitrage from "@/components/LiveMarketArbitrage";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(() => productService.getProductSync(id));
  const [loading, setLoading] = useState(!product);
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "gamut" | "comparison" | "desc" | "reviews">("specs");
  const [isExplodedViewOpen, setIsExplodedViewOpen] = useState(false);

  useEffect(() => {
    productService.getById(id).then((data) => {
      if (data) {
        setProduct(data);
        userBehavior.trackProductView(data.id, data.category);
        const defaultImg = data.images?.[0] || data.image || "";
        setActiveImage(defaultImg);
        if (data.variants && data.variants.length > 0) setSelectedVariant(data.variants[0]);
      }
      setLoading(false);
    });

    const handleUpdate = () => {
      productService.getById(id).then((d) => d && setProduct(d));
    };
    window.addEventListener("products_updated", handleUpdate);
    return () => window.removeEventListener("products_updated", handleUpdate);
  }, [id]);

  if (loading && !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری مشخصات کالا...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4 font-sans select-none" dir="rtl">
        <h2 className="text-xl font-black">محصول مورد نظر یافت نشد!</h2>
        <Link href="/" className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs">← بازگشت به صفحه نخست</Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image || ""];
  const currentMainImg = activeImage || images[0] || "";
  const basePrice = Number(product.discountPrice || product.discount_price || product.price || 0);
  const variantDelta = Number(selectedVariant?.priceDelta || 0);
  const finalUnitPrice = Math.max(0, basePrice + variantDelta);
  const oldPrice = Number(product.originalPrice || product.price || 0) + variantDelta;
  const currentStock = product.stock !== undefined ? Number(product.stock) : 10;
  const isAvailable = (product as any).is_available !== false && product.isAvailable !== false && currentStock > 0;
  const specsEntries = product.specs ? Object.entries(product.specs) : [];

  const handleDirectBuy = () => {
    soundEngine.playAddToCart();
    addToCart({ id: product.id, title: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`, price: finalUnitPrice, image: currentMainImg, stock: currentStock, quantity });
    router.push("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans select-none text-[var(--text-primary)] space-y-8 pb-28 sm:pb-10" dir="rtl">
      
      {/* نوار آدرس و موقعیت هوشمند (Breadcrumb) */}
      <nav className="flex items-center gap-2 p-3 px-5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs text-[var(--text-secondary)] font-bold shadow-sm backdrop-blur-md">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition flex items-center gap-1.5">
          <span>🏠</span><span>صفحه اصلی</span>
        </Link>
        <span>/</span>
        <Link href="/#products" className="hover:text-[var(--accent-blue)] transition">
          {product.category || "تجهیزات و مانیتورها"}
        </Link>
        <span>/</span>
        <span className="text-[var(--accent-blue)] truncate max-w-xs">{product.title}</span>
      </nav>

      {/* معرفی و خرید کالا */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl">
        <div className="lg:col-span-5 space-y-4">
          <div className="w-full h-80 md:h-[430px] rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] overflow-hidden flex items-center justify-center p-6 relative group">
            <img src={currentMainImg} alt={product.title} className="w-full h-full object-contain group-hover:scale-105 transition duration-500" />
            <button onClick={() => { soundEngine.playExplodeShift(); setIsExplodedViewOpen(true); }} className="absolute bottom-4 left-4 px-4 py-2.5 rounded-2xl bg-black/75 hover:bg-blue-600 text-white font-black text-xs border border-white/20 backdrop-blur-md shadow-2xl transition flex items-center gap-2 cursor-pointer">
              <span>🧬</span><span>کالبدشکافی ۳D (Exploded View)</span>
            </button>
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((imgUrl, idx) => (
                <button key={idx} onClick={() => { soundEngine.playClick(); setActiveImage(imgUrl); }} className={`w-20 h-20 rounded-2xl border-2 cursor-pointer p-1 bg-[var(--input-bg)] transition ${currentMainImg === imgUrl ? "border-[var(--accent-blue)] scale-105" : "border-[var(--card-border)] opacity-60"}`}>
                  <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black text-xs">{product.category || "کالای دیجیتال"}</span>
              <span className={`text-xs font-bold ${isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>{isAvailable ? `موجود در انبار (${currentStock} عدد) ✓` : "ناموجود"}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] leading-snug">{product.title}</h1>
            {product.title_fa && <p className="text-xs text-[var(--text-secondary)] font-medium">{product.title_fa}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div onClick={() => { soundEngine.playExplodeShift(); setIsExplodedViewOpen(true); }} className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 hover:border-blue-500 transition cursor-pointer flex items-center gap-3">
                <span className="text-2xl">🧬</span>
                <div><h4 className="font-black text-xs">کالبدشکافی قطعات ۳D</h4><p className="text-[10px] text-[var(--text-secondary)]">مشاهده تفکیک لایه‌ها</p></div>
              </div>
              <div onClick={() => setActiveTab("gamut")} className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 hover:border-indigo-500 transition cursor-pointer flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <div><h4 className="font-black text-xs">تست گاموت رنگی</h4><p className="text-[10px] text-[var(--text-secondary)]">سنجش DCI-P3 و sRGB</p></div>
              </div>
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[var(--text-secondary)] block">انتخاب مدل و رنگ:</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button key={v.id} onClick={() => { soundEngine.playClick(); setSelectedVariant(v); }} className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${selectedVariant?.id === v.id ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-sm" : "border-[var(--card-border)] bg-[var(--input-bg)]"}`}>
                      <span style={{ backgroundColor: v.colorHex || "#333" }} className="w-3.5 h-3.5 rounded-full border border-black/20" />
                      <span>{v.name}</span>
                      {v.modelType && <span className="text-[10px] opacity-75 font-mono">[{v.modelType}]</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت نهایی فاکتور:</span>
              <div className="text-left">
                {oldPrice > finalUnitPrice && <span className="block text-xs line-through text-[var(--text-secondary)] font-mono">{oldPrice.toLocaleString("fa-IR")}</span>}
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{finalUnitPrice.toLocaleString("fa-IR")} تومان</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button disabled={!isAvailable} onClick={() => { soundEngine.playAddToCart(); addToCart({ id: product.id, title: product.title, price: finalUnitPrice, image: currentMainImg, stock: currentStock, quantity }); }} className="w-full sm:flex-1 py-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--accent-blue)] text-[var(--text-primary)] font-black text-xs cursor-pointer hover:bg-[var(--accent-blue)] hover:text-white transition">🛒 افزودن به سبد</button>
              <button disabled={!isAvailable} onClick={handleDirectBuy} className="w-full sm:flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-xl hover:opacity-90 transition">⚡ خرید آنی و تسویه</button>
            </div>
          </div>
        </div>
      </div>

      {/* ۵ تب تعاملی پیشرفته کالا */}
      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--card-border)] text-xs scrollbar-none">
          {[
            { id: "specs", label: "⚙️ مشخصات فنی دقیق" },
            { id: "gamut", label: "🎨 شبیه‌ساز گاموت رنگی" },
            { id: "comparison", label: "⚖️ پایش قیمت با بازار" },
            { id: "desc", label: "📝 بررسی تخصصی" },
            { id: "reviews", label: "⭐ نظرات کاربران" }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-3 rounded-2xl font-black transition cursor-pointer whitespace-nowrap ${activeTab === tab.id ? "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/25" : "bg-[var(--modal-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "specs" && (
          <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {specsEntries.map(([k, v], idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex justify-between">
                  <span className="text-[var(--text-secondary)] font-bold">{k}:</span><span className="font-semibold text-[var(--text-primary)]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "gamut" && <ColorGamutSimulator productTitle={product.title} />}
        {activeTab === "comparison" && <LiveMarketArbitrage productTitle={product.title} ourPrice={finalUnitPrice} marketBenchmarks={product.market_comparison} />}
        {activeTab === "desc" && <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs md:text-sm leading-loose whitespace-pre-line font-medium text-justify">{product.description}</div>}
        {activeTab === "reviews" && <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl"><ProductReviews productId={product.id} /></div>}
      </div>

      <ProductExplodedView productId={product.id} productTitle={product.title} category={product.category} isOpen={isExplodedViewOpen} onClose={() => setIsExplodedViewOpen(false)} />
    </div>
  );
}

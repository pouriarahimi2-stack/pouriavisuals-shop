"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productService, Product, ProductVariant, FLAGSHIP_7_PRODUCTS } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import ProductReviews from "@/components/ProductReviews";
import ProductExplodedView from "@/components/ProductExplodedView";
import ColorGamutSimulator from "@/components/ColorGamutSimulator";
import LiveMarketArbitrage from "@/components/LiveMarketArbitrage";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id || "prod-studio-display-5k";
  const router = useRouter();
  const { addToCart } = useCart();
  const tabsContentRef = useRef<HTMLDivElement>(null);

  const initialProduct = productService.getProductSync(id) || FLAGSHIP_7_PRODUCTS.find((p) => p.id === id) || FLAGSHIP_7_PRODUCTS[3];
  
  const [product, setProduct] = useState<Product>(initialProduct);
  const [activeImage, setActiveImage] = useState<string>(() => {
    return initialProduct?.images?.[0] || initialProduct?.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800";
  });
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(() => {
    return initialProduct?.variants?.[0] || null;
  });
  const [activeTab, setActiveTab] = useState<"specs" | "gamut" | "comparison" | "desc" | "reviews">("specs");
  const [isExplodedViewOpen, setIsExplodedViewOpen] = useState(false);

  useEffect(() => {
    productService.getById(id).then((data) => {
      if (data) {
        setProduct(data);
        userBehavior.trackProductView(data.id, data.category);
        const defaultImg = data.images?.[0] || data.image || "";
        setActiveImage((prev) => prev || defaultImg);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant((prev) => prev || data.variants![0]);
        }
      }
    });

    const handleUpdate = () => {
      productService.getById(id).then((d) => d && setProduct(d));
    };
    window.addEventListener("products_updated", handleUpdate);
    return () => window.removeEventListener("products_updated", handleUpdate);
  }, [id]);

  const images = product.images && product.images.length > 0 ? product.images : [product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"];
  const currentMainImg = activeImage || images[0] || "";
  const basePrice = Number(product.discountPrice || product.discount_price || product.price || 0);
  const variantDelta = Number(selectedVariant?.priceDelta || 0);
  const finalUnitPrice = Math.max(0, basePrice + variantDelta);
  const oldPrice = Number(product.originalPrice || product.price || 0) + variantDelta;
  const currentStock = product.stock !== undefined ? Number(product.stock) : 10;
  const isAvailable = (product as any).is_available !== false && product.isAvailable !== false && currentStock > 0;
  const specsEntries = product.specs ? Object.entries(product.specs) : [];

  const handleTabChange = (tabId: "specs" | "gamut" | "comparison" | "desc" | "reviews") => {
    soundEngine.playClick();
    setActiveTab(tabId);
    if (window.innerWidth < 768 && tabsContentRef.current) {
      tabsContentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAddToCartDirect = () => {
    soundEngine.playAddToCart();
    addToCart({
      id: product.id,
      title: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
      name: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
      price: finalUnitPrice,
      image: currentMainImg,
      stock: currentStock,
      category: product.category || "تکنولوژی",
      quantity: 1,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans select-none text-[var(--text-primary)] space-y-6 pb-28 sm:pb-10" dir="rtl">
      
      {/* نوار مسیر ناوبری مینیمال */}
      <nav className="flex items-center gap-2 p-3 px-5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs text-[var(--text-secondary)] font-bold shadow-sm backdrop-blur-md">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition">صفحه اصلی</Link>
        <span>/</span>
        <Link href="/#products" className="hover:text-[var(--accent-blue)] transition">{product.category || "محصولات"}</Link>
        <span>/</span>
        <span className="text-[var(--accent-blue)] truncate max-w-[140px] sm:max-w-xs">{product.title}</span>
      </nav>

      {/* کارت اصلی کالا */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl">
        <div className="lg:col-span-5 space-y-4">
          <div className="w-full h-72 sm:h-96 md:h-[420px] rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] overflow-hidden flex items-center justify-center p-6 relative group">
            <img src={currentMainImg} alt={product.title} className="w-full h-full object-contain group-hover:scale-105 transition duration-500" />
            <button
              onClick={() => { soundEngine.playExplodeShift(); setIsExplodedViewOpen(true); }}
              className="absolute bottom-3 left-3 px-3.5 py-2 rounded-2xl bg-black/75 hover:bg-blue-600 text-white font-black text-[11px] border border-white/20 backdrop-blur-md shadow-2xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🧬</span><span>کالبدشکافی ۳D</span>
            </button>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => { soundEngine.playClick(); setActiveImage(imgUrl); }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 cursor-pointer p-1 bg-[var(--input-bg)] transition shrink-0 ${currentMainImg === imgUrl ? "border-[var(--accent-blue)] scale-105" : "border-[var(--card-border)] opacity-60"}`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black text-[11px]">
                {product.brand || "تکنولوژی"}
              </span>
              <span className={`text-xs font-bold ${isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                {isAvailable ? `موجود در انبار (${currentStock} عدد) ✓` : "ناموجود"}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] leading-snug">{product.title}</h1>

            {/* متغیرها و رنگ‌ها */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-[var(--text-secondary)] block">
                  رنگ و مدل: <strong className="text-[var(--text-primary)]">{selectedVariant?.name}</strong>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => { soundEngine.playClick(); setSelectedVariant(v); if (images[idx]) setActiveImage(images[idx]); }}
                      className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                        selectedVariant?.id === v.id
                          ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-md"
                          : "border-[var(--card-border)] bg-[var(--input-bg)]"
                      }`}
                    >
                      <span style={{ backgroundColor: v.colorHex || "#333" }} className="w-3.5 h-3.5 rounded-full border border-black/30" />
                      <span>{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت نهایی:</span>
              <div className="text-left">
                {oldPrice > finalUnitPrice && (
                  <span className="block text-xs line-through text-[var(--text-secondary)] font-mono" suppressHydrationWarning>
                    {formatPrice(oldPrice)}
                  </span>
                )}
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono" suppressHydrationWarning>
                  {formatPrice(finalUnitPrice)} تومان
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                disabled={!isAvailable}
                onClick={handleAddToCartDirect}
                className="py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-xl hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <span>🛒</span><span>افزودن به سبد خرید</span>
              </button>
              <button
                disabled={!isAvailable}
                onClick={() => { handleAddToCartDirect(); router.push("/checkout"); }}
                className="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-xl active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <span>⚡</span><span>خرید فوری</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* کنترلر مدرن اپل در موبایل و دسکتاپ (iOS Segmented Control) */}
      <div ref={tabsContentRef} className="space-y-6 pt-2">
        <div className="p-1.5 rounded-2xl sm:rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 text-xs">
          {[
            { id: "specs", label: "⚙️ مشخصات فنی" },
            { id: "gamut", label: "🎨 گاموت رنگی" },
            { id: "comparison", label: "⚖️ پایش قیمت بازار" },
            { id: "desc", label: "📝 نقد و بررسی" },
            { id: "reviews", label: "⭐ نظرات کاربران" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`py-2.5 px-4 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs transition-all cursor-pointer text-center ${
                activeTab === tab.id
                  ? "bg-[var(--accent-blue)] text-white shadow-md scale-[1.02]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "specs" && (
          <div className="p-5 sm:p-8 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {specsEntries.map(([k, v], idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-bold">{k}:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "gamut" && <ColorGamutSimulator productTitle={product.title} />}
        {activeTab === "comparison" && <LiveMarketArbitrage productTitle={product.title} ourPrice={finalUnitPrice} marketBenchmarks={product.market_comparison} />}
        
        {activeTab === "desc" && (
          <div className="p-5 sm:p-8 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs sm:text-sm leading-loose text-[var(--text-secondary)] text-justify">
            <p className="whitespace-pre-line font-medium">{product.description}</p>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="p-5 sm:p-8 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
            <ProductReviews productId={product.id} />
          </div>
        )}
      </div>

      <ProductExplodedView
        productId={product.id}
        productTitle={product.title}
        category={product.category}
        isOpen={isExplodedViewOpen}
        onClose={() => setIsExplodedViewOpen(false)}
      />
    </div>
  );
}

// File Path: app/products/[id]/page.tsx
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
  const [activeTab, setActiveTab] = useState<"specs" | "gamut" | "comparison" | "desc" | "shipping" | "reviews">("specs");

  const [isExplodedViewOpen, setIsExplodedViewOpen] = useState(false);

  useEffect(() => {
    async function loadFullProduct() {
      try {
        const data = await productService.getById(id);
        if (data) {
          setProduct(data);
          userBehavior.trackProductView(data.id, data.category);

          const defaultImg = data.images && data.images.length > 0 ? data.images[0] : data.image || "";
          if (!activeImage) setActiveImage(defaultImg);
          if (data.variants && data.variants.length > 0 && !selectedVariant) {
            setSelectedVariant(data.variants[0]);
          }
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFullProduct();
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
        <div className="text-5xl">📦</div>
        <h2 className="text-xl font-black text-[var(--text-primary)]">محصول مورد نظر یافت نشد!</h2>
        <Link
          href="/products"
          className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs"
        >
          ← بازگشت به کاتالوگ
        </Link>
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
  const isAvailable =
    product.is_available !== false &&
    product.isAvailable !== false &&
    currentStock > 0;

  const specsEntries = product.specs ? Object.entries(product.specs) : [];

  const handleDirectBuy = () => {
    soundEngine.playAddToCart();
    userBehavior.trackProductView(product.id, product.category);
    addToCart({
      id: product.id,
      title: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
      name: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
      price: finalUnitPrice,
      image: currentMainImg,
      stock: selectedVariant?.stock || currentStock,
      quantity,
    });
    router.push("/checkout");
  };

  const handleAddCart = () => {
    soundEngine.playAddToCart();
    userBehavior.trackProductView(product.id, product.category);
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        title: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
        name: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
        price: finalUnitPrice,
        image: currentMainImg,
        stock: selectedVariant?.stock || currentStock,
        quantity: 1,
      });
    }
  };

  const handleTabChange = (tabId: typeof activeTab) => {
    soundEngine.playClick();
    setActiveTab(tabId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans select-none text-[var(--text-primary)] space-y-10 pb-28 sm:pb-10" dir="rtl">
      
      {/* مسیر ناوبری */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-bold">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition">صفحه نخست</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{product.title}</span>
      </div>

      {/* معرفی و خرید کالا */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl">
        
        {/* گالری و دکمه کالبدشکافی */}
        <div className="lg:col-span-5 space-y-4">
          <div className="w-full h-80 md:h-[430px] rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] overflow-hidden flex items-center justify-center p-6 relative group">
            <img
              src={currentMainImg}
              alt={product.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
            
            {product.badge && (
              <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-rose-500 text-white font-black text-xs shadow-lg">
                {product.badge}
              </span>
            )}

            <button
              onClick={() => {
                soundEngine.playExplodeShift();
                setIsExplodedViewOpen(true);
              }}
              className="absolute bottom-4 left-4 px-4 py-2.5 rounded-2xl bg-black/75 hover:bg-blue-600 text-white font-black text-xs border border-white/20 backdrop-blur-md shadow-2xl transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>🧬</span>
              <span>کالبدشکافی ۳D (Exploded View)</span>
            </button>
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveImage(imgUrl);
                  }}
                  className={`w-20 h-20 rounded-2xl border-2 cursor-pointer p-1 bg-[var(--input-bg)] transition-all ${
                    currentMainImg === imgUrl
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

        {/* مشخصات اصلی، تنوع و خرید */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black text-xs">
                {product.category || "کالای دیجیتال"}
              </span>
              <span className={`text-xs font-bold ${isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                {isAvailable ? `موجود در انبار (${currentStock} عدد) ✓` : "ناموجود"}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] leading-snug">
              {product.title}
            </h1>

            {/* بنرهای تعاملی معرفی کالبدشکافی و گاموت رنگی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => {
                  soundEngine.playExplodeShift();
                  setIsExplodedViewOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 hover:border-blue-500 transition cursor-pointer flex items-center gap-3 group shadow-sm"
              >
                <span className="text-2xl group-hover:scale-110 transition">🧬</span>
                <div>
                  <h4 className="font-black text-xs text-[var(--text-primary)]">کالبدشکافی قطعات ۳D</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">مشاهده تفکیک‌شده لایه‌های داخلی پنل</p>
                </div>
              </div>

              <div
                onClick={() => handleTabChange("gamut")}
                className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 hover:border-indigo-500 transition cursor-pointer flex items-center gap-3 group shadow-sm"
              >
                <span className="text-2xl group-hover:scale-110 transition">🎨</span>
                <div>
                  <h4 className="font-black text-xs text-[var(--text-primary)]">تست گاموت رنگی</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">سنجش پوشش DCI-P3 و sRGB</p>
                </div>
              </div>
            </div>

            {product.highlights && product.highlights.length > 0 && (
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <span className="text-xs font-black text-[var(--accent-blue)] block">ویژگی‌های برجسته مهندسی:</span>
                <ul className="space-y-1 text-xs text-[var(--text-secondary)] font-medium">
                  {product.highlights.map((hl, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-emerald-500">✓</span>
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[var(--text-secondary)] block">
                  انتخاب رنگ و مدل: <strong className="text-[var(--text-primary)]">{selectedVariant?.name}</strong>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedVariant(v);
                      }}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                        selectedVariant?.id === v.id
                          ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-sm"
                          : "border-[var(--card-border)] bg-[var(--input-bg)]"
                      }`}
                    >
                      <span
                        style={{ backgroundColor: v.colorHex || "#333" }}
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                      />
                      <span>{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* قیمت نهایی و دکمه‌های خرید */}
          <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت نهایی فاکتور:</span>
              <div className="text-left">
                {oldPrice > finalUnitPrice && (
                  <span className="block text-xs line-through text-[var(--text-secondary)] font-mono">
                    {oldPrice.toLocaleString("fa-IR")}
                  </span>
                )}
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {finalUnitPrice.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="flex items-center gap-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-2xl px-3 py-2.5 font-bold text-xs w-full sm:w-auto justify-between sm:justify-start">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setQuantity((q) => Math.max(1, q - 1));
                  }}
                  className="px-2 text-sm font-black cursor-pointer hover:text-[var(--accent-blue)]"
                >
                  -
                </button>
                <span className="font-mono text-sm px-2">{quantity}</span>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setQuantity((q) => Math.min(currentStock, q + 1));
                  }}
                  className="px-2 text-sm font-black cursor-pointer hover:text-[var(--accent-blue)]"
                >
                  +
                </button>
              </div>

              <button
                disabled={!isAvailable}
                onClick={handleAddCart}
                className="w-full sm:flex-1 py-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--accent-blue)] text-[var(--text-primary)] font-black text-xs cursor-pointer hover:bg-[var(--accent-blue)] hover:text-white transition disabled:opacity-40 shadow-sm"
              >
                🛒 افزودن به سبد خرید
              </button>

              <button
                disabled={!isAvailable}
                onClick={handleDirectBuy}
                className="w-full sm:flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-xl shadow-blue-500/25 hover:opacity-90 transition disabled:opacity-40"
              >
                ⚡ خرید آنی و تسویه فاکتور
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* تب‌های مشخصات، شبیه‌ساز گاموت و نظرات */}
      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--card-border)] text-xs scrollbar-none">
          {[
            { id: "specs", label: "⚙️ مشخصات فنی دقیق", icon: "⚙️" },
            { id: "gamut", label: "🎨 شبیه‌ساز گاموت رنگی", icon: "🎨" },
            { id: "comparison", label: "⚖️ پایش قیمت با بازار", icon: "⚖️" },
            { id: "desc", label: "📝 بررسی تخصصی", icon: "📝" },
            { id: "shipping", label: "🚚 شرایط ارسال و گارانتی", icon: "🚚" },
            { id: "reviews", label: "⭐ نظرات کاربران", icon: "⭐" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-5 py-3 rounded-2xl font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/25"
                  : "bg-[var(--modal-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "specs" && (
          <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {specsEntries.map(([k, v], idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex justify-between">
                  <span className="text-[var(--text-secondary)] font-bold">{k}:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "gamut" && (
          <ColorGamutSimulator productTitle={product.title} />
        )}

        {activeTab === "comparison" && (
          <LiveMarketArbitrage
            productTitle={product.title}
            ourPrice={finalUnitPrice}
            marketBenchmarks={product.market_comparison}
          />
        )}

        {activeTab === "desc" && (
          <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-xs md:text-sm text-[var(--text-secondary)] leading-loose space-y-4 font-medium whitespace-pre-line">
            {product.description}
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3 text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
            <p>📦 {product.warranty || "۱۸ ماه گارانتی شرکتی و سلامت فیزیکی"}</p>
            <p>🚀 ارسال پیشتاز با بسته‌بندی ضدضربه استودیویی و بیمه کامل مرسوله</p>
            <p>🛡️ ۷ روز مهلت تست و ضمانت بازگشت بی‌قیدوشرط وجه</p>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
            <ProductReviews productId={product.id} />
          </div>
        )}
      </div>

      {/* نوار چسبان خرید سریع در موبایل */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--modal-bg)]/95 backdrop-blur-2xl border-t border-[var(--card-border)] p-3 px-4 flex items-center justify-between gap-3 shadow-[0_-10px_25px_rgba(0,0,0,0.2)]">
        <div>
          <span className="text-[10px] text-[var(--text-secondary)] block font-bold">مبلغ نهایی:</span>
          <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
            {finalUnitPrice.toLocaleString("fa-IR")} تومان
          </span>
        </div>
        <button
          disabled={!isAvailable}
          onClick={handleDirectBuy}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg active:scale-95 transition disabled:opacity-40 cursor-pointer"
        >
          ⚡ خرید سریع
        </button>
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
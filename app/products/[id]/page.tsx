"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productService, Product, ProductVariant } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import ProductReviews from "@/components/ProductReviews";

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
  const [activeTab, setActiveTab] = useState<"specs" | "comparison" | "desc" | "shipping" | "reviews">("specs");

  useEffect(() => {
    async function loadFullProduct() {
      try {
        const data = await productService.getById(id);
        if (data) {
          setProduct(data);
          const defaultImg = data.images && data.images.length > 0 ? data.images[0] : (data.image || "");
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
        <Link href="/products" className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs">← بازگشت به کاتالوگ</Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image || ""];
  const currentMainImg = activeImage || images[0] || "";

  const basePrice = Number(product.discountPrice || product.discount_price || product.price || 0);
  const variantDelta = Number(selectedVariant?.priceDelta || 0);
  const finalUnitPrice = Math.max(0, basePrice + variantDelta);
  const oldPrice = Number(product.originalPrice || product.price || 0) + variantDelta;

  const isAvailable = product.is_available !== false && product.isAvailable !== false && (product.stock === undefined || Number(product.stock) > 0);
  const specsEntries = product.specs ? Object.entries(product.specs) : [];

  const handleDirectBuy = () => {
    addToCart({
      id: product.id,
      title: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
      name: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
      price: finalUnitPrice,
      image: currentMainImg,
      stock: selectedVariant?.stock || product.stock || 10,
      quantity,
    });
    router.push("/checkout");
  };

  const handleAddCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        title: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
        name: `${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
        price: finalUnitPrice,
        image: currentMainImg,
        stock: selectedVariant?.stock || product.stock || 10,
        quantity: 1,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-bold">
        <Link href="/">صفحه نخست</Link><span>/</span><Link href="/products">کاتالوگ</Link><span>/</span><span className="text-[var(--text-primary)] truncate max-w-xs">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl">
        <div className="lg:col-span-5 space-y-4">
          <div className="w-full h-80 md:h-[430px] rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] overflow-hidden flex items-center justify-center p-6 relative">
            <img src={currentMainImg} alt={product.title} className="w-full h-full object-contain" />
            {product.badge && <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-rose-500 text-white font-black text-xs">{product.badge}</span>}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((imgUrl, idx) => (
                <button key={idx} onClick={() => setActiveImage(imgUrl)} className={`w-20 h-20 rounded-2xl border-2 cursor-pointer p-1 bg-[var(--input-bg)] ${currentMainImg === imgUrl ? "border-[var(--accent-blue)]" : "border-[var(--card-border)] opacity-60"}`}>
                  <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">{product.title}</h1>
            {product.highlights && product.highlights.length > 0 && (
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <span className="text-xs font-black text-[var(--accent-blue)] block">ویژگی‌های برجسته:</span>
                <ul className="space-y-1 text-xs text-[var(--text-secondary)] font-medium">
                  {product.highlights.map((hl, i) => <li key={i}>✓ {hl}</li>)}
                </ul>
              </div>
            )}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[var(--text-secondary)] block">انتخاب رنگ: <strong className="text-[var(--text-primary)]">{selectedVariant?.name}</strong></span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button key={v.id} onClick={() => setSelectedVariant(v)} className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer ${selectedVariant?.id === v.id ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10" : "border-[var(--card-border)] bg-[var(--input-bg)]"}`}>
                      <span style={{ backgroundColor: v.colorHex || "#333" }} className="w-3.5 h-3.5 rounded-full border border-black/20" />
                      <span>{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت نهایی:</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{finalUnitPrice.toLocaleString("fa-IR")} تومان</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button disabled={!isAvailable} onClick={handleAddCart} className="w-full sm:flex-1 py-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)] text-[var(--text-primary)] font-black text-xs cursor-pointer">🛒 افزودن به سبد خرید</button>
              <button disabled={!isAvailable} onClick={handleDirectBuy} className="w-full sm:flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer shadow-lg">⚡ خرید آنی</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
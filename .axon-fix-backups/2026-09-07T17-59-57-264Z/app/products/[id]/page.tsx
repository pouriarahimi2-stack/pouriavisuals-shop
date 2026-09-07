"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import LiveMarketArbitrage from "@/components/LiveMarketArbitrage";
import ProductReviews from "@/components/ProductReviews";
import ColorGamutSimulator from "@/components/ColorGamutSimulator";
import ProductExplodedView from "@/components/ProductExplodedView";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");
  const [isExplodedOpen, setIsExplodedOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const found = await productService.getById(id);
        if (found) {
          setProduct(found);
          const firstImg = found.images?.[0] || found.image || "";
          setActiveImage(firstImg);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans text-xs font-bold text-[var(--text-secondary)]">
        در حال دریافت مشخصات کالا...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans space-y-4" dir="rtl">
        <h2 className="text-xl font-black">کالای مورد نظر یافت نشد.</h2>
        <Link href="/" className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  const allImages = product.images && product.images.length > 0 ? product.images : [product.image || ""];
  const currentPrice = Number(product.discountPrice || product.price || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* بخش معرفی و خرید کالا */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-6 sm:p-10 shadow-2xl">
        <div className="space-y-4">
          <div className="w-full h-80 sm:h-96 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] p-4 flex items-center justify-center overflow-hidden relative group">
            <img src={activeImage || allImages[0]} alt={product.title} className="w-full h-full object-contain group-hover:scale-105 transition duration-500" />
            
            <button
              type="button"
              onClick={() => {
                soundEngine.playExplodeShift();
                setIsExplodedOpen(true);
              }}
              className="absolute bottom-4 right-4 px-4 py-2 rounded-2xl bg-black/75 hover:bg-blue-600 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition flex items-center gap-1.5 shadow-xl cursor-pointer"
            >
              <span>🧬</span>
              <span>کالبدشکافی ۳D لایه‌ها</span>
            </button>
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveImage(img);
                  }}
                  className={"w-16 h-16 rounded-2xl border p-1 bg-[var(--input-bg)] transition cursor-pointer shrink-0 " + (activeImage === img ? "border-[var(--accent-blue)] ring-2 ring-blue-500/30" : "border-[var(--card-border)]")}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-xs font-black">
                {product.category || "تجهیزات استودیویی"}
              </span>
              <span className="font-mono text-xs text-[var(--text-secondary)] font-bold">
                {product.brand || "Apple"}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black leading-snug">{product.title}</h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
              {product.description || "ارائه شده با ضمانت اصالت فیزیکی و پشتیبانی تخصصی استودیو."}
            </p>
          </div>

          <div className="space-y-4 p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[var(--text-secondary)]">قیمت رسمی فروشگاه:</span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatPrice(currentPrice)} تومان
              </span>
            </div>

            <button
              onClick={() => {
                soundEngine.playAddToCart();
                addToCart({
                  id: product.id,
                  title: product.title,
                  price: currentPrice,
                  image: activeImage || allImages[0],
                  stock: product.stock ?? 10,
                  category: product.category,
                });
              }}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>🛒</span>
              <span>افزودن به سبد خرید</span>
            </button>
          </div>
        </div>
      </div>

      {/* ۱. پایش زنده قیمت بازار */}
      <section className="space-y-4">
        <LiveMarketArbitrage
          productTitle={product.title}
          ourPrice={currentPrice}
          marketBenchmarks={product.market_comparison || []}
        />
      </section>

      {/* ۲. شبیه‌ساز ۷ گاموت رنگی */}
      <section className="space-y-4">
        <ColorGamutSimulator productTitle={product.title} />
      </section>

      {/* ۳. نظرات و امتیازدهی خریداران */}
      <section className="space-y-4">
        <ProductReviews productId={product.id} />
      </section>

      {/* مدال تعاملی کالبدشکافی ۳D */}
      <ProductExplodedView
        productId={product.id}
        productTitle={product.title}
        category={product.category}
        isOpen={isExplodedOpen}
        onClose={() => setIsExplodedOpen(false)}
      />
    </div>
  );
}

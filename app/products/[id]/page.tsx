"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import ProductReviews from "@/components/ProductReviews";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "shipping" | "reviews">("desc");

  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await productService.getById(id);
        if (data) {
          setProduct(data);
          const defaultImg = data.images && data.images.length > 0 ? data.images[0] : (data.image || "");
          setActiveImage(defaultImg);
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری اطلاعات کالا...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4 font-sans select-none" dir="rtl">
        <div className="text-5xl">📦</div>
        <h2 className="text-xl font-black text-[var(--text-primary)]">محصول مورد نظر یافت نشد!</h2>
        <p className="text-xs text-[var(--text-secondary)]">ممکن است این کالا حذف شده باشد یا موجودی آن به پایان رسیده باشد.</p>
        <Link
          href="/#products"
          className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-lg"
        >
          ← بازگشت به کاتالوگ کالاها
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image || ""];
  const isAvailable = product.is_available !== false && (product.stock === undefined || product.stock > 0);
  const specsEntries = product.specs ? Object.entries(product.specs) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      
      {/* مسیر ناوبری (Breadcrumb) */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-bold">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition">صفحه اصلی</Link>
        <span>/</span>
        <Link href="/#products" className="hover:text-[var(--accent-blue)] transition">محصولات</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{product.name}</span>
      </div>

      {/* بخش معرفی اصلی و گالری تصویر */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl">
        
        {/* گالری تصاویر */}
        <div className="space-y-4">
          <div className="w-full h-80 md:h-[420px] rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] overflow-hidden flex items-center justify-center p-6 relative">
            <img
              src={activeImage || images[0] || ""}
              alt={product.name}
              className="w-full h-full object-contain transition-all duration-300"
            />
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <span className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-black">
                  ناموجود در انبار
                </span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 cursor-pointer transition shrink-0 bg-[var(--input-bg)] p-1 ${
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

        {/* مشخصات و خرید */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-1 rounded-full font-bold">
                {product.category || product.category_id || "کالای دیجیتال"}
              </span>
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                  isAvailable
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {isAvailable ? "موجود در انبار" : "ناموجود"}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black leading-tight text-[var(--text-primary)]">
              {product.name}
            </h1>

            {product.title_fa && (
              <p className="text-xs text-[var(--text-secondary)] font-medium">{product.title_fa}</p>
            )}

            <p className="text-xs leading-relaxed text-[var(--text-secondary)] font-medium line-clamp-3">
              {product.description || "توضیحات تکمیلی برای این محصول ثبت نشده است."}
            </p>
          </div>

          {/* باکس قیمت و دکمه افزودن */}
          <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت واحد کالا:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[var(--accent-blue)]">
                  {(product.price || 0).toLocaleString("fa-IR")} تومان
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-xs line-through text-slate-400 font-mono">
                    {product.original_price.toLocaleString("fa-IR")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-3 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-2xl px-4 py-3 font-bold text-xs">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="hover:text-[var(--accent-blue)] cursor-pointer px-1 text-sm font-black"
                >
                  -
                </button>
                <span className="font-mono text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="hover:text-[var(--accent-blue)] cursor-pointer px-1 text-sm font-black"
                >
                  +
                </button>
              </div>

              <button
                disabled={!isAvailable}
                onClick={() => {
                  for (let i = 0; i < quantity; i++) {
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: activeImage || images[0] || "",
                      stock: product.stock ?? 10,
                    });
                  }
                }}
                className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <span>🛒 افزودن به سبد خرید ({quantity} عدد)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* تب‌های تکمیلی: مشخصات، توضیحات و نظرات */}
      <div className="p-6 md:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex gap-2 border-b border-[var(--card-border)] pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("desc")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "desc"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            📝 توضیحات جامع
          </button>
          <button
            onClick={() => setActiveTab("specs")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "specs"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            ⚙️ مشخصات فنی ({specsEntries.length})
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "shipping"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            🚚 شرایط ارسال و گارانتی
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "reviews"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            💬 دیدگاه‌های کاربران
          </button>
        </div>

        <div className="min-h-[160px] pt-2">
          {activeTab === "desc" && (
            <div className="text-sm leading-loose text-[var(--text-secondary)] font-medium whitespace-pre-line">
              {product.description || "توضیحاتی برای این کالا ثبت نشده است."}
            </div>
          )}

          {activeTab === "specs" && (
            <div className="space-y-2">
              {specsEntries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {specsEntries.map(([key, val], idx) => (
                    <div
                      key={idx}
                      className="flex justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
                    >
                      <span className="text-[var(--text-secondary)] font-bold">{key}:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] font-bold">مشخصات فنی ثبت نشده است.</p>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-3 text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
              <p>🛡️ {product.warranty || "گارانتی اصالت، سلامت فیزیکی و ۷ روز ضمانت بازگشت کالا"}</p>
              <p>📦 ارسال سراسری سریع از طریق پست پیشتاز با بسته‌بندی ایمن</p>
              <p>⚡ تحویل اکسپرس برای مشتریان شهر تهران در سریع‌ترین زمان ممکن</p>
            </div>
          )}

          {activeTab === "reviews" && (
            <ProductReviews productId={product.id} />
          )}
        </div>
      </div>
    </div>
  );
}
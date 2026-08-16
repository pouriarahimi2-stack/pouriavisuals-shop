"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import ProductReviews from "@/components/ProductReviews";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let data: Product | null = null;
        if (typeof productService.getById === "function") {
          data = await productService.getById(resolvedParams.id);
        }

        if (!data) {
          const all = (await productService.getAll()) || [];
          data =
            all.find(
              (p: any) =>
                p.id === resolvedParams.id ||
                String(p.id) === String(resolvedParams.id)
            ) || null;
        }

        if (data) {
          setProduct(data);
          const firstImg =
            data.images && data.images.length > 0
              ? data.images[0]
              : data.image || "";
          setSelectedImage(firstImg);
          if (data.colors && data.colors.length > 0) {
            setSelectedColor(data.colors[0].name);
          }
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] text-[var(--text-primary)] select-none">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
        <p className="text-xs text-[var(--text-secondary)] font-bold">
          در حال بارگذاری اطلاعات کالا...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 text-center px-4 bg-[var(--bg-primary)] text-[var(--text-primary)] select-none">
        <div className="p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] max-w-md space-y-4 shadow-xl">
          <span className="text-4xl block">🔍</span>
          <h2 className="text-base font-black">محصول مورد نظر یافت نشد</h2>
          <p className="text-[var(--text-secondary)] text-xs font-medium leading-relaxed">
            ممکن است کالا حذف شده باشد یا شناسه وارد شده نادرست باشد.
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md cursor-pointer"
          >
            مشاهده همه محصولات
          </Link>
        </div>
      </div>
    );
  }

  const imagesList =
    product.images && product.images.length > 0
      ? product.images
      : [selectedImage].filter(Boolean);

  const formattedPrice = Number(product.price).toLocaleString("fa-IR");
  const originalPrice = product.original_price || product.originalPrice;
  const formattedOriginalPrice = originalPrice
    ? Number(originalPrice).toLocaleString("fa-IR")
    : null;
  const discount = product.discount_percent || product.discountPercent || 0;
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: product.name,
      price: product.price,
      discountPrice: originalPrice ? product.price : undefined,
      image: selectedImage || (product.images?.[0] || product.image || ""),
      selectedColor: selectedColor || undefined,
      quantity: quantity,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] select-none transition-colors duration-300">
      
      {/* نوار راهنما (Breadcrumb) */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-8 font-medium">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition">
          صفحه اصلی
        </Link>
        <span>/</span>
        <Link
          href="/products"
          className="hover:text-[var(--accent-blue)] transition"
        >
          {product.category_id || product.category || "کالای دیجیتال"}
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-extrabold truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* بخش اصلی گالری و اطلاعات خرید */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* گالری تصاویر محصول */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 items-center">
          {imagesList.length > 1 && (
            <div className="flex md:flex-col gap-3 overflow-x-auto p-1 max-h-[480px]">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 bg-[var(--input-bg)] transition cursor-pointer flex-shrink-0 ${
                    selectedImage === img
                      ? "border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/20 scale-105"
                      : "border-[var(--card-border)] opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-contain p-1.5"
                  />
                </button>
              ))}
            </div>
          )}

          {/* فریم تصویر اصلی */}
          <div className="relative w-full aspect-square max-h-[480px] rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex items-center justify-center p-8 overflow-hidden">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-6 transition-all duration-500 hover:scale-105"
              />
            ) : (
              <div className="text-[var(--text-secondary)] text-xs font-bold">
                بدون تصویر
              </div>
            )}
          </div>
        </div>

        {/* مشخصات و دکمه افزودن به سبد خرید */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--accent-blue)]">
              {product.brand || "فروشگاه تخصصی Tech"}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mt-1">
              {product.name}
            </h1>
            {product.title_fa && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium leading-relaxed">
                {product.title_fa}
              </p>
            )}
          </div>

          {/* انتخاب رنگ */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                رنگ انتخابی:{" "}
                <strong className="text-[var(--accent-blue)]">
                  {selectedColor}
                </strong>
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {product.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                      selectedColor === c.name
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/20"
                        : "border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* باکس گارانتی و ارسال */}
          <div className="rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 space-y-2.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>
                {product.warranty || "گارانتی اصالت و سلامت فیزیکی ۱۸ ماهه"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--accent-blue)] font-bold">⚡</span>
              <span>ارسال سریع با بسته‌بندی ایمن و کد پیگیری پیامکی</span>
            </div>
          </div>

          {/* باکس قیمت و افزودن به سبد خرید */}
          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 shadow-lg">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[var(--text-secondary)] font-bold">
                قیمت نهایی:
              </span>
              <div className="text-right">
                {formattedOriginalPrice && (
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-lg">
                      %{discount} تخفیف
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] line-through font-mono">
                      {formattedOriginalPrice}
                    </span>
                  </div>
                )}
                <div className="text-2xl font-black text-[var(--accent-blue)] font-mono">
                  {formattedPrice}{" "}
                  <span className="text-xs font-normal text-[var(--text-secondary)]">
                    تومان
                  </span>
                </div>
              </div>
            </div>

            {/* کنترل تعداد کالا */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                تعداد:
              </span>
              <div className="flex items-center gap-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center font-black text-sm cursor-pointer hover:opacity-80 transition"
                >
                  -
                </button>
                <span className="font-mono font-black text-xs w-6 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center font-black text-sm cursor-pointer hover:opacity-80 transition"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-4 rounded-2xl font-black text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                isOutOfStock
                  ? "bg-zinc-500 text-white cursor-not-allowed opacity-50"
                  : isAdded
                  ? "bg-emerald-500 text-white shadow-emerald-500/20 scale-[0.99]"
                  : "bg-[var(--accent-blue)] hover:opacity-90 text-white shadow-blue-500/20"
              }`}
            >
              {isOutOfStock
                ? "موجودی این محصول به اتمام رسیده است"
                : isAdded
                ? "✓ با موفقیت به سبد خرید اضافه شد"
                : "افزودن به سبد خرید 🛍️"}
            </button>
          </div>
        </div>
      </div>

      {/* مشخصات فنی و توضیحات محصول */}
      <div className="mt-16 pt-12 border-t border-[var(--card-border)] grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-6 space-y-3">
          <h3 className="text-sm font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📝</span> نقد و بررسی تخصصی محصول
          </h3>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)] font-medium whitespace-pre-line text-justify">
            {product.description || "توضیحاتی برای این کالا ثبت نشده است."}
          </p>
        </div>

        <div className="md:col-span-6 space-y-3">
          <h3 className="text-sm font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> مشخصات فنی کالا (Specs)
          </h3>
          {product.specs && Object.keys(product.specs).length > 0 ? (
            <div className="rounded-2xl border border-[var(--card-border)] overflow-hidden divide-y divide-[var(--card-border)] bg-[var(--input-bg)]">
              {Object.entries(product.specs).map(([key, value], idx) => (
                <div key={idx} className="flex justify-between p-3 text-xs">
                  <span className="text-[var(--text-secondary)] font-bold">
                    {key}
                  </span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] font-bold">
              مشخصات فنی ثبت نشده است.
            </p>
          )}
        </div>
      </div>

      {/* ماژول نظرات و امتیازدهی کاربران */}
      <ProductReviews productId={product.id} />
    </div>
  );
}
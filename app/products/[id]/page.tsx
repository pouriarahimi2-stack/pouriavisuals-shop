// File Path: app/products/[id]/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";
import AddToCartButton from "@/components/AddToCartButton";
import ProductReviews from "@/components/ProductReviews";
import ColorGamutSimulator from "@/components/ColorGamutSimulator";
import LiveMarketArbitrage from "@/components/LiveMarketArbitrage";
import { formatPrice } from "@/lib/formatters";
import type { Metadata } from "next";

export const revalidate = 60; // بازسازی خودکار هر ۱ دقیقه (ISR)

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) return data;
    }
  } catch {}

  return FLAGSHIP_7_PRODUCTS.find((p) => String(p.id) === String(id)) || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "کالای مورد نظر یافت نشد | آکسون" };
  }

  const title = product.title || product.name || "محصول استودیویی آکسون";
  const desc = product.meta_description || product.description?.slice(0, 150) || "مشخصات فنی، قیمت و خرید مانیتور و تجهیزات استودیویی در آکسون کور.";

  return {
    title: `${title} | نقد و بررسی و خرید با گارانتی اصالت طلایی`,
    description: desc,
    alternates: {
      canonical: `https://axoncore.ir/products/${id}`,
    },
    openGraph: {
      title,
      description: desc,
      url: `https://axoncore.ir/products/${id}`,
      images: [product.image_url || product.image || "https://axoncore.ir/placeholder.png"],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  const title = product.title || product.name || "کالای تخصصی";
  const finalPrice = Number(product.discount_price || product.discountPrice || product.price || 0);
  const basePrice = Number(product.price || 0);
  const hasDiscount = Boolean(finalPrice > 0 && finalPrice < basePrice);
  const imageUrl = product.image_url || product.image || (product.images && product.images[0]) || "https://axoncore.ir/placeholder.png";

  const productSchemaJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": title,
    "image": [imageUrl],
    "description": product.description || "تجهیزات تخصصی و مانیتور تدوین استودیو با گارانتی اصالت طلایی",
    "sku": product.sku || `AXN-${product.id}`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Apple",
    },
    "offers": {
      "@type": "Offer",
      "url": `https://axoncore.ir/products/${product.id}`,
      "priceCurrency": "IRR",
      "price": finalPrice * 10,
      "availability": product.is_available !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 font-sans select-none text-[var(--text-primary)] space-y-12" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchemaJsonLd) }}
      />

      <nav className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--accent-blue)]">خانه</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[var(--accent-blue)]">کاتالوگ تجهیزات</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* گالری تصویر کالا */}
        <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 sm:p-8 shadow-xl flex items-center justify-center aspect-square overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            width={520}
            height={520}
            className="w-full h-full object-contain max-h-[420px] transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* مشخصات و جعبه خرید */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-black font-mono">
              {product.category || "تجهیزات تخصصی تصویر"}
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-snug">
              {title}
            </h1>
            {product.title_fa && (
              <p className="text-xs text-[var(--text-secondary)] font-bold">{product.title_fa}</p>
            )}
          </div>

          {/* تنوع و رنگ‌ها در صورت تعریف */}
          {Array.isArray(product.variants) && product.variants.length > 0 && (
            <div className="space-y-2 p-4 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <span className="text-xs font-bold text-[var(--text-secondary)] block">انتخاب رنگ و مدل:</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    className="px-3.5 py-1.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold flex items-center gap-2 hover:border-[var(--accent-blue)] transition"
                  >
                    {v.colorHex && (
                      <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: v.colorHex }} />
                    )}
                    <span>{v.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* کارت گارانتی و اصالت */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-[var(--text-secondary)] block font-bold">🛡️ گارانتی محصول:</span>
              <strong className="text-xs font-bold text-[var(--text-primary)]">{product.warranty || "۱۸ ماه گارانتی اصالت طلایی"}</strong>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-[var(--text-secondary)] block font-bold">🚀 وضعیت ارسال:</span>
              <strong className="text-xs font-bold text-emerald-600 dark:text-emerald-400">آماده تحویل به پست پیشتاز</strong>
            </div>
          </div>

          {/* قیمت */}
          <div className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">قیمت نهایی استودیو:</span>
            <div className="flex flex-col items-end">
              {hasDiscount && (
                <span className="text-xs font-mono line-through text-slate-400" suppressHydrationWarning>
                  {formatPrice(basePrice)} تومان
                </span>
              )}
              <span className="text-xl sm:text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
                {formatPrice(finalPrice)} تومان
              </span>
            </div>
          </div>

          <AddToCartButton
            product={{
              id: product.id,
              title,
              price: finalPrice,
              image: imageUrl,
              images: [imageUrl],
              stock: product.stock,
              category: product.category,
            }}
          />

          {/* توضیحات */}
          <div className="space-y-3 pt-4 border-t border-[var(--card-border)]">
            <h3 className="font-black text-sm">توضیحات و استانداردهای مهندسی</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium whitespace-pre-line text-justify">
              {product.description || "این کالا منطبق با استانداردهای رتینا، پوشش رنگ DCI-P3 و کالیبراسیون سخت‌افزاری استودیوهای تدوین رنگ ارائه می‌گردد."}
            </p>
          </div>
        </div>
      </div>

      {/* شبیه‌ساز گاموت رنگی */}
      <ColorGamutSimulator productTitle={title} />

      {/* پایش زنده قیمت در ۵ پلتفرم */}
      <LiveMarketArbitrage
        productTitle={title}
        ourPrice={finalPrice}
        marketBenchmarks={product.market_comparison}
      />

      {/* دیدگاه‌های خریداران */}
      <ProductReviews productId={String(product.id)} />
    </div>
  );
}

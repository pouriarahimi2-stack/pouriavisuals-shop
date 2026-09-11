import React from "react";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";
import AddToCartButton from "@/components/AddToCartButton";
import ProductExplodedView from "@/components/ProductExplodedView";
import ColorGamutSimulator from "@/components/ColorGamutSimulator";
import LiveMarketArbitrage from "@/components/LiveMarketArbitrage";
import ProductReviews from "@/components/ProductReviews";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function fetchProductData(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) return data;
  } catch {}

  const flagship = FLAGSHIP_7_PRODUCTS.find((p) => String(p.id) === String(id));
  if (flagship) return flagship;

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetchProductData(id);

  if (!product) {
    return { title: "کالا یافت نشد | آکسون" };
  }

  const title = product.title || product.name || "کالای تخصصی استودیو";
  const desc = product.subtitle || product.short_description || product.description || "خرید تخصصی با گارانتی اصالت طلایی";
  const image = product.images?.[0] || product.image || "https://axoncore.ir/placeholder.png";

  return {
    title: `${title} | خرید و قیمت در آکسون`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [{ url: image }],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetchProductData(id);

  if (!product) {
    notFound();
  }

  const title = product.title || product.name || "کالای دیجیتال استودیویی";
  const price = Number(product.price || 0);
  const discountPrice = product.discount_price || product.discountPrice ? Number(product.discount_price || product.discountPrice) : undefined;
  const finalPrice = discountPrice && discountPrice > 0 ? discountPrice : price;
  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"];
  const stock = product.stock !== undefined ? Number(product.stock) : 10;
  const category = product.category || "تجهیزات تخصصی تصویر";
  const desc = product.description || product.short_description || "تامین و کالیبراسیون تخصصی با ۱۸ ماه گارانتی اصالت طلایی.";

  // ساخت اسکیما (Structured Data) برای گوگل
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": title,
    "image": images,
    "description": desc,
    "brand": {
      "@type": "Brand",
      "name": "Apple / Axon Core"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://axoncore.ir/products/${product.id}`,
      "priceCurrency": "IRR",
      "price": finalPrice * 10, // تبدیل تومان به ریال برای استاندارد گوگل
      "availability": stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans select-none text-[var(--text-primary)] space-y-12" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* مسیر ناوبری (Breadcrumb) */}
      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--accent-blue)]">فروشگاه</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[var(--accent-blue)]">کاتالوگ محصولات</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{title}</span>
      </div>

      {/* بخش اصلی معرفی کالا */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* گالری تصاویر */}
        <div className="lg:col-span-7 space-y-4">
          <div className="w-full h-[420px] sm:h-[500px] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-xl p-4 flex items-center justify-center">
            <img src={images[0]} alt={title} className="w-full h-full object-contain" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((imgUrl: string, idx: number) => (
                <div key={idx} className="w-20 h-20 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 shrink-0 overflow-hidden shadow-sm">
                  <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* مشخصات و دکمه خرید */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 text-[11px] font-black inline-block">
              {category}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] leading-tight">{title}</h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{product.subtitle || "کالای استاندارد استودیویی"}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)]">
              <span>وضعیت انبار:</span>
              <span className={stock > 0 ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-rose-500 font-black"}>
                {stock > 0 ? `موجود در انبار (${stock} عدد)` : "ناموجود"}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-2 border-t border-[var(--card-border)]">
              <span className="text-xs text-[var(--text-secondary)] font-bold">قیمت مصرف‌کننده:</span>
              <div className="text-left font-mono">
                {discountPrice && discountPrice < price && (
                  <span className="text-xs text-slate-400 line-through block">{price.toLocaleString("fa-IR")} تومان</span>
                )}
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {finalPrice.toLocaleString("fa-IR")} <span className="text-xs">تومان</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <AddToCartButton
              product={{
                id: product.id,
                title: title,
                price: finalPrice,
                image: images[0],
                images: images,
                stock: stock,
                category: category
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--card-border)] text-[11px] font-bold text-[var(--text-secondary)]">
            <div className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center">
              🛡️ ۱۸ ماه گارانتی طلایی
            </div>
            <div className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center">
              🚀 ارسال پیشتاز سراسری
            </div>
          </div>
        </div>
      </div>

      {/* ماژول‌های پیشرفته (کالبدشکافی ۳D، شبیه‌ساز رنگ و مقایسه قیمت) */}
      <div className="space-y-12 pt-6 border-t border-[var(--card-border)]">
        <ProductExplodedView productTitle={title} productCategory={category} />
        <ColorGamutSimulator productTitle={title} />
        <LiveMarketArbitrage productTitle={title} currentPrice={finalPrice} />
        <ProductReviews productId={String(product.id)} />
      </div>
    </div>
  );
}

// File Path: app/products/[id]/page.tsx
import { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ProductDetailClient from "@/components/ProductDetailClient";
import { unpackProductRow } from "@/lib/productUnpacker";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { data: rawProd } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (rawProd) {
      const p = unpackProductRow(rawProd);
      const title = p.meta_title || p.title + " | فروشگاه آکسون کور";
      const desc =
        p.meta_description ||
        p.description?.slice(0, 155) ||
        "خرید آنلاین " + p.title + " با تضمین اصالت فیزیکی و ارسال سریع به سراسر کشور.";
      const img = p.image || "/placeholder.png";

      return {
        title,
        description: desc,
        openGraph: {
          title,
          description: desc,
          images: [img],
        },
      };
    }
  } catch (e) {
    console.error("Metadata error:", e);
  }

  return {
    title: "جزئیات محصول | آکسون کور",
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const { data: rawProduct } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!rawProduct) {
    notFound();
  }

  const product = unpackProductRow(rawProduct);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  const finalPrice = product.discount_price || product.price || 0;
  const imageUrl =
    product.image && product.image.startsWith("http")
      ? product.image
      : baseUrl + (product.image || "/placeholder.png");

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title || product.name,
    image: [imageUrl],
    description:
      product.description?.replace(/<[^>]*>?/gm, "").slice(0, 200) || product.title,
    sku: product.sku || "AXON-" + product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || "Axon Core",
    },
    offers: {
      "@type": "Offer",
      url: baseUrl + "/products/" + product.id,
      priceCurrency: "IRR",
      price: Math.round(finalPrice * 10),
      availability:
        (product.stock ?? 1) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "آکسون کور",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "28",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd)
            .replace(/</g, "\u003c")
            .replace(/>/g, "\u003e"),
        }}
      />
      <ProductDetailClient initialProduct={product} productId={id} />
    </>
  );
}

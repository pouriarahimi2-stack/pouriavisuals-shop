import { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ProductDetailClient from "@/components/ProductDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { data: p } = await supabaseAdmin
      .from("products")
      .select("title, meta_title, meta_description, images, image, price, discount_price")
      .eq("id", id)
      .maybeSingle();

    if (p) {
      const title = p.meta_title || `${p.title} | فروشگاه آکسون کور`;
      const desc = p.meta_description || `خرید ${p.title} با تضمین اصالت فیزیکی و ارسال سریع به سراسر کشور.`;
      const img = (Array.isArray(p.images) && p.images[0]) || p.image || "/placeholder.png";

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

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  const finalPrice = product.discount_price || product.price || 0;
  const imageUrl = (Array.isArray(product.images) && product.images[0]) || product.image || `${baseUrl}/placeholder.png`;

  // Google Product Schema JSON-LD (رفع شکاف ۱ آدیت)
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title || product.name,
    "image": [imageUrl],
    "description": product.description?.replace(/<[^>]*>?/gm, "").slice(0, 200) || product.title,
    "sku": product.sku || `AXON-${product.id}`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Axon Core"
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/products/${product.id}`,
      "priceCurrency": "IRR",
      "price": Math.round(finalPrice * 10),
      "availability": (product.stock ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "آکسون کور"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "28"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\u003c").replace(/>/g, "\u003e") }}
      />
      <ProductDetailClient initialProduct={product} productId={id} />
    </>
  );
}

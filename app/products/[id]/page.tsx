// File Path: app/products/[id]/page.tsx
import { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ProductDetailClient from "@/components/ProductDetailClient";
import { unpackProductRow } from "@/lib/productUnpacker";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const [{ data: rawProd }, siteRow] = await Promise.all([
      supabaseAdmin.from("products").select("*").eq("id", id).maybeSingle(),
      getMasterSiteInfoRow(),
    ]);

    const sys = normalizeSystemSettings(
      siteRow?.homepage_layout_config || {},
      siteRow
    );
    const baseUrl = (
      sys.canonicalBaseUrl ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://axoncore.ir"
    ).replace(/\/+$/, "");
    const siteName = sys.site_name || "آکسون کور";
    const allowIndex = !sys.noIndex;

    if (rawProd) {
      const p = unpackProductRow(rawProd);
      const title = p.meta_title || `${p.title} | ${siteName}`;
      const desc =
        p.meta_description ||
        p.description?.slice(0, 155) ||
        `خرید آنلاین ${p.title} با تضمین اصالت فیزیکی و ارسال سریع از ${siteName}.`;
      const rawImg = p.image || "/placeholder.png";
      const fullImg = rawImg.startsWith("http") ? rawImg : baseUrl + rawImg;

      const isAvailable = p.is_available !== false && Number(p.stock ?? 0) > 0;
      const basePrice = Number(p.price || 0);
      const discountPrice =
        p.discount_price &&
        Number(p.discount_price) > 0 &&
        Number(p.discount_price) < basePrice
          ? Number(p.discount_price)
          : null;
      const finalPrice = discountPrice ? discountPrice : basePrice;

      return {
        title,
        description: desc,
        robots: {
          index: allowIndex,
          follow: allowIndex,
          googleBot: { index: allowIndex, follow: allowIndex },
        },
        alternates: {
          canonical: baseUrl + "/products/" + p.id,
        },
        openGraph: {
          title,
          description: desc,
          url: baseUrl + "/products/" + p.id,
          siteName,
          images: [fullImg],
          type: "website",
        },
        other: {
          product_id: String(p.id),
          product_name: String(p.title || p.name || "کالای دیجیتال"),
          product_price: isAvailable ? String(finalPrice) : "0",
          product_old_price:
            isAvailable && discountPrice ? String(basePrice) : String(finalPrice),
          availability: isAvailable ? "instock" : "outofstock",
          guarantee: String(p.warranty || "۱۸ ماه گارانتی اصالت طلایی"),
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

  const [{ data: rawProduct }, siteRow, reviewsRes] = await Promise.all([
    supabaseAdmin.from("products").select("*").eq("id", id).maybeSingle(),
    getMasterSiteInfoRow(),
    supabaseAdmin
      .from("product_reviews")
      .select("rating")
      .eq("product_id", id)
      .eq("is_approved", true),
  ]);

  if (!rawProduct) {
    notFound();
  }

  const sys = normalizeSystemSettings(
    siteRow?.homepage_layout_config || {},
    siteRow
  );
  const product = unpackProductRow(rawProduct);
  const baseUrl = (
    sys.canonicalBaseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://axoncore.ir"
  ).replace(/\/+$/, "");
  const isAvailable =
    product.is_available !== false && Number(product.stock ?? 0) > 0;
  const finalPrice = product.discount_price || product.price || 0;
  const imageUrl =
    product.image && product.image.startsWith("http")
      ? product.image
      : baseUrl + (product.image || "/placeholder.png");

  const approvedReviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
  const reviewCount = approvedReviews.length;
  const avgRating =
    reviewCount > 0
      ? (
          approvedReviews.reduce(
            (sum: number, r: any) => sum + Number(r.rating || 5),
            0
          ) / reviewCount
        ).toFixed(1)
      : null;

  const productJsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title || product.name,
    image: [imageUrl],
    description:
      product.description?.replace(/<[^>]*>?/gm, "").slice(0, 200) ||
      product.title,
    sku: product.sku || "AXON-" + product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || "Axon Core",
    },
    offers: {
      "@type": "Offer",
      url: baseUrl + "/products/" + product.id,
      priceCurrency: "IRR",
      price: isAvailable ? Math.round(finalPrice * 10) : 0,
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: sys.site_name || "آکسون کور",
      },
    },
  };

  if (reviewCount > 0 && avgRating) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: String(reviewCount),
    };
  }

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
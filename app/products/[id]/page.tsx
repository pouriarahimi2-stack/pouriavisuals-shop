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
      .select("title, meta_title, meta_description, images, image")
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

  return <ProductDetailClient initialProduct={product} productId={id} />;
}

// File Path: app/api/torob/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";

    let rawProducts: any[] = FLAGSHIP_7_PRODUCTS;

    try {
      if (supabaseAdmin) {
        const { data: dbProducts } = await supabaseAdmin
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (dbProducts && dbProducts.length > 0) {
          const dbIds = new Set(dbProducts.map((p: any) => String(p.id)));
          const extraFlagships = FLAGSHIP_7_PRODUCTS.filter((f) => !dbIds.has(String(f.id)));
          rawProducts = [...dbProducts, ...extraFlagships];
        }
      }
    } catch {}

    const formattedList = rawProducts.map((p: any) => {
      const basePrice = Number(p.price || 0);
      const discountVal = p.discount_price || p.discountPrice ? Number(p.discount_price || p.discountPrice) : undefined;
      const finalPrice = discountVal && discountVal > 0 ? discountVal : basePrice;
      const isAvailable = p.is_available !== false && p.isAvailable !== false && (p.stock === undefined || Number(p.stock) > 0);

      const images = Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : [p.image_url || p.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"];

      return {
        page_unique_id: String(p.id),
        title: p.title || p.name || "کالای دیجیتال استودیویی آکسون",
        subtitle: p.title_fa || p.short_description || "",
        price: finalPrice,
        old_price: discountVal && discountVal < basePrice ? basePrice : undefined,
        availability: isAvailable ? "instock" : "outofstock",
        category: p.category || p.category_name || "تجهیزات تخصصی",
        image_links: images,
        page_url: `${baseUrl}/products/${p.id}`,
      };
    });

    return NextResponse.json(
      {
        count: formattedList.length,
        products: formattedList,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ count: 0, products: [], error: err.message }, { status: 500 });
  }
}

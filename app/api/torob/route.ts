// File Path: app/api/torob/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";

    let productsList: any[] = [];

    try {
      if (supabaseAdmin) {
        const { data: dbProducts, error } = await supabaseAdmin
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && dbProducts && dbProducts.length > 0) {
          productsList = dbProducts;
        }
      }
    } catch {}

    // در صورت خالی بودن دیتابیس، استفاده قطعی از ۷ کالای پرچمدار
    if (productsList.length === 0) {
      productsList = FLAGSHIP_7_PRODUCTS;
    }

    const formattedProducts = productsList.map((p: any) => {
      const price = Number(p.price || 0);
      const discountPrice = p.discount_price || p.discountPrice ? Number(p.discount_price || p.discountPrice) : undefined;
      const finalPayablePrice = discountPrice && discountPrice > 0 ? discountPrice : price;
      const isAvailable = p.is_available !== false && p.isAvailable !== false && (p.stock === undefined || Number(p.stock) > 0);

      const images = Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : [p.image_url || p.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"];

      return {
        page_unique_id: String(p.id),
        title: p.title || p.name || "کالای دیجیتال تخصصی آکسون",
        subtitle: p.title_fa || p.short_description || "",
        price: finalPayablePrice,
        old_price: discountPrice && discountPrice < price ? price : undefined,
        availability: isAvailable ? "instock" : "outofstock",
        category: p.category || p.category_name || "تجهیزات تخصصی",
        image_links: images,
        page_url: `${baseUrl}/products/${p.id}`,
      };
    });

    return NextResponse.json(
      {
        count: formattedProducts.length,
        products: formattedProducts,
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

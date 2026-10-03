// File Path: app/api/torob/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { unpackProductRow } from "@/lib/productUnpacker";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
    let rawProducts: any[] = [];

    if (supabaseAdmin) {
      const { data: dbProducts } = await supabaseAdmin
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (Array.isArray(dbProducts)) {
        rawProducts = dbProducts.map(unpackProductRow);
      }
    }

    const formattedList = rawProducts.map((p: any) => {
      const basePrice = Number(p.price || 0);
      const discountVal =
        p.discount_price && Number(p.discount_price) > 0
          ? Number(p.discount_price)
          : undefined;
      const finalPrice =
        discountVal && discountVal < basePrice ? discountVal : basePrice;
      const isAvailable =
        p.is_available !== false && Number(p.stock ?? 0) > 0;

      const images: string[] =
        Array.isArray(p.images) && p.images.length > 0
          ? p.images.map((img: string) =>
              img.startsWith("http") ? img : baseUrl + img
            )
          : [
              p.image && p.image.startsWith("http")
                ? p.image
                : baseUrl + (p.image || "/placeholder.png"),
            ];

      return {
        page_unique_id: String(p.id),
        title: p.title || p.name || "محصول دیجیتال آکسون",
        subtitle: p.short_description || "",
        price: finalPrice,
        old_price: discountVal && discountVal < basePrice ? basePrice : undefined,
        availability: isAvailable ? "instock" : "outofstock",
        category_name: p.category || "کالای دیجیتال و تکنولوژی",
        image_links: images,
        page_url: baseUrl + "/products/" + p.id,
        spec: p.specs && typeof p.specs === "object" ? p.specs : undefined,
        guarantee: p.warranty || "۱۸ ماه گارانتی اصالت طلایی",
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
          "Cache-Control": "s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { count: 0, products: [], error: err.message },
      { status: 500 }
    );
  }
}

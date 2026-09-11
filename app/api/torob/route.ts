import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
    let rawProducts: any[] = [];

    try {
      if (supabaseAdmin) {
        const { data: dbProducts } = await supabaseAdmin
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);

        if (dbProducts && dbProducts.length > 0) {
          rawProducts = dbProducts;
        }
      }
    } catch (dbErr) {
      console.warn("Torob DB fallback warning:", dbErr);
    }

    if (rawProducts.length === 0 && Array.isArray(FLAGSHIP_7_PRODUCTS)) {
      rawProducts = [...FLAGSHIP_7_PRODUCTS];
    } else if (Array.isArray(FLAGSHIP_7_PRODUCTS)) {
      const dbIds = new Set(rawProducts.map((p) => String(p.id)));
      const extras = FLAGSHIP_7_PRODUCTS.filter((f) => !dbIds.has(String(f.id)));
      rawProducts = [...rawProducts, ...extras];
    }

    const formattedList = rawProducts.map((p: any) => {
      const basePrice = Number(p.price || 0);
      const discountVal = p.discount_price || p.discountPrice ? Number(p.discount_price || p.discountPrice) : undefined;
      const finalPrice = discountVal && discountVal > 0 ? discountVal : basePrice;
      const isAvailable = p.is_available !== false && p.isAvailable !== false && (p.stock === undefined || p.stock === null || Number(p.stock) > 0);

      let images: string[] = [];
      if (Array.isArray(p.images) && p.images.length > 0) {
        images = p.images.map((img: string) => img.startsWith("http") ? img : baseUrl + img);
      } else if (p.image_url || p.image) {
        const single = String(p.image_url || p.image);
        images = [single.startsWith("http") ? single : baseUrl + single];
      } else {
        images = [baseUrl + "/placeholder.png"];
      }

      return {
        page_unique_id: String(p.id),
        title: p.title || p.name || "تجهیزات استودیویی آکسون",
        subtitle: p.title_fa || p.short_description || "",
        price: finalPrice,
        old_price: discountVal && discountVal < basePrice ? basePrice : undefined,
        availability: isAvailable ? "instock" : "outofstock",
        category_name: p.category || p.category_name || "تجهیزات استودیو و تدوین",
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
    return NextResponse.json({ count: 0, products: [], error: err.message }, { status: 500 });
  }
}

// app/api/torob/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";

    const { data: dbProducts, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const products = (dbProducts || []).map((p: any) => {
      const price = Number(p.price || 0);
      const discountPrice = p.discount_price ? Number(p.discount_price) : undefined;
      const isAvailable = p.is_available !== false && (p.stock === undefined || Number(p.stock) > 0);

      const images = Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : [p.image_url || p.image || `${baseUrl}/placeholder.png`];

      return {
        page_unique_id: String(p.id),
        title: p.title || p.name || "کالای دیجیتال",
        subtitle: p.title_fa || p.short_description || "",
        price: discountPrice || price,
        old_price: discountPrice ? price : undefined,
        availability: isAvailable ? "instock" : "outofstock",
        category: p.category || "تجهیزات تخصصی",
        image_links: images,
        page_url: `${baseUrl}/products/${p.id}`,
      };
    });

    return NextResponse.json(
      {
        count: products.length,
        products: products,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ count: 0, products: [], error: err.message }, { status: 500 });
  }
}
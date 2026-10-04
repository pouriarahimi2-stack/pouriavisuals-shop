// File Path: app/api/torob/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { unpackProductRow } from "@/lib/productUnpacker";

export const dynamic = "force-dynamic";

async function buildTorobCatalogResponse(params: {
  page?: number;
  pageUrls?: string[];
  pageUniqueIds?: string[];
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir").replace(/\/+$/, "");
  let rawProducts: any[] = [];

  if (supabaseAdmin) {
    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (Array.isArray(dbProducts)) {
      rawProducts = dbProducts.map(unpackProductRow);
    }
  }

  let filtered = rawProducts;

  if (Array.isArray(params.pageUniqueIds) && params.pageUniqueIds.length > 0) {
    const idSet = new Set(params.pageUniqueIds.map(String));
    filtered = filtered.filter((p) => idSet.has(String(p.id)));
  } else if (Array.isArray(params.pageUrls) && params.pageUrls.length > 0) {
    const urlSet = new Set(params.pageUrls.map((u) => String(u).trim()));
    filtered = filtered.filter((p) => urlSet.has(baseUrl + "/products/" + p.id));
  }

  const pageSize = 100;
  const currentPage = Math.max(1, Number(params.page || 1));
  const maxPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedList = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formattedList = pagedList.map((p: any) => {
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
            img.startsWith("http") || img.startsWith("data:") ? img : baseUrl + img
          )
        : [
            p.image && (p.image.startsWith("http") || p.image.startsWith("data:"))
              ? p.image
              : baseUrl + (p.image || "/placeholder.png"),
          ];

    return {
      page_unique_id: String(p.id),
      title: p.title || p.name || "محصول دیجیتال آکسون",
      subtitle: p.short_description || p.brand || "",
      current_price: finalPrice,
      price: finalPrice,
      old_price: discountVal && discountVal < basePrice ? basePrice : undefined,
      availability: isAvailable ? "instock" : "outofstock",
      category_name: p.category || "کالای دیجیتال و تکنولوژی",
      image_link: images[0],
      image_links: images,
      page_url: baseUrl + "/products/" + p.id,
      short_desc: p.short_description || "",
      spec: p.specs && typeof p.specs === "object" ? p.specs : {},
      guarantee: p.warranty || "۱۸ ماه گارانتی اصالت طلایی",
    };
  });

  return NextResponse.json(
    {
      count: filtered.length,
      max_pages: maxPages,
      products: formattedList,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    return await buildTorobCatalogResponse({ page });
  } catch (err: any) {
    return NextResponse.json(
      { count: 0, max_pages: 1, products: [], error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return await buildTorobCatalogResponse({
      page: Number(body.page || 1),
      pageUrls: Array.isArray(body.page_urls) ? body.page_urls : undefined,
      pageUniqueIds: Array.isArray(body.page_unique_ids) ? body.page_unique_ids : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { count: 0, max_pages: 1, products: [], error: err.message },
      { status: 500 }
    );
  }
}

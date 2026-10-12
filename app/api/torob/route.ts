// File Path: app/api/torob/route.ts
// API ترب نسخه ۳ — فرمت کامل با api_version و products (فیلدهای اجباری v3)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const TOROB_API_VERSION = 3;

const BASE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir").replace(/\/$/, "");

function corsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, User-Agent",
    "Cache-Control": "no-store",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function resolveImageUrl(p: any): string {
  let imageUrl = "";

  // اگر images یک JSON string است، parse کن
  if (typeof p.images === "string") {
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        imageUrl = String(parsed[0]);
      }
    } catch {
      // ignore
    }
  } else if (Array.isArray(p.images) && p.images.length > 0) {
    imageUrl = String(p.images[0]);
  }

  if (!imageUrl && p.image_url) imageUrl = String(p.image_url);
  if (!imageUrl && p.image) imageUrl = String(p.image);

  // تبدیل به URL کامل
  if (imageUrl && !imageUrl.startsWith("http")) {
    imageUrl = BASE_URL + (imageUrl.startsWith("/") ? "" : "/") + imageUrl;
  }

  return imageUrl;
}

async function handler(req: NextRequest): Promise<NextResponse> {
  try {
    let page = 1;
    let limit = 100;

    if (req.method === "POST") {
      try {
        const body = await req.json().catch(() => ({}));
        if (body?.page)  page  = Number(body.page);
        if (body?.limit) limit = Number(body.limit);
      } catch {
        // body خالی یا invalid
      }
    } else {
      const sp = new URL(req.url).searchParams;
      if (sp.get("page"))  page  = Number(sp.get("page"));
      if (sp.get("limit")) limit = Number(sp.get("limit"));
    }

    page  = Math.max(1, isNaN(page)  ? 1   : page);
    limit = Math.min(200, isNaN(limit) ? 100 : Math.max(1, limit));
    const offset = (page - 1) * limit;

    const { data: rows, error, count } = await supabaseAdmin
      .from("products")
      .select(
        "id, title, name, price, discount_price, stock, is_available, image_url, image, images, category, description",
        { count: "exact" }
      )
      .eq("is_available", true)
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[torob] db error:", error.message);
      return NextResponse.json(
        {
          api_version: TOROB_API_VERSION,
          products: [],
          count: 0,
          next: null,
          previous: null,
          error: "خطا در دریافت محصولات",
        },
        { status: 500, headers: corsHeaders() }
      );
    }

    const total   = count || 0;
    const hasNext = offset + limit < total;
    const hasPrev = page > 1;

    // ساخت URL با page parameter
    const pageUrl = (p: number) => `${BASE_URL}/api/torob?page=${p}&limit=${limit}`;

    const products = (rows || []).map((p) => {
      const basePrice     = Number(p.price) || 0;
      const discountPrice = p.discount_price && Number(p.discount_price) > 0
        ? Number(p.discount_price)
        : 0;

      // قیمت فعلی (ترب انتظار دارد قیمت فروش را بگیرد)
      const currentPrice = discountPrice > 0 && discountPrice < basePrice
        ? discountPrice
        : basePrice;

      // قیمت قبل از تخفیف (old_price)
      const oldPrice = discountPrice > 0 && discountPrice < basePrice
        ? basePrice
        : currentPrice;

      const imageUrl = resolveImageUrl(p);
      const title = String(p.title || p.name || "").trim();

      return {
        title,
        subtitle:     "",
        page_url:     `${BASE_URL}/products/${p.id}`,
        price:        currentPrice,
        old_price:    oldPrice,
        availability: "instock",
        image_url:    imageUrl,
        // فیلدهای اختیاری اما مفید برای ترب
        id:           String(p.id),
        category:     String(p.category || ""),
      };
    });

    // ساختار کامل ترب v3 — api_version و products اجباری هستند
    const responseBody = {
      api_version: TOROB_API_VERSION,
      count:       total,
      next:        hasNext ? pageUrl(page + 1) : null,
      previous:    hasPrev ? pageUrl(page - 1) : null,
      products,
    };

    return NextResponse.json(responseBody, {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطای ناشناخته";
    console.error("[torob] error:", msg);
    return NextResponse.json(
      {
        api_version: TOROB_API_VERSION,
        products: [],
        count: 0,
        next: null,
        previous: null,
        error: msg,
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export const GET  = handler;
export const POST = handler;

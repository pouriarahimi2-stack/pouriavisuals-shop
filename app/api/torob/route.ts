// File Path: app/api/torob/route.ts
// API ترب نسخه ۱ — فرمت Dictionary با pagination صحیح
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

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

// OPTIONS — preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// ─── هندلر اصلی ─────────────────────────────────────────────────────────────
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
    limit = Math.min(200, isNaN(limit) ? 100 : limit);
    const offset = (page - 1) * limit;

    const { data: products, error, count } = await supabaseAdmin
      .from("products")
      .select(
        "id, title, price, discount_price, stock, is_available, image_url, images",
        { count: "exact" }
      )
      .eq("is_available", true)
      .gt("stock", 0)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[torob] db error:", error.message);
      return NextResponse.json(
        { error: "خطا در دریافت محصولات" },
        { status: 500, headers: corsHeaders() }
      );
    }

    const total   = count || 0;
    const hasNext = offset + limit < total;
    const hasPrev = page > 1;

    const results = (products || []).map((p) => {
      const hasDiscount = p.discount_price && Number(p.discount_price) > 0;
      const price    = Number(hasDiscount ? p.discount_price : p.price) || 0;
      const oldPrice = Number(hasDiscount ? p.price : price) || 0;

      let imageUrl = "";
      if (Array.isArray(p.images) && p.images.length > 0) {
        imageUrl = String(p.images[0]);
      } else if (p.image_url) {
        imageUrl = String(p.image_url);
      }
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = BASE_URL + (imageUrl.startsWith("/") ? "" : "/") + imageUrl;
      }

      return {
        title:        String(p.title || "").trim(),
        subtitle:     "",
        page_url:     `${BASE_URL}/products/${p.id}`,
        price:        price,
        old_price:    oldPrice > price ? oldPrice : price,
        availability: "instock",
        image_url:    imageUrl,
      };
    });

    // فرمت Dictionary که ترب نسخه ۱ انتظار دارد
    const responseBody = {
      count:    total,
      next:     hasNext ? `${BASE_URL}/api/torob?page=${page + 1}` : null,
      previous: hasPrev ? `${BASE_URL}/api/torob?page=${page - 1}` : null,
      results,
    };

    return NextResponse.json(responseBody, {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطای ناشناخته";
    console.error("[torob] error:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export const GET  = handler;
export const POST = handler;

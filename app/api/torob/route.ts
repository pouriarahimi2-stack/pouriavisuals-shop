// File Path: app/api/torob/route.ts
// API ترب v3 — فقط URL واقعی در image_links (بدون base64)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const TOROB_API_VERSION = "torob_api_v3";

const BASE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir").replace(/\/$/, "");

function corsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, User-Agent, X-Torob-Token",
    "Cache-Control": "no-store",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function toAbsolute(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return BASE_URL + (url.startsWith("/") ? "" : "/") + url;
}

/** بررسی اینکه آیا string یک URL واقعی است (نه base64) */
function isRealUrl(s: string): boolean {
  if (!s) return false;
  // base64 معمولاً با data: شروع می‌شه یا طولانی است و / یا . ندارد
  if (s.startsWith("data:")) return false;
  // base64 خام: اگر string خیلی طولانی است و شامل http نیست
  if (s.length > 500 && !s.startsWith("http")) return false;
  // URL واقعی باید با http شروع شود یا / برای relative
  return s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/");
}

function resolveImageLinks(p: Record<string, unknown>): string[] {
  const links: string[] = [];

  let raw: unknown = p.images;
  if (typeof raw === "string") {
    // اگر کل رشته base64 است
    if (raw.startsWith("data:") || (raw.length > 500 && !raw.includes("http") && !raw.startsWith("["))) {
      raw = null;
    } else {
      try { raw = JSON.parse(raw); } catch { raw = null; }
    }
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const s = String(item ?? "").trim();
      if (s && isRealUrl(s)) {
        links.push(toAbsolute(s));
      }
    }
  }

  // fallback به image_url یا image تکی — فقط اگر URL واقعی باشد
  if (links.length === 0 && p.image_url) {
    const u = String(p.image_url).trim();
    if (isRealUrl(u)) links.push(toAbsolute(u));
  }
  if (links.length === 0 && p.image) {
    const u = String(p.image).trim();
    if (isRealUrl(u)) links.push(toAbsolute(u));
  }

  return links;
}

function resolveSpec(p: Record<string, unknown>): Record<string, string> {
  const spec: Record<string, string> = {};

  let raw: unknown = p.specs;
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { raw = null; }
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      spec[String(k)] = String(v ?? "");
    }
  }

  if (Object.keys(spec).length === 0 && p.category) {
    spec["دسته‌بندی"] = String(p.category);
  }

  return spec;
}

async function handler(req: NextRequest): Promise<NextResponse> {
  try {
    let page  = 1;
    let limit = 100;

    if (req.method === "POST") {
      try {
        const body = await req.json().catch(() => ({}));
        if (body?.page)  page  = Number(body.page);
        if (body?.limit) limit = Number(body.limit);
      } catch { /* body خالی */ }
    } else {
      const sp = new URL(req.url).searchParams;
      if (sp.get("page"))  page  = Number(sp.get("page"));
      if (sp.get("limit")) limit = Number(sp.get("limit"));
    }

    page  = Math.max(1, isNaN(page)  ? 1   : page);
    limit = Math.min(200, isNaN(limit) ? 100 : Math.max(1, limit));
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from("products")
      .select(
        "id, title, name, price, discount_price, stock, is_available, " +
        "image_url, image, images, category, description, specs, created_at",
        { count: "exact" }
      )
      .eq("is_available", true)
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[torob] db error:", error.message);
      return NextResponse.json(
        { api_version: TOROB_API_VERSION, products: [], count: 0, next: null, previous: null },
        { status: 500, headers: corsHeaders() }
      );
    }

    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    const total   = count ?? 0;
    const hasNext = offset + limit < total;
    const hasPrev = page > 1;

    const pageUrl = (pg: number) =>
      `${BASE_URL}/api/torob?page=${pg}&limit=${limit}`;

    const products = rows.map((p) => {
      const basePrice     = Number(p.price) || 0;
      const discountPrice = p.discount_price && Number(p.discount_price) > 0
        ? Number(p.discount_price)
        : 0;

      const currentPrice = discountPrice > 0 && discountPrice < basePrice
        ? discountPrice
        : basePrice;

      const oldPrice = discountPrice > 0 && discountPrice < basePrice
        ? basePrice
        : currentPrice;

      const imageLinks = resolveImageLinks(p);
      const spec       = resolveSpec(p);
      const title      = String(p.title ?? p.name ?? "").trim();
      const productUrl = `${BASE_URL}/products/${p.id}`;

      const dateAdded = p.created_at
        ? new Date(String(p.created_at)).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      return {
        page_unique:   productUrl,
        current_price: currentPrice,
        availability:  true,
        image_links:   imageLinks,   // فقط URL واقعی — بدون base64
        spec,
        date_added:    dateAdded,
        title,
        subtitle:      "",
        page_url:      productUrl,
        old_price:     oldPrice,
        id:            String(p.id),
        category:      String(p.category ?? ""),
      };
    });

    return NextResponse.json(
      {
        api_version: TOROB_API_VERSION,
        count:    total,
        next:     hasNext ? pageUrl(page + 1) : null,
        previous: hasPrev ? pageUrl(page - 1) : null,
        products,
      },
      { status: 200, headers: corsHeaders() }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error("[torob] error:", msg);
    return NextResponse.json(
      { api_version: TOROB_API_VERSION, products: [], count: 0, next: null, previous: null },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export const GET  = handler;
export const POST = handler;

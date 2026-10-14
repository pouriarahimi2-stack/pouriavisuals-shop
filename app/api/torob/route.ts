// File Path: app/api/torob/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TOROB_API_VERSION = "torob_api_v3";
const DEFAULT_LIMIT     = 20;
const MAX_LIMIT         = 100;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function isRealUrl(s: unknown): boolean {
  if (typeof s !== "string") return false;
  if (s.startsWith("data:"))  return false;
  if (!s.startsWith("http"))  return false;
  if (s.length > 2000)        return false;
  return true;
}

function toIranDateTime(dateStr: unknown): string {
  const d = dateStr ? new Date(dateStr as string) : new Date();
  const iso = (isNaN(d.getTime()) ? new Date() : d).toISOString();
  return iso.replace("Z", "+03:30");
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

  const offset = (page - 1) * limit;

  // ── شمارش کل ─────────────────────────────────────────────────────────────
  const { count: totalCount, error: countErr } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_available", true);

  if (countErr) {
    return NextResponse.json({ error: "خطا در دریافت تعداد محصولات" }, { status: 500 });
  }

  const total   = totalCount ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / limit));   // ← max_page

  // ── دریافت محصولات ────────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, name, brand, category, price, discount_price, is_available, image, images, description, specs, created_at, updated_at, sku"
    )
    .eq("is_available", true)
    .range(offset, offset + limit - 1)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "خطا در دریافت محصولات" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];

  // ── ساخت URL صفحه ─────────────────────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://axoncore.ir";
  const pageUrl = (p: number) =>
    `${baseUrl}/api/torob?page=${p}&limit=${limit}`;

  const hasNext = page < maxPage;
  const hasPrev = page > 1;

  // ── تبدیل هر محصول به فرمت ترب ──────────────────────────────────────────
  const products = rows.map((row) => {
    const rawImages = Array.isArray(row.images) ? row.images : [];
    const mainImage = typeof row.image === "string" ? row.image : "";

    const imageLinks: string[] = [mainImage, ...rawImages]
      .filter(isRealUrl)
      .filter((v, i, a) => a.indexOf(v) === i)   // dedup
      .slice(0, 5);

    const currentPrice  = Number(row.discount_price || row.price || 0);
    const specs: Record<string, string> = {};

    if (row.specs && typeof row.specs === "object" && !Array.isArray(row.specs)) {
      for (const [k, v] of Object.entries(row.specs as Record<string, unknown>)) {
        if (v !== null && v !== undefined) specs[k] = String(v);
      }
    }

    if (row.brand)    specs["برند"]    = String(row.brand);
    if (row.category) specs["دسته‌بندی"] = String(row.category);
    if (row.sku)      specs["کد محصول"] = String(row.sku);

    const productId = String(row.id ?? "");
    const title     = String(row.title ?? row.name ?? "محصول");

    return {
      page_unique:   productId,
      title:         title,
      category_name: String(row.category ?? ""),
      price:         currentPrice,
      current_price: currentPrice,
      availability:  Boolean(row.is_available),
      image_links:   imageLinks,
      spec:          specs,
      description:   String(row.description ?? ""),
      shop_name:     "اکسون کور",
      shop_link:     `${baseUrl}/products/${productId}`,
      product_link:  `${baseUrl}/products/${productId}`,
      date_added:    toIranDateTime(row.created_at),
      date_updated:  toIranDateTime(row.updated_at),
    };
  });

  return NextResponse.json({
    api_version: TOROB_API_VERSION,
    count:       total,       // ← تعداد کل محصولات
    max_page:    maxPage,     // ← تعداد کل صفحات (درخواست پشتیبانی ترب)
    next:        hasNext ? pageUrl(page + 1) : null,
    previous:    hasPrev ? pageUrl(page - 1) : null,
    products,
  });
}

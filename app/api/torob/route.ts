// File Path: app/api/torob/route.ts
// ترب با POST + هدر X-Torob-Token (JWT/EdDSA) درخواست می‌زنه
// مستندات: https://panel.torob.com/api-documentation
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TOROB_API_VERSION = "torob_api_v3";
const DEFAULT_LIMIT     = 20;
const MAX_LIMIT         = 100;

// کلید عمومی ترب برای verify کردن JWT — از مستندات رسمی ترب
// الگوریتم: EdDSA (Ed25519)
const TOROB_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAt6Mu4T0pBORY11W+QeM35UsmLO3vsf+6yKpFDEImFk0=
-----END PUBLIC KEY-----`;

const supabaseAdmin = createClient(
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

async function verifyTorobToken(token: string): Promise<boolean> {
  try {
    const publicKey = await jose.importSPKI(TOROB_PUBLIC_KEY_PEM, "EdDSA");
    await jose.jwtVerify(token, publicKey, {
      algorithms: ["EdDSA"],
    });
    return true;
  } catch {
    return false;
  }
}

async function getProducts(page: number, limit: number) {
  const offset = (page - 1) * limit;

  const { count: totalCount, error: countErr } = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_available", true);

  if (countErr) throw new Error("خطا در شمارش محصولات");

  const total   = totalCount ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / limit));

  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, title, name, brand, category, price, discount_price, is_available, image, images, description, specs, created_at, updated_at, sku"
    )
    .eq("is_available", true)
    .range(offset, offset + limit - 1)
    .order("updated_at", { ascending: false });

  if (error) throw new Error("خطا در دریافت محصولات");

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://axoncore.ir";
  const pageUrl = (p: number) => `${baseUrl}/api/torob?page=${p}&limit=${limit}`;

  const products = rows.map((row) => {
    const rawImages = Array.isArray(row.images) ? row.images : [];
    const mainImage = typeof row.image === "string" ? row.image : "";
    const imageLinks: string[] = [mainImage, ...rawImages]
      .filter(isRealUrl)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5);

    const currentPrice = Number(row.discount_price || row.price || 0);
    const specs: Record<string, string> = {};

    if (row.specs && typeof row.specs === "object" && !Array.isArray(row.specs)) {
      for (const [k, v] of Object.entries(row.specs as Record<string, unknown>)) {
        if (v !== null && v !== undefined) specs[k] = String(v);
      }
    }
    if (row.brand)    specs["برند"]      = String(row.brand);
    if (row.category) specs["دسته‌بندی"] = String(row.category);
    if (row.sku)      specs["کد محصول"] = String(row.sku);

    const productId = String(row.id ?? "");
    const title     = String(row.title ?? row.name ?? "محصول");

    return {
      page_unique:   productId,
      title,
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

  return {
    api_version: TOROB_API_VERSION,
    count:       total,
    max_page:    maxPage,
    next:        page < maxPage ? pageUrl(page + 1) : null,
    previous:    page > 1      ? pageUrl(page - 1) : null,
    products,
  };
}

// ── POST — ترب همیشه POST می‌زنه ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  // بررسی JWT token از هدر X-Torob-Token
  const token = req.headers.get("X-Torob-Token") ?? req.headers.get("x-torob-token");

  if (!token) {
    return NextResponse.json({ error: "توکن ترب ارسال نشده" }, { status: 401 });
  }

  const isValid = await verifyTorobToken(token);
  if (!isValid) {
    return NextResponse.json({ error: "توکن نامعتبر" }, { status: 403 });
  }

  // body می‌تونه شامل page و limit باشه
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // body خالی — مشکلی نیست
  }

  const page  = Math.max(1, parseInt(String(body.page  ?? "1"),  10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(body.limit ?? String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT));

  try {
    const result = await getProducts(page, limit);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[torob] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// ── GET — برای تست دستی (بدون token) ────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

  try {
    const result = await getProducts(page, limit);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[torob] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

export const dynamic = "force-dynamic";

const TOROB_API_VERSION = "torob_api_v3";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const TOROB_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAt6Mu4T0pBORY11W+QeM35UsmLO3vsf+6yKpFDEImFk0=
-----END PUBLIC KEY-----`;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isRealUrl(s: unknown): boolean {
  if (typeof s !== "string") return false;
  if (s.startsWith("data:")) return false;
  if (!s.startsWith("http")) return false;
  if (s.length > 2000) return false;
  return true;
}

function toIranDateTime(dateStr: unknown): string {
  const d = dateStr ? new Date(dateStr as string) : new Date();
  const iso = (isNaN(d.getTime()) ? new Date() : d).toISOString();
  return iso.replace("Z", "+03:30");
}

async function verifyTorobToken(token: string): Promise<boolean> {
  try {
    const publickey = await jose.importSPKI(TOROB_PUBLIC_KEY_PEM, "EdDSA");
    await jose.jwtVerify(token, publickey, { algorithms: ["EdDSA"] });
    return true;
  } catch {
    return false;
  }
}

async function getProducts(page: number, limit: number, pageUniques: string[] = [], pageUrls: string[] = []) {
  let countQuery = supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_available", true);

  let dataQuery = supabaseAdmin
    .from("products")
    .select(
      "id, title, name, brand, category, price, discount_price, is_available, image, images, description, specs, created_at, updated_at, sku"
    )
    .eq("is_available", true);

  // ── رفع ارور ترب: پشتیبانی از آرایه محصولات (page_uniques و page_urls) ──
  let targetIds: string[] = [];

  if (pageUniques && pageUniques.length > 0) {
    targetIds = pageUniques;
  } else if (pageUrls && pageUrls.length > 0) {
    targetIds = pageUrls.map(url => {
      const parts = url.split("?")[0].split("/").filter(Boolean);
      return parts[parts.length - 1];
    }).filter(Boolean) as string[];
  }

  // اعتبارسنجی فرمت UUID برای جلوگیری از ارور دیتابیس در صورت ارسال دیتای نامعتبر
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validTargetIds = targetIds.filter(id => uuidRegex.test(id));

  if (targetIds.length > 0) {
    if (validTargetIds.length === 0) {
      return {
        api_version: TOROB_API_VERSION,
        count: 0,
        max_pages: 1, // تغییر به max_pages طبق درخواست ترب
        next: null,
        previous: null,
        products: [],
      };
    }
    // فیلتر کردن چندین محصول به صورت همزمان
    countQuery = countQuery.in("id", validTargetIds);
    dataQuery = dataQuery.in("id", validTargetIds);
  } else {
    // صفحه‌بندی عادی برای دریافت کل لیست
    const offset = (page - 1) * limit;
    dataQuery = dataQuery
      .range(offset, offset + limit - 1)
      .order("updated_at", { ascending: false });
  }

  const { count: totalCount, error: countErr } = await countQuery;
  if (countErr) throw new Error("خطا در شمارش محصولات");
  
  const total = totalCount ?? 0;
  const maxPages = Math.max(1, Math.ceil(total / limit));

  const { data, error } = await dataQuery;
  if (error) throw new Error("خطا در دریافت محصولات");

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://axoncore.ir";
  const pageUrlGen = (p: number) => `${baseUrl}/api/torob?page=${p}&limit=${limit}`;

  const products = rows.map((row) => {
    let rawDescription = String(row.description ?? "");
    let extractedImages: string[] = [];

    const metaMatch = rawDescription.match(/<!--MEDIA_METADATA:(.*?)-->/);
    if (metaMatch && metaMatch[1]) {
      try {
        const metaData = JSON.parse(metaMatch[1]);
        if (Array.isArray(metaData.images)) {
          extractedImages = metaData.images;
        }
      } catch (e) {}
      rawDescription = rawDescription.replace(/<!--MEDIA_METADATA:.*?-->/g, "").trim();
    }

    const rawImages = Array.isArray(row.images) ? row.images : [];
    const mainImage = typeof row.image === "string" ? row.image : "";
    
    const imageLinks: string[] = [mainImage, ...rawImages, ...extractedImages]
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
      description:   rawDescription,
      shop_name:     "آکسون کور",
      page_url:      `${baseUrl}/products/${productId}`,
      shop_link:     `${baseUrl}/products/${productId}`,
      product_link:  `${baseUrl}/products/${productId}`,
      date_added:    toIranDateTime(row.created_at),
      date_updated:  toIranDateTime(row.updated_at),
    };
  });

  return {
    api_version: TOROB_API_VERSION,
    count: total,
    max_pages: maxPages, // تغییر کلید از max_page به max_pages
    next: (targetIds.length === 0 && page < maxPages) ? pageUrlGen(page + 1) : null,
    previous: (targetIds.length === 0 && page > 1) ? pageUrlGen(page - 1) : null,
    products,
  };
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("X-Torob-Token") ?? req.headers.get("x-torob-token");
  if (!token) {
    return NextResponse.json({ error: "توکن ترب ارسال نشده" }, { status: 401 });
  }

  const isValid = await verifyTorobToken(token);
  if (!isValid) {
    return NextResponse.json({ error: "توکن نامعتبر" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {}

  const page = Math.max(1, parseInt(String(searchParams.get("page") ?? body.page ?? "1"), 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(searchParams.get("limit") ?? body.limit ?? String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT));
  
  // استخراج آرایه‌ها از بدنه یا Query
  let pageUniques: string[] = [];
  if (Array.isArray(body.page_uniques)) pageUniques = body.page_uniques.map(String);
  else if (typeof body.page_uniques === "string") pageUniques = body.page_uniques.split(",");
  else if (searchParams.get("page_uniques")) pageUniques = searchParams.get("page_uniques")!.split(",");

  let pageUrls: string[] = [];
  if (Array.isArray(body.page_urls)) pageUrls = body.page_urls.map(String);
  else if (typeof body.page_urls === "string") pageUrls = body.page_urls.split(",");
  else if (searchParams.get("page_urls")) pageUrls = searchParams.get("page_urls")!.split(",");

  try {
    const result = await getProducts(page, limit, pageUniques, pageUrls);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[torob] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT);
  
  const qUniques = searchParams.get("page_uniques");
  const pageUniques = qUniques ? qUniques.split(",") : [];

  const qUrls = searchParams.get("page_urls");
  const pageUrls = qUrls ? qUrls.split(",") : [];

  try {
    const result = await getProducts(page, limit, pageUniques, pageUrls);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[torob] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

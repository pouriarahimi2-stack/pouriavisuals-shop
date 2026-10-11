// File Path: app/api/torob/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// هدرهای مشترک برای همه پاسخ‌ها
function torobHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, User-Agent",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "X-Robots-Tag": "noindex",
  };
}

// هندلر OPTIONS برای preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: torobHeaders() });
}

// هندلر اصلی — هم GET هم POST پشتیبانی می‌شود
async function handler(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page")  || "1"));
    const limit  = Math.min(200, parseInt(searchParams.get("limit") || "100"));
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
      console.error("[torob] supabase error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500, headers: torobHeaders() }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://axoncore.ir";

    // فرمت دقیق نسخه ۱ ترب
    // https://panel.torob.com/api-docs/v1
    const catalog = (products || []).map((p) => {
      const hasDiscount = p.discount_price && Number(p.discount_price) > 0;
      const price    = Number(hasDiscount ? p.discount_price : p.price) || 0;
      const oldPrice = Number(hasDiscount ? p.price : price) || 0;

      // لینک تصویر اول
      let imageUrl = "";
      if (Array.isArray(p.images) && p.images.length > 0) {
        imageUrl = String(p.images[0]);
      } else if (p.image_url) {
        imageUrl = String(p.image_url);
      }
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = baseUrl + (imageUrl.startsWith("/") ? "" : "/") + imageUrl;
      }

      return {
        // فیلدهای اجباری نسخه ۱ ترب
        title:        String(p.title || "").trim(),
        subtitle:     "",                                          // زیرعنوان (اختیاری)
        page_url:     `${baseUrl}/products/${p.id}`,
        price:        price,                                       // قیمت نهایی (تومان)
        old_price:    oldPrice > price ? oldPrice : price,        // قیمت قبل از تخفیف
        availability: "instock",                                   // چون فقط موجود می‌فرستیم
        image_url:    imageUrl,
      };
    });

    // pagination info (برای ترب اختیاریه ولی مفیده)
    const totalCount = count || 0;
    const hasNext    = offset + limit < totalCount;

    return NextResponse.json(catalog, {
      status: 200,
      headers: {
        ...torobHeaders(),
        "X-Total-Count": String(totalCount),
        "X-Page":        String(page),
        "X-Has-Next":    String(hasNext),
        "X-Next-Page":   hasNext ? String(page + 1) : "",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[torob] handler error:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: torobHeaders() }
    );
  }
}

export const GET  = handler;
export const POST = handler;  // ترب گاهی POST می‌فرستد

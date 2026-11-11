// File Path: app/api/admin/products/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { unpackProductRow, packProductDescription } from "@/lib/productUnpacker";

export const dynamic = "force-dynamic";

function roundToThousand(num: number): number {
  if (num <= 0) return 0;
  return Math.round(num / 1000) * 1000;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const {
      operation,
      categoryFilter = "all",
      percentChange = 0,
      fixedChange = 0,
      stockValue = 10,
      roundPrices = true,
    } = body;

    const { data: allRows, error } = await supabaseAdmin
      .from("products")
      .select("*");

    if (error || !allRows) {
      return NextResponse.json(
        { success: false, message: "خطا در دریافت لیست محصولات از دیتابیس." },
        { status: 500 }
      );
    }

    const targets = allRows.filter((row: any) => {
      if (categoryFilter === "all") return true;
      return String(row.category || "").trim() === String(categoryFilter).trim();
    });

    if (targets.length === 0) {
      return NextResponse.json(
        { success: false, message: "هیچ محصولی در این دسته‌بندی یافت نشد." },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    const BATCH_SIZE = 20;

    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      const batch = targets.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (rawRow: any) => {
          const unpacked = unpackProductRow(rawRow);
          let nextPrice = Math.max(0, Number(rawRow.price || 0));
          let nextDiscount =
            rawRow.discount_price && Number(rawRow.discount_price) > 0
              ? Number(rawRow.discount_price)
              : null;
          let nextStock = Math.max(0, Number(rawRow.stock ?? 0));

          if (operation === "percent_price") {
            const factor = 1 + Number(percentChange) / 100;
            if (nextPrice > 0) {
              nextPrice = Math.max(0, Math.round(nextPrice * factor));
              if (roundPrices) nextPrice = roundToThousand(nextPrice);
            }

            if (nextDiscount !== null && nextDiscount > 0) {
              nextDiscount = Math.max(0, Math.round(nextDiscount * factor));
              if (roundPrices) nextDiscount = roundToThousand(nextDiscount);
            }
          } else if (operation === "fixed_price") {
            const delta = Number(fixedChange);
            // محافظت از کالاهای ۰ تومانی در برابر افزایش/کاهش مبلغ ثابت
            if (nextPrice > 0) {
              nextPrice = Math.max(0, nextPrice + delta);
              if (roundPrices) nextPrice = roundToThousand(nextPrice);
            }

            if (nextDiscount !== null && nextDiscount > 0) {
              nextDiscount = Math.max(0, nextDiscount + delta);
              if (roundPrices) nextDiscount = roundToThousand(nextDiscount);
            }
          } else if (operation === "set_stock") {
            nextStock = Math.max(0, Number(stockValue));
          } else if (operation === "clear_discounts") {
            nextDiscount = null;
          }

          // اطمینان از اینکه قیمت تخفیف‌خورده بزرگ‌تر یا مساوی قیمت پایه نباشد
          if (
            nextDiscount !== null &&
            (nextDiscount <= 0 || (nextPrice > 0 && nextDiscount >= nextPrice))
          ) {
            nextDiscount = null;
          }

          const updatedMeta = {
            images: unpacked.images || [unpacked.image || "/placeholder.png"],
            specs: unpacked.specs || {},
            warranty: unpacked.warranty ?? "",
            sku: unpacked.sku,
            brand: unpacked.brand || "",
            purchase_price: unpacked.purchase_price ?? 0,
            discount_price: nextDiscount,
            color_options: Array.isArray(unpacked.color_options) ? unpacked.color_options : [],
            meta_title: unpacked.meta_title || rawRow.title,
            meta_description: unpacked.meta_description || "",
            short_description: unpacked.short_description || "",
          };

          const packagedDesc = packProductDescription(
            unpacked.description || "",
            updatedMeta
          );

          const { error: upErr } = await supabaseAdmin
            .from("products")
            .update({
              price: nextPrice,
              discount_price: nextDiscount,
              stock: nextStock,
              is_available: nextStock > 0,
              description: packagedDesc,
              updated_at: new Date().toISOString(),
            })
            .eq("id", rawRow.id);

          return !upErr;
        })
      );

      updatedCount += results.filter(Boolean).length;
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `✓ عملیات دسته‌جمعی روی ${updatedCount} محصول با موفقیت انجام و در دیتابیس ذخیره شد.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در عملیات دسته‌جمعی." },
      { status: 500 }
    );
  }
}
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

    for (const rawRow of targets) {
      const unpacked = unpackProductRow(rawRow);
      let nextPrice = Number(rawRow.price || 0);
      let nextDiscount =
        rawRow.discount_price && Number(rawRow.discount_price) > 0
          ? Number(rawRow.discount_price)
          : null;
      let nextStock = Number(rawRow.stock ?? 0);

      if (operation === "percent_price") {
        const factor = 1 + Number(percentChange) / 100;
        nextPrice = Math.max(0, Math.round(nextPrice * factor));
        if (roundPrices) nextPrice = roundToThousand(nextPrice);

        if (nextDiscount !== null) {
          nextDiscount = Math.max(0, Math.round(nextDiscount * factor));
          if (roundPrices) nextDiscount = roundToThousand(nextDiscount);
        }
      } else if (operation === "fixed_price") {
        const delta = Number(fixedChange);
        nextPrice = Math.max(0, nextPrice + delta);
        if (roundPrices) nextPrice = roundToThousand(nextPrice);

        if (nextDiscount !== null) {
          nextDiscount = Math.max(0, nextDiscount + delta);
          if (roundPrices) nextDiscount = roundToThousand(nextDiscount);
        }
      } else if (operation === "set_stock") {
        nextStock = Math.max(0, Number(stockValue));
      } else if (operation === "clear_discounts") {
        nextDiscount = null;
      }

      const updatedMeta = {
        images: unpacked.images || [unpacked.image || "/placeholder.png"],
        specs: unpacked.specs || {},
        warranty: unpacked.warranty || "۱۸ ماه گارانتی اصالت طلایی",
        sku: unpacked.sku,
        brand: unpacked.brand || "",
        purchase_price: unpacked.purchase_price || Math.round(nextPrice * 0.7),
        discount_price: nextDiscount,
        meta_title: unpacked.meta_title || rawRow.title,
        meta_description: unpacked.meta_description || "",
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

      if (!upErr) updatedCount++;
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

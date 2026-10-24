// File Path: app/api/admin/import-products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { packProductDescription } from "@/lib/productUnpacker";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// فیلتر هوشمند استخراج عدد از دیتای کثیف (حذف تومان، کاما، اسلش و تبدیل اعداد فارسی)
function extractNumber(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const persianToEnglish = String(val).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
  const numericString = persianToEnglish.replace(/[^0-9]/g, "");
  return Number(numericString) || 0;
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = await req.json();
    const products = Array.isArray(body) ? body : body.products;
    // حاشیه سود پیش‌فرض در صورتی که قیمت فروش خالی باشد
    const profitMargin = Number(body.profitMargin || 20); 

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, message: "لیست محصولات معتبر نیست." }, { status: 400 });
    }

    let upsertedCount = 0;

    for (const p of products) {
      // نگاشت پویای ستون‌های فایل تامین‌کننده (دراپ‌شیپینگ) به فیلدهای استاندارد
      const rawTitle = p["نام محصول"] || p["نام محصول "] || p.title || p.name;
      const rawSku = p["کد محصول"] || p["کد محصول "] || p.sku || `AXN-${Date.now()}`;
      const rawPurchasePrice = p["قیمت تک دراپ"] || p["قیمت تک دراپ "] || p.purchase_price;
      const rawStock = p["میانگین موجودی"] || p["میانگین موجودی "] || p.stock;
      const rawShipping = p["نحوه ارسال"] || p.shipping_method || "ارسال سریع";
      const rawCategory = p["دسته بندی"] || p.category || "تجهیزات دیجیتال";

      if (!rawTitle) continue;

      const title = String(rawTitle).trim();
      const sku = String(rawSku).trim();
      
      // قیمت دراپ‌شیپینگ (مخفی برای کلاینت، ذخیره در بهای تمام شده)
      const purchasePrice = extractNumber(rawPurchasePrice);
      
      // قیمت نهایی برای مشتری
      let sellingPrice = extractNumber(p["قیمت فروش"] || p["قیمت فروش "]);
      if (sellingPrice === 0 && purchasePrice > 0) {
        sellingPrice = purchasePrice + Math.round((purchasePrice * profitMargin) / 100);
      }

      // تفسیر وضعیت موجودی (تبدیل "ناموجود" به 0 و "موجود" به عدد پیش‌فرض)
      let stock = 0;
      const stockStr = String(rawStock).trim();
      if (stockStr !== "ناموجود" && stockStr !== "0" && stockStr !== "") {
        stock = extractNumber(stockStr);
        if (stock === 0 && stockStr.includes("موجود")) stock = 10;
      }

      const metaDesc = `خرید آنلاین ${title} با ضمانت اصالت و امکان ارسال از طریق ${rawShipping} در فروشگاه آکسون کور.`;

      const payload = {
        title,
        name: title,
        sku,
        category: rawCategory,
        price: sellingPrice,
        purchase_price: purchasePrice,
        stock,
        is_available: stock > 0,
        image_url: p.image_url || p.Photo_Filename || "/placeholder.png",
        meta_description: metaDesc,
        meta_title: `خرید و قیمت ${title} | آکسون کور`,
        updated_at: new Date().toISOString(),
      };

      // جلوگیری از ایجاد محصولات تکراری با بررسی کد کالا (UPSERT Logic)
      const { data: existing } = await supabaseAdmin
        .from("products")
        .select("id, description, images, media_gallery")
        .eq("sku", sku)
        .maybeSingle();

      if (existing) {
        const packagedDesc = packProductDescription(existing.description || metaDesc, {
          ...payload,
          images: existing.images || [payload.image_url],
          warranty: "تضمین سلامت فیزیکی کالا",
        });

        await supabaseAdmin
          .from("products")
          .update({ ...payload, description: packagedDesc })
          .eq("id", existing.id);
        upsertedCount++;
      } else {
        const newId = randomUUID();
        const packagedDesc = packProductDescription(metaDesc, {
          ...payload,
          images: [payload.image_url],
          warranty: "تضمین سلامت فیزیکی کالا",
        });

        await supabaseAdmin
          .from("products")
          .insert([{ 
            ...payload, 
            id: newId, 
            description: packagedDesc,
            created_at: new Date().toISOString() 
          }]);
        upsertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `تعداد ${upsertedCount} محصول به صورت هوشمند از فایل آپلودی در سیستم ثبت/به‌روزرسانی شد.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

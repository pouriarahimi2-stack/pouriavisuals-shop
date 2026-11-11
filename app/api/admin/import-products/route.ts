// File Path: app/api/admin/import-products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { unpackProductRow, packProductDescription } from "@/lib/productUnpacker";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// ۱. تعریف دقیق ساختار گالری برای تایپ‌اسکریپت (حذف کامل any)
interface MediaGalleryItem {
  url: string;
  alt?: string;
  is_primary?: boolean;
  sort_order?: number;
}

// ۲. تعریف ساختار محصولات ورودی
interface ImportProduct {
  title?: string;
  name?: string;
  sku?: string;
  purchase_price?: string | number;
  price?: string | number;
  stock?: string | number;
  category?: string;
  description?: string;
  image_url?: string;
  Photo_Filename?: string;
  media_gallery?: MediaGalleryItem[];
  [key: string]: unknown; // اجازه به سایر فیلدهای ناشناخته اکسل اما به صورت ایمن
}

function extractNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const normalizedDigits = String(val)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
  const numericString = normalizedDigits.replace(/[^0-9]/g, "");
  return Number(numericString) || 0;
}

function extractPriceFromText(text: string): number {
  const match = text.match(/(?:قیمت|مبلغ|بها)[\s\S]*?([\d,۰-۹٠-٩/]+)\s*(?:تومان|ت|هزار تومان)/i);
  if (match && match[1]) {
    return extractNumber(match[1]);
  }
  return 0;
}

function parseTelegramJsonToProducts(telegramJson: any): ImportProduct[] {
  const products: ImportProduct[] = [];
  let currentProduct: ImportProduct | null = null;
  const topics: Record<string, string> = {};

  if (!telegramJson.messages || !Array.isArray(telegramJson.messages)) return products;

  telegramJson.messages.forEach((m: any) => {
    if (m.action === "topic_created" && m.title) {
      topics[m.id] = m.title;
    }
  });

  telegramJson.messages.forEach((m: any) => {
    if (m.type !== "message") return;

    let textContent = "";
    if (Array.isArray(m.text)) {
      textContent = m.text.map((t: any) => (typeof t === "string" ? t : t.text)).join("");
    } else {
      textContent = m.text || "";
    }

    if (textContent.trim() !== "") {
      if (currentProduct) products.push(currentProduct);

      const lines = textContent.split("\n").filter((l: string) => l.trim());
      const rawTitle = lines[0] || "کالای دیجیتال";
      const cleanTitle = rawTitle.replace(/[^\w\s\u0600-\u06FF]/g, "").trim();

      const catName = topics[m.reply_to_message_id] || "دسته عمومی";

      currentProduct = {
        title: cleanTitle,
        description: textContent,
        category: catName,
        price: extractPriceFromText(textContent),
        stock: 10,
        media_gallery: [],
        sku: `TG-${m.id}`,
      };

      if (m.photo && currentProduct.media_gallery) {
        currentProduct.media_gallery.push({
          url: `/${m.photo}`,
          alt: cleanTitle,
          is_primary: true,
          sort_order: 1,
        });
      }
    } else if (currentProduct && m.photo && currentProduct.media_gallery) {
      currentProduct.media_gallery.push({
        url: `/${m.photo}`,
        alt: currentProduct.title + " - تصویر " + (currentProduct.media_gallery.length + 1),
        is_primary: false,
        sort_order: currentProduct.media_gallery.length + 1,
      });
    }
  });

  if (currentProduct) products.push(currentProduct);
  return products;
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = await req.json();
    let products: ImportProduct[] = [];
    const profitMargin = Number(body.profitMargin || 20);

    if (body.type === "private_supergroup" || body.messages) {
      products = parseTelegramJsonToProducts(body);
    } else {
      products = Array.isArray(body) ? body : body.products;
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, message: "هیچ محصولی جهت ایمپورت یافت نشد." }, { status: 400 });
    }

    const { data: existingRows } = await supabaseAdmin.from("products").select("*");
    const unpackedExisting = (existingRows || []).map(unpackProductRow);

    let upsertedCount = 0;

    for (const p of products) {
      // پشتیبانی از کلیدهای فارسی و انگلیسی
      const rawTitle = p["نام محصول"] || p["نام محصول "] || p.title || p.name;
      const rawSku =
        p["کد محصول"] ||
        p["کد محصول "] ||
        p.sku ||
        `AXN-${Date.now()}-${Math.random().toString(36).slice(-4)}`;
      const rawPurchasePrice = p["قیمت تک دراپ"] || p["قیمت تک دراپ "] || p.purchase_price || 0;
      const rawStock = p["میانگین موجودی"] || p["میانگین موجودی "] || p.stock || 10;
      const rawCategory = p["دسته بندی"] || p["دسته‌بندی"] || p.category || "تجهیزات دیجیتال";

      if (!rawTitle) continue;

      const title = String(rawTitle).trim();
      const sku = String(rawSku).trim();

      const purchasePrice = extractNumber(rawPurchasePrice);

      let sellingPrice = extractNumber(p["قیمت فروش"] || p["قیمت فروش "] || p.price);
      if (sellingPrice === 0 && purchasePrice > 0) {
        sellingPrice = purchasePrice + Math.round((purchasePrice * profitMargin) / 100);
      }

      let stock = 0;
      const stockStr = String(rawStock).trim();
      if (!stockStr.includes("ناموجود") && !stockStr.includes("اتمام") && stockStr !== "0" && stockStr !== "") {
        stock = extractNumber(stockStr);
        if (stock === 0 && stockStr.includes("موجود")) stock = 10;
      }

      const existing = unpackedExisting.find(
        (ex: any) =>
          (sku && ex.sku && String(ex.sku).toLowerCase() === sku.toLowerCase()) ||
          String(ex.title || "").trim().toLowerCase() === title.toLowerCase()
      );

      // اعمال اینترفیس دقیق برای گالری نهایی
      let finalGallery: MediaGalleryItem[] = [];
      if (Array.isArray(p.media_gallery) && p.media_gallery.length > 0) {
        finalGallery = p.media_gallery;
      } else {
        const fallbackImg = String(
          p.image_url || p.Photo_Filename || existing?.image || "/placeholder.png"
        );
        finalGallery = [{ url: fallbackImg, alt: title, is_primary: true, sort_order: 1 }];
      }

      const primaryImage =
        finalGallery.find((g: MediaGalleryItem) => g.is_primary)?.url ||
        finalGallery[0]?.url ||
        "/placeholder.png";

      const cleanDesc = String(p.description || existing?.description || "")
        .replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "")
        .trim();

      const metaDesc = cleanDesc
        ? cleanDesc.slice(0, 155)
        : `خرید آنلاین ${title} با ضمانت اصالت در فروشگاه آکسون کور.`;

      const metaTitle = `خرید و قیمت ${title} | آکسون کور`;
      const imagesList = finalGallery.map((g: MediaGalleryItem) => g.url).filter(Boolean);

      const mediaMeta = {
        images: imagesList.length > 0 ? imagesList : [primaryImage],
        specs: existing?.specs || {},
        warranty: String(p["گارانتی"] || p.warranty || existing?.warranty || "").trim(),
        sku,
        brand: String(p["برند"] || p.brand || existing?.brand || "").trim(),
        purchase_price: purchasePrice,
        discount_price: existing?.discount_price ?? null,
        color_options: existing?.color_options || [],
        meta_title: metaTitle,
        meta_description: metaDesc,
        short_description: cleanDesc.slice(0, 140),
      };

      const packagedDesc = packProductDescription(cleanDesc || metaDesc, mediaMeta);

      const dbPayload: Record<string, any> = {
        title,
        name: title,
        category: String(rawCategory).trim(),
        price: sellingPrice,
        purchase_price: purchasePrice,
        discount_price: existing?.discount_price ?? null,
        stock,
        is_available: stock > 0,
        image_url: primaryImage,
        media_gallery: finalGallery,
        description: packagedDesc,
        color_options: existing?.color_options || [],
        shipping_type: existing?.shipping_type || "both",
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error: upErr } = await supabaseAdmin
          .from("products")
          .update(dbPayload)
          .eq("id", existing.id);
        if (!upErr) upsertedCount++;
      } else {
        const newId = randomUUID();
        const { error: insErr } = await supabaseAdmin
          .from("products")
          .insert([
            {
              ...dbPayload,
              id: newId,
              created_at: new Date().toISOString(),
            },
          ]);
        if (!insErr) upsertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `تعداد ${upsertedCount} محصول به صورت هوشمند پردازش و در سیستم ثبت/به‌روزرسانی شد.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
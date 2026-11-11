// File Path: lib/productUnpacker.ts
export function unpackProductRow(p: any) {
  if (!p || typeof p !== "object") return p;
  let rawDesc = String(p.description || "");
  let meta: Record<string, any> = {};
  const match = rawDesc.match(/<!--MEDIA_METADATA:([\s\S]*?)-->/);
  if (match && match[1]) {
    try {
      meta = JSON.parse(match[1]);
    } catch {}
    rawDesc = rawDesc.replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "").trim();
  }

  const primaryImg =
    p.image ||
    p.image_url ||
    (Array.isArray(p.images) && p.images[0]) ||
    (Array.isArray(meta.images) && meta.images[0]) ||
    "/placeholder.png";

  const imagesArr =
    Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : Array.isArray(meta.images) && meta.images.length > 0
      ? meta.images
      : [primaryImg];

  const basePrice = Math.max(0, Number(p.price || 0));

  // اگر ستون discount_price در دیتابیس موجود باشد (حتی اگر null شده باشد)، اولویت با ستون دیتابیس است
  const rawDiscount =
    p.discount_price !== undefined
      ? p.discount_price !== null && Number(p.discount_price) > 0
        ? Number(p.discount_price)
        : null
      : meta.discount_price && Number(meta.discount_price) > 0
      ? Number(meta.discount_price)
      : null;

  // قیمت تخفیف‌خورده فقط زمانی معتبر است که کمتر از قیمت پایه باشد
  const discountPrice =
    rawDiscount !== null && (basePrice === 0 || rawDiscount < basePrice)
      ? rawDiscount
      : null;

  const effectiveSellingPrice =
    discountPrice && discountPrice < basePrice ? discountPrice : basePrice;

  const purchasePrice =
    p.purchase_price !== undefined && p.purchase_price !== null && Number(p.purchase_price) > 0
      ? Number(p.purchase_price)
      : meta.purchase_price !== undefined && meta.purchase_price !== null && Number(meta.purchase_price) > 0
      ? Number(meta.purchase_price)
      : effectiveSellingPrice > 0
      ? Math.round(effectiveSellingPrice * 0.7)
      : 0;

  const stock = p.stock !== undefined && p.stock !== null ? Math.max(0, Number(p.stock)) : 10;

  // پاکسازی کاراکترهای نامرئی (\u200B) از نام برند و گارانتی
  const cleanBrand = String(p.brand || meta.brand || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();

  const cleanWarranty = String(p.warranty ?? meta.warranty ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();

  const colorOptions =
    Array.isArray(p.color_options) && p.color_options.length > 0
      ? p.color_options
      : Array.isArray(meta.color_options)
      ? meta.color_options
      : [];

  return {
    ...p,
    id: String(p.id),
    title: p.title || p.name || "کالای دیجیتال",
    name: p.name || p.title || "کالای دیجیتال",
    sku: p.sku || meta.sku || "SKU-" + String(p.id).slice(-6).toUpperCase(),
    brand: cleanBrand,
    category: p.category || "کالای دیجیتال",
    price: basePrice,
    discount_price: discountPrice,
    discountPrice: discountPrice ?? undefined,
    purchase_price: purchasePrice,
    stock,
    is_available: p.is_available !== false && stock > 0,
    isAvailable: p.is_available !== false && stock > 0,
    image: primaryImg,
    image_url: primaryImg,
    images: imagesArr,
    description: rawDesc,
    short_description: p.short_description || meta.short_description || rawDesc.slice(0, 140),
    warranty: cleanWarranty,
    meta_title: p.meta_title || meta.meta_title || p.title || p.name || "",
    meta_description: p.meta_description || meta.meta_description || rawDesc.slice(0, 155),
    specs: (typeof p.specs === "object" && p.specs) || meta.specs || {},
    color_options: colorOptions,
    // روش ارسال — از ستون DB
    shipping_type: (p.shipping_type as "post" | "tipax" | "both" | undefined) || "both",
  };
}

export function packProductDescription(cleanDesc: string, metaObj: Record<string, any>): string {
  const sanitizedDesc = String(cleanDesc || "")
    .replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "")
    .trim();
  return sanitizedDesc + "\n\n<!--MEDIA_METADATA:" + JSON.stringify(metaObj) + "-->";
}
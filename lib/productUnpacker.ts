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

  const basePrice = Number(p.price || 0);
  const discountPrice =
    p.discount_price !== undefined && p.discount_price !== null && Number(p.discount_price) > 0
      ? Number(p.discount_price)
      : meta.discount_price && Number(meta.discount_price) > 0
      ? Number(meta.discount_price)
      : null;

  const effectiveSellingPrice = discountPrice && discountPrice < basePrice ? discountPrice : basePrice;
  const purchasePrice = Number(
    p.purchase_price ?? meta.purchase_price ?? Math.round(effectiveSellingPrice * 0.7)
  );

  const stock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 10;

  return {
    ...p,
    id: String(p.id),
    title: p.title || p.name || "کالای دیجیتال",
    name: p.name || p.title || "کالای دیجیتال",
    sku: p.sku || meta.sku || "SKU-" + String(p.id).slice(-6).toUpperCase(),
    brand: p.brand || meta.brand || "Axon",
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
    warranty: p.warranty || meta.warranty || "۱۸ ماه گارانتی اصالت طلایی",
    meta_title: p.meta_title || meta.meta_title || p.title || p.name || "",
    meta_description: p.meta_description || meta.meta_description || rawDesc.slice(0, 155),
    specs: (typeof p.specs === "object" && p.specs) || meta.specs || {},
  };
}

export function packProductDescription(cleanDesc: string, metaObj: Record<string, any>): string {
  const sanitizedDesc = String(cleanDesc || "")
    .replace(/<!--MEDIA_METADATA:[\s\S]*?-->/g, "")
    .trim();
  return sanitizedDesc + "\n\n<!--MEDIA_METADATA:" + JSON.stringify(metaObj) + "-->";
}

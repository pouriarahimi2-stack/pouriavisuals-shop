// File Path: scripts/migrate-product-images.ts
// اجرا: npx ts-node scripts/migrate-product-images.ts
// این اسکریپت تصاویر base64 را از دیتابیس خوانده، به Supabase Storage آپلود می‌کند
// و URL واقعی را در فیلد image_url ذخیره می‌کند

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateImages() {
  console.log("🔄 شروع migration تصاویر base64 → Supabase Storage...");

  // دریافت محصولاتی که image_url ندارند یا base64 دارند
  const { data: products, error } = await supabase
    .from("products")
    .select("id, images, image, image_url")
    .order("created_at", { ascending: true });

  if (error) { console.error("خطا:", error.message); process.exit(1); }
  if (!products?.length) { console.log("محصولی یافت نشد"); return; }

  console.log(`📦 ${products.length} محصول یافت شد`);

  let migrated = 0;
  let skipped  = 0;

  for (const p of products) {
    // اگر image_url معتبر دارد، skip
    if (p.image_url && p.image_url.startsWith("http") && !p.image_url.startsWith("data:")) {
      skipped++;
      continue;
    }

    // پیدا کردن base64
    let base64Data: string | null = null;
    let mimeType = "image/jpeg";

    const tryExtract = (val: unknown): string | null => {
      if (!val) return null;
      let str = String(val);
      if (str.startsWith("data:image/")) {
        const match = str.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) { mimeType = match[1]; return match[2]; }
      }
      if (str.length > 200 && /^[A-Za-z0-9+/=]+$/.test(str.trim())) {
        return str.trim();
      }
      return null;
    };

    base64Data = tryExtract(p.image);

    if (!base64Data && p.images) {
      let imgs = p.images;
      if (typeof imgs === "string") {
        try { imgs = JSON.parse(imgs); } catch { imgs = null; }
      }
      if (Array.isArray(imgs) && imgs.length > 0) {
        base64Data = tryExtract(imgs[0]);
      }
    }

    if (!base64Data) { skipped++; continue; }

    try {
      const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      const fileName = `products/${p.id}/main.${ext}`;
      const buffer = Buffer.from(base64Data, "base64");

      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(fileName, buffer, { contentType: mimeType, upsert: true });

      if (upErr) { console.error(`❌ ${p.id}: ${upErr.message}`); continue; }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      await supabase.from("products")
        .update({ image_url: urlData.publicUrl })
        .eq("id", p.id);

      console.log(`✅ ${p.id}: ${urlData.publicUrl}`);
      migrated++;
    } catch (e: unknown) {
      console.error(`❌ ${p.id}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`\n✅ migration کامل: ${migrated} منتقل شد، ${skipped} skip شد`);
}

migrateImages().catch(console.error);

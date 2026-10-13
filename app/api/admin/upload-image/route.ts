// File Path: app/api/admin/upload-image/route.ts
// آپلود تصویر محصول به Supabase Storage bucket: product-images
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const BUCKET = "product-images";

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productId = String(formData.get("product_id") || "").trim();

    if (!file) {
      return NextResponse.json({ success: false, message: "فایلی ارسال نشده." }, { status: 400 });
    }

    // بررسی نوع فایل
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "فقط تصاویر JPG، PNG، WebP و GIF مجاز هستند." },
        { status: 400 }
      );
    }

    // بررسی حجم فایل
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "حجم فایل نباید بیشتر از ۵ مگابایت باشد." },
        { status: 400 }
      );
    }

    // بررسی پسوند
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json(
        { success: false, message: "پسوند فایل نامعتبر است." },
        { status: 400 }
      );
    }

    // نام یکتای فایل
    const safeName = productId
      ? `${productId}/${Date.now()}${ext}`
      : `misc/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // آپلود به Supabase Storage
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(safeName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error("[upload-image] storage error:", uploadErr.message);
      return NextResponse.json(
        { success: false, message: "خطا در آپلود: " + uploadErr.message },
        { status: 500 }
      );
    }

    // دریافت URL عمومی
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(safeName);

    const publicUrl = urlData?.publicUrl || "";

    // بروزرسانی image_url در جدول products اگر product_id داشته باشیم
    if (productId && /^[0-9a-f-]{36}$/i.test(productId)) {
      // دریافت رکورد فعلی
      const { data: existing } = await supabaseAdmin
        .from("products")
        .select("description")
        .eq("id", productId)
        .maybeSingle();

      await supabaseAdmin
        .from("products")
        .update({
          image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      // بروزرسانی لیست images در متادیتا
      if (existing) {
        const oldDesc = String(existing.description || "");
        const metaMatch = oldDesc.match(/<!--MEDIA_METADATA:([sS]*?)-->/);
        let meta: Record<string, any> = {};
        if (metaMatch?.[1]) {
          try { meta = JSON.parse(metaMatch[1]); } catch {}
        }
        const cleanDesc = oldDesc.replace(/<!--MEDIA_METADATA:[sS]*?-->/g, "").trim();
        const existingImages: string[] = Array.isArray(meta.images)
          ? meta.images.filter((u: string) => !u.startsWith("data:"))
          : [];
        if (!existingImages.includes(publicUrl)) existingImages.unshift(publicUrl);
        meta.images = existingImages;
        const newDesc = cleanDesc + "\n\n<!--MEDIA_METADATA:" + JSON.stringify(meta) + "-->";
        await supabaseAdmin
          .from("products")
          .update({ description: newDesc })
          .eq("id", productId);
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "تصویر با موفقیت آپلود شد.",
    });
  } catch (err: any) {
    console.error("[upload-image] catch:", err?.message);
    return NextResponse.json(
      { success: false, message: err?.message || "خطای سرور داخلی" },
      { status: 500 }
    );
  }
}

// File Path: app/api/admin/upload-image/route.ts
// آپلود تصویر به Supabase Storage و ذخیره URL در جدول products
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // احراز هویت ادمین
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("product_id") as string | null;

    if (!file || !productId) {
      return NextResponse.json(
        { error: "file و product_id الزامی است" },
        { status: 400 }
      );
    }

    // بررسی نوع فایل
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "فقط فایل تصویر مجاز است" },
        { status: 400 }
      );
    }

    // محدودیت حجم: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "حجم فایل نباید بیشتر از 5MB باشد" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: "فرمت فایل پشتیبانی نمی‌شود" },
        { status: 400 }
      );
    }

    const fileName = `products/${productId}/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // آپلود به Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("product-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload-image] storage error:", uploadError.message);
      return NextResponse.json(
        { error: "خطا در آپلود تصویر: " + uploadError.message },
        { status: 500 }
      );
    }

    // دریافت URL عمومی
    const { data: urlData } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // ذخیره URL در جدول products
    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", productId);

    if (updateError) {
      console.error("[upload-image] db update error:", updateError.message);
      return NextResponse.json(
        { error: "تصویر آپلود شد اما خطا در ذخیره URL: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "تصویر با موفقیت آپلود شد",
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطای ناشناخته";
    console.error("[upload-image] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

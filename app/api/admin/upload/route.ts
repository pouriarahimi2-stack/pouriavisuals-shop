import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // حداکثر ۵ مگابایت

export async function POST(req: NextRequest) {
  try {
    // ۱. بررسی نشست مدیریت
    const adminToken = req.cookies.get("admin_session_token")?.value;
    if (!adminToken || adminToken.length < 20) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز. لطفا ابتدا وارد پنل شوید." },
        { status: 401 }
      );
    }

    // ۲. استخراج فایل از FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucketName = (formData.get("bucket") as string) || "products";

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, message: "هیچ فایلی برای بارگذاری دریافت نشد." },
        { status: 400 }
      );
    }

    // ۳. بررسی اندازه فایل
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "حجم فایل ارسالی فراتر از حد مجاز (حداکثر ۵ مگابایت) است." },
        { status: 400 }
      );
    }

    // ۴. اعتبارسنجی پسوند و نوع داده
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "فرمت فایل نامعتبر است. فقط تصاویر (WebP, PNG, JPG, SVG, GIF) مجاز هستند.",
        },
        { status: 400 }
      );
    }

    // ۵. نام‌گذاری تصادفی و خنثی‌سازی حملات نام فایل
    const originalExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${originalExt}`;
    const filePath = `uploads/${cleanFileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ۶. ارسال به Supabase Storage با مجوز ادمین
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, message: uploadError.message },
        { status: 500 }
      );
    }

    // ۷. دریافت آدرس عمومی فایل
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: cleanFileName,
      size: file.size,
      mimeType: file.type,
      message: "فایل با موفقیت و بررسی‌های امنیتی ذخیره گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در پردازش آپلود." },
      { status: 500 }
    );
  }
}

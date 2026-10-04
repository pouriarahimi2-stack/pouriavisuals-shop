// File Path: app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

function sanitizeSvgSafely(rawSvg: string): string {
  let clean = String(rawSvg || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript\s*:/gi, "");

  if (clean.includes("<svg") && !clean.includes("xmlns=")) {
    clean = clean.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return clean;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetBucket = (formData.get("bucket") as string) || "products";

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, message: "فایلی برای آپلود ارسال نشده است." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "حجم فایل نباید بیش از ۵ مگابایت باشد." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, message: "فرمت فایل تصویری مجاز نیست." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    if (file.type === "image/svg+xml") {
      const cleanSvg = sanitizeSvgSafely(buffer.toString("utf8"));
      buffer = Buffer.from(cleanSvg, "utf8");
    }

    // برای لوگوها و آیکون‌ها، بازگرداندن مستقیم Data URI با حفظ کامل شفافیت و وکتور
    if (targetBucket === "site-assets" || file.size <= 350 * 1024) {
      const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json(
        {
          success: true,
          url: base64Data,
          timestamp: Date.now(),
          message: "✓ تصویر جدید با موفقیت پردازش شد.",
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const originalExt =
      file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${originalExt}`;
    const filePath = `uploads/${cleanFileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("products")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: base64Data,
        fileName: cleanFileName,
      });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("products")
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: cleanFileName,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در آپلود فایل." },
      { status: 500 }
    );
  }
}

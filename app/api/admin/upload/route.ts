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
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
]);

function sanitizeSvgContent(svgText: string): string {
  return svgText
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "فایلی برای آپلود انتخاب نشده است." },
        { status: 400 }
      );
    }

    const mime = String(file.type || "").toLowerCase();
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const isSvg = mime === "image/svg+xml" || ext === "svg";
    const isGif = mime === "image/gif" || ext === "gif";

    if (!ALLOWED_MIME_TYPES.has(mime) && !isSvg && !isGif) {
      return NextResponse.json(
        {
          success: false,
          message:
            "فرمت فایل مجاز نیست. فرمت‌های مجاز: JPG, PNG, WebP, AVIF, GIF, SVG, MP4, WebM",
        },
        { status: 400 }
      );
    }

    // سقف مجاز ۸ مگابایت برای جلوگیری از افت سرعت شبکه
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "حجم فایل نباید بیشتر از ۸ مگابایت باشد." },
        { status: 400 }
      );
    }

    let arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    if (isSvg) {
      const cleanSvg = sanitizeSvgContent(buffer.toString("utf8"));
      buffer = Buffer.from(cleanSvg, "utf8");
    }

    const safeFileName = `axon_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}.${ext.replace(/[^a-z0-9]/g, "") || "png"}`;

    const contentType = isSvg
      ? "image/svg+xml"
      : isGif
      ? "image/gif"
      : mime || "image/png";

    // تلاش اول: آپلود در Supabase Storage با کش طولانی‌مدت CDN جهت حداکثر سرعت لود
    try {
      const bucketName = "products";
      const filePath = `backgrounds/${safeFileName}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType,
          cacheControl: "31536000",
          upsert: true,
        });

      if (!upErr) {
        const { data: pubUrl } = supabaseAdmin.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        if (pubUrl?.publicUrl) {
          return NextResponse.json({
            success: true,
            url: pubUrl.publicUrl,
            mime: contentType,
            message: "✓ فایل با موفقیت روی CDN ابری آپلود شد.",
          });
        }
      }
    } catch {}

    // پشتیبان تضمین‌شده: تبدیل به Data URL بهینه در صورت عدم دسترسی به باکت
    const base64Url = `data:${contentType};base64,${buffer.toString("base64")}`;
    return NextResponse.json({
      success: true,
      url: base64Url,
      mime: contentType,
      message: "✓ تصویر/انیمیشن با موفقیت پردازش و آماده نمایش شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در آپلود فایل." },
      { status: 500 }
    );
  }
}

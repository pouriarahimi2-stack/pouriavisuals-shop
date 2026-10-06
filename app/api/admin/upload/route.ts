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
        { success: false, message: "فرمت فایل مجاز نیست." },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "حجم فایل نباید بیشتر از ۸ مگابایت باشد." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    const contentType = isSvg
      ? "image/svg+xml"
      : isGif
      ? "image/gif"
      : mime || "image/png";

    // تحویل مستقیم SVG به صورت Data URI برای لود آنی در ایران بدون نیاز به ارتباط با دامنه خارجی
    if (isSvg) {
      const cleanSvg = sanitizeSvgContent(buffer.toString("utf8"));
      buffer = Buffer.from(cleanSvg, "utf8");
      const dataUrl = `data:image/svg+xml;base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        mime: contentType,
      });
    }

    const safeFileName = `axon_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}.${ext.replace(/[^a-z0-9]/g, "") || "png"}`;

    try {
      const bucketName = "products";
      const filePath = `uploads/${safeFileName}`;
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
            url: "/api/media-proxy?url=" + encodeURIComponent(pubUrl.publicUrl),
            rawUrl: pubUrl.publicUrl,
            mime: contentType,
          });
        }
      }
    } catch {}

    const base64Url = `data:${contentType};base64,${buffer.toString("base64")}`;
    return NextResponse.json({
      success: true,
      url: base64Url,
      mime: contentType,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در آپلود فایل." },
      { status: 500 }
    );
  }
}

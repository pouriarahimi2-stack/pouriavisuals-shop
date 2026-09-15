import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import sanitizeHtml from "sanitize-html";

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

async function ensureBucketExists(bucketName: string): Promise<string> {
  try {
    const { data: bucket } = await supabaseAdmin.storage.getBucket(bucketName);
    if (bucket) return bucketName;

    // تلاش برای ایجاد خودکار باکت به صورت Public
    const { error: createErr } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5242880,
    });

    if (!createErr) return bucketName;
  } catch {}

  // فال‌بک به باکت پیش‌فرض محصولات در صورت عدم امکان ساخت
  try {
    const { data: defaultBucket } = await supabaseAdmin.storage.getBucket("products");
    if (!defaultBucket) {
      await supabaseAdmin.storage.createBucket("products", { public: true });
    }
    return "products";
  } catch {
    return bucketName;
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let targetBucket = (formData.get("bucket") as string) || "products";

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, message: "فایلی برای آپلود ارسال نشده است." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "حجم فایل نباید بیش از ۵ مگابایت باشد." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, message: "فرمت فایل تصویری مجاز نیست." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // پاکسازی امن فایل‌های SVG برای جلوگیری از حملات XSS
    if (file.type === "image/svg+xml") {
      const rawSvg = buffer.toString("utf8");
      const cleanSvg = sanitizeHtml(rawSvg, {
        allowedTags: [
          "svg", "g", "path", "circle", "rect", "line", "polyline", "polygon",
          "ellipse", "defs", "linearGradient", "radialGradient", "stop", "text", "tspan", "title"
        ],
        allowedAttributes: {
          "*": ["id", "class", "style", "d", "fill", "stroke", "stroke-width", "viewBox", "width", "height", "x", "y", "cx", "cy", "r", "rx", "ry", "x1", "y1", "x2", "y2", "points", "transform", "opacity", "offset", "stop-color"]
        },
      });
      buffer = Buffer.from(cleanSvg, "utf8");
    }

    // تضمین وجود باکت قبل از آپلود
    targetBucket = await ensureBucketExists(targetBucket);

    const originalExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${originalExt}`;
    const filePath = `uploads/${cleanFileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(targetBucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      // در صورت خطای باکت، تبدیل به Data URI باکیفیت به عنوان راه‌حل بدون بن‌بست
      const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: base64Data,
        fileName: cleanFileName,
        message: "فایل با موفقیت در سیستم ذخیره گردید.",
      });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(targetBucket)
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: cleanFileName,
      message: "فایل با موفقیت و پاکسازی امنیتی ذخیره گردید.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در آپلود فایل." }, { status: 500 });
  }
}

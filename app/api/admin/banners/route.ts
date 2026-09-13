import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function checkAdminAuth(req: NextRequest) {
  const adminToken = req.cookies.get("admin_session_token")?.value;
  return Boolean(adminToken && adminToken.length >= 20);
}

async function logAudit(req: NextRequest, action: string, targetId: string, details: any) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "local";

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_username: "admin",
      action,
      target_resource: `banner:${targetId}`,
      details,
      ip_address: clientIp,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[AUDIT_LOG_ERROR]:", err);
  }
}

// اعتبارسنجی امن لینک‌ها جهت جلوگیری از XSS
function isValidUrlOrPath(str?: string | null): boolean {
  if (!str) return true;
  const trimmed = str.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ۱. دریافت بنرها (GET)
export async function GET() {
  try {
    const { data: banners, error } = await supabaseAdmin
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      banners: banners || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در دریافت بنرها." },
      { status: 500 }
    );
  }
}

// ۲. ایجاد بنر جدید (POST)
export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, image_url, link_url, is_active } = body;

    if (!image_url || typeof image_url !== "string" || !isValidUrlOrPath(image_url)) {
      return NextResponse.json(
        { success: false, message: "آدرس تصویر بنر نامعتبر است." },
        { status: 400 }
      );
    }

    if (link_url && !isValidUrlOrPath(link_url)) {
      return NextResponse.json(
        { success: false, message: "آدرس لینک مقصد بنر نامعتبر یا ناامن است." },
        { status: 400 }
      );
    }

    const payload = {
      title: typeof title === "string" ? title.trim() : "",
      image_url: image_url.trim(),
      link_url: link_url ? link_url.trim() : null,
      is_active: is_active !== false,
      created_at: new Date().toISOString(),
    };

    const { data: newBanner, error } = await supabaseAdmin
      .from("banners")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await logAudit(req, "CREATE_BANNER", String(newBanner.id), { title: newBanner.title });

    return NextResponse.json({
      success: true,
      banner: newBanner,
      message: "بنر جدید با موفقیت اضافه شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ثبت بنر." },
      { status: 500 }
    );
  }
}

// ۳. حذف بنر (DELETE)
export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه بنر الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("banners").delete().eq("id", id);
    if (error) throw error;

    await logAudit(req, "DELETE_BANNER", String(id), { deleted_at: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      message: "بنر با موفقیت حذف گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در حذف بنر." },
      { status: 500 }
    );
  }
}

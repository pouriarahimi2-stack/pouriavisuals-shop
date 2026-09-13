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
      target_resource: `news:${targetId}`,
      details,
      ip_address: clientIp,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[AUDIT_LOG_ERROR]:", err);
  }
}

function sanitizeSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^؀-ۿa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

// ۱. واکشی تمام مقالات (GET)
export async function GET() {
  try {
    const { data: news, error } = await supabaseAdmin
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      news: news || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در واکشی مقالات." },
      { status: 500 }
    );
  }
}

// ۲. انتشار مقاله جدید (POST)
export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, slug, excerpt, content, cover_image, tags, is_published } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ success: false, message: "عنوان مقاله الزامی است." }, { status: 400 });
    }

    const generatedSlug = slug ? sanitizeSlug(slug) : sanitizeSlug(title);

    // پالایش پایه‌ای از اسکریپت‌های مخرب
    const cleanContent = typeof content === "string" ? content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") : "";

    const payload = {
      title: title.trim(),
      slug: generatedSlug,
      excerpt: typeof excerpt === "string" ? excerpt.trim() : "",
      content: cleanContent,
      cover_image: typeof cover_image === "string" ? cover_image.trim() : null,
      tags: Array.isArray(tags) ? tags : [],
      is_published: is_published !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newArticle, error } = await supabaseAdmin
      .from("news")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await logAudit(req, "CREATE_NEWS", String(newArticle.id), { title: newArticle.title, slug: generatedSlug });

    return NextResponse.json({
      success: true,
      article: newArticle,
      message: "مقاله جدید با موفقیت منتشر گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ثبت مقاله." },
      { status: 500 }
    );
  }
}

// ۳. ویرایش مقاله (PUT)
export async function PUT(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه مقاله الزامی است." }, { status: 400 });
    }

    if (updates.slug) {
      updates.slug = sanitizeSlug(updates.slug);
    }
    if (updates.content && typeof updates.content === "string") {
      updates.content = updates.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    }
    updates.updated_at = new Date().toISOString();

    const { data: updatedArticle, error } = await supabaseAdmin
      .from("news")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(req, "UPDATE_NEWS", String(id), { updates });

    return NextResponse.json({
      success: true,
      article: updatedArticle,
      message: "مقاله با موفقیت ویرایش شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ویرایش مقاله." },
      { status: 500 }
    );
  }
}

// ۴. حذف مقاله (DELETE)
export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه مقاله الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("news").delete().eq("id", id);
    if (error) throw error;

    await logAudit(req, "DELETE_NEWS", String(id), { deleted_at: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      message: "مقاله با موفقیت حذف شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در حذف مقاله." },
      { status: 500 }
    );
  }
}

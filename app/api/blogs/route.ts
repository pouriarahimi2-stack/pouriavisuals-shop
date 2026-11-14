// File Path: app/api/blogs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeSlug(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const onlyPublished = searchParams.get("published") === "true";

    if (id || slug) {
      const targetKey = decodeURIComponent(String(id || slug || "")).trim();
      let postData: any = null;

      if (UUID_REGEX.test(targetKey)) {
        const { data } = await supabaseAdmin
          .from("posts")
          .select("*")
          .eq("id", targetKey)
          .maybeSingle();
        postData = data;
      }

      if (!postData) {
        const { data } = await supabaseAdmin
          .from("posts")
          .select("*")
          .eq("slug", targetKey)
          .maybeSingle();
        postData = data;
      }

      return NextResponse.json(
        { success: true, post: postData, data: postData },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const { data: posts, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const allPosts = Array.isArray(posts) ? posts : [];
    const filtered = onlyPublished
      ? allPosts.filter((p: any) => p.is_published !== false)
      : allPosts;

    return NextResponse.json(
      { success: true, posts: filtered, data: filtered },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, posts: [], data: [], message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();

    // اکشن تغییر سریع وضعیت انتشار مقاله
    if (body.action === "toggle_publish" && body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("posts")
        .update({
          is_published: Boolean(body.is_published),
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: updated.is_published
          ? "✓ مقاله در مجله سایت و نقشه گوگل منتشر شد."
          : "✓ مقاله به حالت پیش‌نویس تغییر یافت.",
        data: updated,
        post: updated,
      });
    }

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "عنوان و محتوای مقاله الزامی هستند." },
        { status: 400 }
      );
    }

    const baseSlug = normalizeSlug(body.slug || title) || "article-" + Date.now().toString().slice(-5);
    const img = String(body.imageUrl || body.image_url || "/placeholder.png").trim();
    const cleanTextExcerpt = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155);
    const metaDesc = String(
      body.metaDescription || body.meta_description || cleanTextExcerpt || title
    ).trim();

    const isPublished =
      body.isPublished !== undefined
        ? Boolean(body.isPublished)
        : body.is_published !== undefined
        ? Boolean(body.is_published)
        : true;

    const nowIso = new Date().toISOString();

    const payload: Record<string, any> = {
      title,
      slug: baseSlug,
      content,
      category: String(body.category || "راهنمای خرید و بررسی تخصصی").trim(),
      image_url: img,
      meta_description: metaDesc,
      is_published: isPublished,
      updated_at: nowIso,
    };

    if (body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("posts")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "✓ مقاله سئو با موفقیت به‌روزرسانی شد.",
        data: updated,
        post: updated,
      });
    } else {
      // بررسی یکتا بودن نامک (Slug) پیش از درج مقاله جدید
      const { data: existingSlug } = await supabaseAdmin
        .from("posts")
        .select("id")
        .eq("slug", baseSlug)
        .maybeSingle();

      if (existingSlug) {
        payload.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }

      const insertRow = {
        id: randomUUID(),
        ...payload,
        created_at: nowIso,
      };

      const { data: inserted, error } = await supabaseAdmin
        .from("posts")
        .insert([insertRow])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "✓ مقاله سئو با موفقیت در دیتابیس ذخیره و منتشر گردید.",
        data: inserted,
        post: inserted,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه مقاله الزامی است." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "✓ مقاله با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
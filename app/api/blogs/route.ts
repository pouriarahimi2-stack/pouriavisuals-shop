import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (id || slug) {
      let query = supabaseAdmin.from("posts").select("*");
      if (id) query = query.eq("id", id);
      else if (slug) query = query.eq("slug", slug);

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return NextResponse.json({ success: true, post: data, data });
    }

    const { data: posts, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, posts: posts || [], data: posts || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();

    if (!title || !content) {
      return NextResponse.json({ success: false, message: "عنوان و محتوای مقاله الزامی هستند." }, { status: 400 });
    }

    const cleanSlug = String(body.slug || title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const img = body.imageUrl || body.image_url || "/placeholder.png";
    const metaDesc = body.metaDescription || body.meta_description || title;

    const payload = {
      title,
      slug: cleanSlug,
      content,
      category: body.category || "راهنمای خرید و بررسی",
      image_url: img,
      meta_description: metaDesc,
      is_published: body.isPublished !== undefined ? Boolean(body.isPublished) : (body.is_published !== undefined ? Boolean(body.is_published) : true),
      updated_at: new Date().toISOString(),
    };

    if (body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("posts")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "مقاله با موفقیت به‌روزرسانی شد.", data: updated, post: updated });
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("posts")
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "مقاله با موفقیت منتشر گردید.", data: inserted, post: inserted });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
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
      return NextResponse.json({ success: false, message: "شناسه مقاله الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "مقاله با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

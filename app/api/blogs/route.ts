import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [], posts: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const cleanTitle = String(body.title || "").trim();

    if (!cleanTitle) {
      return NextResponse.json({ success: false, message: "عنوان مقاله الزامی است." }, { status: 400 });
    }

    const postId = String(body.id || ("post_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6)));
    const cleanSlug = String(body.slug || cleanTitle)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload: Record<string, any> = {
      id: postId,
      title: cleanTitle,
      slug: cleanSlug,
      content: body.content || "",
      category: body.category || "مقاله تخصصی",
      image_url: body.image_url || body.imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      meta_description: body.meta_description || body.metaDescription || cleanTitle,
      is_published: body.is_published !== false && body.isPublished !== false,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("posts").select("id").eq("id", postId).maybeSingle();

    if (existing) {
      const { data, error } = await supabaseAdmin.from("posts").update(payload).eq("id", postId).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, message: "مقاله با موفقیت به‌روزرسانی شد.", data, post: data });
    } else {
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin.from("posts").insert([payload]).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, message: "مقاله جدید با موفقیت منتشر گردید.", data, post: data });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه مقاله الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "مقاله با موفقیت از پایگاه داده حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

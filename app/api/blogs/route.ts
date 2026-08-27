// File Path: app/api/blogs/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedPosts = (data || []).map((p: any) => ({
      id: String(p.id),
      title: p.title,
      slug: p.slug,
      content: p.content,
      category: p.category || "راهنمای خرید و بررسی",
      imageUrl: p.image_url,
      image_url: p.image_url,
      metaDescription: p.meta_description,
      meta_description: p.meta_description,
      metaKeywords: p.meta_keywords,
      isPublished: p.is_published !== false,
      is_published: p.is_published !== false,
      viewsCount: Number(p.views_count || 0),
      createdAt: p.created_at,
      created_at: p.created_at,
    }));

    return NextResponse.json({ success: true, posts: mappedPosts, data: mappedPosts });
  } catch (error: any) {
    console.error("API Blogs GET Error:", error);
    return NextResponse.json({ success: false, posts: [], data: [], error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cleanSlug = (body.slug || body.title || `post-${Date.now()}`)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload: Record<string, any> = {
      title: body.title.trim(),
      slug: cleanSlug,
      content: body.content,
      category: body.category || "راهنمای خرید و بررسی",
      image_url: body.imageUrl || body.image_url || null,
      meta_description: body.metaDescription || body.meta_description || null,
      meta_keywords: body.metaKeywords || body.meta_keywords || null,
      is_published: body.isPublished !== false && body.is_published !== false,
      updated_at: new Date().toISOString(),
    };

    if (body.id && !String(body.id).startsWith("temp_") && !String(body.id).startsWith("post-")) {
      const { data, error } = await supabaseAdmin
        .from("posts")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, post: data });
    } else {
      const { data, error } = await supabaseAdmin
        .from("posts")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, post: data });
    }
  } catch (error: any) {
    console.error("API Blogs POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
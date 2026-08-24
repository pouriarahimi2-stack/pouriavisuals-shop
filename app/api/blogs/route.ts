import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedPosts = (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content,
      category: p.category,
      imageUrl: p.image_url,
      metaDescription: p.meta_description,
      metaKeywords: p.meta_keywords,
      isPublished: p.is_published,
      published: p.is_published,
      viewsCount: p.views_count,
      createdAt: p.created_at,
    }));

    return NextResponse.json({ success: true, posts: mappedPosts, data: mappedPosts });
  } catch (error: any) {
    console.error("API Blogs GET error:", error);
    return NextResponse.json({ success: false, posts: [], data: [], error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = {
      title: body.title,
      slug: body.slug || body.title.toLowerCase().replace(/\s+/g, "-"),
      content: body.content,
      category: body.category || "عمومی",
      image_url: body.imageUrl || body.image_url || null,
      meta_description: body.metaDescription || body.meta_description || null,
      meta_keywords: body.metaKeywords || body.meta_keywords || null,
      is_published: body.isPublished !== false,
      updated_at: new Date().toISOString(),
    };

    if (body.id) {
      const { data, error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, post: data });
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, post: data });
    }
  } catch (error: any) {
    console.error("API Blogs POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
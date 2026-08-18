import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return NextResponse.json({ success: true, data });
      }
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (err) {
    console.error("API Blogs GET Error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, metaDescription, keywords, category } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, message: "عنوان و متن مقاله الزامی است." }, { status: 400 });
    }

    const newPost = {
      id: `blog_${Date.now()}`,
      title,
      content,
      meta_description: metaDescription || "",
      keywords: keywords || "",
      category: category || "مقاله تخصصی",
      is_visible: true,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { error } = await supabase.from("blogs").insert([newPost]);
      if (error) {
        console.error("Supabase blog insert error:", error);
      }
    }

    return NextResponse.json({
      success: true,
      post: {
        id: newPost.id,
        title: newPost.title,
        content: newPost.content,
        metaDescription: newPost.meta_description,
        keywords: newPost.keywords,
        category: newPost.category,
        isVisible: newPost.is_visible,
        createdAt: new Date().toLocaleDateString("fa-IR"),
      },
    });
  } catch (err) {
    console.error("API Blogs POST Error:", err);
    return NextResponse.json({ success: false, message: "خطا در ثبت مقاله." }, { status: 500 });
  }
}
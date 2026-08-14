import { NextResponse } from "next/server";

// آرایه موقت برای ذخیره مقالات در لایه سرور
let blogPosts: any[] = [];

export async function GET() {
  return NextResponse.json({ success: true, posts: blogPosts });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, metaDescription, keywords, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "عنوان و متن مقاله الزامی است." },
        { status: 400 }
      );
    }

    const newPost = {
      id: Date.now().toString(),
      title,
      metaDescription: metaDescription || "",
      keywords: keywords || "",
      content,
      createdAt: new Date().toLocaleDateString("fa-IR"),
    };

    // افزودن مقاله جدید به ابتدای آرایه
    blogPosts.unshift(newPost);

    return NextResponse.json({
      success: true,
      message: "مقاله با موفقیت منتشر شد!",
      post: newPost,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
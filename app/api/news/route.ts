import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("tech_news")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
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
      return NextResponse.json({ success: false, message: "تیتر خبر الزامی است." }, { status: 400 });
    }

    const newsId = body.id || ("news_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));
    const cleanSlug = String(body.slug || cleanTitle)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload: Record<string, any> = {
      id: newsId,
      title: cleanTitle,
      slug: cleanSlug,
      summary: body.summary ? String(body.summary).trim() : cleanTitle,
      content: body.content ? String(body.content).trim() : "",
      category: body.category || "hardware",
      source_name: body.source_name ? String(body.source_name).trim() : "آکسون تک",
      image_url: body.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      tags: Array.isArray(body.tags) ? body.tags : ["سخت افزار", "مانیتور"],
      is_published: body.is_published !== false,
      trending_score: body.trending_score ? Number(body.trending_score) : 95,
      updated_at: new Date().toISOString(),
    };

    if (body.id) {
      const { data, error } = await supabaseAdmin.from("tech_news").update(payload).eq("id", body.id).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, message: "خبر با موفقیت ویرایش گردید.", data });
    } else {
      payload.published_at = new Date().toISOString();
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin.from("tech_news").insert([payload]).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, message: "خبر با موفقیت منتشر گردید.", data });
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
      return NextResponse.json({ success: false, message: "شناسه خبر الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("tech_news").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "خبر با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

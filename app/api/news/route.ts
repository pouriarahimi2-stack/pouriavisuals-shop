// app/api/news/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = Number(searchParams.get("limit") || 20);

    let query = supabaseAdmin
      .from("tech_news")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanSlug = (body.slug || body.title || `news-${Date.now()}`)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload = {
      title: body.title.trim(),
      slug: cleanSlug,
      summary: body.summary?.trim() || "",
      content: body.content?.trim() || "",
      category: body.category || "gadgets",
      source_name: body.source_name || "جهانی",
      source_url: body.source_url || "",
      image_url: body.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      published_at: new Date().toISOString(),
      trending_score: Number(body.trending_score || 95),
      tags: Array.isArray(body.tags) ? body.tags : ["تکنولوژی"],
      is_published: body.is_published !== false,
      updated_at: new Date().toISOString(),
    };

    if (body.id) {
      const { data, error } = await supabaseAdmin
        .from("tech_news")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
      const { data, error } = await supabaseAdmin
        .from("tech_news")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
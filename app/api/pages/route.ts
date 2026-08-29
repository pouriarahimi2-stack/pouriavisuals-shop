// File Path: app/api/pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "home";

    const { data, error } = await supabaseAdmin
      .from("site_pages")
      .select("*")
      .eq("slug", slug.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, title, sections, content, is_published, meta_description, theme } = body;

    const cleanSlug = (slug || "home").trim().toLowerCase().replace(/\s+/g, "-");

    const payload = {
      id: cleanSlug,
      slug: cleanSlug,
      title: title || "صفحه اختصاصی",
      sections: sections || content || [],
      content: content || sections || [],
      meta_description: meta_description || null,
      theme: theme || {},
      is_published: is_published !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("site_pages")
      .upsert(payload, { onConflict: "slug" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
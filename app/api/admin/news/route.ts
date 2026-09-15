import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("tech_news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      const fallback = await supabaseAdmin.from("news").select("*").order("created_at", { ascending: false });
      return NextResponse.json({ success: true, news: fallback.data || [] });
    }

    return NextResponse.json({ success: true, news: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ success: false, message: "تیتر خبر الزامی است." }, { status: 400 });
    }

    const cleanSlug = String(body.slug || title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload = {
      id: body.id || randomUUID(),
      title,
      slug: cleanSlug,
      summary: body.excerpt || body.summary || title,
      content: body.content || "",
      category: body.category || "hardware",
      source_name: body.source_name || "آکسون تک",
      image_url: body.cover_image || body.image_url || "/placeholder.png",
      tags: Array.isArray(body.tags) ? body.tags : ["فناوری"],
      is_published: body.is_published !== false,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("tech_news").insert([payload]).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, news: data, message: "خبر با موفقیت منتشر شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, message: "شناسه خبر الزامی است." }, { status: 400 });
    }

    const payload = {
      title: body.title,
      slug: body.slug,
      summary: body.excerpt || body.summary,
      content: body.content,
      image_url: body.cover_image || body.image_url,
      tags: body.tags,
      is_published: body.is_published,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("tech_news")
      .update(payload)
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, news: data, message: "خبر با موفقیت بروزرسانی شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه خبر الزامی است." }, { status: 400 });
    }

    await supabaseAdmin.from("tech_news").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "خبر با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

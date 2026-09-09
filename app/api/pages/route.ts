import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { PageBlock } from "@/lib/modularBuilderTypes";
import { seedHomePageIfMissing } from "@/lib/seedHomePage";

export const dynamic = "force-dynamic";

// واکشی کل صفحات ساخته‌شده
export async function GET(req: NextRequest) {
  await seedHomePageIfMissing();
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const { data, error } = await supabaseAdmin
        .from("modular_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ success: true, page: data });
    }

    const { data: list, error } = await supabaseAdmin
      .from("modular_pages")
      .select("id, slug, title, meta_description, is_published, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, pages: list || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ایجاد یا ویرایش صفحه و بلوک‌ها همراه با تریگر وب‌سوکت CDC
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, slug, title, meta_description, blocks, is_published } = body;

    const cleanSlug = String(slug || "").trim().toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\-_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!cleanSlug || !title) {
      return NextResponse.json({ success: false, message: "عنوان صفحه و آدرس (Slug) الزامی است." }, { status: 400 });
    }

    const pageId = id || ("page_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));

    const payload = {
      id: pageId,
      slug: cleanSlug,
      title: String(title).trim(),
      meta_description: meta_description ? String(meta_description).trim() : null,
      blocks: Array.isArray(blocks) ? blocks : [],
      is_published: is_published !== false,
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabaseAdmin.from("modular_pages").select("id").eq("id", pageId).maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin.from("modular_pages").update(payload).eq("id", pageId);
      if (error) throw error;
    } else {
      payload["created_at"] = new Date().toISOString();
      const { error } = await supabaseAdmin.from("modular_pages").insert([payload]);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: "صفحه ماژولار با موفقیت ذخیره شد.", page: payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// حذف کامل صفحه
export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه صفحه الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("modular_pages").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "صفحه با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

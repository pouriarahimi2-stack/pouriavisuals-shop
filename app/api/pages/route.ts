import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    if (slug || id) {
      let query = supabaseAdmin.from("modular_pages").select("*");
      if (id) query = query.eq("id", id);
      else if (slug) query = query.eq("slug", slug.trim().toLowerCase());

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return NextResponse.json({ success: true, page: data, data });
    }

    const { data: pages, error } = await supabaseAdmin
      .from("modular_pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, pages: pages || [], data: pages || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const title = String(body.title || "").trim();
    const rawSlug = String(body.slug || title).trim();

    if (!title || !rawSlug) {
      return NextResponse.json({ success: false, message: "عنوان و نامک صفحه الزامی هستند." }, { status: 400 });
    }

    const cleanSlug = rawSlug
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload = {
      title,
      slug: cleanSlug,
      puck_data: body.puck_data || body.data || { content: [], root: {} },
      is_published: body.is_published !== false,
      updated_at: new Date().toISOString(),
    };

    if (body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("modular_pages")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "صفحه با موفقیت به‌روزرسانی شد.", page: updated });
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("modular_pages")
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "صفحه جدید با موفقیت ایجاد شد.", page: inserted });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه صفحه الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("modular_pages").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "صفحه با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

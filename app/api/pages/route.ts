import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const cleanSlug = String(slug).trim().toLowerCase();
      // تقدم ۱۰۰٪ واکشی از دیتابیس Supabase
      const { data, error } = await supabaseAdmin
        .from("modular_pages")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (data && data.puck_data) {
        return NextResponse.json({ success: true, page: data });
      }

      // فال‌بک لوکال در صورت نبود رکورد دیتابیس
      return NextResponse.json({
        success: true,
        page: { slug: cleanSlug, title: cleanSlug === "home" ? "صفحه اصلی" : cleanSlug, puck_data: null }
      });
    }

    const { data: allPages } = await supabaseAdmin
      .from("modular_pages")
      .select("id, slug, title, is_published, updated_at")
      .order("updated_at", { ascending: false });

    return NextResponse.json({ success: true, pages: allPages || [] });
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
    const { slug, title, puck_data, is_published } = body;
    const cleanSlug = String(slug || "home").trim().toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from("modular_pages")
      .select("id")
      .eq("slug", cleanSlug)
      .maybeSingle();

    const payload: any = {
      slug: cleanSlug,
      title: String(title || cleanSlug).trim(),
      puck_data: puck_data || {},
      is_published: is_published !== false,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error: updErr } = await supabaseAdmin
        .from("modular_pages")
        .update(payload)
        .eq("id", existing.id);
      if (updErr) throw updErr;
    } else {
      payload.created_at = new Date().toISOString();
      const { error: insErr } = await supabaseAdmin
        .from("modular_pages")
        .insert([payload]);
      if (insErr) throw insErr;
    }

    return NextResponse.json({ success: true, message: "صفحه با موفقیت در دیتابیس ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

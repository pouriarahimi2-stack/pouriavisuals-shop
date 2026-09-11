import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

const FALLBACK_PAGES = [
  { id: "sys-home", slug: "home", title: "صفحه اصلی (خانه)" },
  { id: "sys-products", slug: "products", title: "کاتالوگ محصولات و تجهیزات" },
  { id: "sys-news", slug: "news", title: "اخبار تکنولوژی" },
  { id: "sys-blog", slug: "blog", title: "مجله سئو" },
  { id: "sys-about", slug: "about", title: "درباره ما" },
  { id: "sys-contact", slug: "contact", title: "تماس با ما" },
  { id: "sys-track", slug: "track-order", title: "پیگیری سفارش" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const cleanSlug = String(slug).trim().toLowerCase();

      try {
        const { data, error } = await supabaseAdmin
          .from("modular_pages")
          .select("*")
          .eq("slug", cleanSlug)
          .maybeSingle();

        if (!error && data) {
          return NextResponse.json({ success: true, page: data });
        }
      } catch (dbErr) {
        console.warn("DB select fallback warning:", dbErr);
      }

      const defaultTitle = cleanSlug === "home" ? "صفحه اصلی" : cleanSlug;
      return NextResponse.json({
        success: true,
        page: { slug: cleanSlug, title: defaultTitle, puck_data: null }
      });
    }

    try {
      const { data: dbPages, error } = await supabaseAdmin
        .from("modular_pages")
        .select("id, slug, title, is_published, updated_at")
        .order("updated_at", { ascending: false });

      if (!error && Array.isArray(dbPages)) {
        const merged = [...dbPages];
        FALLBACK_PAGES.forEach((fp) => {
          if (!merged.some((p) => p.slug === fp.slug)) {
            merged.push(fp);
          }
        });
        return NextResponse.json({ success: true, pages: merged });
      }
    } catch (e) {
      console.warn("Error fetching all pages:", e);
    }

    return NextResponse.json({ success: true, pages: FALLBACK_PAGES });
  } catch (err: any) {
    return NextResponse.json({ success: true, pages: FALLBACK_PAGES, warning: err.message });
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

    const payload: any = {
      slug: cleanSlug,
      title: String(title || cleanSlug).trim(),
      puck_data: puck_data || {},
      is_published: is_published !== false,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: existing } = await supabaseAdmin
        .from("modular_pages")
        .select("id")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("modular_pages")
          .update(payload)
          .eq("id", existing.id);
      } else {
        payload.id = "page_" + cleanSlug + "_" + Date.now();
        payload.created_at = new Date().toISOString();
        await supabaseAdmin.from("modular_pages").insert([payload]);
      }
    } catch (dbErr: any) {
      console.error("Database upsert error in /api/pages:", dbErr);
      return NextResponse.json({
        success: false,
        message: "خطا در ثبت پایگاه‌داده: " + (dbErr.message || "جدول modular_pages را ایجاد کنید.")
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: "صفحه با موفقیت ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

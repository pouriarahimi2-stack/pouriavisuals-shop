import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export const SYSTEM_PAGES = [
  { id: "sys-home", slug: "home", title: "صفحه اصلی (خانه)" },
  { id: "sys-products", slug: "products", title: "کاتالوگ محصولات و تجهیزات" },
  { id: "sys-news", slug: "news", title: "رادار اخبار تکنولوژی" },
  { id: "sys-blog", slug: "blog", title: "مجله تخصصی و مقالات سئو" },
  { id: "sys-about", slug: "about", title: "درباره استودیو آکسون" },
  { id: "sys-contact", slug: "contact", title: "تماس و مشاوره تخصصی" },
  { id: "sys-track", slug: "track-order", title: "پیگیری مرسولات پستی" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const getRevisions = searchParams.get("revisions");

    // واکشی تاریخچه نسخه‌های یک صفحه
    if (slug && getRevisions === "true") {
      const { data: revs } = await supabaseAdmin
        .from("page_revisions")
        .select("id, created_at")
        .eq("page_slug", slug)
        .order("created_at", { ascending: false })
        .limit(5);

      return NextResponse.json({ success: true, revisions: revs || [] });
    }

    if (slug) {
      const { data } = await supabaseAdmin
        .from("modular_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (data) {
        return NextResponse.json({ success: true, page: data });
      }

      const sys = SYSTEM_PAGES.find((p) => p.slug === slug);
      if (sys) {
        return NextResponse.json({ success: true, page: sys });
      }
    }

    const { data: customPages } = await supabaseAdmin
      .from("modular_pages")
      .select("id, slug, title, is_published, updated_at")
      .order("updated_at", { ascending: false });

    const combined = [...SYSTEM_PAGES];
    (customPages || []).forEach((cp) => {
      if (!combined.some((p) => p.slug === cp.slug)) {
        combined.push(cp);
      }
    });

    return NextResponse.json({ success: true, pages: combined });
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
    const { slug, title, puck_data, is_published, restoreRevisionId } = body;
    const cleanSlug = String(slug || "").trim().toLowerCase();

    // اگر درخواست بازیابی نسخه قبلی باشد
    if (restoreRevisionId) {
      const { data: rev } = await supabaseAdmin
        .from("page_revisions")
        .select("puck_data")
        .eq("id", restoreRevisionId)
        .maybeSingle();

      if (rev && rev.puck_data) {
        await supabaseAdmin
          .from("modular_pages")
          .update({ puck_data: rev.puck_data, updated_at: new Date().toISOString() })
          .eq("slug", cleanSlug);

        return NextResponse.json({ success: true, message: "صفحه با موفقیت به نسخه انتخابی بازگردانی شد.", restoredData: rev.puck_data });
      }
    }

    const payload: any = {
      slug: cleanSlug,
      title: String(title || cleanSlug).trim(),
      puck_data: puck_data || {},
      is_published: is_published !== false,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("modular_pages").select("id").eq("slug", cleanSlug).maybeSingle();

    if (existing) {
      await supabaseAdmin.from("modular_pages").update(payload).eq("id", existing.id);
    } else {
      payload.id = "page_" + Date.now();
      payload.created_at = new Date().toISOString();
      await supabaseAdmin.from("modular_pages").insert([payload]);
    }

    // ثبت اسنپ‌شات در تاریخچه نسخه‌ها
    if (puck_data) {
      try {
        await supabaseAdmin.from("page_revisions").insert([
          { page_slug: cleanSlug, puck_data }
        ]);
      } catch {}
    }

    return NextResponse.json({ success: true, message: "صفحه با موفقیت ذخیره و اسنپ‌شات نسخه ثبت شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

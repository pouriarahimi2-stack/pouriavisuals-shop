import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export const SYSTEM_PAGES = [
  { id: "sys-home", slug: "home", title: "صفحه اصلی (خانه)", meta_description: "مرجع تخصصی مانیتورهای ۵K و استودیو", is_published: true },
  { id: "sys-products", slug: "products", title: "کاتالوگ محصولات و تجهیزات", meta_description: "لیست کامل مانیتورها و سخت‌افزار استودیویی", is_published: true },
  { id: "sys-news", slug: "news", title: "رادار اخبار تکنولوژی", meta_description: "جدیدترین ترندها و مقالات خبری سخت‌افزار", is_published: true },
  { id: "sys-blog", slug: "blog", title: "مجله تخصصی و مقالات سئو", meta_description: "راهنمای خرید، کالیبراسیون و تحلیل پنل‌ها", is_published: true },
  { id: "sys-about", slug: "about", title: "درباره استودیو آکسون", meta_description: "استانداردها، تعهدات و گارانتی طلایی ۱۸ ماهه", is_published: true },
  { id: "sys-contact", slug: "contact", title: "تماس و مشاوره تخصصی", meta_description: "ارتباط با کارشناسان تدوین و پردازش رنگ", is_published: true },
  { id: "sys-track", slug: "track-order", title: "پیگیری مرسولات پستی", meta_description: "استعلام ۲۴ رقمی بارنامه پیشتاز مرسولات", is_published: true }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const { data } = await supabaseAdmin
        .from("modular_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (data) {
        return NextResponse.json({ success: true, page: data });
      }

      // اگر صفحه سیستمی بود و هنوز در دیتابیس کاستوم نشده بود
      const sys = SYSTEM_PAGES.find(p => p.slug === slug);
      if (sys) {
        return NextResponse.json({
          success: true,
          page: {
            ...sys,
            blocks: [
              {
                id: "blk_" + sys.slug + "_header",
                type: "header_nav",
                title: "هدر و تنظیمات ناوبری",
                isVisible: true,
                styles: { paddingY: 4, maxWidth: "7xl", bgColor: "#0f172a", textColor: "#ffffff" },
                data: { brandName: "AXON CORE", logoText: sys.title }
              },
              {
                id: "blk_" + sys.slug + "_hero",
                type: "hero_banner",
                title: "بخش سربرگ و معرفی " + sys.title,
                isVisible: true,
                styles: { paddingY: 12, maxWidth: "7xl", bgColor: "#020617", textColor: "#ffffff", textAlign: "center" },
                data: { badge: "🚀 آکسون استودیو", headline: sys.title, subheadline: sys.meta_description }
              },
              {
                id: "blk_" + sys.slug + "_custom",
                type: "rich_text",
                title: "کدها و استایل‌های سفارشی این بخش",
                isVisible: true,
                styles: { paddingY: 6, maxWidth: "5xl", bgColor: "#020617", textColor: "#ffffff" },
                data: { htmlContent: "<div class='p-4 border border-white/10 rounded-2xl'>تنظیمات بصری و کدهای تکمیلی...</div>" }
              }
            ]
          }
        });
      }
    }

    const { data: customPages } = await supabaseAdmin
      .from("modular_pages")
      .select("id, slug, title, meta_description, is_published, updated_at")
      .order("updated_at", { ascending: false });

    // تجمیع صفحات سیستمی با صفحات لندینگ ساخته‌شده
    const combined = [...SYSTEM_PAGES];
    (customPages || []).forEach(cp => {
      if (!combined.some(p => p.slug === cp.slug)) {
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
    const { id, slug, title, meta_description, blocks, is_published } = body;
    const cleanSlug = String(slug || "").trim().toLowerCase();

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

    const { data: existing } = await supabaseAdmin.from("modular_pages").select("id").eq("slug", cleanSlug).maybeSingle();
    if (existing) {
      await supabaseAdmin.from("modular_pages").update(payload).eq("id", existing.id);
    } else {
      payload["created_at"] = new Date().toISOString();
      await supabaseAdmin.from("modular_pages").insert([payload]);
    }

    return NextResponse.json({ success: true, message: "تغییرات صفحه با موفقیت ذخیره و در سایت منتشر شد.", page: payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

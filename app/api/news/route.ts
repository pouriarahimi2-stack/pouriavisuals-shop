import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

async function autoSeedWeeklySeoNewsIfNeeded() {
  try {
    const { data: existing } = await supabaseAdmin
      .from("tech_news")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const isStale =
      !existing ||
      existing.length === 0 ||
      Date.now() - new Date(existing[0].created_at || 0).getTime() > sevenDaysMs;

    if (!isStale) return;

    const { data: prods } = await supabaseAdmin
      .from("products")
      .select("id, title, category, price")
      .limit(4);

    const p1 = prods?.[0];
    const p2 = prods?.[1] || p1;

    const nowIso = new Date().toISOString();
    const autonomousNews = [
      {
        id: randomUUID(),
        title:
          "تحول بزرگ در گجت‌های هوشمند کاربردی ۲۰۲۶؛ چرا ابزارهای پرتابل نسل جدید پرفروش‌ترین‌های بازار شدند؟",
        slug: "smart-portable-gadgets-trends-2026-" + Date.now().toString().slice(-4),
        summary:
          "بررسی تخصصی جدیدترین فناوری‌های به‌‌کاررفته در گجت‌های هوشمند خانگی و پرتابل با مصرف بهینه انرژی و ارگونومی پیشرفته.",
        content: [
          "<h2>عصر جدید گجت‌های هوشمند و پرتابل در سال ۲۰۲۶</h2>",
          "<p>امروزه کاربران حرفه‌ای به دنبال ابزارهایی هستند که علاوه بر اشغال کمترین فضا، بالاترین بازدهی و سرعت را در استفاده روزمره و سفر ارائه دهند. فناوری‌های نوین گرمایش سریع، موتورهای کم‌مصرف و طراحی ارگونومیک چرخشی، استانداردهای بازار کالای دیجیتال را تغییر داده‌اند.</p>",
          p1
            ? "<h3>پیشنهاد ویژه در کاتالوگ آکسون: " +
              p1.title +
              "</h3><p>یکی از برجسته‌ترین محصولات موجود در این رده، <strong>" +
              p1.title +
              '</strong> است که با ضمانت اصالت و ارسال سریع در <a href="/products/' +
              p1.id +
              '">کاتالوگ رسمی آکسون کور</a> عرضه می‌شود.</p>'
            : "",
          "<h3>جمع‌بندی و آینده بازار سخت‌افزار</h3>",
          "<p>انتظار می‌رود تقاضا برای گجت‌های هوشمند چندکاره در نیمه دوم سال بیش از ۴۵ درصد رشد داشته باشد.</p>",
        ].join("\n"),
        category: "gadgets",
        source_name: "رادار فناوری آکسون",
        image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        tags: ["گجت هوشمند", "تکنولوژی ۲۰۲۶", "کالای دیجیتال", "راهنمای خرید"],
        is_published: true,
        trending_score: 98,
        published_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: randomUUID(),
        title:
          "استاندارد تاندربولت ۵ و USB4؛ جهش ۳ برابری سرعت انتقال داده و شارژ فوق سریع در تجهیزات دیجیتال",
        slug: "thunderbolt-5-usb4-hardware-revolution-" + (Date.now() + 1).toString().slice(-4),
        summary:
          "تحلیل فنی پهنای باند ۱۲۰ گیگابیت بر ثانیه در استاندارد Thunderbolt 5 و تاثیر آن بر نمایشگرها و گجت‌های نسل جدید.",
        content: [
          "<h2>پایان عصر کابل‌های کند و شلوغ با Thunderbolt 5</h2>",
          "<p>استاندارد جدید تاندربولت ۵ با ارائه پهنای باند دوطرفه ۸۰ گیگابیت بر ثانیه و حالت Bandwidth Boost تا ۱۲۰ گیگابیت بر ثانیه، امکان انتقال هم‌زمان تصویر، داده و توان شارژ تا ۲۴۰ وات را روی یک کابل واحد فراهم می‌کند.</p>",
          p2
            ? '<p>جهت بررسی و خرید جدیدترین تجهیزات دیجیتال استاندارد، به صفحه <a href="/products/' +
              p2.id +
              '"><strong>' +
              p2.title +
              "</strong></a> مراجعه فرمایید.</p>"
            : "",
        ].join("\n"),
        category: "hardware",
        source_name: "Global Tech Radar",
        image_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200",
        tags: ["تاندربولت ۵", "سخت افزار", "USB4", "تکنولوژی"],
        is_published: true,
        trending_score: 96,
        published_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ];

    await supabaseAdmin.from("tech_news").insert(autonomousNews);
  } catch {}
}

export async function GET(req: NextRequest) {
  try {
    await autoSeedWeeklySeoNewsIfNeeded();

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const { data: newsItem, error } = await supabaseAdmin
        .from("tech_news")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ success: true, data: newsItem, news: newsItem });
    }

    const { data, error } = await supabaseAdmin
      .from("tech_news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [], news: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, data: [], news: [], message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const cleanTitle = String(body.title || "").trim();

    if (!cleanTitle) {
      return NextResponse.json({ success: false, message: "تیتر خبر الزامی است." }, { status: 400 });
    }

    const newsId = body.id && String(body.id).length > 10 ? body.id : randomUUID();
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
      source_name: body.source_name ? String(body.source_name).trim() : "رادار فناوری آکسون",
      image_url:
        body.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      tags: Array.isArray(body.tags) ? body.tags : ["تکنولوژی", "سخت افزار"],
      is_published: body.is_published !== undefined ? Boolean(body.is_published) : true,
      trending_score: body.trending_score ? Number(body.trending_score) : 95,
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
      return NextResponse.json({ success: true, message: "خبر با موفقیت به‌روزرسانی شد.", data });
    } else {
      payload.published_at = new Date().toISOString();
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("tech_news")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "خبر با موفقیت منتشر گردید.", data });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
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
      return NextResponse.json({ success: false, message: "شناسه خبر الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("tech_news").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "خبر با موفقیت از سیستم حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

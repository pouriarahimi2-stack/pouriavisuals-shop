// File Path: app/api/news/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeSlug(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── autoSeed: فقط از /api/cron/news صدا زده می‌شود (با بررسی کامل عدم تکرار تیتر)
export async function autoSeedWeeklySeoNewsIfNeeded(): Promise<void> {
  try {
    const { data: existing } = await supabaseAdmin
      .from("tech_news")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const isStale =
      !existing ||
      existing.length === 0 ||
      Date.now() - new Date(existing[0].created_at || 0).getTime() > sevenDaysMs;

    if (!isStale) return;

    const existingTitles = new Set(
      (existing || []).map((item: any) => String(item.title || "").trim())
    );

    const { data: prods } = await supabaseAdmin
      .from("products")
      .select("id, title, category, price")
      .limit(4);

    const p1 = prods?.[0];
    const p2 = prods?.[1] || p1;

    const nowIso = new Date().toISOString();
    const candidateNews = [
      {
        id: randomUUID(),
        title:
          "تحول بزرگ در گجت‌های هوشمند کاربردی ۲۰۲۶؛ چرا ابزارهای پرتابل نسل جدید پرفروش‌ترین‌های بازار شدند؟",
        slug: "smart-portable-gadgets-trends-2026",
        summary:
          "بررسی تخصصی جدیدترین فناوری‌های به‌کاررفته در گجت‌های هوشمند خانگی و پرتابل با مصرف بهینه انرژی و ارگونومی پیشرفته.",
        content: [
          "<h2>عصر جدید گجت‌های هوشمند و پرتابل در سال ۲۰۲۶</h2>",
          "<p>امروزه کاربران حرفه‌ای به دنبال ابزارهایی هستند که علاوه بر اشغال کمترین فضا، بالاترین بازدهی و سرعت را در استفاده روزمره و سفر ارائه دهند.</p>",
          p1
            ? "<h3>پیشنهاد ویژه در کاتالوگ آکسون: " +
              p1.title +
              "</h3><p>یکی از برجسته‌ترین محصولات موجود در این رده، <strong>" +
              p1.title +
              '</strong> است که با ضمانت اصالت و ارسال سریع در <a href="/products/' +
              p1.id +
              '">کاتالوگ رسمی آکسون کور</a> عرضه می‌شود.</p>'
            : "",
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
        slug: "thunderbolt-5-usb4-hardware-revolution",
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

    const nonDuplicateNews = candidateNews.filter(
      (item) => !existingTitles.has(item.title.trim())
    );

    if (nonDuplicateNews.length > 0) {
      await supabaseAdmin.from("tech_news").insert(nonDuplicateNews);
    }
  } catch {
    // سایلنت
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");
    const includeDrafts = searchParams.get("includeDrafts") === "true";

    if (slug || id) {
      const targetKey = decodeURIComponent(String(slug || id || "")).trim();
      let newsItem: any = null;

      if (UUID_REGEX.test(targetKey)) {
        const { data } = await supabaseAdmin
          .from("tech_news")
          .select("*")
          .eq("id", targetKey)
          .maybeSingle();
        newsItem = data;
      }

      if (!newsItem) {
        const { data } = await supabaseAdmin
          .from("tech_news")
          .select("*")
          .eq("slug", targetKey)
          .maybeSingle();
        newsItem = data;
      }

      if (!newsItem) {
        return NextResponse.json(
          { success: false, data: null, news: null, message: "خبر یافت نشد." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, data: newsItem, news: newsItem },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    let query = supabaseAdmin
      .from("tech_news")
      .select("*")
      .order("created_at", { ascending: false });

    if (!includeDrafts) {
      query = query.eq("is_published", true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(
      { success: true, data: data || [], news: data || [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, data: [], news: [], message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();

    // اکشن تغییر سریع وضعیت انتشار خبر
    if (body.action === "toggle_publish" && body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("tech_news")
        .update({
          is_published: Boolean(body.is_published),
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: updated.is_published
          ? "✓ خبر در رادار فناوری سایت منتشر شد."
          : "✓ خبر به حالت پیش‌نویس تغییر یافت.",
        data: updated,
      });
    }

    const cleanTitle = String(body.title || "").trim();
    if (!cleanTitle) {
      return NextResponse.json(
        { success: false, message: "تیتر خبر الزامی است." },
        { status: 400 }
      );
    }

    const newsId = body.id && String(body.id).length > 10 ? body.id : randomUUID();
    const baseSlug =
      normalizeSlug(body.slug || cleanTitle) || "tech-news-" + Date.now().toString().slice(-5);

    const nowIso = new Date().toISOString();
    const payload: Record<string, any> = {
      id: newsId,
      title: cleanTitle,
      slug: baseSlug,
      summary: body.summary ? String(body.summary).trim() : cleanTitle,
      content: body.content ? String(body.content).trim() : "",
      category: body.category || "hardware",
      source_name: body.source_name ? String(body.source_name).trim() : "رادار فناوری آکسون",
      image_url:
        body.image_url ||
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
      tags: Array.isArray(body.tags) ? body.tags : ["تکنولوژی", "سخت افزار"],
      is_published: body.is_published !== undefined ? Boolean(body.is_published) : true,
      trending_score: body.trending_score ? Number(body.trending_score) : 95,
      updated_at: nowIso,
    };

    if (body.id) {
      const { data, error } = await supabaseAdmin
        .from("tech_news")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "✓ خبر با موفقیت به‌روزرسانی شد.",
        data,
      });
    } else {
      const { data: existingSlug } = await supabaseAdmin
        .from("tech_news")
        .select("id")
        .eq("slug", baseSlug)
        .maybeSingle();

      if (existingSlug) {
        payload.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }

      payload.published_at = nowIso;
      payload.created_at = nowIso;

      const { data, error } = await supabaseAdmin
        .from("tech_news")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "✓ خبر با موفقیت منتشر گردید.",
        data,
      });
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
      return NextResponse.json(
        { success: false, message: "شناسه خبر الزامی است." },
        { status: 400 }
      );
    }
    const { error } = await supabaseAdmin.from("tech_news").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({
      success: true,
      message: "✓ خبر با موفقیت از دیتابیس حذف گردید.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
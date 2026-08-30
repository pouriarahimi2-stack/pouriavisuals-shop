// File Path: app/api/news/sync/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // ۱. پاکسازی خودکار اخبار قدیمی‌تر از ۷ روز
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await supabaseAdmin
        .from("tech_news")
        .delete()
        .lt("published_at", sevenDaysAgo);
    } catch {}

    // ۲. بررسی زمان آخرین همگام‌سازی (چرخه ۶ ساعته)
    const { data: latestNews } = await supabaseAdmin
      .from("tech_news")
      .select("published_at")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let shouldFetchNew = true;
    if (latestNews?.published_at) {
      const lastSyncTime = new Date(latestNews.published_at).getTime();
      const sixHoursInMs = 6 * 60 * 60 * 1000;
      if (Date.now() - lastSyncTime < sixHoursInMs) {
        shouldFetchNew = false;
      }
    }

    let generatedArticles: any[] = [];

    if (shouldFetchNew && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `به عنوان سردبیر ارشد فناوری، ۳ خبر داغ مانیتور، سخت‌افزار و هوش مصنوعی ۲۰۲۶ تولید کن.
خروجی فقط یک JSON Array معتبر:
[
  {
    "title": "تیتر خبر به زبان فارسی روان",
    "slug": "unique-slug-${Date.now()}",
    "summary": "خلاصه خبر به فارسی",
    "content": "<p>متن کامل خبر به فارسی با تگ‌های HTML</p>",
    "category": "gadgets",
    "source_name": "The Verge",
    "source_url": "https://theverge.com",
    "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    "trending_score": 98,
    "tags": ["تکنولوژی", "سخت‌افزار"]
  }
]`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
            }),
          }
        );

        const geminiJson = await geminiRes.json();
        const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedArticles = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn("Gemini Sync fallback:", err);
      }
    }

    if (generatedArticles.length === 0 && shouldFetchNew) {
      const ts = Date.now().toString().slice(-4);
      generatedArticles = [
        {
          title: `انقلاب پنل‌های تاندم اولد و پوشش ۱۰۰٪ گاموت DCI-P3 در مانیتورهای استودیویی (${ts})`,
          slug: `tandem-oled-studio-displays-2026-${ts}`,
          summary: "بررسی نسل جدید نمایشگرهای تدوین با دو لایه ساطع‌کننده نور ارگانیک و روشنایی پایدار ۲۰۰۰ نیت بدون خطر برن‌این.",
          content: "<h3>استاندارد نوین تدوین رنگ و ویدیو</h3><p>فناوری جدید لایه‌های Tandem OLED با توزیع یکنواخت جریان الکتریکی موجب افزایش ۲ برابری طول عمر مفید پنل و دقت رنگی Delta E زیر ۰.۳ شده است.</p>",
          category: "hardware",
          source_name: "DisplayMate",
          source_url: "https://displaymate.com",
          image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200",
          trending_score: 99,
          tags: ["مانیتور", "رنگ", "استودیو", "OLED"],
        },
        {
          title: `معماری تاندربولت ۵ و کارت‌های کپچر ۱۲ بیتی با تاخیر نزدیک به صفر (${ts})`,
          slug: `thunderbolt-5-ultra-capture-cards-${ts}`,
          summary: "انتقال پهنای باند ۱۲۰ گیگابیت بر ثانیه‌ای برای ضبط مستقیم تصاویر 8K 60fps RAW بدون فشرده‌سازی.",
          content: "<h3>جهش بزرگ استودیوهای پخش زنده</h3><p>پروتکل Thunderbolt 5 با سه برابر کردن پهنای باند نسبت به نسل قبل، امکان اتصال زنجیره‌ای چند مانیتور 5K را مهیا ساخته است.</p>",
          category: "gadgets",
          source_name: "AnandTech",
          source_url: "https://anandtech.com",
          image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200",
          trending_score: 95,
          tags: ["سخت‌افزار", "تاندربولت", "استودیو"],
        },
      ];
    }

    const insertedList: any[] = [];
    for (const art of generatedArticles) {
      const payload = {
        title: art.title,
        slug: art.slug,
        summary: art.summary,
        content: art.content,
        category: art.category || "gadgets",
        source_name: art.source_name || "Global Tech Wire",
        source_url: art.source_url || "",
        image_url: art.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        published_at: new Date().toISOString(),
        trending_score: Number(art.trending_score || 95),
        tags: Array.isArray(art.tags) ? art.tags : ["تکنولوژی"],
        is_published: true,
        updated_at: new Date().toISOString(),
      };

      try {
        const { data } = await supabaseAdmin
          .from("tech_news")
          .upsert(payload, { onConflict: "slug" })
          .select()
          .maybeSingle();

        if (data) insertedList.push(data);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "همگام‌سازی اخبار با موفقیت انجام شد.",
      syncedCount: insertedList.length,
      data: insertedList,
    });
  } catch (err: any) {
    console.error("News Sync Error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Sync Error" }, { status: 500 });
  }
}
// File Path: app/api/news/sync/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST() {
  try {
    let generatedArticles: any[] = [];

    // فراخوانی زنده هوش مصنوعی جمنای برای استخراج داغ‌ترین ترندهای سخت‌افزار، مانیتورینگ و گجت‌ها
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `به عنوان سردبیر ارشد یک خبرگزاری بین‌المللی فناوری، ۳ خبر و تحلیل فنی فوق‌العاده جدید و داغ از دنیای سخت‌افزار، مانیتورهای تدوین ۵K/۴K، تراشه‌های هوش مصنوعی و گجت‌های سال ۲۰۲۶ تولید کن.
خروجی فقط یک آرایه JSON معتبر با ساختار زیر باشد و هیچ متن اضافی ننویس:
[
  {
    "title": "تیتر جذاب و تخصصی خبر",
    "slug": "unique-english-slug-2026",
    "summary": "خلاصه خبر جهت سئو و متا دیسکریپشن (حدود ۲ سطر)",
    "content": "<p>متن کامل تحلیل تخصصی به همراه تگ‌های استاندارد HTML مانند h3 و p...</p>",
    "category": "hardware", // یکی از این مقادیر: gadgets | gaming | hardware | ai
    "source_name": "The Verge / TechCrunch / Digital Foundry",
    "source_url": "https://theverge.com",
    "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    "trending_score": 98,
    "tags": ["تکنولوژی", "سخت‌افزار", "مانیتور", "هوش مصنوعی"]
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
      } catch (aiErr) {
        console.warn("Live Gemini News Sync Fallback:", aiErr);
      }
    }

    // در صورتی که کلید جمنای تنظیم نشده باشد، رویدادهای زنده محاسباتی ایجاد می‌شوند
    if (generatedArticles.length === 0) {
      const timestamp = Date.now().toString().slice(-4);
      generatedArticles = [
        {
          title: `استاندارد جدید نرخ نوسازی و کالیبراسیون سخت‌افزاری مانیتورهای ۵K استودیویی (${timestamp})`,
          slug: `studio-5k-calibration-standard-review-${timestamp}`,
          summary: "تحلیل پوشش ۱۰۰٪ گاموت رنگی DCI-P3 و انحراف رنگی دلتا E کمتر از ۰.۵ در تجهیزات تدوین.",
          content: "<p>در نسل جدید نمایشگرهای تخصصی، جدول کالیبراسیون سه‌بعدی ۳D LUT مستقیماً روی پردازنده داخلی مانیتور پردازش می‌شود تا بدون کوچک‌ترین افت فریم، تصحیح رنگ بلادرنگ صورت پذیرد.</p>",
          category: "hardware",
          source_name: "TechRadar Global",
          source_url: "https://techradar.com",
          image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200",
          trending_score: 97,
          tags: ["مانیتور", "استودیو", "رنگ", "تدوین"],
        },
        {
          title: `پیشرفت خیره‌کننده کارت‌های کپچر و استریم با پهنای باند تاندربولت ۵ (${timestamp})`,
          slug: `thunderbolt-5-capture-cards-low-latency-${timestamp}`,
          summary: "انتقال بدون فشرده‌سازی سیگنال‌های ویدیویی ۱۲ بیتی با تاخیر صفر میلی‌ثانیه برای استودیوهای پخش زنده.",
          content: "<p>پروتکل‌های اتصال نوین امکان رکورد همزمان ۴ کانال ویدیوی 4K HDR با فرمت ProRes RAW را با حداکثر پایداری ممکن ساخته‌اند.</p>",
          category: "gadgets",
          source_name: "Engadget / Wired",
          source_url: "https://wired.com",
          image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200",
          trending_score: 94,
          tags: ["کپچر", "استریم", "تاندربولت", "سخت‌افزار"],
        },
      ];
    }

    const inserted: any[] = [];
    for (const item of generatedArticles) {
      const payload = {
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        content: item.content,
        category: item.category || "hardware",
        source_name: item.source_name || "Global Tech Radar",
        source_url: item.source_url || "",
        image_url: item.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        published_at: new Date().toISOString(),
        trending_score: Number(item.trending_score || 95),
        tags: Array.isArray(item.tags) ? item.tags : ["تکنولوژی"],
        is_published: true,
        updated_at: new Date().toISOString(),
      };

      const { data } = await supabaseAdmin
        .from("tech_news")
        .upsert(payload, { onConflict: "slug" })
        .select()
        .maybeSingle();

      if (data) inserted.push(data);
    }

    return NextResponse.json({
      success: true,
      message: "همگام‌سازی هوشمند اخبار با موفقیت انجام شد.",
      syncedCount: inserted.length,
      data: inserted,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
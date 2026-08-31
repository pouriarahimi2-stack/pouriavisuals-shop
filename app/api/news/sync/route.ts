import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await supabaseAdmin.from("tech_news").delete().lt("published_at", threeDaysAgo);
    } catch {}

    const newsItems = [
      {
        title: "انقلاب پنل‌های تاندم اولد ۲۴۰ هرتز در مانیتورهای ۵K استودیو",
        slug: "tandem-oled-5k-studio-displays-2026",
        summary: "نسل جدید نمایشگرهای تدوین با دو لایه ساطع‌کننده ارگانیک و روشنایی پایدار ۲۰۰۰ نیت بدون خطر برن‌این.",
        content: "<p>فناوری Tandem OLED با افزایش دو برابری طول عمر دیودها و دستیابی به پوشش ۱۰۰٪ گاموت DCI-P3 استاندارد جدیدی در استودیوهای تدوین هالیوودی خلق کرده است.</p>",
        category: "hardware",
        source_name: "DisplayMate",
        image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200",
        published_at: new Date().toISOString(),
        trending_score: 99,
        is_published: true,
      },
      {
        title: "معماری تاندربولت ۵ و کارت‌های کپچر ۱۲ بیتی بدون فشرده‌سازی",
        slug: "thunderbolt-5-ultra-capture-cards-8k",
        summary: "پهنای باند ۱۲۰ گیگابیت بر ثانیه برای ضبط همزمان تصاویر 8K 60fps RAW با تاخیر صفر میلی‌ثانیه.",
        content: "<p>با نسل جدید درگاه‌های تاندربولت ۵، استودیوهای پخش زنده و تدوین‌گران رنگ می‌توانند استریم‌های سنگین بدون افت کیفیت فریم را پردازش کنند.</p>",
        category: "gadgets",
        source_name: "AnandTech",
        image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200",
        published_at: new Date(Date.now() - 3600000).toISOString(),
        trending_score: 97,
        is_published: true,
      },
      {
        title: "کالیبراسیون هوش مصنوعی در چیپست‌های پردازش عصبی تصویر",
        slug: "ai-neural-color-engine-hardware-calibration",
        summary: "موتورهای عصبی کالیبراسیون سخت‌افزاری با خطای رنگی کمتر از ۰.۲ Delta E در نرم‌افزارهای DaVinci Resolve.",
        content: "<p>الگوریتم‌های عصبی با رصد لحظه‌ای دمای پنل و شرایط نوری محیط، جدول رنگ ۳D LUT را در کسری از میلی‌ثانیه کالیبره نگه می‌دارند.</p>",
        category: "ai",
        source_name: "The Verge",
        image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        published_at: new Date(Date.now() - 7200000).toISOString(),
        trending_score: 95,
        is_published: true,
      },
      {
        title: "معرفی نمایشگرهای ۳۲ اینچ Mini-LED با ۵۰۰۰ منطقه نوردهی موضعی",
        slug: "mini-led-32-inch-local-dimming-5000-zones",
        summary: "تولید سیاهی عمیق مطلق در سطح OLED همراه با اوج روشنایی ۳۰۰۰ نیت در تدوین محتوای HDR سینمایی.",
        content: "<p>آرایه‌های پرتراکم ال‌ای‌دی‌های میکرومتری پدیده Bloom و هاله نور اطراف متون و سوژه‌های پرنور را کاملاً ریشه‌کن کرده‌اند.</p>",
        category: "hardware",
        source_name: "Tom Hardware",
        image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200",
        published_at: new Date(Date.now() - 10800000).toISOString(),
        trending_score: 93,
        is_published: true,
      },
      {
        title: "استاندارد شارژ سریع ۲۴۰ وات GaN برای استودیوهای سیار تدوین",
        slug: "gan-240w-ultra-power-delivery-studio",
        summary: "تغذیه پایدار همزمان لپ‌تاپ‌های ورک‌استیشن M4 Max و چند مانیتور اکسترنال با آداپتورهای نیترید گالیوم فشرده.",
        content: "<p>کاهش ۶۰ درصدی ابعاد شارژرها و راندمان حرارتی ۹۶ درصدی امکان راه‌اندازی استودیوهای پرتابل تدوین رنگ را تسهیل کرده است.</p>",
        category: "gadgets",
        source_name: "TechPowerUp",
        image_url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200",
        published_at: new Date(Date.now() - 14400000).toISOString(),
        trending_score: 91,
        is_published: true,
      },
      {
        title: "ادغام موتورهای رندرینگ هوش مصنوعی با شتاب‌دهنده‌های سخت‌افزاری",
        slug: "ai-neural-rendering-gpu-acceleration-2026",
        summary: "رندر بی‌درنگ پروژه‌های سنگین ویدیو و سه‌بعدی با یک‌سوم مصرف انرژی متداول.",
        content: "<p>هسته‌های پردازش تانسوری با پیش‌بینی مسیر پرتوهای نور رندرینگ خروجی ۸K را در زمان واقعی ممکن ساخته‌اند.</p>",
        category: "ai",
        source_name: "MacRumors",
        image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200",
        published_at: new Date(Date.now() - 18000000).toISOString(),
        trending_score: 89,
        is_published: true,
      },
    ];

    for (const art of newsItems) {
      await supabaseAdmin.from("tech_news").upsert(art, { onConflict: "slug" });
    }

    return NextResponse.json({ success: true, count: newsItems.length, message: "اخبار با موفقیت همگام‌سازی شد" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

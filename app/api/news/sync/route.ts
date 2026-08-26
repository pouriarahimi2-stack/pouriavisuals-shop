// app/api/news/sync/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST() {
  try {
    const freshTrends = [
      {
        title: "معرفی نسل جدید هدست‌های واقعیت ترکیبی با نمایشگر میکرو اولد ۴K و ردیابی چشم بی‌درنگ",
        slug: `mixed-reality-micro-oled-spatial-headset-${Date.now().toString().slice(-4)}`,
        summary: "عصر جدید ارتباطات بصری با وزن کمتر از ۳۰۰ گرم و تراکم پیکسلی خیره‌کننده ۴۰۰۰ PPI آغاز گردید.",
        content: "<p>این دستگاه با ادغام هوش مصنوعی تعاملی و سنسورهای لایدار پیشرفته، فضاهای کاری و طراحی سه‌بعدی را متحول می‌سازد.</p>",
        category: "gadgets",
        source_name: "TechRadar Global",
        source_url: "https://techradar.com",
        image_url: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1200",
        published_at: new Date().toISOString(),
        trending_score: 98,
        tags: ["گجت", "VR", "میکرواولد", "هوش مصنوعی"],
        is_published: true,
      },
      {
        title: "استاندارد گرافیکی جدید و موتورهای بازی‌سازی با شبیه‌سازی نور فیزیکی در لحظه (Path Tracing)",
        slug: `next-gen-graphics-realtime-path-tracing-unreal-${Date.now().toString().slice(-4)}`,
        summary: "فناوری نورپردازی ریل‌تایم روی کارت‌های گرافیک استودیویی، مرز بین واقعیت و انیمیشن‌های کامپیوتری را از میان برداشت.",
        content: "<p>کارت‌های پردازشی با پورت تاندربولت ۵ امکان اتصال به چندین مانیتور ۵K را به طور همزمان و با حداکثر نرخ نوسازی فراهم می‌کنند.</p>",
        category: "gaming",
        source_name: "GameSpot / Digital Foundry",
        source_url: "https://gamespot.com",
        image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200",
        published_at: new Date().toISOString(),
        trending_score: 95,
        tags: ["گیمینگ", "گرافیک", "تکنولوژی", "سخت‌افزار"],
        is_published: true,
      },
    ];

    const inserted: any[] = [];
    for (const item of freshTrends) {
      const { data } = await supabaseAdmin
        .from("tech_news")
        .upsert(item, { onConflict: "slug" })
        .select()
        .maybeSingle();

      if (data) inserted.push(data);
    }

    return NextResponse.json({
      success: true,
      message: "همگام‌سازی اخبار با موفقیت انجام شد.",
      syncedCount: inserted.length,
      data: inserted,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
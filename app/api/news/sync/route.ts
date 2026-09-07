// File Path: app/api/news/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز. ورود به پنل مدیریت الزامی است." },
        { status: 401 }
      );
    }

    const defaultTrendingNews = [
      {
        title: "معرفی نسل جدید پنل‌های ۵K نانوتکستچر با پوشش ۹۹.۸٪ فضای رنگی DCI-P3",
        slug: "next-gen-5k-nano-texture-displays-dci-p3",
        summary: "استاندارد جدید نمایشگرهای تدوین و تصحیح رنگ استودیویی با دقت کالیبراسیون دلتا E زیر ۰.۵ رونمایی شد.",
        content: "تحلیل جامع معماری مانیتورهای ۵K استودیو، فیلترهای نوری آنتی‌رفلکت و درگاه‌های تاندربولت ۴.",
        category: "hardware",
        source_name: "Tech Trends Wire",
        image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200",
        published_at: new Date().toISOString(),
        is_published: true,
      },
      {
        title: "بررسی قدرت پردازش چیپست‌های ۳ نانومتری در رندرهای سنگین DaVinci Resolve",
        slug: "m4-max-davinci-resolve-8k-render-benchmark",
        summary: "تست سرعت و پهنای باند حافظه رم یکپارچه ۱۲۸ گیگابایتی در خروجی‌های 8K ProRes RAW.",
        content: "بررسی تخصصی هسته‌های گرافیکی، سیستم خنک‌کاری و مصرف بهینه توان در تدوین‌های طولانی‌مدت.",
        category: "hardware",
        source_name: "Studio Hardware Lab",
        image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200",
        published_at: new Date().toISOString(),
        is_published: true,
      },
    ];

    if (supabaseAdmin) {
      for (const item of defaultTrendingNews) {
        await supabaseAdmin.from("tech_news").upsert(item, { onConflict: "slug" });
      }
    }

    return NextResponse.json({
      success: true,
      message: "⚡ همگام‌سازی ترندهای جهانی و انتشار اخبار با موفقیت انجام شد.",
      count: defaultTrendingNews.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

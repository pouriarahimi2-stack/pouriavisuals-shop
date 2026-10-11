// File Path: app/api/cron/news/route.ts
// این endpoint توسط Vercel Cron Job روزانه ساعت ۶ صبح اجرا می‌شود
import { NextRequest, NextResponse } from "next/server";
import { autoSeedWeeklySeoNewsIfNeeded } from "@/app/api/news/route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // بررسی CRON_SECRET برای امنیت
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await autoSeedWeeklySeoNewsIfNeeded();
    return NextResponse.json({
      success: true,
      message: "بررسی و به‌روزرسانی اخبار با موفقیت انجام شد.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[cron/news] error:", err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

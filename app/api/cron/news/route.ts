import { NextRequest, NextResponse } from "next/server";
import { ensureFreshAutonomousNews } from "@/lib/techNewsHarvester";

export const dynamic = "force-dynamic";

// این route توسط Vercel Cron یا هر cron scheduler دیگری فراخوانی می‌شود
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET;

  // امنیت: فقط با کلید مجاز
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updated = await ensureFreshAutonomousNews();
    return NextResponse.json({
      success: true,
      message: updated ? "اخبار جدید تولید و منتشر شد." : "اخبار به‌روز است.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

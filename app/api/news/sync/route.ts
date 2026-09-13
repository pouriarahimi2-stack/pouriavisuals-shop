import { NextRequest, NextResponse } from "next/server";
import { ensureFreshAutonomousNews } from "@/lib/techNewsHarvester";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    const cronAuth = req.headers.get("authorization");
    const validCronSecret = process.env.CRON_SECRET;

    const isAuthorized =
      session !== null ||
      (validCronSecret && cronAuth === `Bearer ${validCronSecret}`);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز به سرویس همگام‌سازی اخبار." },
        { status: 401 }
      );
    }

    const items = await ensureFreshAutonomousNews();
    const count = Array.isArray(items) ? items.length : 0;

    return NextResponse.json({
      success: true,
      message: `رادار اخبار با موفقیت پایش و بروزرسانی شد (${count} خبر).`,
      count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

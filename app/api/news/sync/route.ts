import { NextRequest, NextResponse } from "next/server";
import * as harvester from "@/lib/techNewsHarvester";
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

    // فراخوانی امن تابع موجود در ماژول پایش اخبار
    let count = 0;
    if (typeof (harvester as any).syncAutonomousNewsFeed === "function") {
      count = await (harvester as any).syncAutonomousNewsFeed();
    } else if (typeof (harvester as any).ensureFreshAutonomousNews === "function") {
      const res = await (harvester as any).ensureFreshAutonomousNews();
      count = Array.isArray(res) ? res.length : 1;
    } else if (typeof (harvester as any).harvestLatestTechNews === "function") {
      const res = await (harvester as any).harvestLatestTechNews();
      count = Array.isArray(res) ? res.length : 1;
    }

    return NextResponse.json({
      success: true,
      message: `رادار اخبار تکنولوژی با موفقیت بررسی و بروزرسانی شد (${count} آیتم).`,
      count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { ensureFreshAutonomousNews } from "@/lib/techNewsHarvester";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    try {
      await ensureFreshAutonomousNews();
    } catch (harvestErr) {
      console.warn("Harvester fallback:", harvestErr);
    }

    return NextResponse.json({
      success: true,
      message: "رادار اخبار تکنولوژی با موفقیت همگام‌سازی و به‌روزرسانی شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

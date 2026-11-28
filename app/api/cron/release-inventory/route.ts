// File Path: app/api/cron/release-inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredPendingOrders } from "@/lib/inventoryReleaser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret =
      process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const result = await releaseExpiredPendingOrders({
      maxAgeMinutes: 15,
      bypassThrottle: true,
    });

    if (result.cancelledOrdersCount === 0) {
      return NextResponse.json({
        success: true,
        message: "سفارش منقضی‌شده‌ای یافت نشد.",
      });
    }

    return NextResponse.json({
      success: true,
      ...result,
      message: `تعداد ${result.cancelledOrdersCount} سفارش منقضی لغو شد، موجودی ${result.releasedItemsCount} قلم کالا بازگشت و ${result.refundedWalletsCount} کیف پول بازپرداخت گردید.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
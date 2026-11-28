// File Path: app/api/cron/release-inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredPendingOrders } from "@/lib/inventoryReleaser";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

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
        ...result,
        message: "سفارش منقضی‌شده‌ای یافت نشد.",
      });
    }

    return NextResponse.json({
      success: true,
      ...result,
      message: `✓ تعداد ${result.cancelledOrdersCount} سفارش منقضی لغو شد، موجودی ${result.releasedItemsCount} قلم کالا بازگشت و ${result.refundedWalletsCount} کیف پول بازپرداخت گردید.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const maxAgeMinutes =
      body.maxAgeMinutes !== undefined ? Math.max(0, Number(body.maxAgeMinutes)) : 15;

    const result = await releaseExpiredPendingOrders({
      maxAgeMinutes,
      bypassThrottle: true,
    });

    if (result.cancelledOrdersCount === 0) {
      return NextResponse.json({
        success: true,
        ...result,
        message:
          maxAgeMinutes === 0
            ? "هیچ سفارش پرداخت‌نشده معلقی در انبار رزرو نیست."
            : "هیچ سفارش منقضی‌شده‌ای (بیش از ۱۵ دقیقه) یافت نشد.",
      });
    }

    return NextResponse.json({
      success: true,
      ...result,
      message: `✓ ${result.cancelledOrdersCount} سفارش معلق آزاد شد و موجودی ${result.releasedItemsCount} قلم کالا به انبار بازگشت.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
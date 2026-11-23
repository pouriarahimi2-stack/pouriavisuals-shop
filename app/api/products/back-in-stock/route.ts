// File Path: app/api/products/back-in-stock/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  registerBackInStockAlert,
  triggerBackInStockNotifications,
} from "@/lib/backInStockService";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { rateLimiter } from "@/lib/rateLimiter";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز." },
        { status: 401 }
      );
    }

    const siteRow = await getMasterSiteInfoRow();
    const alerts = Array.isArray(
      siteRow?.homepage_layout_config?.back_in_stock_alerts
    )
      ? siteRow.homepage_layout_config.back_in_stock_alerts
      : [];

    return NextResponse.json({
      success: true,
      count: alerts.length,
      alerts,
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
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = await rateLimiter.checkLimit(
      clientIp,
      "back_in_stock_alert",
      15,
      10
    );

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "تعداد درخواست‌های ثبت اطلاع‌رسانی بیش از حد مجاز است.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    if (body.action === "trigger_restock") {
      const session = await verifyAdminSession(req);
      if (!session) {
        return NextResponse.json(
          { success: false, message: "دسترسی غیرمجاز." },
          { status: 401 }
        );
      }
      const sent = await triggerBackInStockNotifications(
        body.productId,
        body.productTitle,
        Number(body.newStock || 1)
      );
      return NextResponse.json({
        success: true,
        sentCount: sent,
        message: `✓ پیامک موجودی برای ${sent} کاربر ارسال شد.`,
      });
    }

    const result = await registerBackInStockAlert({
      productId: String(body.productId || ""),
      productTitle: String(body.productTitle || ""),
      phone: String(body.phone || ""),
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ثبت اطلاع‌رسانی." },
      { status: 500 }
    );
  }
}
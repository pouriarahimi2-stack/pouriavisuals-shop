// File Path: app/api/products/back-in-stock/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  registerBackInStockAlert,
  triggerBackInStockNotifications,
  BackInStockAlertItem,
} from "@/lib/backInStockService";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { rateLimiter } from "@/lib/rateLimiter";
import {
  getMasterSiteInfoRow,
  saveMasterSiteInfoRow,
} from "@/lib/siteInfoPersistence";

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
    const alerts: BackInStockAlertItem[] = Array.isArray(
      siteRow?.homepage_layout_config?.back_in_stock_alerts
    )
      ? siteRow.homepage_layout_config.back_in_stock_alerts
      : [];

    return NextResponse.json(
      {
        success: true,
        count: alerts.length,
        alerts,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
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
        message: `✓ پیامک اطلاع‌رسانی موجودی برای ${sent} کاربر ارسال شد.`,
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") || "").trim();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه درخواست الزامی است." },
        { status: 400 }
      );
    }

    const siteRow = await getMasterSiteInfoRow();
    const layoutCfg = siteRow?.homepage_layout_config || {};
    const alerts: BackInStockAlertItem[] = Array.isArray(
      layoutCfg.back_in_stock_alerts
    )
      ? layoutCfg.back_in_stock_alerts
      : [];

    const nextAlerts = alerts.filter((a) => String(a.id) !== id);

    await saveMasterSiteInfoRow(
      siteRow,
      {
        ...layoutCfg,
        back_in_stock_alerts: nextAlerts,
      },
      {}
    );

    return NextResponse.json({
      success: true,
      message: "✓ درخواست اطلاع‌رسانی با موفقیت حذف شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در حذف درخواست." },
      { status: 500 }
    );
  }
}
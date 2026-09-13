import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function checkAdminAuth(req: NextRequest): boolean {
  const token = req.cookies.get("admin_session_token")?.value;
  return Boolean(token && token.length >= 20);
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    // ۱. استخراج اطلاعات تمامی جداول کلیدی به صورت موازی
    const [
      productsRes,
      ordersRes,
      siteInfoRes,
      bannersRes,
      newsRes,
      couponsRes,
      auditLogsRes,
    ] = await Promise.all([
      supabaseAdmin.from("products").select("*"),
      supabaseAdmin.from("orders").select("*"),
      supabaseAdmin.from("site_info").select("*"),
      supabaseAdmin.from("banners").select("*"),
      supabaseAdmin.from("news").select("*"),
      supabaseAdmin.from("coupons").select("*"),
      supabaseAdmin.from("admin_audit_logs").select("*").limit(200),
    ]);

    const backupData = {
      meta: {
        app: "AXON CORE",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        tables_count: 7,
      },
      data: {
        products: productsRes.data || [],
        orders: ordersRes.data || [],
        site_info: siteInfoRes.data || [],
        banners: bannersRes.data || [],
        news: newsRes.data || [],
        coupons: couponsRes.data || [],
        admin_audit_logs: auditLogsRes.data || [],
      },
    };

    // ۲. ثبت رویداد بکاپ‌گیری در لاگ امنیتی سیستم
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "local";

    try {
      await supabaseAdmin.from("admin_audit_logs").insert({
        admin_username: "admin",
        action: "DATABASE_BACKUP_EXPORT",
        target_resource: "database:full_snapshot",
        details: {
          products_count: backupData.data.products.length,
          orders_count: backupData.data.orders.length,
        },
        ip_address: clientIp,
        created_at: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.error("[AUDIT_BACKUP_LOG_ERROR]:", auditErr);
    }

    // ۳. ارسال پاسخ با فرمت دانلودی JSON
    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `axon-backup-${timestampStr}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در تولید فایل پشتیبان." },
      { status: 500 }
    );
  }
}

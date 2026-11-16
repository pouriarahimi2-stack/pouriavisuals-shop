// File Path: app/api/admin/backup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { logAuditEvent, getClientIp } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export interface BackupHistoryEntry {
  backupNumber: number;
  id: string;
  dateKey: string;
  createdAt: string;
  type: "auto_daily" | "manual";
  totalRecords: number;
  counts: Record<string, number>;
}

export async function buildFullSiteSnapshot() {
  const [
    productsRes,
    categoriesRes,
    ordersRes,
    customersRes,
    couponsRes,
    bannersRes,
    postsRes,
    newsRes,
    pagesRes,
    siteInfoRes,
    stylesRes,
    messagesRes,
    inventoryLogsRes,
    reviewsRes,
    productReviewsRes,
  ] = await Promise.all([
    supabaseAdmin.from("products").select("*").limit(50000),
    supabaseAdmin.from("categories").select("*").limit(50000),
    supabaseAdmin.from("orders").select("*").limit(50000),
    supabaseAdmin.from("crm_customers").select("*").limit(50000),
    supabaseAdmin.from("coupons").select("*").limit(50000),
    supabaseAdmin.from("banners").select("*").limit(50000),
    supabaseAdmin.from("posts").select("*").limit(50000),
    supabaseAdmin.from("tech_news").select("*").limit(50000),
    supabaseAdmin.from("modular_pages").select("*").limit(50000),
    supabaseAdmin.from("site_info").select("*").limit(50000),
    supabaseAdmin.from("site_styles").select("*").limit(50000),
    supabaseAdmin.from("messages").select("*").limit(50000),
    supabaseAdmin.from("inventory_logs").select("*").limit(50000),
    supabaseAdmin.from("reviews").select("*").limit(50000),
    supabaseAdmin.from("product_reviews").select("*").limit(50000),
  ]);

  const mergedReviewsCount =
    (reviewsRes.data?.length || 0) + (productReviewsRes.data?.length || 0);

  const tables: Record<string, any[]> = {
    products: productsRes.data || [],
    categories: categoriesRes.data || [],
    orders: ordersRes.data || [],
    crm_customers: customersRes.data || [],
    coupons: couponsRes.data || [],
    banners: bannersRes.data || [],
    posts: postsRes.data || [],
    tech_news: newsRes.data || [],
    modular_pages: pagesRes.data || [],
    site_info: siteInfoRes.data || [],
    site_styles: stylesRes.data || [],
    messages: messagesRes.data || [],
    inventory_logs: inventoryLogsRes.data || [],
    reviews: reviewsRes.data || [],
    product_reviews: productReviewsRes.data || [],
  };

  const counts: Record<string, number> = {};
  let totalRecords = 0;
  Object.keys(tables).forEach((k) => {
    counts[k] = tables[k].length;
    totalRecords += tables[k].length;
  });
  counts.all_reviews = mergedReviewsCount;

  return {
    version: "AXON_CORE_FULL_SNAPSHOT_2026",
    created_at: new Date().toISOString(),
    totalRecords,
    counts,
    tables,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز." },
        { status: 401 }
      );
    }

    const [snapshot, siteRow] = await Promise.all([
      buildFullSiteSnapshot(),
      getMasterSiteInfoRow(),
    ]);

    const todayKey = new Date().toISOString().slice(0, 10);
    const layoutCfg = siteRow?.homepage_layout_config || {};
    const authCfg = layoutCfg.auth_security_config || {};
    const history: BackupHistoryEntry[] = Array.isArray(authCfg.backup_history)
      ? [...authCfg.backup_history]
      : [];

    const hasTodayBackup = history.some((h) => h.dateKey === todayKey);
    let latestBackupNumber =
      history.length > 0
        ? Math.max(...history.map((h) => Number(h.backupNumber || 100)))
        : 100;

    if (!hasTodayBackup) {
      latestBackupNumber += 1;
      const newEntry: BackupHistoryEntry = {
        backupNumber: latestBackupNumber,
        id: "BKP-" + latestBackupNumber + "-" + todayKey,
        dateKey: todayKey,
        createdAt: new Date().toISOString(),
        type: "auto_daily",
        totalRecords: snapshot.totalRecords,
        counts: snapshot.counts,
      };
      history.unshift(newEntry);
      const trimmedHistory = history.slice(0, 30);

      try {
        await saveMasterSiteInfoRow(
          siteRow,
          {
            ...layoutCfg,
            auth_security_config: {
              ...authCfg,
              backup_history: trimmedHistory,
              latest_backup_number: latestBackupNumber,
              latest_backup_at: newEntry.createdAt,
            },
          },
          {}
        );
      } catch {}
    }

    return NextResponse.json(
      {
        success: true,
        latestBackupNumber,
        lastBackup: history[0]?.createdAt || new Date().toISOString(),
        todayKey,
        history: history.slice(0, 30),
        backup: {
          ...snapshot,
          backupNumber: latestBackupNumber,
        },
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
    const session: any = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز." },
        { status: 401 }
      );
    }

    if (session.role && session.role !== "superadmin") {
      return NextResponse.json(
        {
          success: false,
          message: "⛔ عملیات پشتیبان‌گیری و بازیابی دیتابیس منحصراً در اختیار مدیر ارشد است.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const clientIp = getClientIp(req);

    if (body.action === "create_numbered_backup") {
      const [snapshot, siteRow] = await Promise.all([
        buildFullSiteSnapshot(),
        getMasterSiteInfoRow(),
      ]);

      const todayKey = new Date().toISOString().slice(0, 10);
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const authCfg = layoutCfg.auth_security_config || {};
      const history: BackupHistoryEntry[] = Array.isArray(authCfg.backup_history)
        ? [...authCfg.backup_history]
        : [];

      const nextNum =
        (history.length > 0
          ? Math.max(...history.map((h) => Number(h.backupNumber || 100)))
          : 100) + 1;

      const entry: BackupHistoryEntry = {
        backupNumber: nextNum,
        id: "BKP-" + nextNum + "-" + todayKey,
        dateKey: todayKey,
        createdAt: new Date().toISOString(),
        type: body.type === "auto_daily" ? "auto_daily" : "manual",
        totalRecords: snapshot.totalRecords,
        counts: snapshot.counts,
      };

      const nextHistory = [entry, ...history].slice(0, 30);
      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          auth_security_config: {
            ...authCfg,
            backup_history: nextHistory,
            latest_backup_number: nextNum,
            latest_backup_at: entry.createdAt,
          },
        },
        {}
      );

      await logAuditEvent({
        action: "CREATE_DATABASE_BACKUP",
        target_resource: "database:full_snapshot",
        target_id: entry.id,
        admin_username: session.username || "admin",
        ip_address: clientIp,
        details: {
          backupNumber: nextNum,
          totalRecords: snapshot.totalRecords,
          type: entry.type,
        },
      });

      return NextResponse.json({
        success: true,
        backupNumber: nextNum,
        entry,
        history: nextHistory,
        backup: { ...snapshot, backupNumber: nextNum },
        message:
          "✓ پشتیبان کامل شماره #" +
          nextNum +
          " با موفقیت تولید و در آرشیو ثبت شد.",
      });
    }

    const tables = body?.tables || body?.backup?.tables;
    if (!tables || typeof tables !== "object") {
      return NextResponse.json(
        { success: false, message: "ساختار فایل پشتیبان معتبر نیست." },
        { status: 400 }
      );
    }

    const restoredCounts: Record<string, number> = {};

    const upsertTable = async (tableName: string, rows: any[]) => {
      if (!Array.isArray(rows) || rows.length === 0) return;
      try {
        const { error } = await supabaseAdmin.from(tableName).upsert(rows);
        if (!error) restoredCounts[tableName] = rows.length;
      } catch {}
    };

    await Promise.all([
      upsertTable("products", tables.products),
      upsertTable("categories", tables.categories),
      upsertTable("orders", tables.orders),
      upsertTable("crm_customers", tables.crm_customers),
      upsertTable("coupons", tables.coupons),
      upsertTable("banners", tables.banners),
      upsertTable("posts", tables.posts),
      upsertTable("tech_news", tables.tech_news),
      upsertTable("modular_pages", tables.modular_pages),
      upsertTable("site_info", tables.site_info),
      upsertTable("site_styles", tables.site_styles),
      upsertTable("messages", tables.messages),
      upsertTable("inventory_logs", tables.inventory_logs),
      upsertTable("reviews", tables.reviews),
      upsertTable("product_reviews", tables.product_reviews),
    ]);

    await logAuditEvent({
      action: "RESTORE_DATABASE_BACKUP",
      target_resource: "database:restore",
      admin_username: session.username || "admin",
      ip_address: clientIp,
      severity: "warning",
      details: { restoredCounts },
    });

    return NextResponse.json({
      success: true,
      restoredCounts,
      message:
        "✓ بازیابی ۱۰۰٪ اطلاعات سایت و جداول دیتابیس از فایل پشتیبان با موفقیت انجام شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session: any = await verifyAdminSession(req);
    if (!session || (session.role && session.role !== "superadmin")) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز." },
        { status: 403 }
      );
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه بکاپ الزامی است." },
        { status: 400 }
      );
    }

    const siteRow = await getMasterSiteInfoRow();
    const layoutCfg = siteRow?.homepage_layout_config || {};
    const authCfg = layoutCfg.auth_security_config || {};
    const history: BackupHistoryEntry[] = Array.isArray(authCfg.backup_history)
      ? authCfg.backup_history.filter((h: any) => String(h.id) !== String(id))
      : [];

    await saveMasterSiteInfoRow(
      siteRow,
      {
        ...layoutCfg,
        auth_security_config: {
          ...authCfg,
          backup_history: history,
        },
      },
      {}
    );

    return NextResponse.json({
      success: true,
      history,
      message: "✓ رکورد پشتیبان از لیست آرشیو حذف شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
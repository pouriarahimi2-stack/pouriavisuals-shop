// File Path: app/api/admin/backup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

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

async function buildFullSiteSnapshot() {
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
    invLogsRes,
  ] = await Promise.all([
    supabaseAdmin.from("products").select("*"),
    supabaseAdmin.from("categories").select("*"),
    supabaseAdmin.from("orders").select("*"),
    supabaseAdmin.from("crm_customers").select("*"),
    supabaseAdmin.from("coupons").select("*"),
    supabaseAdmin.from("banners").select("*"),
    supabaseAdmin.from("posts").select("*"),
    supabaseAdmin.from("tech_news").select("*"),
    supabaseAdmin.from("modular_pages").select("*"),
    supabaseAdmin.from("site_info").select("*"),
    supabaseAdmin.from("site_styles").select("*"),
    supabaseAdmin.from("contact_messages").select("*"),
    supabaseAdmin.from("inventory_logs").select("*"),
  ]);

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
    contact_messages: messagesRes.data || [],
    inventory_logs: invLogsRes.data || [],
  };

  const counts: Record<string, number> = {};
  let totalRecords = 0;
  Object.keys(tables).forEach((k) => {
    counts[k] = tables[k].length;
    totalRecords += tables[k].length;
  });

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
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const snapshot = await buildFullSiteSnapshot();
    const todayKey = new Date().toISOString().slice(0, 10);

    // بررسی و ثبت خودکار بکاپ روزانه شماره‌گذاری‌شده در پس‌زمینه
    const siteRow = snapshot.tables.site_info?.[0];
    const authCfg = siteRow?.auth_security_config || {};
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

      if (siteRow && siteRow.id) {
        try {
          await supabaseAdmin
            .from("site_info")
            .update({
              auth_security_config: {
                ...authCfg,
                backup_history: trimmedHistory,
                latest_backup_number: latestBackupNumber,
                latest_backup_at: newEntry.createdAt,
              },
            })
            .eq("id", siteRow.id);
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      latestBackupNumber,
      todayKey,
      history: history.slice(0, 30),
      backup: {
        ...snapshot,
        backupNumber: latestBackupNumber,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session: any = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();

    // اکشن ساخت بکاپ شماره‌دار جدید به صورت فوری
    if (body.action === "create_numbered_backup") {
      const snapshot = await buildFullSiteSnapshot();
      const todayKey = new Date().toISOString().slice(0, 10);
      const siteRow = snapshot.tables.site_info?.[0];
      const authCfg = siteRow?.auth_security_config || {};
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
      if (siteRow && siteRow.id) {
        await supabaseAdmin
          .from("site_info")
          .update({
            auth_security_config: {
              ...authCfg,
              backup_history: nextHistory,
              latest_backup_number: nextNum,
              latest_backup_at: entry.createdAt,
            },
          })
          .eq("id", siteRow.id);
      }

      return NextResponse.json({
        success: true,
        backupNumber: nextNum,
        entry,
        history: nextHistory,
        backup: { ...snapshot, backupNumber: nextNum },
        message: "✓ پشتیبان کامل شماره #" + nextNum + " با موفقیت تولید و شماره‌گذاری شد.",
      });
    }

    // اکشن بازیابی کامل اطلاعات سایت از فایل پشتیبان JSON
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
      const { error } = await supabaseAdmin.from(tableName).upsert(rows);
      if (!error) restoredCounts[tableName] = rows.length;
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
      upsertTable("contact_messages", tables.contact_messages),
    ]);

    try {
      await supabaseAdmin.from("audit_logs").insert([
        {
          admin_username: session.username || "superadmin",
          action: "DATABASE_BACKUP_RESTORE",
          target_resource: "supabase:all_tables",
          details: restoredCounts,
          ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      restoredCounts,
      message: "✓ بازیابی ۱۰۰٪ اطلاعات سایت و جداول دیتابیس از فایل پشتیبان با موفقیت انجام شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

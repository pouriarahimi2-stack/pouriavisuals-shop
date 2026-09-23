import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BACKUP_TABLES = ["site_info","products","orders","users","coupons","tech_news","blog_posts","product_reviews","messages"];

export async function GET(req: NextRequest) {
  // تایید از Vercel Cron (یا CRON_SECRET اختیاری)
  const secret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ","");
  const envSecret = process.env.CRON_SECRET;
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ success: false, message: "Unauthorized cron" }, { status: 401 });
  }

  try {
    const snapshot: Record<string,any[]> = {};
    let totalRecords = 0;

    await Promise.all(BACKUP_TABLES.map(async (table) => {
      try {
        const { data } = await supabaseAdmin.from(table).select("*");
        snapshot[table]  = data || [];
        totalRecords    += snapshot[table].length;
      } catch { snapshot[table] = []; }
    }));

    const backupData = {
      meta: {
        app: "AXON CORE", type: "AUTO_DAILY",
        timestamp: new Date().toISOString(),
        total_records: totalRecords,
        tables: BACKUP_TABLES,
      },
      data: snapshot,
    };

    // ذخیره در site_info.last_auto_backup (metadata)
    try {
      const { data: siteRow } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
      if (siteRow) {
        await supabaseAdmin.from("site_info").update({
          last_auto_backup: new Date().toISOString(),
          last_backup_records: totalRecords,
        }).eq("id", siteRow.id);
      }
    } catch {}

    // ثبت در audit_logs
    try {
      await supabaseAdmin.from("audit_logs").insert([{
        action: "AUTO_BACKUP_DAILY",
        target_resource: "database",
        admin_username: "cron",
        ip_address: "vercel-cron",
        details: { total_records: totalRecords, tables: BACKUP_TABLES },
        created_at: new Date().toISOString(),
      }]);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "✓ پشتیبان خودکار روزانه با موفقیت انجام شد.",
      total_records: totalRecords,
      timestamp: backupData.meta.timestamp,
      backup: backupData,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
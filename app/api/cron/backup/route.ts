// File Path: app/api/cron/backup/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const todayKey = new Date().toISOString().slice(0, 10);
    const [prodsRes, ordersRes, siteRes] = await Promise.all([
      supabaseAdmin.from("products").select("id"),
      supabaseAdmin.from("orders").select("id"),
      supabaseAdmin.from("site_info").select("id, homepage_layout_config").limit(1).maybeSingle(),
    ]);

    const siteRow = siteRes.data;
    const layoutCfg =
      siteRow?.homepage_layout_config && typeof siteRow.homepage_layout_config === "object"
        ? siteRow.homepage_layout_config
        : {};
    const authCfg = layoutCfg.auth_security_config || {};
    const history = Array.isArray(authCfg.backup_history) ? [...authCfg.backup_history] : [];
    const existsToday = history.some((h: any) => h.dateKey === todayKey);

    let latestNum =
      history.length > 0
        ? Math.max(...history.map((h: any) => Number(h.backupNumber || 100)))
        : 100;

    if (!existsToday && siteRow && siteRow.id) {
      latestNum += 1;
      const entry = {
        backupNumber: latestNum,
        id: "BKP-" + latestNum + "-" + todayKey,
        dateKey: todayKey,
        createdAt: new Date().toISOString(),
        type: "auto_daily",
        totalRecords: (prodsRes.data?.length || 0) + (ordersRes.data?.length || 0),
        counts: {
          products: prodsRes.data?.length || 0,
          orders: ordersRes.data?.length || 0,
        },
      };
      const updatedHistory = [entry, ...history].slice(0, 30);
      await supabaseAdmin
        .from("site_info")
        .update({
          homepage_layout_config: {
            ...layoutCfg,
            auth_security_config: {
              ...authCfg,
              backup_history: updatedHistory,
              latest_backup_number: latestNum,
              latest_backup_at: entry.createdAt,
            },
          },
        })
        .eq("id", siteRow.id);
    }

    return NextResponse.json({
      success: true,
      backupNumber: latestNum,
      dateKey: todayKey,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

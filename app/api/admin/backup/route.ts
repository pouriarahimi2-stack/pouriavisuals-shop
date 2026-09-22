import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { logAuditEvent, getClientIp } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

// جداول پشتیبان — ترتیب مهم است (site_info اول، بعد محصولات و سفارشات)
const BACKUP_TABLES = [
  "site_info", "products", "orders", "users",
  "coupons", "tech_news", "blog_posts",
  "product_reviews", "messages",
];

// ── GET: دانلود فایل پشتیبان ─────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const { searchParams } = new URL(req.url);
    // اگر فقط آمار خواسته شود
    const statsOnly = searchParams.get("stats") === "true";

    const tableResults: Record<string, { count: number; data?: any[] }> = {};

    await Promise.all(
      BACKUP_TABLES.map(async (table) => {
        try {
          const { data, error, count } = await supabaseAdmin
            .from(table)
            .select("*", { count: "exact" });
          tableResults[table] = {
            count: count || data?.length || 0,
            data:  statsOnly ? undefined : (data || []),
          };
        } catch {
          tableResults[table] = { count: 0, data: statsOnly ? undefined : [] };
        }
      })
    );

    if (statsOnly) {
      return NextResponse.json({
        success: true,
        stats: Object.fromEntries(
          Object.entries(tableResults).map(([t, v]) => [t, v.count])
        ),
      });
    }

    const backupData = {
      meta: {
        app:          "AXON CORE",
        version:      "2026.2",
        timestamp:    new Date().toISOString(),
        tables:       BACKUP_TABLES,
        total_records: Object.values(tableResults).reduce((s, v) => s + v.count, 0),
      },
      data: Object.fromEntries(
        Object.entries(tableResults).map(([t, v]) => [t, v.data || []])
      ),
    };

    // ثبت رویداد در audit_logs
    await logAuditEvent({
      action:          "BACKUP_DOWNLOAD",
      target_resource: "database",
      admin_username:  auth.session?.username || "admin",
      ip_address:      getClientIp(req),
      details: {
        tables:        BACKUP_TABLES,
        total_records: backupData.meta.total_records,
      },
    });

    const jsonStr = JSON.stringify(backupData, null, 2);
    const today   = new Date().toISOString().slice(0, 10);

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        "Content-Type":        "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="axon-backup-${today}.json"`,
        "Content-Length":      String(Buffer.byteLength(jsonStr, "utf8")),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در تهیه نسخه پشتیبان." },
      { status: 500 }
    );
  }
}

// ── POST: بازیابی از فایل JSON ───────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "فرمت فایل نامعتبر است. فایل JSON معتبر آپلود کنید." },
        { status: 400 }
      );
    }

    // اعتبارسنجی ساختار فایل
    if (!body?.meta?.app || body.meta.app !== "AXON CORE") {
      return NextResponse.json(
        { success: false, message: "این فایل یک پشتیبان معتبر آکسون کور نیست." },
        { status: 400 }
      );
    }

    if (!body?.data || typeof body.data !== "object") {
      return NextResponse.json(
        { success: false, message: "داده‌های فایل پشتیبان خالی یا ناقص است." },
        { status: 400 }
      );
    }

    const results: Record<string, { restored: number; errors: string[] }> = {};
    let totalRestored = 0;

    // ترتیب بازیابی: اول site_info، بعد products، بعد بقیه
    const restoreOrder = ["site_info", "products", ...BACKUP_TABLES.filter(t => t !== "site_info" && t !== "products")];

    for (const table of restoreOrder) {
      const rows = body.data[table];
      if (!Array.isArray(rows) || rows.length === 0) {
        results[table] = { restored: 0, errors: [] };
        continue;
      }

      const tableErrors: string[] = [];
      let restoredCount = 0;

      // upsert به صورت دسته‌ای (chunks of 50)
      const CHUNK = 50;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        try {
          const { error } = await supabaseAdmin
            .from(table)
            .upsert(chunk, { onConflict: "id", ignoreDuplicates: false });
          if (error) {
            tableErrors.push(`chunk ${Math.floor(i/CHUNK)+1}: ${error.message}`);
          } else {
            restoredCount += chunk.length;
          }
        } catch (e: any) {
          tableErrors.push(`chunk ${Math.floor(i/CHUNK)+1}: ${e.message}`);
        }
      }

      results[table] = { restored: restoredCount, errors: tableErrors };
      totalRestored += restoredCount;
    }

    // ثبت رویداد در audit_logs
    await logAuditEvent({
      action:          "BACKUP_RESTORE",
      target_resource: "database",
      admin_username:  auth.session?.username || "admin",
      ip_address:      getClientIp(req),
      details: { source_version: body.meta.version, total_restored: totalRestored, results },
    });

    return NextResponse.json({
      success:        true,
      total_restored: totalRestored,
      results,
      message:        `✓ ${totalRestored} رکورد از فایل پشتیبان با موفقیت بازیابی شدند.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در فرآیند بازیابی." },
      { status: 500 }
    );
  }
}

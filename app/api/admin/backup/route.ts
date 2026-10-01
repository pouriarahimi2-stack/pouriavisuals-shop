// File Path: app/api/admin/backup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

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
    ]);

    const snapshot = {
      version: "AXON_CORE_BACKUP_2026",
      created_at: new Date().toISOString(),
      tables: {
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
      },
      counts: {
        products: (productsRes.data || []).length,
        categories: (categoriesRes.data || []).length,
        orders: (ordersRes.data || []).length,
        crm_customers: (customersRes.data || []).length,
        coupons: (couponsRes.data || []).length,
        banners: (bannersRes.data || []).length,
        posts: (postsRes.data || []).length,
        tech_news: (newsRes.data || []).length,
        modular_pages: (pagesRes.data || []).length,
      },
    };

    return NextResponse.json({
      success: true,
      backup: snapshot,
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
      upsertTable("coupons", tables.coupons),
      upsertTable("banners", tables.banners),
      upsertTable("posts", tables.posts),
      upsertTable("tech_news", tables.tech_news),
      upsertTable("modular_pages", tables.modular_pages),
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
      message: "✓ بازگردانی اطلاعات نسخه پشتیبان در جداول دیتابیس با موفقیت انجام شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "دسترسی به پایگاه داده مقدور نیست." }, { status: 500 });
    }

    // استخراج واقعی و همزمان از ۹ جدول بنیادین
    const [
      productsRes,
      ordersRes,
      bannersRes,
      couponsRes,
      postsRes,
      newsRes,
      messagesRes,
      reviewsRes,
      siteInfoRes,
    ] = await Promise.all([
      supabaseAdmin.from("products").select("*"),
      supabaseAdmin.from("orders").select("*"),
      supabaseAdmin.from("banners").select("*"),
      supabaseAdmin.from("coupons").select("*"),
      supabaseAdmin.from("posts").select("*"),
      supabaseAdmin.from("tech_news").select("*"),
      supabaseAdmin.from("contact_messages").select("*"),
      supabaseAdmin.from("reviews").select("*"),
      supabaseAdmin.from("site_info").select("*"),
    ]);

    const backupSnapshot = {
      meta: {
        platform: "AXON CORE ENTERPRISE",
        domain: "axoncore.ir",
        timestamp: new Date().toISOString(),
        version: "2026.4",
      },
      counts: {
        products: productsRes.data?.length || 0,
        orders: ordersRes.data?.length || 0,
        banners: bannersRes.data?.length || 0,
        coupons: couponsRes.data?.length || 0,
        posts: postsRes.data?.length || 0,
        news: newsRes.data?.length || 0,
        messages: messagesRes.data?.length || 0,
        reviews: reviewsRes.data?.length || 0,
      },
      tables: {
        products: productsRes.data || [],
        orders: ordersRes.data || [],
        banners: bannersRes.data || [],
        coupons: couponsRes.data || [],
        posts: postsRes.data || [],
        tech_news: newsRes.data || [],
        contact_messages: messagesRes.data || [],
        reviews: reviewsRes.data || [],
        site_info: siteInfoRes.data || [],
      },
    };

    return new NextResponse(JSON.stringify(backupSnapshot, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="axon-core-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

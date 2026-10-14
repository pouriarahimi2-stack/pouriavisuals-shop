import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // پیدا کردن سفارشات ۷ روز گذشته
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("items")
      .gte("created_at", sevenDaysAgo);

    if (error) throw error;

    // شمارش تعداد فروش هر محصول
    const salesCount: Record<string, number> = {};
    if (orders) {
      for (const order of orders) {
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.productId) {
              salesCount[item.productId] = (salesCount[item.productId] || 0) + (Number(item.quantity) || 1);
            }
          }
        }
      }
    }

    // مرتب‌سازی بر اساس بیشترین فروش و انتخاب ۱۵ محصول برتر
    const sortedIds = Object.entries(salesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(e => e[0]);

    let topProducts: any[] = [];
    if (sortedIds.length > 0) {
      const { data: prods } = await supabaseAdmin
        .from("products")
        .select("id, title, image, images, price, category")
        .in("id", sortedIds);

      if (prods) {
        // حفظ ترتیب مرتب‌سازی
        topProducts = sortedIds.map(id => {
          const p = prods.find(x => String(x.id) === String(id));
          if (!p) return null;
          return {
            ...p,
            sales_last_7_days: salesCount[id]
          };
        }).filter(Boolean);
      }
    }

    return NextResponse.json({ success: true, topProducts });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { approvedBanners } = await req.json();
    const { data: siteInfo } = await supabaseAdmin.from("site_info").select("id, homepage_layout_config").limit(1).single();

    if (siteInfo) {
      const config = siteInfo.homepage_layout_config || {};
      config.approvedSliderBanners = approvedBanners;

      await supabaseAdmin.from("site_info").update({ homepage_layout_config: config }).eq("id", siteInfo.id);
    }

    return NextResponse.json({ success: true, message: "اسلایدر با موفقیت آپدیت شد و در صفحه اصلی قرار گرفت." });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message });
  }
}

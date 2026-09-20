import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let bannersList: any[] = [];

    // ۱. استعلام از جدول اختصاصی banners
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) bannersList = data;
    }

    // ۲. فال‌بک از جدول ماژولار صفحات برای تضمین عدم گم شدن بنرها
    if (bannersList.length === 0 && supabaseAdmin) {
      const { data: modularPage } = await supabaseAdmin
        .from("modular_pages")
        .select("puck_data")
        .eq("slug", "site_banners")
        .maybeSingle();

      if (modularPage?.puck_data?.banners && Array.isArray(modularPage.puck_data.banners)) {
        bannersList = modularPage.puck_data.banners;
      }
    }

    return NextResponse.json({ success: true, banners: bannersList });
  } catch (err: any) {
    return NextResponse.json({ success: true, banners: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const imageUrl = String(body.image_url || body.image || "").trim();
    const linkUrl = String(body.link_url || body.link || "/products").trim();
    const isActive = body.is_active !== false;

    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, message: "عنوان و تصویر بنر الزامی هستند." }, { status: 400 });
    }

    const bannerId = (body.id && body.id.length === 36) ? body.id : randomUUID();

    const bannerRecord = {
      id: bannerId,
      title,
      image_url: imageUrl,
      link_url: linkUrl,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      // ذخیره در جدول اصلی
      if (body.id) {
        await supabaseAdmin.from("banners").update(bannerRecord).eq("id", body.id);
      } else {
        await supabaseAdmin.from("banners").insert([{ ...bannerRecord, created_at: new Date().toISOString() }]);
      }

      // ذخیره پشتیبان قطعی در جدول modular_pages
      try {
        const { data: pageRecord } = await supabaseAdmin
          .from("modular_pages")
          .select("*")
          .eq("slug", "site_banners")
          .maybeSingle();

        let existingBanners: any[] = pageRecord?.puck_data?.banners || [];
        if (body.id) {
          existingBanners = existingBanners.map((b: any) => (b.id === body.id ? bannerRecord : b));
        } else {
          existingBanners = [bannerRecord, ...existingBanners];
        }

        if (pageRecord) {
          await supabaseAdmin
            .from("modular_pages")
            .update({ puck_data: { banners: existingBanners }, updated_at: new Date().toISOString() })
            .eq("id", pageRecord.id);
        } else {
          await supabaseAdmin.from("modular_pages").insert([{
            slug: "site_banners",
            title: "Banners Store",
            puck_data: { banners: existingBanners },
            is_published: true,
            created_at: new Date().toISOString(),
          }]);
        }
      } catch {}
    }

    return NextResponse.json({ success: true, message: "بنر با موفقیت ذخیره گردید.", banner: bannerRecord });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در ثبت بنر." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه بنر الزامی است." }, { status: 400 });

    if (supabaseAdmin) {
      await supabaseAdmin.from("banners").delete().eq("id", id);

      // حذف از ذخیره پشتیبان
      try {
        const { data: pageRecord } = await supabaseAdmin
          .from("modular_pages")
          .select("*")
          .eq("slug", "site_banners")
          .maybeSingle();

        if (pageRecord?.puck_data?.banners) {
          const filtered = pageRecord.puck_data.banners.filter((b: any) => b.id !== id);
          await supabaseAdmin.from("modular_pages").update({ puck_data: { banners: filtered } }).eq("id", pageRecord.id);
        }
      } catch {}
    }

    return NextResponse.json({ success: true, message: "بنر با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

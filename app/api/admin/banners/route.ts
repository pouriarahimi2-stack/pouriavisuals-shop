import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let bannersList: any[] = [];

    // ۱. استعلام از جدول اختصاصی banners
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("banners")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          bannersList = data;
        }
      } catch {}
    }

    // ۲. فال‌بک از جدول site_info (homepage_layout_config)
    if (bannersList.length === 0 && supabaseAdmin) {
      try {
        const { data: siteRow } = await supabaseAdmin
          .from("site_info")
          .select("homepage_layout_config")
          .limit(1)
          .maybeSingle();

        if (siteRow?.homepage_layout_config?.banners && Array.isArray(siteRow.homepage_layout_config.banners)) {
          bannersList = siteRow.homepage_layout_config.banners;
        }
      } catch {}
    }

    // ۳. فال‌بک از جدول modular_pages
    if (bannersList.length === 0 && supabaseAdmin) {
      try {
        const { data: pageRecord } = await supabaseAdmin
          .from("modular_pages")
          .select("puck_data")
          .eq("slug", "site_banners")
          .maybeSingle();

        if (pageRecord?.puck_data?.banners && Array.isArray(pageRecord.puck_data.banners)) {
          bannersList = pageRecord.puck_data.banners;
        }
      } catch {}
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

    let savedSuccessfully = false;

    // لایه ۱: درج مستقیم در جدول banners با فرمت‌های مختلف ستون‌ها
    if (supabaseAdmin) {
      try {
        if (body.id) {
          const { error: updErr } = await supabaseAdmin.from("banners").update(bannerRecord).eq("id", body.id);
          if (!updErr) savedSuccessfully = true;
          else {
            // تلاش با ستون link به جای link_url
            const { error: updErr2 } = await supabaseAdmin.from("banners").update({
              title,
              image_url: imageUrl,
              is_active: isActive,
              updated_at: new Date().toISOString(),
            }).eq("id", body.id);
            if (!updErr2) savedSuccessfully = true;
          }
        } else {
          const { error: insErr } = await supabaseAdmin.from("banners").insert([{ ...bannerRecord, created_at: new Date().toISOString() }]);
          if (!insErr) savedSuccessfully = true;
          else {
            const { error: insErr2 } = await supabaseAdmin.from("banners").insert([{
              id: bannerId,
              title,
              image_url: imageUrl,
              is_active: isActive,
              created_at: new Date().toISOString(),
            }]);
            if (!insErr2) savedSuccessfully = true;
          }
        }
      } catch (dbErr) {
        console.warn("Table banners insert warning:", dbErr);
      }
    }

    // لایه ۲: ذخیره قطعی و تضمینی در جدول site_info
    if (supabaseAdmin) {
      try {
        const { data: siteRow } = await supabaseAdmin.from("site_info").select("id, homepage_layout_config").limit(1).maybeSingle();
        if (siteRow) {
          const currentConfig = siteRow.homepage_layout_config || {};
          let currentBanners = Array.isArray(currentConfig.banners) ? currentConfig.banners : [];

          if (body.id) {
            currentBanners = currentBanners.map((b: any) => (b.id === body.id ? bannerRecord : b));
          } else {
            currentBanners = [bannerRecord, ...currentBanners];
          }

          currentConfig.banners = currentBanners;

          await supabaseAdmin
            .from("site_info")
            .update({ homepage_layout_config: currentConfig, updated_at: new Date().toISOString() })
            .eq("id", siteRow.id);

          savedSuccessfully = true;
        }
      } catch (cfgErr) {
        console.warn("Site info banner backup warning:", cfgErr);
      }
    }

    // لایه ۳: ذخیره در جدول modular_pages تحت اسلاگ site_banners
    if (supabaseAdmin) {
      try {
        const { data: pageRecord } = await supabaseAdmin.from("modular_pages").select("*").eq("slug", "site_banners").maybeSingle();
        let existingBanners = pageRecord?.puck_data?.banners || [];
        if (body.id) {
          existingBanners = existingBanners.map((b: any) => (b.id === body.id ? bannerRecord : b));
        } else {
          existingBanners = [bannerRecord, ...existingBanners];
        }

        if (pageRecord) {
          await supabaseAdmin.from("modular_pages").update({ puck_data: { banners: existingBanners }, updated_at: new Date().toISOString() }).eq("id", pageRecord.id);
        } else {
          await supabaseAdmin.from("modular_pages").insert([{
            slug: "site_banners",
            title: "Banners Registry",
            puck_data: { banners: existingBanners },
            is_published: true,
            created_at: new Date().toISOString(),
          }]);
        }
        savedSuccessfully = true;
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "بنر با موفقیت ذخیره شد.",
      banner: bannerRecord,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در ذخیره‌سازی بنر." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه بنر الزامی است." }, { status: 400 });

    if (supabaseAdmin) {
      try { await supabaseAdmin.from("banners").delete().eq("id", id); } catch {}

      try {
        const { data: siteRow } = await supabaseAdmin.from("site_info").select("id, homepage_layout_config").limit(1).maybeSingle();
        if (siteRow?.homepage_layout_config?.banners) {
          const filtered = siteRow.homepage_layout_config.banners.filter((b: any) => b.id !== id);
          siteRow.homepage_layout_config.banners = filtered;
          await supabaseAdmin.from("site_info").update({ homepage_layout_config: siteRow.homepage_layout_config }).eq("id", siteRow.id);
        }
      } catch {}

      try {
        const { data: pageRecord } = await supabaseAdmin.from("modular_pages").select("*").eq("slug", "site_banners").maybeSingle();
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

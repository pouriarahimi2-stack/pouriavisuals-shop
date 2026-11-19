// File Path: app/api/news/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { unpackProductRow } from "@/lib/productUnpacker";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeSlug(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── تولید گزارش‌های تحلیلی سئو از روی کالاهای واقعی کاتالوگ (بدون اخبار ساختگی بی‌ربط)
export async function autoSeedWeeklySeoNewsIfNeeded(): Promise<void> {
  try {
    const { data: rawProds } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(6);

    const prods = (rawProds || []).map(unpackProductRow);
    if (prods.length === 0) return;

    const { data: existing } = await supabaseAdmin
      .from("tech_news")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    const existingTitles = new Set(
      (existing || []).map((item: any) => String(item.title || "").trim())
    );

    const nowIso = new Date().toISOString();
    const toInsert: any[] = [];

    prods.slice(0, 4).forEach((p: any, idx: number) => {
      const pTitle = p.title || p.name || "تجهیزات هوشمند";
      const pCat = p.category || "کالای دیجیتال";
      const pPrice = Number(p.discount_price || p.price || 0);
      const priceText =
        pPrice > 0
          ? `${pPrice.toLocaleString("fa-IR")} تومان`
          : "قیمت روز رقابتی";

      const newsTitle = `گزارش تحلیلی و بررسی فنی ${pTitle}؛ استانداردهای روز در دسته ${pCat}`;
      if (existingTitles.has(newsTitle)) return;

      const contentHtml = [
        `<h2>بررسی تخصصی و تحلیل عملکرد ${pTitle}</h2>`,
        `<p>در این گزارش از رادار فناوری آکسون کور، به بررسی مشخصات مهندسی، کیفیت ساخت و مزایای استفاده از <strong>${pTitle}</strong> در دسته‌بندی <strong>${pCat}</strong> می‌پردازیم.</p>`,
        `<h3>نکات برجسته فنی و ارزش خرید</h3>`,
        `<ul>`,
        `  <li><strong>کیفیت ساخت و دوام بالا:</strong> طراحی مهندسی‌شده برای کارکرد پایدار و ایمن در استفاده روزمره.</li>`,
        `  <li><strong>ضمانت اصالت و سلامت فیزیکی:</strong> عرضه مستقیم با ${
          p.warranty || "۱۸ ماه گارانتی اصالت طلایی"
        } در آکسون کور.</li>`,
        `  <li><strong>قیمت رقابتی (${priceText}):</strong> ارزش خرید بالا نسبت به مشخصات فنی ارائه‌شده.</li>`,
        `</ul>`,
        `<div style="margin-top:20px;padding:18px;border-radius:18px;background:rgba(2,132,199,0.12);border:1px solid rgba(56,189,248,0.35);">`,
        `  <h3>🛍️ مشاهده مشخصات و خرید مستقیم ${pTitle}</h3>`,
        `  <p>هم‌اکنون می‌توانید <strong>${pTitle}</strong> را با قیمت <strong>${priceText}</strong> و ارسال سریع پیشتاز از کاتالوگ رسمی سفارش دهید:</p>`,
        `  <p><a href="/products/${p.id}"><strong>🔗 ورود به صفحه محصول ${pTitle} ←</strong></a></p>`,
        `</div>`,
      ].join("\n");

      toInsert.push({
        id: randomUUID(),
        title: newsTitle,
        slug:
          (normalizeSlug(pTitle) || "product-report") +
          "-radar-" +
          (idx + 1),
        summary: `تحلیل تخصصی کیفیت ساخت، مشخصات فنی و ارزش خرید ${pTitle} در دسته ${pCat} همراه با بررسی شرایط گارانتی و قیمت روز.`,
        content: contentHtml,
        category: "gadgets",
        source_name: "رادار تحلیلی آکسون کور",
        image_url:
          p.image && p.image !== "/placeholder.png"
            ? p.image
            : "/placeholder.png",
        tags: [pTitle, pCat, "بررسی تخصصی", "آکسون کور"],
        is_published: true,
        trending_score: 98 - idx,
        published_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
      });
    });

    if (toInsert.length > 0) {
      await supabaseAdmin.from("tech_news").insert(toInsert);
    }
  } catch {}
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");
    const includeDrafts = searchParams.get("includeDrafts") === "true";

    if (slug || id) {
      const targetKey = decodeURIComponent(String(slug || id || "")).trim();
      let newsItem: any = null;

      if (UUID_REGEX.test(targetKey)) {
        const { data } = await supabaseAdmin
          .from("tech_news")
          .select("*")
          .eq("id", targetKey)
          .maybeSingle();
        newsItem = data;
      }

      if (!newsItem) {
        const { data } = await supabaseAdmin
          .from("tech_news")
          .select("*")
          .eq("slug", targetKey)
          .maybeSingle();
        newsItem = data;
      }

      if (!newsItem) {
        return NextResponse.json(
          { success: false, data: null, news: null, message: "خبر یافت نشد." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, data: newsItem, news: newsItem },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    let query = supabaseAdmin
      .from("tech_news")
      .select("*")
      .order("created_at", { ascending: false });

    if (!includeDrafts) {
      query = query.eq("is_published", true);
    }

    let { data, error } = await query;
    if (error) throw error;

    // اگر هیچ خبری در دیتابیس نبود، به صورت خودکار از روی محصولات واقعی فروشگاه گزارش تحلیلی بساز
    if (!data || data.length === 0) {
      await autoSeedWeeklySeoNewsIfNeeded();
      const retry = await supabaseAdmin
        .from("tech_news")
        .select("*")
        .order("created_at", { ascending: false });
      data = retry.data || [];
    }

    return NextResponse.json(
      { success: true, data: data || [], news: data || [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, data: [], news: [], message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز." },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (body.action === "toggle_publish" && body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("tech_news")
        .update({
          is_published: Boolean(body.is_published),
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: updated.is_published
          ? "✓ خبر در رادار فناوری سایت منتشر شد."
          : "✓ خبر به حالت پیش‌نویس تغییر یافت.",
        data: updated,
      });
    }

    const cleanTitle = String(body.title || "").trim();
    if (!cleanTitle) {
      return NextResponse.json(
        { success: false, message: "تیتر خبر الزامی است." },
        { status: 400 }
      );
    }

    const newsId =
      body.id && String(body.id).length > 10 ? body.id : randomUUID();
    const baseSlug =
      normalizeSlug(body.slug || cleanTitle) ||
      "tech-news-" + Date.now().toString().slice(-5);

    const nowIso = new Date().toISOString();
    const payload: Record<string, any> = {
      id: newsId,
      title: cleanTitle,
      slug: baseSlug,
      summary: body.summary ? String(body.summary).trim() : cleanTitle,
      content: body.content ? String(body.content).trim() : "",
      category: body.category || "hardware",
      source_name: body.source_name
        ? String(body.source_name).trim()
        : "رادار فناوری آکسون",
      image_url: body.image_url || "/placeholder.png",
      tags: Array.isArray(body.tags) ? body.tags : ["تکنولوژی", "کالای دیجیتال"],
      is_published:
        body.is_published !== undefined ? Boolean(body.is_published) : true,
      trending_score: body.trending_score ? Number(body.trending_score) : 95,
      updated_at: nowIso,
    };

    if (body.id) {
      const { data, error } = await supabaseAdmin
        .from("tech_news")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "✓ خبر با موفقیت به‌روزرسانی شد.",
        data,
      });
    } else {
      const { data: existingSlug } = await supabaseAdmin
        .from("tech_news")
        .select("id")
        .eq("slug", baseSlug)
        .maybeSingle();

      if (existingSlug) {
        payload.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }

      payload.published_at = nowIso;
      payload.created_at = nowIso;

      const { data, error } = await supabaseAdmin
        .from("tech_news")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "✓ خبر با موفقیت منتشر گردید.",
        data,
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز." },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه خبر الزامی است." },
        { status: 400 }
      );
    }
    const { error } = await supabaseAdmin
      .from("tech_news")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({
      success: true,
      message: "✓ خبر با موفقیت از دیتابیس حذف گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
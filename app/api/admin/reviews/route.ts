// File Path: app/api/admin/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { unpackProductRow } from "@/lib/productUnpacker";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const [r1, r2, prodsRes, siteRow] = await Promise.all([
      supabaseAdmin.from("reviews").select("*").order("created_at", { ascending: false }),
      supabaseAdmin
        .from("product_reviews")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("products").select("*"),
      getMasterSiteInfoRow(),
    ]);

    const products = (prodsRes.data || []).map(unpackProductRow);
    const productMap = new Map<string, any>();
    for (const p of products) {
      productMap.set(String(p.id), p);
    }

    const layoutCfg = siteRow?.homepage_layout_config || {};
    const storedMetaList: any[] = Array.isArray(layoutCfg.reviews_metadata_store)
      ? layoutCfg.reviews_metadata_store
      : [];
    const metaMap = new Map<string, any>();
    for (const m of storedMetaList) {
      if (m && m.id) metaMap.set(String(m.id), m);
    }

    const combinedMap = new Map<string, any>();
    for (const item of [...(r1.data || []), ...(r2.data || []), ...storedMetaList]) {
      if (!item || !item.id) continue;
      const id = String(item.id);
      const meta = metaMap.get(id) || {};
      const pid = String(item.product_id || meta.product_id || "");
      const matchedProd = productMap.get(pid);

      const isApp =
        meta.is_approved !== undefined
          ? Boolean(meta.is_approved)
          : item.is_approved !== undefined
          ? Boolean(item.is_approved)
          : item.status !== "pending" && item.status !== "rejected";

      const commentText = item.comment || item.content || item.body || meta.comment || "";
      if (!commentText) continue;

      combinedMap.set(id, {
        id,
        product_id: pid,
        product_title:
          matchedProd?.title || item.product_title || meta.product_title || "محصول کاتالوگ",
        product_image: matchedProd?.image || "/placeholder.png",
        user_name: item.user_name || item.author_name || meta.user_name || "خریدار محصول",
        author_name: item.author_name || item.user_name || meta.user_name || "خریدار محصول",
        rating: Math.max(1, Math.min(5, Number(item.rating ?? meta.rating ?? 5))),
        comment: commentText,
        admin_reply: item.admin_reply ?? meta.admin_reply ?? "",
        is_approved: isApp,
        status: isApp ? "approved" : "pending",
        created_at: item.created_at || meta.created_at || new Date().toISOString(),
      });
    }

    const allReviews = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(
      {
        success: true,
        reviews: allReviews,
        data: allReviews,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      reviews: [],
      data: [],
      message: err.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const nowIso = new Date().toISOString();

    // اکشن تولید خودکار دیدگاه‌های اولیه برای محصولات کاتالوگ (جهت تقویت سئو و AggregateRating)
    if (body.action === "seed_catalog_reviews") {
      const { data: rawProds } = await supabaseAdmin.from("products").select("*").limit(15);
      const products = (rawProds || []).map(unpackProductRow);

      if (products.length === 0) {
        return NextResponse.json(
          { success: false, message: "محصولی در کاتالوگ یافت نشد." },
          { status: 400 }
        );
      }

      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const metaList: any[] = Array.isArray(layoutCfg.reviews_metadata_store)
        ? layoutCfg.reviews_metadata_store
        : [];

      const sampleReviewsTemplates = [
        {
          user: "محمدرضا کاظمی",
          rating: 5,
          comment:
            "کیفیت ساخت و متریال دستگاه واقعاً عالیه. بسته‌بندی کاملاً پلمپ و اورجینال به دستم رسید و سرعت ارسال آکسون کور فوق‌العاده بود.",
          reply:
            "محمدرضای عزیز، از اعتماد و خرید شما سپاسگزاریم. مبارکتان باشد و همواره در خدمتیم 🌸",
        },
        {
          user: "سارا احمدی",
          rating: 5,
          comment:
            "قبل از خرید از پشتیبانی مشاوره گرفتم و خیلی دقیق راهنمایی کردن. عملکرد دستگاه دقیقاً مطابق مشخصات فنی سایت هست و کاملاً راضی‌ام.",
          reply:
            "سرکار خانم احمدی، خوشحالیم که از کیفیت محصول و خدمات مشاوره آکسون کور رضایت کامل دارید 🛡️",
        },
        {
          user: "امیرحسین رضوی",
          rating: 5,
          comment:
            "نسبت به قیمت، ارزش خرید بسیار بالایی داره و گارانتی اصالت کالا خیال آدم رو کاملاً راحت می‌کنه. به دوستان هم پیشنهاد می‌کنم.",
          reply:
            "امیرحسین گرامی، ممنون از ثبت تجربه خریدتان. رضایت شما بزرگ‌ترین سرمایه آکسون کور است ✨",
        },
      ];

      let createdCount = 0;
      for (let i = 0; i < Math.min(products.length, 6); i++) {
        const prod = products[i];
        const tpl = sampleReviewsTemplates[i % sampleReviewsTemplates.length];
        const revId = randomUUID();

        const minimalRow = {
          id: revId,
          product_id: String(prod.id),
          user_name: tpl.user,
          rating: tpl.rating,
          comment: `${tpl.comment} (${prod.title})`,
          created_at: nowIso,
        };

        const fullRow = {
          ...minimalRow,
          product_title: prod.title,
          admin_reply: tpl.reply,
          is_approved: true,
          status: "approved",
          updated_at: nowIso,
        };

        await supabaseAdmin.from("product_reviews").insert([minimalRow]);
        const { error: revErr } = await supabaseAdmin.from("reviews").insert([fullRow]);
        if (revErr) {
          await supabaseAdmin.from("reviews").insert([minimalRow]);
        }

        metaList.unshift(fullRow);
        createdCount++;
      }

      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          reviews_metadata_store: metaList.slice(0, 500),
        },
        {}
      );

      return NextResponse.json({
        success: true,
        createdCount,
        message: `✓ تعداد ${createdCount} دیدگاه تاییدشده به همراه پاسخ رسمی فروشگاه برای محصولات کاتالوگ ثبت و منتشر شد.`,
      });
    }

    // ثبت دستی دیدگاه جدید توسط ادمین
    const productId = String(body.product_id || "").trim();
    const userName = String(body.user_name || "خریدار تاییدشده").trim();
    const comment = String(body.comment || "").trim();
    const adminReply = String(body.admin_reply || "").trim();
    const rating = Math.max(1, Math.min(5, Number(body.rating || 5)));

    if (!productId || !comment) {
      return NextResponse.json(
        { success: false, message: "انتخاب محصول و وارد کردن متن دیدگاه الزامی است." },
        { status: 400 }
      );
    }

    const revId = randomUUID();
    const minimalRow = {
      id: revId,
      product_id: productId,
      user_name: userName,
      rating,
      comment,
      created_at: nowIso,
    };

    const fullRow = {
      ...minimalRow,
      admin_reply: adminReply,
      is_approved: true,
      status: "approved",
      updated_at: nowIso,
    };

    await supabaseAdmin.from("product_reviews").insert([minimalRow]);
    const { error: revErr } = await supabaseAdmin.from("reviews").insert([fullRow]);
    if (revErr) {
      await supabaseAdmin.from("reviews").insert([minimalRow]);
    }

    const siteRow = await getMasterSiteInfoRow();
    const layoutCfg = siteRow?.homepage_layout_config || {};
    const metaList: any[] = Array.isArray(layoutCfg.reviews_metadata_store)
      ? layoutCfg.reviews_metadata_store
      : [];
    metaList.unshift(fullRow);
    await saveMasterSiteInfoRow(
      siteRow,
      {
        ...layoutCfg,
        reviews_metadata_store: metaList.slice(0, 500),
      },
      {}
    );

    return NextResponse.json({
      success: true,
      review: fullRow,
      message: "✓ دیدگاه جدید با موفقیت ثبت و در صفحه محصول منتشر شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, is_approved, status, admin_reply, comment, rating, user_name } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه دیدگاه الزامی است." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      updated_at: nowIso,
    };
    if (is_approved !== undefined) updatePayload.is_approved = Boolean(is_approved);
    if (status !== undefined) updatePayload.status = status;
    if (admin_reply !== undefined) updatePayload.admin_reply = admin_reply;
    if (comment !== undefined) updatePayload.comment = comment;
    if (rating !== undefined) updatePayload.rating = Number(rating);
    if (user_name !== undefined) updatePayload.user_name = user_name;

    await supabaseAdmin.from("reviews").update(updatePayload).eq("id", id);

    const minimalUpdate: Record<string, any> = {};
    if (comment !== undefined) minimalUpdate.comment = comment;
    if (rating !== undefined) minimalUpdate.rating = Number(rating);
    if (user_name !== undefined) minimalUpdate.user_name = user_name;
    if (Object.keys(minimalUpdate).length > 0) {
      await supabaseAdmin.from("product_reviews").update(minimalUpdate).eq("id", id);
    }

    // بروزرسانی در متادیتای پایدار
    const siteRow = await getMasterSiteInfoRow();
    const layoutCfg = siteRow?.homepage_layout_config || {};
    const metaList: any[] = Array.isArray(layoutCfg.reviews_metadata_store)
      ? layoutCfg.reviews_metadata_store
      : [];
    const existingIdx = metaList.findIndex((m) => String(m?.id) === String(id));
    if (existingIdx !== -1) {
      metaList[existingIdx] = {
        ...metaList[existingIdx],
        ...updatePayload,
      };
    } else {
      metaList.unshift({
        id: String(id),
        ...updatePayload,
      });
    }
    await saveMasterSiteInfoRow(
      siteRow,
      {
        ...layoutCfg,
        reviews_metadata_store: metaList.slice(0, 500),
      },
      {}
    );

    return NextResponse.json({
      success: true,
      message: "✓ تغییرات دیدگاه با موفقیت ذخیره شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه دیدگاه الزامی است." },
        { status: 400 }
      );
    }

    await Promise.all([
      supabaseAdmin.from("reviews").delete().eq("id", id),
      supabaseAdmin.from("product_reviews").delete().eq("id", id),
    ]);

    try {
      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const metaList: any[] = Array.isArray(layoutCfg.reviews_metadata_store)
        ? layoutCfg.reviews_metadata_store.filter((m: any) => String(m?.id) !== String(id))
        : [];
      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          reviews_metadata_store: metaList,
        },
        {}
      );
    } catch {}

    return NextResponse.json({ success: true, message: "✓ دیدگاه با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
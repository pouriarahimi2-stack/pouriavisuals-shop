// File Path: app/api/blogs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { unpackProductRow } from "@/lib/productUnpacker";
import {
  getMasterSiteInfoRow,
  saveMasterSiteInfoRow,
} from "@/lib/siteInfoPersistence";
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

function buildAccurateProductArticleHtml(p: any): string {
  const prodTitle = String(p?.title || p?.name || "محصول تخصصی").trim();
  const prodCat = String(
    p?.category || "راهنمای خرید و بررسی تخصصی"
  ).trim();
  const prodBrand = String(p?.brand || "").trim();
  const prodWarranty = String(p?.warranty || "").trim();
  const prodPrice = Number(p?.discount_price || p?.price || 0);
  const priceText =
    prodPrice > 0
      ? `${prodPrice.toLocaleString("fa-IR")} تومان`
      : "قیمت روز رقابتی";
  const prodUrl = `/products/${p.id}`;

  const specsObj = p?.specs && typeof p.specs === "object" ? p.specs : {};
  const specEntries = Object.entries(specsObj).filter(([k, v]) => k && v);

  const specsRowsHtml =
    specEntries.length > 0
      ? specEntries
          .map(
            ([k, v]) =>
              `<tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">${k}</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">${v}</td></tr>`
          )
          .join("")
      : `
        <tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">عنوان محصول</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">${prodTitle}</td></tr>
        <tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">دسته‌بندی</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">${prodCat}</td></tr>
        ${
          prodBrand
            ? `<tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">برند سازنده</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">${prodBrand}</td></tr>`
            : ""
        }
        ${
          prodWarranty
            ? `<tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">پوشش گارانتی</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">${prodWarranty}</td></tr>`
            : `<tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">تضمین کیفیت</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">بررسی سلامت فیزیکی پیش از ارسال</td></tr>`
        }
        <tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">قیمت روز</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">${priceText}</td></tr>
      `;

  const brandIntroSentence = prodBrand
    ? `محصول <strong>${prodTitle}</strong> از برند <strong>${prodBrand}</strong>`
    : `محصول <strong>${prodTitle}</strong>`;

  const warrantyIntroSentence = prodWarranty
    ? `با پوشش <strong>${prodWarranty}</strong> و تضمین سلامت فیزیکی عرضه می‌گردد.`
    : `پس از بررسی کامل سلامت فیزیکی و بسته‌بندی ایمن به سراسر کشور ارسال می‌گردد.`;

  const faqWarrantyAnswer = prodWarranty
    ? `بله، این کالا با <strong>${prodWarranty}</strong> و تضمین اصالت و سلامت فیزیکی در فروشگاه آکسون کور عرضه می‌شود.`
    : `تمامی کالاهای فروشگاه آکسون کور پیش از ارسال از نظر سلامت فیزیکی و عملکرد بررسی شده و با بسته‌بندی ایمن ارسال می‌گردند.`;

  return `
<article class="space-y-6 leading-relaxed">
  <h2>بررسی تخصصی، مشخصات فنی و راهنمای خرید ${prodTitle}</h2>
  <p>انتخاب و خرید <strong>${prodTitle}</strong> در دسته‌بندی <strong>${prodCat}</strong> نیازمند بررسی دقیق کیفیت ساخت، مشخصات فنی، کارایی و ارزش خرید است. در این مقاله از مجله تخصصی آکسون کور، ویژگی‌های کلیدی این محصول را به صورت دقیق بررسی می‌کنیم.</p>

  <h3>چرا ${prodTitle} ارزش خرید بالایی دارد؟</h3>
  <p>${brandIntroSentence} طراحی شده و ${warrantyIntroSentence} کیفیت ساخت مطلوب و عملکرد پایدار در استفاده روزمره، این مدل را به یکی از گزینه‌های کاربردی کاتالوگ تبدیل کرده است.</p>

  <h3>جدول مشخصات کلیدی و شرایط عرضه در آکسون کور</h3>
  <div style="overflow-x:auto;margin:16px 0;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:rgba(2,132,199,0.12);">
          <th style="padding:12px;border:1px solid rgba(148,163,184,0.25);text-align:right;">شاخص بررسی</th>
          <th style="padding:12px;border:1px solid rgba(148,163,184,0.25);text-align:right;">مشخصات در فروشگاه آکسون کور</th>
        </tr>
      </thead>
      <tbody>
        ${specsRowsHtml}
      </tbody>
    </table>
  </div>

  <h3>سوالات متداول پیش از خرید ${prodTitle}</h3>
  <p><strong>آیا این کالا دارای ضمانت سلامت و گارانتی است؟</strong><br/>${faqWarrantyAnswer}</p>
  <p><strong>نحوه ارسال سفارش به چه صورت است؟</strong><br/>سفارش‌های ثبت‌شده در کوتاه‌ترین زمان پردازش و از طریق پست پیشتاز یا تیپاکس به سراسر کشور ارسال می‌شوند.</p>

  <div style="margin-top:24px;padding:20px;border-radius:20px;background:linear-gradient(135deg,rgba(2,132,199,0.15),rgba(79,70,229,0.12));border:1px solid rgba(56,189,248,0.35);">
    <h4 style="margin:0 0 8px 0;font-weight:900;color:#38bdf8;">🛍️ مشاهده مشخصات و خرید آنلاین ${prodTitle}</h4>
    <p style="margin:0 0 14px 0;font-size:13px;">برای ثبت سفارش مستقیم <strong>${prodTitle}</strong> با قیمت <strong>${priceText}</strong> و ارسال سریع کلیک کنید:</p>
    <a href="${prodUrl}" style="display:inline-block;padding:10px 22px;border-radius:14px;background:#0284c7;color:#ffffff;font-weight:900;text-decoration:none;font-size:13px;">خرید مستقیم ${prodTitle} ←</a>
  </div>
</article>`.trim();
}

async function ensureCatalogSeoArticles(): Promise<any[]> {
  try {
    const { data: rawProds } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(4);

    const prods = (rawProds || []).map(unpackProductRow);
    if (prods.length === 0) return [];

    const nowIso = new Date().toISOString();
    const generatedPosts = prods.map((p: any, idx: number) => {
      const prodTitle = p.title || p.name || "محصول تخصصی";
      const prodCat = p.category || "راهنمای خرید و بررسی تخصصی";
      const prodPrice = Number(p.discount_price || p.price || 0);
      const priceText =
        prodPrice > 0
          ? `${prodPrice.toLocaleString("fa-IR")} تومان`
          : "قیمت روز رقابتی";

      return {
        id: randomUUID(),
        title: `بررسی تخصصی و راهنمای خرید ${prodTitle}`,
        slug:
          (normalizeSlug(prodTitle) || "product-guide") +
          "-guide-" +
          (idx + 1),
        content: buildAccurateProductArticleHtml(p),
        category: prodCat,
        image_url:
          p.image && p.image !== "/placeholder.png"
            ? p.image
            : "/placeholder.png",
        meta_description:
          `بررسی تخصصی، جدول مشخصات و راهنمای خرید ${prodTitle} با بهترین قیمت روز (${priceText}) در آکسون کور.`.slice(
            0,
            155
          ),
        is_published: true,
        created_at: nowIso,
        updated_at: nowIso,
      };
    });

    const { data: inserted } = await supabaseAdmin
      .from("posts")
      .insert(generatedPosts)
      .select();

    return Array.isArray(inserted) ? inserted : generatedPosts;
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const onlyPublished = searchParams.get("published") === "true";

    if (id || slug) {
      const targetKey = decodeURIComponent(String(id || slug || "")).trim();
      let postData: any = null;

      if (UUID_REGEX.test(targetKey)) {
        const { data } = await supabaseAdmin
          .from("posts")
          .select("*")
          .eq("id", targetKey)
          .maybeSingle();
        postData = data;
      }

      if (!postData) {
        const { data } = await supabaseAdmin
          .from("posts")
          .select("*")
          .eq("slug", targetKey)
          .maybeSingle();
        postData = data;
      }

      return NextResponse.json(
        { success: true, post: postData, data: postData },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const [postsRes, siteRow] = await Promise.all([
      supabaseAdmin
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false }),
      getMasterSiteInfoRow(),
    ]);

    if (postsRes.error) throw postsRes.error;

    let allPosts = Array.isArray(postsRes.data) ? postsRes.data : [];
    if (allPosts.length === 0) {
      allPosts = await ensureCatalogSeoArticles();
    }

    const layoutCfg = siteRow?.homepage_layout_config || {};
    const blogPageConfig = layoutCfg.blog_page_config || {};
    const postAuthorsMap: Record<string, string> =
      layoutCfg.blog_post_authors && typeof layoutCfg.blog_post_authors === "object"
        ? layoutCfg.blog_post_authors
        : {};

    const enrichedPosts = allPosts.map((p: any) => ({
      ...p,
      author: p.author || postAuthorsMap[String(p.id)] || "",
    }));

    const filtered = onlyPublished
      ? enrichedPosts.filter((p: any) => p.is_published !== false)
      : enrichedPosts;

    return NextResponse.json(
      { success: true, posts: filtered, data: filtered, blogPageConfig },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, posts: [], data: [], message: err.message },
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

    // ذخیره تنظیمات سراسری تمامی اجزای صفحه مقالات
    if (body.action === "save_blog_settings") {
      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const nextBlogCfg = {
        showBreadcrumb: body.showBreadcrumb !== false,
        breadcrumbHomeLabel: String(body.breadcrumbHomeLabel || "خانه").trim(),
        breadcrumbBlogLabel: String(
          body.breadcrumbBlogLabel || "مجله تخصصی"
        ).trim(),
        showReadingTime: body.showReadingTime !== false,
        readingTimePrefix: String(
          body.readingTimePrefix || "زمان مطالعه:"
        ).trim(),
        readingTimeUnit: String(body.readingTimeUnit || "دقیقه").trim(),
        showAuthor: body.showAuthor !== false,
        authorPrefix: String(body.authorPrefix || "نویسنده:").trim(),
        defaultAuthorName: String(body.defaultAuthorName || "").trim(),
        showPublishDate: body.showPublishDate !== false,
        publishDatePrefix: String(
          body.publishDatePrefix || "تاریخ انتشار:"
        ).trim(),
        showFeaturedImage: body.showFeaturedImage !== false,
        showLinkedProductCard: body.showLinkedProductCard !== false,
        linkedProductBadge: String(
          body.linkedProductBadge || "🛍️ محصول بررسی‌شده در این مقاله"
        ).trim(),
        linkedProductButtonText: String(
          body.linkedProductButtonText || "مشاهده مشخصات و خرید آنلاین ←"
        ).trim(),
        defaultWarrantyFallback: String(
          body.defaultWarrantyFallback || ""
        ).trim(),
        showRelatedPosts: body.showRelatedPosts !== false,
        relatedPostsTitle: String(
          body.relatedPostsTitle || "📚 سایر مقالات و راهنماهای تخصصی مرتبط"
        ).trim(),
        relatedPostLinkText: String(
          body.relatedPostLinkText || "مطالعه مقاله ←"
        ).trim(),
        ctaBoxEnabled: body.ctaBoxEnabled !== false,
        ctaBoxTitle: String(body.ctaBoxTitle || "").trim(),
        ctaBoxSubtitle: String(body.ctaBoxSubtitle || "").trim(),
        ctaButtonText: String(body.ctaButtonText || "").trim(),
        ctaButtonUrl: String(body.ctaButtonUrl || "/products").trim(),
        archiveButtonText: String(body.archiveButtonText || "").trim(),
        archiveButtonUrl: String(body.archiveButtonUrl || "/blog").trim(),
      };

      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          blog_page_config: nextBlogCfg,
        },
        {}
      );

      return NextResponse.json({
        success: true,
        blogPageConfig: nextBlogCfg,
        message:
          "✓ تنظیمات تمامی بخش‌های صفحه مقالات با موفقیت ذخیره و در کل سایت اعمال شد.",
      });
    }

    if (body.action === "rebuild_from_real_products") {
      const [postsRes, prodsRes] = await Promise.all([
        supabaseAdmin.from("posts").select("*"),
        supabaseAdmin.from("products").select("*"),
      ]);

      const allPosts = postsRes.data || [];
      const allProducts = (prodsRes.data || []).map(unpackProductRow);
      const prodMap = new Map(allProducts.map((p: any) => [String(p.id), p]));

      let updatedCount = 0;
      for (const post of allPosts) {
        const rawContent = String(post.content || "");
        const match = rawContent.match(/\/products\/([a-zA-Z0-9_-]+)/);
        const linkedProd = match?.[1] ? prodMap.get(match[1]) : null;

        let nextContent = rawContent;
        let nextMeta = String(post.meta_description || "");

        if (linkedProd) {
          nextContent = buildAccurateProductArticleHtml(linkedProd);
          const prodPrice = Number(
            linkedProd.discount_price || linkedProd.price || 0
          );
          const priceText =
            prodPrice > 0
              ? `${prodPrice.toLocaleString("fa-IR")} تومان`
              : "قیمت روز رقابتی";
          nextMeta =
            `بررسی تخصصی، جدول مشخصات و راهنمای خرید ${linkedProd.title} با بهترین قیمت روز (${priceText}) در آکسون کور.`.slice(
              0,
              155
            );
        } else {
          nextContent = nextContent
            .replace(
              /با استانداردهای کیفی برند\s*<strong>Apple<\/strong>/g,
              "با استانداردهای کیفی روز"
            )
            .replace(
              /با پوشش\s*<strong>۱۸ ماه گارانتی اصالت و سلامت فیزیکی طلایی<\/strong>/g,
              "با تضمین سلامت فیزیکی"
            )
            .replace(
              /۱۸ ماه گارانتی اصالت و سلامت فیزیکی طلایی/g,
              "تضمین سلامت فیزیکی کالا"
            )
            .replace(/۱۸ ماه گارانتی اصالت طلایی/g, "تضمین سلامت فیزیکی کالا");
          nextMeta = nextMeta
            .replace(/و گارانتی اصالت/g, "")
            .replace(/۱۸ ماه گارانتی اصالت طلایی/g, "");
        }

        const { error: upErr } = await supabaseAdmin
          .from("posts")
          .update({
            content: nextContent,
            meta_description: nextMeta,
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        if (!upErr) updatedCount++;
      }

      return NextResponse.json({
        success: true,
        updatedCount,
        message: `✓ ${updatedCount} مقاله بر اساس برند، گارانتی و قیمت واقعی محصولات پاکسازی و به‌روزرسانی شدند.`,
      });
    }

    if (body.action === "toggle_publish" && body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("posts")
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
          ? "✓ مقاله در مجله سایت و نقشه گوگل منتشر شد."
          : "✓ مقاله به حالت پیش‌نویس تغییر یافت.",
        data: updated,
        post: updated,
      });
    }

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const authorName = String(body.author || "").trim();

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "عنوان و محتوای مقاله الزامی هستند." },
        { status: 400 }
      );
    }

    const baseSlug =
      normalizeSlug(body.slug || title) ||
      "article-" + Date.now().toString().slice(-5);
    const img = String(
      body.imageUrl || body.image_url || "/placeholder.png"
    ).trim();
    const cleanTextExcerpt = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155);
    const metaDesc = String(
      body.metaDescription ||
        body.meta_description ||
        cleanTextExcerpt ||
        title
    ).trim();

    const isPublished =
      body.isPublished !== undefined
        ? Boolean(body.isPublished)
        : body.is_published !== undefined
        ? Boolean(body.is_published)
        : true;

    const nowIso = new Date().toISOString();

    const payload: Record<string, any> = {
      title,
      slug: baseSlug,
      content,
      category: String(body.category || "راهنمای خرید و بررسی تخصصی").trim(),
      image_url: img,
      meta_description: metaDesc,
      is_published: isPublished,
      updated_at: nowIso,
    };

    const persistAuthorMapping = async (postId: string) => {
      try {
        const siteRow = await getMasterSiteInfoRow();
        const layoutCfg = siteRow?.homepage_layout_config || {};
        const prevAuthors =
          layoutCfg.blog_post_authors &&
          typeof layoutCfg.blog_post_authors === "object"
            ? { ...layoutCfg.blog_post_authors }
            : {};

        if (authorName) {
          prevAuthors[postId] = authorName;
        } else {
          delete prevAuthors[postId];
        }

        await saveMasterSiteInfoRow(
          siteRow,
          {
            ...layoutCfg,
            blog_post_authors: prevAuthors,
          },
          {}
        );
      } catch {}
    };

    if (body.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("posts")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      await persistAuthorMapping(String(updated.id));

      return NextResponse.json({
        success: true,
        message: "✓ مقاله سئو با موفقیت به‌روزرسانی شد.",
        data: { ...updated, author: authorName },
        post: { ...updated, author: authorName },
      });
    } else {
      const { data: existingSlug } = await supabaseAdmin
        .from("posts")
        .select("id")
        .eq("slug", baseSlug)
        .maybeSingle();

      if (existingSlug) {
        payload.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }

      const insertRow = {
        id: randomUUID(),
        ...payload,
        created_at: nowIso,
      };

      const { data: inserted, error } = await supabaseAdmin
        .from("posts")
        .insert([insertRow])
        .select()
        .single();

      if (error) throw error;
      await persistAuthorMapping(String(inserted.id));

      return NextResponse.json({
        success: true,
        message: "✓ مقاله سئو با موفقیت در دیتابیس ذخیره و منتشر گردید.",
        data: { ...inserted, author: authorName },
        post: { ...inserted, author: authorName },
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
        { success: false, message: "شناسه مقاله الزامی است." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "✓ مقاله با موفقیت حذف شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
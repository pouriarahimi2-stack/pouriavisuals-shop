// File Path: app/blog/[id]/page.tsx
import React from "react";
import sanitizeHtml from "sanitize-html";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { unpackProductRow } from "@/lib/productUnpacker";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safeJsonLd(obj: any): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function estimateReadingMinutes(htmlOrText?: string): number {
  const clean = String(htmlOrText || "")
    .replace(/<[^>]*>/g, " ")
    .trim();
  if (!clean) return 2;
  const words = clean.split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 180));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPost(rawIdOrSlug: string) {
  try {
    if (!supabaseAdmin || !rawIdOrSlug) return null;
    const decoded = decodeURIComponent(String(rawIdOrSlug)).trim();

    if (UUID_REGEX.test(decoded)) {
      const { data: byId } = await supabaseAdmin
        .from("posts")
        .select("*")
        .eq("id", decoded)
        .maybeSingle();
      if (byId) return byId;
    }

    const { data: bySlug } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("slug", decoded)
      .maybeSingle();

    if (bySlug) return bySlug;
  } catch (e) {
    console.error("Blog post fetch error:", e);
  }

  return null;
}

async function getLinkedProductFromContent(content: string) {
  try {
    if (!supabaseAdmin || !content) return null;
    const match = content.match(/\/products\/([a-zA-Z0-9_-]+)/);
    if (!match || !match[1]) return null;
    const prodId = decodeURIComponent(match[1]).trim();
    const { data: rawProd } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", prodId)
      .maybeSingle();
    if (!rawProd) return null;
    return unpackProductRow(rawProd);
  } catch {
    return null;
  }
}

async function getRelatedPosts(currentId: string) {
  try {
    if (!supabaseAdmin) return [];
    const { data } = await supabaseAdmin
      .from("posts")
      .select("id, title, slug, category, image_url, created_at")
      .neq("id", currentId)
      .order("created_at", { ascending: false })
      .limit(3);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const [post, siteRow] = await Promise.all([
    getPost(id),
    getMasterSiteInfoRow(),
  ]);
  const sys = normalizeSystemSettings(
    siteRow?.homepage_layout_config || {},
    siteRow
  );
  const baseUrl = (sys.canonicalBaseUrl || "https://axoncore.ir").replace(
    /\/+$/,
    ""
  );
  const siteName = sys.site_name || "آکسون کور";
  const allowIndex = !sys.noIndex;

  if (!post) {
    return {
      title: `مقاله یافت نشد | مجله تخصصی ${siteName}`,
      robots: { index: false, follow: false },
    };
  }

  const title = post.title || "مقاله تخصصی و راهنمای خرید";
  const cleanContentText = String(post.content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const desc =
    post.meta_description ||
    cleanContentText.slice(0, 155) ||
    `بررسی و راهنمای تخصصی خرید محصولات در مجله ${siteName}.`;
  const canonicalUrl = `${baseUrl}/blog/${encodeURIComponent(
    post.slug || post.id
  )}`;

  return {
    title: `${title} | مجله تخصصی ${siteName}`,
    description: desc,
    robots: {
      index: allowIndex,
      follow: allowIndex,
      googleBot: { index: allowIndex, follow: allowIndex },
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: desc,
      url: canonicalUrl,
      siteName,
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at || post.created_at,
      images: [post.image_url || `${baseUrl}/placeholder.png`],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;
  const [post, siteRow] = await Promise.all([
    getPost(id),
    getMasterSiteInfoRow(),
  ]);

  if (!post) notFound();

  const layoutCfg = siteRow?.homepage_layout_config || {};
  const sys = normalizeSystemSettings(layoutCfg, siteRow);
  const blogCfg = layoutCfg?.blog_page_config || {};
  const postAuthorsMap: Record<string, string> =
    layoutCfg?.blog_post_authors && typeof layoutCfg.blog_post_authors === "object"
      ? layoutCfg.blog_post_authors
      : {};

  const [linkedProduct, relatedPosts] = await Promise.all([
    getLinkedProductFromContent(post.content || ""),
    getRelatedPosts(String(post.id)),
  ]);

  const baseUrl = (
    sys.canonicalBaseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://axoncore.ir"
  ).replace(/\/+$/, "");
  const siteName = sys.site_name || "آکسون کور | Axon Core";
  const postUrl = `${baseUrl}/blog/${encodeURIComponent(post.slug || post.id)}`;
  const readingMinutes = estimateReadingMinutes(post.content);

  // تنظیمات قابل ویرایش تمام بخش‌های صفحه مقاله از پنل مدیریت
  const showBreadcrumb = blogCfg.showBreadcrumb !== false;
  const breadcrumbHomeLabel = String(
    blogCfg.breadcrumbHomeLabel || "خانه"
  ).trim();
  const breadcrumbBlogLabel = String(
    blogCfg.breadcrumbBlogLabel || "مجله تخصصی"
  ).trim();

  const showReadingTime = blogCfg.showReadingTime !== false;
  const readingTimePrefix = String(
    blogCfg.readingTimePrefix || "زمان مطالعه:"
  ).trim();
  const readingTimeUnit = String(blogCfg.readingTimeUnit || "دقیقه").trim();

  const showAuthor = blogCfg.showAuthor !== false;
  const authorPrefix = String(blogCfg.authorPrefix || "نویسنده:").trim();
  const resolvedAuthor = String(
    post.author ||
      postAuthorsMap[String(post.id)] ||
      blogCfg.defaultAuthorName ||
      `تحریریه فنی ${siteName}`
  ).trim();

  const showPublishDate = blogCfg.showPublishDate !== false;
  const publishDatePrefix = String(
    blogCfg.publishDatePrefix || "تاریخ انتشار:"
  ).trim();

  const showFeaturedImage = blogCfg.showFeaturedImage !== false;

  const showLinkedProductCard = blogCfg.showLinkedProductCard !== false;
  const linkedProductBadge = String(
    blogCfg.linkedProductBadge || "🛍️ محصول بررسی‌شده در این مقاله"
  ).trim();
  const linkedProductButtonText = String(
    blogCfg.linkedProductButtonText || "مشاهده مشخصات و خرید آنلاین ←"
  ).trim();
  const productWarrantyDisplay = String(
    linkedProduct?.warranty || blogCfg.defaultWarrantyFallback || ""
  ).trim();

  const showRelatedPosts = blogCfg.showRelatedPosts !== false;
  const relatedPostsTitle = String(
    blogCfg.relatedPostsTitle || "📚 سایر مقالات و راهنماهای تخصصی مرتبط"
  ).trim();
  const relatedPostLinkText = String(
    blogCfg.relatedPostLinkText || "مطالعه مقاله ←"
  ).trim();

  const ctaBoxEnabled = blogCfg.ctaBoxEnabled !== false;
  const ctaBoxTitle = String(
    blogCfg.ctaBoxTitle || "نیاز به مشاوره تخصصی جهت خرید محصولات دارید؟"
  ).trim();
  const ctaBoxSubtitle = String(
    blogCfg.ctaBoxSubtitle ||
      `کارشناسان ${siteName} آماده پاسخگویی و راهنمایی تخصصی شما برای انتخاب بهترین کالا هستند.`
  ).trim();
  const ctaButtonText = String(
    blogCfg.ctaButtonText || "مشاهده کاتالوگ محصولات ←"
  ).trim();
  const ctaButtonUrl = String(blogCfg.ctaButtonUrl || "/products").trim();
  const archiveButtonText = String(
    blogCfg.archiveButtonText || "آرشیو مجله"
  ).trim();
  const archiveButtonUrl = String(blogCfg.archiveButtonUrl || "/blog").trim();

  const cleanDesc =
    post.meta_description ||
    String(post.content || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: cleanDesc,
    image: [post.image_url || `${baseUrl}/placeholder.png`],
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      "@type": "Person",
      name: resolvedAuthor,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: sys.favicon_url?.startsWith("http")
          ? sys.favicon_url
          : `${baseUrl}${sys.favicon_url || "/favicon.ico"}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: breadcrumbHomeLabel || "صفحه اصلی",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumbBlogLabel || "مجله تخصصی",
        item: `${baseUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <article
      className="max-w-4xl mx-auto px-4 py-6 sm:py-12 font-sans select-text text-[var(--text-primary)] space-y-6 sm:space-y-8"
      dir="rtl"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      {showBreadcrumb && (
        <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
          <Link href="/" className="hover:text-[var(--accent-blue)] transition">
            {breadcrumbHomeLabel}
          </Link>
          <span>/</span>
          <Link
            href="/blog"
            className="hover:text-[var(--accent-blue)] transition"
          >
            {breadcrumbBlogLabel}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] truncate max-w-[220px] sm:max-w-md">
            {post.title}
          </span>
        </nav>
      )}

      <header className="space-y-4 border-b border-[var(--card-border)] pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {post.category && (
            <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-xs font-black inline-block">
              {post.category}
            </span>
          )}
          {showReadingTime && (
            <span className="px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold text-[var(--text-secondary)]">
              ⏱️ {readingTimePrefix} {readingMinutes} {readingTimeUnit}
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black leading-snug">
          {post.title}
        </h1>

        {(showAuthor || showPublishDate) && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] font-medium">
            {showAuthor && (
              <span>
                ✍️ {authorPrefix}{" "}
                <strong className="text-[var(--text-primary)]">
                  {resolvedAuthor}
                </strong>
              </span>
            )}
            {showAuthor && showPublishDate && <span>•</span>}
            {showPublishDate && (
              <span>
                📅 {publishDatePrefix}{" "}
                {post.created_at
                  ? new Date(post.created_at).toLocaleDateString("fa-IR")
                  : "به‌روزرسانی جدید"}
              </span>
            )}
          </div>
        )}
      </header>

      {showFeaturedImage &&
        post.image_url &&
        post.image_url !== "/placeholder.png" && (
          <div className="rounded-3xl sm:rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 overflow-hidden shadow-xl">
            <img
              src={post.image_url}
              alt={post.title}
              width={900}
              height={480}
              className="w-full h-auto max-h-[440px] object-cover rounded-2xl sm:rounded-[2rem]"
            />
          </div>
        )}

      <div
        className="rounded-3xl sm:rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-5 sm:p-10 shadow-sm leading-loose text-sm sm:text-base text-[var(--text-primary)] font-medium space-y-4 text-justify prose dark:prose-invert max-w-none [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:font-black [&_h2]:text-[var(--accent-blue)] [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-black [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pr-5 [&_ul]:space-y-1.5 [&_a]:text-[var(--accent-blue)] [&_a]:underline"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(String(post.content || ""), {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([
              "img",
              "h1",
              "h2",
              "h3",
              "h4",
              "table",
              "thead",
              "tbody",
              "tr",
              "th",
              "td",
              "article",
              "section",
              "div",
              "span",
            ]),
            allowedAttributes: {
              ...sanitizeHtml.defaults.allowedAttributes,
              "*": ["class", "style", "href", "target", "dir"],
              img: ["src", "alt", "width", "height", "loading"],
            },
          }),
        }}
      />

      {showLinkedProductCard && linkedProduct && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-emerald-500/10 border-2 border-[var(--accent-blue)]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
            <img
              src={linkedProduct.image || "/placeholder.png"}
              alt={linkedProduct.title}
              className="w-24 h-24 rounded-2xl object-cover border border-[var(--card-border)] bg-[var(--modal-bg)] shrink-0"
            />
            <div className="space-y-1.5">
              {linkedProductBadge && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                  {linkedProductBadge}
                </span>
              )}
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                {linkedProduct.title}
              </h3>
              {productWarrantyDisplay && (
                <p className="text-xs text-[var(--text-secondary)]">
                  {productWarrantyDisplay}
                </p>
              )}
              <div className="text-sm font-black text-[var(--accent-blue)] font-mono">
                {Number(
                  linkedProduct.discount_price || linkedProduct.price || 0
                ).toLocaleString("fa-IR")}{" "}
                تومان
              </div>
            </div>
          </div>

          <Link
            href={`/products/${linkedProduct.id}`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg hover:opacity-90 transition text-center shrink-0"
          >
            {linkedProductButtonText}
          </Link>
        </div>
      )}

      {showRelatedPosts && relatedPosts.length > 0 && (
        <section className="space-y-4 pt-4">
          {relatedPostsTitle && (
            <h3 className="text-sm sm:text-base font-black text-[var(--accent-blue)]">
              {relatedPostsTitle}
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedPosts.map((rp: any) => (
              <Link
                key={rp.id}
                href={`/blog/${encodeURIComponent(rp.slug || rp.id)}`}
                className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition flex flex-col justify-between gap-2"
              >
                <div className="space-y-2">
                  {rp.image_url && (
                    <img
                      src={rp.image_url}
                      alt={rp.title}
                      className="w-full h-28 object-cover rounded-xl border border-[var(--card-border)]"
                    />
                  )}
                  <h4 className="text-xs font-black line-clamp-2 leading-relaxed">
                    {rp.title}
                  </h4>
                </div>
                {relatedPostLinkText && (
                  <span className="text-[10px] font-bold text-[var(--accent-blue)]">
                    {relatedPostLinkText}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {ctaBoxEnabled && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            {ctaBoxTitle && (
              <h4 className="font-black text-sm text-[var(--text-primary)]">
                {ctaBoxTitle}
              </h4>
            )}
            {ctaBoxSubtitle && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {ctaBoxSubtitle}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {ctaButtonText && (
              <Link
                href={ctaButtonUrl || "/products"}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition shadow-md text-center"
              >
                {ctaButtonText}
              </Link>
            )}
            {archiveButtonText && (
              <Link
                href={archiveButtonUrl || "/blog"}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition text-center"
              >
                {archiveButtonText}
              </Link>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
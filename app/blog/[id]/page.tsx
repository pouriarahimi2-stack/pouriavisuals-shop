// File Path: app/blog/[id]/page.tsx
import React from "react";
import sanitizeHtml from "sanitize-html";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { unpackProductRow } from "@/lib/productUnpacker";
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
  const post = await getPost(id);

  if (!post) {
    return { title: "مقاله یافت نشد | مجله تخصصی آکسون کور" };
  }

  const title = post.title || "مقاله تخصصی تکنولوژی و دیجیتال";
  const cleanContentText = String(post.content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const desc =
    post.meta_description ||
    cleanContentText.slice(0, 155) ||
    "بررسی و راهنمای تخصصی خرید محصولات دیجیتال و تکنولوژی در مجله آکسون کور.";
  const canonicalUrl = "https://axoncore.ir/blog/" + encodeURIComponent(post.slug || post.id);

  return {
    title: title + " | مجله تخصصی آکسون کور",
    description: desc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: desc,
      url: canonicalUrl,
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at || post.created_at,
      images: [post.image_url || "https://axoncore.ir/placeholder.png"],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) notFound();

  const [linkedProduct, relatedPosts] = await Promise.all([
    getLinkedProductFromContent(post.content || ""),
    getRelatedPosts(String(post.id)),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  const postUrl = baseUrl + "/blog/" + encodeURIComponent(post.slug || post.id);
  const readingMinutes = estimateReadingMinutes(post.content);

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
    image: [post.image_url || baseUrl + "/placeholder.png"],
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      "@type": "Person",
      name: post.author || "کارشناس فنی آکسون کور",
    },
    publisher: {
      "@type": "Organization",
      name: "آکسون کور | Axon Core",
      logo: {
        "@type": "ImageObject",
        url: baseUrl + "/favicon.ico",
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
        name: "صفحه اصلی",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "مجله تخصصی",
        item: baseUrl + "/blog",
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

      <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition">
          خانه
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[var(--accent-blue)] transition">
          مجله تخصصی
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-[220px] sm:max-w-md">
          {post.title}
        </span>
      </nav>

      <header className="space-y-4 border-b border-[var(--card-border)] pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-xs font-black inline-block">
            {post.category || "راهنمای خرید و بررسی تخصصی"}
          </span>
          <span className="px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold text-[var(--text-secondary)]">
            ⏱️ زمان مطالعه: {readingMinutes} دقیقه
          </span>
        </div>

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black leading-snug">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] font-medium">
          <span>
            ✍️ نویسنده:{" "}
            <strong className="text-[var(--text-primary)]">
              {post.author || "تحریریه فنی آکسون کور"}
            </strong>
          </span>
          <span>•</span>
          <span>
            📅 تاریخ انتشار:{" "}
            {post.created_at
              ? new Date(post.created_at).toLocaleDateString("fa-IR")
              : "به‌روزرسانی جدید"}
          </span>
        </div>
      </header>

      {post.image_url && post.image_url !== "/placeholder.png" && (
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

      {/* محتوای اصلی مقاله سئو */}
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

      {/* کارت خرید مستقیم محصول مرتبط در صورت اتصال مقاله به کالا */}
      {linkedProduct && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-emerald-500/10 border-2 border-[var(--accent-blue)]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
            <img
              src={linkedProduct.image || "/placeholder.png"}
              alt={linkedProduct.title}
              className="w-24 h-24 rounded-2xl object-cover border border-[var(--card-border)] bg-[var(--modal-bg)] shrink-0"
            />
            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                🛍️ محصول بررسی‌شده در این مقاله
              </span>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                {linkedProduct.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {linkedProduct.warranty || "۱۸ ماه گارانتی اصالت طلایی آکسون کور"}
              </p>
              <div className="text-sm font-black text-[var(--accent-blue)] font-mono">
                {Number(linkedProduct.discount_price || linkedProduct.price || 0).toLocaleString(
                  "fa-IR"
                )}{" "}
                تومان
              </div>
            </div>
          </div>

          <Link
            href={`/products/${linkedProduct.id}`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg hover:opacity-90 transition text-center shrink-0"
          >
            مشاهده مشخصات و خرید آنلاین ←
          </Link>
        </div>
      )}

      {/* مقالات مرتبط جهت تقویت لینک‌سازی داخلی سئو */}
      {relatedPosts.length > 0 && (
        <section className="space-y-4 pt-4">
          <h3 className="text-sm sm:text-base font-black text-[var(--accent-blue)]">
            📚 سایر مقالات و راهنماهای تخصصی مرتبط
          </h3>
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
                  <h4 className="text-xs font-black line-clamp-2 leading-relaxed">{rp.title}</h4>
                </div>
                <span className="text-[10px] font-bold text-[var(--accent-blue)]">
                  مطالعه مقاله ←
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-black text-sm text-[var(--text-primary)]">
            نیاز به مشاوره تخصصی جهت خرید محصولات دیجیتال دارید؟
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            کارشناسان آکسون کور آماده پاسخگویی و راهنمایی تخصصی شما برای انتخاب بهترین تجهیزات هستند.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link
            href="/products"
            className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition shadow-md text-center"
          >
            مشاهده کاتالوگ محصولات ←
          </Link>
          <Link
            href="/blog"
            className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition text-center"
          >
            آرشیو مجله
          </Link>
        </div>
      </div>
    </article>
  );
}
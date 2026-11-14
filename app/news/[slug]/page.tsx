// File Path: app/news/[slug]/page.tsx
import { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import TableOfContents from "@/components/TableOfContents";
import { unpackProductRow } from "@/lib/productUnpacker";
import { formatPrice } from "@/lib/formatters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  params: Promise<{ slug: string }>;
}

function safeJsonLd(obj: any): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function sanitizeNewsHtml(html: string): string {
  if (!html) return "";
  const normalized = html.replace(
    /background:\s*#0f172a\s*;\s*color:\s*#38bdf8\s*;?/gi,
    "background:rgba(2,132,199,0.15);"
  );
  return sanitizeHtml(normalized, {
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
  });
}

async function fetchNewsBySlugOrId(rawSlugOrId: string) {
  try {
    if (!supabaseAdmin || !rawSlugOrId) return null;
    const decoded = decodeURIComponent(String(rawSlugOrId)).trim();

    if (UUID_REGEX.test(decoded)) {
      const { data: byId } = await supabaseAdmin
        .from("tech_news")
        .select("*")
        .eq("id", decoded)
        .maybeSingle();
      if (byId) return byId;
    }

    const { data: bySlug } = await supabaseAdmin
      .from("tech_news")
      .select("*")
      .eq("slug", decoded)
      .maybeSingle();

    if (bySlug) return bySlug;
  } catch (e) {
    console.error("News detail fetch error:", e);
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchNewsBySlugOrId(slug);

  if (!article) return { title: "خبر مورد نظر یافت نشد | آکسون کور" };
  const canonicalUrl =
    "https://axoncore.ir/news/" + encodeURIComponent(article.slug || article.id);

  return {
    title: article.title + " | رادار فناوری آکسون کور",
    description: article.summary || article.title,
    keywords: Array.isArray(article.tags) ? article.tags : [],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.title,
      description: article.summary || article.title,
      url: canonicalUrl,
      images: [article.image_url || "https://axoncore.ir/placeholder.png"],
      type: "article",
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await fetchNewsBySlugOrId(slug);

  if (!article) notFound();

  const [{ data: rawProds }, { data: recentNews }] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4),
    supabaseAdmin
      .from("tech_news")
      .select("id, title, slug, image_url, published_at, created_at")
      .neq("id", article.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const relatedProducts = (rawProds || []).map(unpackProductRow);
  const cleanHtml = sanitizeNewsHtml(article.content || "");

  // فیلتر کردن تیترهای یکتا برای بخش اخبار اخیر
  const uniqueRecentNews: any[] = [];
  const seenRecentTitles = new Set<string>([String(article.title || "").trim().toLowerCase()]);
  for (const rn of recentNews || []) {
    const key = String(rn.title || "").trim().toLowerCase();
    if (!seenRecentTitles.has(key) && uniqueRecentNews.length < 3) {
      seenRecentTitles.add(key);
      uniqueRecentNews.push(rn);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  const newsUrl = baseUrl + "/news/" + encodeURIComponent(article.slug || article.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary || article.title,
    image: [article.image_url || baseUrl + "/placeholder.png"],
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.created_at,
    author: {
      "@type": "Organization",
      name: article.source_name || "رادار فناوری آکسون کور",
    },
    publisher: {
      "@type": "Organization",
      name: "آکسون کور | Axon Core",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: baseUrl + "/favicon.ico",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": newsUrl,
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
        name: "رادار اخبار تکنولوژی",
        item: baseUrl + "/news",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: newsUrl,
      },
    ],
  };

  return (
    <article
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto font-sans select-text text-[var(--text-primary)] space-y-8"
      dir="rtl"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
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
        <Link href="/news" className="hover:text-[var(--accent-blue)] transition">
          رادار اخبار تکنولوژی
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs sm:max-w-md">
          {article.title}
        </span>
      </nav>

      <header className="space-y-4 border-b border-[var(--card-border)] pb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black">
            📡 گزارش تحلیلی فناوری
          </span>
          <span className="text-slate-400 font-mono">منبع: {article.source_name}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-400 font-mono">
            📅{" "}
            {new Date(article.published_at || article.created_at).toLocaleDateString("fa-IR")}
          </span>
        </div>

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black leading-snug">
          {article.title}
        </h1>
      </header>

      <div className="w-full h-64 sm:h-96 rounded-3xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)] shadow-xl">
        <img
          src={article.image_url || "/placeholder.png"}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>

      {article.summary && (
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs sm:text-sm font-bold leading-relaxed text-[var(--text-secondary)] shadow-sm">
          💡 <strong className="text-[var(--accent-blue)]">چکیده گزارش:</strong> {article.summary}
        </div>
      )}

      {/* فهرست دسترسی سریع به سرفصل‌های خبر */}
      <TableOfContents contentHtml={cleanHtml} />

      <div
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
        className="blog-content p-6 sm:p-10 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md prose dark:prose-invert max-w-none text-xs sm:text-base leading-loose space-y-4 text-justify [&_h2]:text-base [&_h2]:sm:text-xl [&_h2]:font-black [&_h2]:text-[var(--accent-blue)] [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:sm:text-base [&_h3]:font-black [&_h3]:mt-4 [&_a]:text-[var(--accent-blue)] [&_a]:underline"
      />

      {/* ویترین محصولات مرتبط کاتالوگ در انتهای خبر */}
      {relatedProducts.length > 0 && (
        <section className="p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--accent-blue)]/40 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
            <div>
              <h2 className="text-sm sm:text-lg font-black text-[var(--accent-blue)]">
                🛍️ محصولات منتخب مرتبط در کاتالوگ آکسون کور
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                خرید مستقیم با تضمین اصالت فیزیکی و ارسال سریع پیشتاز به سراسر کشور
              </p>
            </div>
            <Link
              href="/products"
              className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black"
            >
              مشاهده کل کاتالوگ ←
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {relatedProducts.map((p: any) => {
              const finalP = Number(p.discount_price || p.price || 0);
              return (
                <Link
                  key={p.id}
                  href={"/products/" + p.id}
                  className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2.5">
                    <div className="w-full h-36 rounded-xl bg-white dark:bg-slate-900 p-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={p.image || "/placeholder.png"}
                        alt={p.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition"
                      />
                    </div>
                    <h3 className="font-black line-clamp-2 leading-relaxed">{p.title}</h3>
                  </div>
                  <div className="pt-2.5 border-t border-[var(--card-border)] flex items-center justify-between">
                    <span className="font-mono font-black text-emerald-500">
                      {formatPrice(finalP)} ت
                    </span>
                    <span className="text-[11px] font-black text-[var(--accent-blue)]">
                      خرید آنلاین ←
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* سایر اخبار مرتبط */}
      {uniqueRecentNews.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-black text-sm text-[var(--text-secondary)]">
            📰 سایر گزارش‌های اخیر رادار فناوری:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {uniqueRecentNews.map((rn: any) => (
              <Link
                key={rn.id}
                href={"/news/" + encodeURIComponent(rn.slug || rn.id)}
                className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition font-bold leading-relaxed line-clamp-2"
              >
                🔗 {rn.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="pt-4 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(Array.isArray(article.tags) ? article.tags : []).map((tag: string, i: number) => (
            <span
              key={i}
              className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>
        <Link
          href="/news"
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 shadow-md"
        >
          ← بازگشت به رادار اخبار
        </Link>
      </div>
    </article>
  );
}
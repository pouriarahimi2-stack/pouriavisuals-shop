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

interface Props {
  params: Promise<{ slug: string }>;
}

function sanitizeNewsHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class", "style", "href", "target"],
      img: ["src", "alt", "width", "height"],
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { data: article } = await supabaseAdmin
    .from("tech_news")
    .select("title, summary, image_url, tags, slug")
    .or("slug.eq." + decodedSlug + ",id.eq." + decodedSlug)
    .maybeSingle();

  if (!article) return { title: "خبر مورد نظر یافت نشد | آکسون کور" };
  const canonicalUrl = "https://axoncore.ir/news/" + (article.slug || decodedSlug);

  return {
    title: article.title + " | رادار فناوری آکسون کور",
    description: article.summary,
    keywords: article.tags || [],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      url: canonicalUrl,
      images: [article.image_url || "https://axoncore.ir/placeholder.png"],
      type: "article",
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const [{ data: article }, { data: rawProds }, { data: recentNews }] = await Promise.all([
    supabaseAdmin
      .from("tech_news")
      .select("*")
      .or("slug.eq." + decodedSlug + ",id.eq." + decodedSlug)
      .maybeSingle(),
    supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(4),
    supabaseAdmin
      .from("tech_news")
      .select("id, title, slug, image_url, published_at")
      .neq("slug", decodedSlug)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (!article) notFound();

  const relatedProducts = (rawProds || []).map(unpackProductRow);
  const cleanHtml = sanitizeNewsHtml(article.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: [article.image_url || "https://axoncore.ir/placeholder.png"],
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.created_at,
    author: {
      "@type": "Organization",
      name: article.source_name || "رادار فناوری آکسون کور",
    },
    publisher: {
      "@type": "Organization",
      name: "آکسون کور | Axon Core",
      url: "https://axoncore.ir",
      logo: {
        "@type": "ImageObject",
        url: "https://axoncore.ir/favicon.ico",
      },
    },
  };

  return (
    <article
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto font-sans select-text text-[var(--text-primary)] space-y-8"
      dir="rtl"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, "\u003c")
            .replace(/>/g, "\u003e"),
        }}
      />

      <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--accent-blue)]">
          خانه
        </Link>
        <span>/</span>
        <Link href="/news" className="hover:text-[var(--accent-blue)]">
          رادار اخبار تکنولوژی
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{article.title}</span>
      </nav>

      <header className="space-y-4 border-b border-[var(--card-border)] pb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]">
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

      {/* فهرست دسترسی سریع به سرفصل‌های خبر برای افزایش ماندگاری کاربر (Dwell Time) */}
      <TableOfContents contentHtml={cleanHtml} />

      <div
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
        className="blog-content p-6 sm:p-10 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md prose dark:prose-invert max-w-none text-xs sm:text-base leading-loose space-y-4 text-justify"
      />

      {/* ویترین محصولات مرتبط کاتالوگ در انتهای خبر برای تبدیل خواننده به خریدار */}
      {relatedProducts.length > 0 && (
        <section className="p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--accent-blue)]/40 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
            <div>
              <h2 className="text-sm sm:text-lg font-black text-[var(--accent-blue)]">
                🛍️️ محصولات منتخب مرتبط در کاتالوگ آکسون کور
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
                  className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="w-full h-32 rounded-xl bg-white dark:bg-slate-900 p-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={p.image || "/placeholder.png"}
                        alt={p.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition"
                      />
                    </div>
                    <h3 className="font-black line-clamp-2 leading-relaxed">{p.title}</h3>
                  </div>
                  <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
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
      {recentNews && recentNews.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-black text-sm text-[var(--text-secondary)]">
            📰 سایر گزارش‌های اخیر رادار فناوری:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {recentNews.map((rn: any) => (
              <Link
                key={rn.id}
                href={"/news/" + rn.slug}
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
          {(article.tags || []).map((tag: string, i: number) => (
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

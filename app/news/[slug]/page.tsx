import { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: article } = await supabaseAdmin
    .from("tech_news")
    .select("title, summary, image_url, tags")
    .eq("slug", slug)
    .maybeSingle();

  if (!article) return { title: "خبر مورد نظر یافت نشد | آکسون" };

  return {
    title: `${article.title} | اخبار فناوری آکسون`,
    description: article.summary,
    keywords: article.tags || [],
    openGraph: {
      title: article.title,
      description: article.summary,
      images: [article.image_url || "/og-image.jpg"],
      type: "article",
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const { data: article } = await supabaseAdmin
    .from("tech_news")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!article) notFound();

  // تولید اسکیما استاندارد JSON-LD گوگل برای NewsArticle
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: [article.image_url],
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.created_at,
    author: {
      "@type": "Organization",
      name: article.source_name || "آکسون تک",
    },
    publisher: {
      "@type": "Organization",
      name: "آکسون",
      url: "https://axoncore.ir",
    },
  };

  return (
    <article className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-4 border-b border-[var(--card-border)] pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-blue)]">
          <Link href="/news" className="hover:underline">اخبار تکنولوژی</Link>
          <span>/</span>
          <span>{article.category}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black leading-snug">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span>منبع: {article.source_name}</span>
          <span>•</span>
          <span>تاریخ انتشار: {new Date(article.published_at || article.created_at).toLocaleDateString("fa-IR")}</span>
        </div>
      </div>

      <div className="w-full h-72 sm:h-96 rounded-3xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)] shadow-xl">
        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
      </div>

      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs sm:text-sm font-medium leading-relaxed text-[var(--text-secondary)] shadow-sm">
        💡 <strong>خلاصه گزارش:</strong> {article.summary}
      </div>

      <div
        dangerouslySetInnerHTML={{ __html: article.content }}
        className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-loose space-y-4 text-justify"
      />

      <div className="pt-6 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(article.tags || []).map((tag: string, i: number) => (
            <span key={i} className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-slate-400">
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

// File Path: app/blog/[id]/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseServer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function safeJsonLd(obj: any): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPost(idOrSlug: string) {
  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("posts")
        .select("*")
        .or("id.eq." + idOrSlug + ",slug.eq." + idOrSlug)
        .maybeSingle();

      if (data) return data;
    }
  } catch {}

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: "مقاله یافت نشد | مجله تخصصی آکسون" };
  }

  const title = post.title || "مقاله تخصصی تکنولوژی و دیجیتال";
  const desc =
    post.meta_description ||
    (post.content ? post.content.slice(0, 150) : "") ||
    "بررسی و راهنمای تخصصی خرید محصولات دیجیتال و تکنولوژی در مجله آکسون.";
  const canonicalUrl = "https://axoncore.ir/blog/" + (post.slug || post.id);

  return {
    title: title + " | مجله تخصصی آکسون",
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
      modifiedTime: post.updated_at,
      images: [post.image_url || "https://axoncore.ir/placeholder.png"],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  const postUrl = baseUrl + "/blog/" + (post.slug || post.id);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || (post.content ? post.content.slice(0, 150) : ""),
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
      className="max-w-4xl mx-auto px-4 py-6 sm:py-12 font-sans select-none text-[var(--text-primary)] space-y-6 sm:space-y-8"
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
        <Link href="/" className="hover:text-[var(--accent-blue)]">
          خانه
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[var(--accent-blue)]">
          مجله تخصصی
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-[220px] sm:max-w-xs">
          {post.title}
        </span>
      </nav>

      <header className="space-y-4 border-b border-[var(--card-border)] pb-6">
        <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-bold font-mono inline-block">
          {post.category || "تکنولوژی و کالای دیجیتال"}
        </span>

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black leading-snug">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] font-medium">
          <span>
            ✍️ نویسنده:{" "}
            <strong className="text-[var(--text-primary)]">
              {post.author || "کارشناس فنی آکسون کور"}
            </strong>
          </span>
          <span>•</span>
          <span>📅 تاریخ انتشار: {new Date(post.created_at).toLocaleDateString("fa-IR")}</span>
        </div>
      </header>

      {post.image_url && (
        <div className="rounded-3xl sm:rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 overflow-hidden shadow-xl">
          <img
            src={post.image_url}
            alt={post.title}
            width={900}
            height={480}
            className="w-full h-auto max-h-[420px] object-cover rounded-2xl sm:rounded-[2rem]"
          />
        </div>
      )}

      <div className="rounded-3xl sm:rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-5 sm:p-10 shadow-sm leading-loose text-sm sm:text-base text-[var(--text-secondary)] font-medium space-y-4 whitespace-pre-line text-justify">
        {post.content}
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-black text-sm text-[var(--text-primary)]">
            نیاز به مشاوره تخصصی جهت خرید محصولات دیجیتال دارید؟
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            کارشناسان آکسون آماده پاسخگویی و راهنمایی تخصصی شما برای انتخاب بهترین تجهیزات هستند.
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
            سایر مقالات
          </Link>
        </div>
      </div>
    </article>
  );
}

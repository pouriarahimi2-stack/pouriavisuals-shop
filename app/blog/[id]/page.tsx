import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseServer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPost(idOrSlug: string) {
  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("posts")
        .select("*")
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .maybeSingle();

      if (data) return data;
    }
  } catch {}

  // فال‌بک پیش‌فرض مقاله تخصصی در صورت عدم اتصال لحظه‌ای دیتابیس
  return {
    id: idOrSlug,
    title: "راهنمای جامع انتخاب مانیتورهای ۵K و ۴K برای تدوینگران و استودیوهای رنگ",
    slug: idOrSlug,
    category: "راهنمای خرید و بررسی",
    author: "تیم فنی آکسون کور",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: "https://axoncore.ir/placeholder.png",
    content: `در دنیای تولید محتوای پیشرفته و استودیوهای اصلاح رنگ، انتخاب نمایشگر به یکی از حیاتی‌ترین تصمیمات سخت‌افزاری تبدیل شده است. وضوح تصویر ۵K با تراکم پیکسلی ۲۱۸ پیکسل در هر اینچ (PPI) به چشم اجازه می‌دهد جزئیات متون و خطوط را بدون کوچک‌ترین تارشدگی یا خستگی مشاهده کند.\n\nاستاندارد گاموت رنگی DCI-P3 و پوشش بیش از ۹۹ درصدی آن تضمین می‌کند که خروجی نهایی پروژه شما دقیقاً همان رنگی باشد که در مانیتورهای سینمایی مشاهده خواهد شد. کلیه مانیتورهای ارائه‌شده در استودیو آکسون با ابزارهای دقیق سخت‌افزاری کالیبره شده و با برگه اصالت سلامت به دست متخصصان می‌رسند.`,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: "مقاله یافت نشد | مجله تخصصی آکسون" };
  }

  const title = post.title || "مقاله تخصصی تجهیزات استودیو";
  const desc = post.meta_description || post.content?.slice(0, 150) || "بررسی و راهنمای تخصصی مانیتورهای ۵K و تجهیزات تصویر در مجله آکسون.";

  return {
    title: `${title} | مجله تخصصی آکسون`,
    description: desc,
    alternates: {
      canonical: `https://axoncore.ir/blog/${post.slug || post.id}`,
    },
    openGraph: {
      title,
      description: desc,
      url: `https://axoncore.ir/blog/${post.slug || post.id}`,
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
  const postUrl = `${baseUrl}/blog/${post.slug || post.id}`;

  // ۱. اسکیمای ساختاریافته مقاله گوگل (Article Schema)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.meta_description || post.content?.slice(0, 150),
    "image": [post.image_url || `${baseUrl}/placeholder.png`],
    "datePublished": post.created_at,
    "dateModified": post.updated_at || post.created_at,
    "author": {
      "@type": "Person",
      "name": post.author || "کارشناس فنی آکسون کور",
    },
    "publisher": {
      "@type": "Organization",
      "name": "آکسون کور | Axon Core",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/favicon.ico`,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };

  // ۲. اسکیمای BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "صفحه اصلی",
        "item": baseUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "مجله تخصصی",
        "item": `${baseUrl}/blog`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl,
      },
    ],
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 sm:py-12 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ناوبری Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--accent-blue)]">خانه</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[var(--accent-blue)]">مجله تخصصی</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{post.title}</span>
      </nav>

      {/* هدر مقاله */}
      <header className="space-y-4 border-b border-[var(--card-border)] pb-6">
        <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-bold font-mono">
          {post.category || "تکنولوژی و تصویر"}
        </span>

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black leading-snug">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] font-medium">
          <span>✍️ نویسنده: <strong className="text-[var(--text-primary)]">{post.author || "کارشناس استودیو"}</strong></span>
          <span>•</span>
          <span>📅 تاریخ انتشار: {new Date(post.created_at).toLocaleDateString("fa-IR")}</span>
        </div>
      </header>

      {/* تصویر شاخص */}
      {post.image_url && (
        <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 overflow-hidden shadow-xl">
          <img
            src={post.image_url}
            alt={post.title}
            width={900}
            height={480}
            className="w-full h-auto max-h-[420px] object-cover rounded-[2rem]"
          />
        </div>
      )}

      {/* بدنه مقاله */}
      <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 sm:p-10 shadow-sm leading-loose text-sm sm:text-base text-[var(--text-secondary)] font-medium space-y-4 whitespace-pre-line text-justify">
        {post.content}
      </div>

      {/* فوتر بازگشت و کال‌تو‌اکشن بررسی کاتالوگ */}
      <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-black text-sm text-[var(--text-primary)]">نیاز به مشاوره جهت انتخاب مانیتور دارید؟</h4>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">کارشناسان آکسون آماده پاسخگویی و هماهنگی تست سخت‌افزاری هستند.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            href="/products"
            className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition shadow-md text-center"
          >
            مشاهده کاتالوگ تجهیزات ←
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

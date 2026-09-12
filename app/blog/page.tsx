import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import BlogArchiveClient, { BlogPostItem } from "@/components/BlogArchiveClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مجله تخصصی تصویر، مانیتورهای ۵K و تکنولوژی استودیو | آکسون",
  description: "مجموعه مقالات تخصصی، راهنمای خرید مانیتورهای تدوین، کالیبراسیون رنگ، بررسی درگاه‌های تاندربولت و اخبار گجت‌های هوشمند در آکسون کور.",
  openGraph: {
    title: "مجله تخصصی استودیو و مانیتورهای ۵K | آکسون",
    description: "مرجع مقالات و راهنماهای حرفه‌ای تجهیزات تدوین و تصحیح رنگ.",
    url: "https://axoncore.ir/blog",
    type: "website",
  },
  alternates: {
    canonical: "https://axoncore.ir/blog",
  },
};

const DEFAULT_POSTS: BlogPostItem[] = [
  {
    id: "guide-5k-monitors",
    slug: "guide-5k-monitors",
    title: "راهنمای جامع انتخاب مانیتورهای ۵K و ۴K برای تدوینگران و استودیوهای رنگ",
    category: "راهنمای خرید",
    excerpt: "تفاوت‌های حیاتی تراکم پیکسلی ۲۱۸ PPI با نمایشگرهای متداول و بررسی پوشش گاموت رنگی DCI-P3 برای تدوین ویدیو.",
    image_url: "https://axoncore.ir/placeholder.png",
    created_at: new Date().toISOString(),
  },
  {
    id: "thunderbolt-5-breakthrough",
    slug: "thunderbolt-5-breakthrough",
    title: "بررسی معماری تاندربولت ۵؛ پهنای باند ۱۲۰ گیگابیت بر ثانیه در خدمت خروجی دوگانه ۸K",
    category: "تکنولوژی و سخت‌افزار",
    excerpt: "بررسی پهنای باند و نحوه انتقال سیگنال‌های تصویری فشرده‌نشده در پروژه‌های استودیویی مدرن.",
    image_url: "https://axoncore.ir/placeholder.png",
    created_at: new Date().toISOString(),
  }
];

export default async function BlogPage() {
  let posts: BlogPostItem[] = [];
  let categories: string[] = [];

  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("posts")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        posts = data;
      } else {
        posts = DEFAULT_POSTS;
      }
    }
  } catch {
    posts = DEFAULT_POSTS;
  }

  categories = Array.from(new Set(posts.map((p) => p.category || "مقالات تخصصی"))).filter(Boolean);

  // اسکیمای رسمی Blog موتورهای جستجو
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "مجله تخصصی تکنولوژی و تصویر استودیو آکسون",
    "description": "مرجع مقالات و راهنماهای کالیبراسیون مانیتورهای ۵K و سخت‌افزار تدوین",
    "url": "https://axoncore.ir/blog",
    "blogPost": posts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "url": `https://axoncore.ir/blog/${post.slug || post.id}`,
      "datePublished": post.created_at,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-[11px] font-bold">
          AXON KNOWLEDGE BASE • 2026
        </span>
        <h1 className="text-2xl md:text-4xl font-black">مجله تخصصی فناوری تصویر و استودیو</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
          تحلیل‌های تخصصی سخت‌افزار، راهنمای استانداردهای کالیبراسیون و بررسی فناوری‌های رتینا
        </p>
      </div>

      <BlogArchiveClient initialPosts={posts} categories={categories} />
    </div>
  );
}

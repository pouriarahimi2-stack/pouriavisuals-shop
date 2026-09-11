import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import BlogArchiveClient from "@/components/BlogArchiveClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مجله تخصصی و مقالات تحلیلی مانیتور و تجهیزات رنگ استودیو | آکسون",
  description: "راهنمای خرید، تست گاموت رنگی، مقایسه تخصصی مانیتورهای ۵K و ۴K و استانداردهای سخت‌افزار تدوین در آکسون کور.",
  openGraph: {
    title: "مجله تخصصی آکسون | مقالات تحلیلی مانیتور و تصویر",
    description: "مرجع مقالات کالیبراسیون و بررسی سخت‌افزار ادیتورهای ویدیو و کالریست‌ها.",
    url: "https://axoncore.ir/blog",
    type: "website",
  },
  alternates: {
    canonical: "https://axoncore.ir/blog",
  },
};

export default async function BlogArchivePage() {
  let posts: any[] = [];

  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("posts")
        .select("id, title, slug, content, category, image_url, meta_description, created_at, is_visible, is_published")
        .order("created_at", { ascending: false });

      if (data) {
        posts = data.filter((p) => p.is_visible !== false && p.is_published !== false);
      }
    }
  } catch (err) {
    console.warn("Blog server load warning:", err);
  }

  // اسکیما CollectionPage برای گوگل
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "مجله تخصصی و مقالات آکسون",
    "url": "https://axoncore.ir/blog",
    "description": "مجموعه مقالات تحلیل رنگ، مانیتورهای استودیو و استانداردهای نمایش تصویر",
    "hasPart": posts.slice(0, 10).map((p) => ({
      "@type": "BlogPosting",
      "headline": p.title,
      "url": `https://axoncore.ir/blog/${p.slug || p.id}`,
      "datePublished": p.created_at,
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <div className="text-center space-y-3">
        <span className="p-3.5 rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] inline-block text-2xl shadow-sm">
          📚
        </span>
        <h1 className="text-2xl md:text-4xl font-black">مجله تخصصی، راهنمای خرید و مقالات تحلیلی</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
          تحلیل‌های جامع بازار، مقایسه سخت‌افزارها، مانیتورهای تدوین ۵K و کالیبراسیون تخصصی تصویر
        </p>
      </div>

      <BlogArchiveClient initialPosts={posts} />
    </div>
  );
}

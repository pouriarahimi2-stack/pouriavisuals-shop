"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug?: string;
  summary?: string;
  metaDescription?: string;
  content: string;
  image?: string;
  imageUrl?: string;
  author?: string;
  category?: string;
  createdAt?: string;
}

export default function SingleBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      try {
        let found: BlogPost | null = null;
        try {
          const res = await fetch(`/api/blogs/${resolvedParams.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.post) found = data.post;
          }
        } catch {}

        if (!found && typeof window !== "undefined") {
          const localBlogs: BlogPost[] = JSON.parse(localStorage.getItem("site_blogs") || "[]");
          found =
            localBlogs.find(
              (b) =>
                String(b.id) === String(resolvedParams.id) ||
                b.slug === resolvedParams.id
            ) || null;
        }

        setPost(found);
      } catch (err) {
        console.error("Error loading blog post:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
        <span className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری مقاله...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4 bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <h2 className="text-xl font-black">مقاله‌ای یافت نشد!</h2>
        <p className="text-xs text-[var(--text-secondary)]">ممکن است مقاله حذف شده باشد یا آدرس وارد شده نادرست باشد.</p>
        <Link
          href="/blog"
          className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md"
        >
          بازگشت به لیست مقالات
        </Link>
      </div>
    );
  }

  const displayImage =
    post.image ||
    post.imageUrl ||
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200";

  return (
    <article className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] select-none transition-colors duration-300">
      {/* بردکرامپ */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6 font-medium">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition">خانه</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله تخصصی</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-bold truncate max-w-xs">{post.title}</span>
      </nav>

      {/* هدر و متادیتای مقاله */}
      <header className="space-y-4 mb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)] font-bold">
          {post.category && (
            <span className="px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20">
              {post.category}
            </span>
          )}
          <span>📅 {post.createdAt || "امروز"}</span>
          {post.author && <span>✍️ نویسنده: {post.author}</span>}
        </div>

        <h1 className="text-2xl sm:text-4xl font-black leading-tight text-[var(--text-primary)]">
          {post.title}
        </h1>

        {post.summary && (
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-r-2 border-[var(--accent-blue)] pr-3 font-medium">
            {post.summary}
          </p>
        )}
      </header>

      {/* تصویر شاخص */}
      <div className="w-full h-64 sm:h-96 relative rounded-3xl overflow-hidden border border-[var(--card-border)] mb-10 shadow-xl bg-black/5 dark:bg-black/40">
        <img src={displayImage} alt={post.title} className="w-full h-full object-cover" />
      </div>

      {/* بدنه و متن اصلی مقاله */}
      <div
        className="text-xs sm:text-sm leading-8 sm:leading-9 text-[var(--text-secondary)] font-normal space-y-4 max-w-none border-b border-[var(--card-border)] pb-12"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* فوتر مقاله و دکمه بازگشت */}
      <footer className="pt-6 flex justify-between items-center text-xs">
        <Link
          href="/blog"
          className="px-5 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] font-bold transition flex items-center gap-2"
        >
          <span>←</span>
          <span>مشاهده سایر مقالات</span>
        </Link>
        <Link
          href="/"
          className="text-[var(--accent-blue)] font-bold hover:underline"
        >
          مشاهده محصولات فروشگاه 🛍️
        </Link>
      </footer>
    </article>
  );
}
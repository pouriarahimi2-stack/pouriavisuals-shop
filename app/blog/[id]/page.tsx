"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  metaDescription?: string;
  content: string;
  createdAt: string;
  category?: string;
}

export default function SingleBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      try {
        let found: BlogPost | null = null;

        // جستجو در API
        try {
          const res = await fetch("/api/blogs");
          const data = await res.json();
          const allPosts = data.data || data.posts || [];
          found = allPosts.find((p: any) => String(p.id) === String(id)) || null;
        } catch {}

        // جستجو در حافظه محلی
        if (!found) {
          const localBlogs: BlogPost[] = JSON.parse(
            localStorage.getItem("site_blogs") || "[]"
          );
          found = localBlogs.find((p) => String(p.id) === String(id)) || null;
        }

        setPost(found);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری مقاله...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4 font-sans select-none" dir="rtl">
        <div className="text-5xl">📄</div>
        <h2 className="text-xl font-black text-[var(--text-primary)]">مقاله مورد نظر یافت نشد!</h2>
        <p className="text-xs text-[var(--text-secondary)]">ممکن است این مقاله حذف شده باشد یا آدرس اشتباه باشد.</p>
        <Link
          href="/blog"
          className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-lg"
        >
          ← بازگشت به بخش مقالات
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      
      {/* مسیر ناوبری (Breadcrumb) */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-bold">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition">صفحه اصلی</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله تخصصی</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{post.title}</span>
      </div>

      {/* باکس کامل محتوای مقاله */}
      <article className="p-8 md:p-12 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-8">
        
        {/* هدر مقاله */}
        <header className="space-y-4 border-b border-[var(--card-border)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black">
              {post.category || "مقاله تخصصی سئو"}
            </span>
            <span className="font-mono text-[var(--text-secondary)] font-bold">
              📅 انتشار: {post.createdAt || "امروز"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black leading-snug text-[var(--text-primary)]">
            {post.title}
          </h1>

          {post.metaDescription && (
            <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed font-medium bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--card-border)]">
              💡 {post.metaDescription}
            </p>
          )}
        </header>

        {/* بدنه رندر شده مقاله با استایل‌های سفارشی */}
        <div
          dangerouslySetInnerHTML={{ __html: post.content }}
          className="blog-content prose prose-sm max-w-none text-xs md:text-sm leading-loose text-[var(--text-primary)] font-medium space-y-4"
          style={{ textAlign: "justify" }}
        />

        {/* فوتر مقاله و دکمه بازگشت */}
        <footer className="pt-6 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/blog"
            className="px-5 py-2.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition flex items-center gap-2"
          >
            <span>←</span>
            <span>مشاهده سایر مقالات</span>
          </Link>

          <Link
            href="/#products"
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition shadow-lg flex items-center gap-2"
          >
            <span>🛍️</span>
            <span>مشاهده محصولات مرتبط در فروشگاه</span>
          </Link>
        </footer>
      </article>
    </div>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SingleBlogPost() {
  const params = useParams();
  const [post, setPost] = useState<any>(null);
  const [cleanContent, setCleanContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch("/api/blogs");
        const data = await res.json();
        
        const localBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
        const combined = [...(data.posts || []), ...localBlogs];
        
        const found = combined.find((p: any) => String(p.id) === String(params.id));
        
        if (found) {
          setPost(found);
          const cleaned = sanitizeContentForUser(found.content || "");
          setCleanContent(cleaned);

          // تنظیم استاندارد عنوان برگه جهت سئو بدون خطای Hydration
          document.title = found.title || "مقاله تخصصی";
        }
      } catch (e) {
        console.error("Error fetching article:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xs animate-pulse font-sans">
        در حال بارگذاری مقاله...
      </div>
    );
  }

  if (!post || post.isVisible === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <span className="text-4xl">📄</span>
        <h2 className="text-lg font-bold">مقاله مورد نظر یافت نشد یا غیرفعال شده است!</h2>
        <Link href="/blog" className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-500 transition">
          بازگشت به مجله
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen p-4 md:p-12 max-w-4xl mx-auto space-y-6 text-white font-sans">
      <Link href="/blog" className="inline-flex items-center gap-1 text-xs text-indigo-400 font-bold hover:underline">
        <span>→</span> بازگشت به لیست مقالات
      </Link>

      {/* هدر ساده و شیک مقاله برای کاربر */}
      <header className="liquid-glass-card p-8 rounded-3xl space-y-3">
        <div className="text-xs opacity-60 font-medium">
          📅 تاریخ انتشار: {post.createdAt || "امروز"}
        </div>
        <h1 className="text-2xl md:text-3xl font-black leading-tight text-indigo-200">
          {post.title}
        </h1>
      </header>

      {/* متن اصلی و بهینه‌شده مقاله */}
      <div className="liquid-glass-card p-8 rounded-3xl space-y-4 text-xs md:text-sm leading-relaxed whitespace-pre-line border border-white/10">
        {cleanContent}
      </div>
    </article>
  );
}

function sanitizeContentForUser(content: string): string {
  if (!content) return "";

  let clean = content
    .replace(/(Title Tag|عنوان سئو|Meta Description|توضیحات متا|کلمات کلیدی|LSI Keywords|هشتگ‌ها|Hashtags):[\s\S]*?(?=\n\n|#|$)/gi, "")
    .replace(/#\w+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return clean || content;
}
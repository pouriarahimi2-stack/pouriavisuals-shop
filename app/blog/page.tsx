"use client";

import React, { useState, useEffect } from "react";
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
  isVisible?: boolean;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadBlogs() {
      setLoading(true);
      try {
        let apiPosts: BlogPost[] = [];
        try {
          const res = await fetch("/api/blogs");
          if (res.ok) {
            const data = await res.json();
            if (data.posts) apiPosts = data.posts;
          }
        } catch {}

        const localBlogs: BlogPost[] =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("site_blogs") || "[]")
            : [];

        const combined = [...apiPosts, ...localBlogs];
        const visible = combined.filter((p) => p.isVisible !== false);
        const unique = Array.from(
          new Map(visible.map((item) => [item.id || item.title, item])).values()
        );

        setPosts(unique);
      } catch (err) {
        console.error("Error loading blog posts:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBlogs();
  }, []);

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans bg-[var(--bg-primary,#f8fafc)] text-slate-900 dark:text-slate-100 select-none transition-colors duration-300">
      
      {/* هدر صفحه مقالات */}
      <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black border border-blue-500/20">
          <span>🌐</span>
          <span>مجله تخصصی و راهنمای خرید</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          جدیدترین مقالات و تحلیل‌های دنیای تکنولوژی
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
          بررسی دقیق، راهنمای خرید گجت‌های هوشمند و ترفندهای کاربردی فناوری.
        </p>

        {/* فیلد جستجو */}
        <div className="pt-2 max-w-md mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در مقالات..."
            className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-sm transition"
          />
        </div>
      </div>

      {/* نمایش وضعیت */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-500">در حال بارگذاری مقالات...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md mx-auto space-y-3 shadow-lg">
          <span className="text-4xl block">📝</span>
          <h3 className="font-black text-sm text-slate-900 dark:text-white">مقاله‌ای یافت نشد!</h3>
          <p className="text-xs text-slate-500 font-medium">
            {searchQuery ? "مقاله‌ای با این عبارت پیدا نشد." : "هنوز مقاله‌ای منتشر نشده است."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const displayImage =
              post.image ||
              post.imageUrl ||
              "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600";

            return (
              <article
                key={post.id || post.title}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 shadow-md group hover:shadow-xl"
              >
                <div className="w-full h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={displayImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 right-3 px-3 py-1 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-md">
                    {post.category || "سئو شده"}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                      <span>📅 {post.createdAt || "امروز"}</span>
                      {post.author && <span>✍️ {post.author}</span>}
                    </div>

                    <h2 className="font-black text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {post.title || "مقاله تخصصی بدون عنوان"}
                    </h2>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium">
                      {post.summary ||
                        post.metaDescription ||
                        post.content?.replace(/<[^>]*>?/gm, "").substring(0, 110) + "..."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <Link
                      href={`/blog/${post.id || post.slug || "view"}`}
                      className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>مطالعه کامل مقاله</span>
                      <span>←</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
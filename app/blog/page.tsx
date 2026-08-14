"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        // ۱. فراخوانی مقالات از API سرور
        const res = await fetch("/api/blogs");
        const data = await res.json();
        
        // ۲. فراخوانی مقالات از حافظه مرورگر (جهت نمایش آنی)
        const localBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");

        // ترکیب دو لیست و حذف موارد تکراری بر اساس ID یا عنوان
        const combined = [...(data.posts || []), ...localBlogs];
        const uniquePosts = Array.from(
          new Map(combined.map((item) => [item.id || item.title, item])).values()
        );

        setPosts(uniquePosts);
      } catch (e) {
        console.error("Error loading blog posts:", e);
        const localBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
        setPosts(localBlogs);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-12 max-w-6xl mx-auto space-y-8 font-sans text-white">
      {/* هدر بلاگ شیشه‌ای */}
      <header className="liquid-glass-card p-8 rounded-3xl text-center space-y-3">
        <span className="px-4 py-1.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold inline-block">
          🌐 مجله تخصصی و راهنمای خرید
        </span>
        <h1 className="text-3xl md:text-4xl font-black">آخرین مقالات و نقد و بررسی‌ها</h1>
        <p className="text-sm opacity-70 max-w-xl mx-auto leading-relaxed">
          جدیدترین تحلیل‌های بازار، راهنمای خرید سیستم‌های گیمینگ، هوش مصنوعی و تجهیزات دیجیتال
        </p>
      </header>

      {/* لیست مقالات */}
      {loading ? (
        <div className="text-center py-12 text-sm opacity-60 animate-pulse">
          در حال بارگذاری مقالات...
        </div>
      ) : posts.length === 0 ? (
        <div className="liquid-glass-card p-12 text-center rounded-3xl space-y-4">
          <span className="text-4xl">📚</span>
          <h3 className="text-lg font-bold">هنوز مقاله‌ای منتشر نشده است</h3>
          <p className="text-xs opacity-60">
            مقالات تولیدشده توسط مدیر هوش مصنوعی پس از تایید ادمین در این بخش قرار می‌گیرند.
          </p>
          <Link
            href="/admin"
            className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold hover:bg-indigo-500 transition shadow-lg"
          >
            ورود به پنل مدیریت و ساخت مقاله
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id || post.title}
              className="liquid-glass-card rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:scale-[1.02] transition-transform duration-300 border border-white/10"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] opacity-60">
                  <span>📅 {post.createdAt || "امروز"}</span>
                  <span className="bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                    سئو شده
                  </span>
                </div>
                <h2 className="text-base font-extrabold leading-snug line-clamp-2 text-indigo-200">
                  {post.title}
                </h2>
                <p className="text-xs opacity-70 leading-relaxed line-clamp-3">
                  {post.metaDescription || post.content?.substring(0, 120) + "..."}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <Link
                  href={`/blog/${post.id}`}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>مطالعه کامل مقاله</span>
                  <span>←</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
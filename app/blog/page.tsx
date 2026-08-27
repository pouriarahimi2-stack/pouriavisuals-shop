// File Path: app/blog/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { supabase } from "@/lib/supabase";

interface BlogPost {
  id: string;
  title: string;
  slug?: string;
  metaDescription?: string;
  meta_description?: string;
  content: string;
  createdAt?: string;
  created_at?: string;
  category?: string;
  imageUrl?: string;
  image_url?: string;
  isVisible?: boolean;
  isPublished?: boolean;
}

export default function BlogArchivePage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  const loadBlogs = async () => {
    setLoading(true);
    try {
      let combined: BlogPost[] = [];
      try {
        const res = await fetch("/api/blogs");
        const data = await res.json();
        if (data.data) combined = [...data.data];
        else if (data.posts) combined = [...data.posts];
      } catch (e) {
        console.warn("API blogs load error:", e);
      }

      if (combined.length === 0 && typeof window !== "undefined") {
        const localBlogs: BlogPost[] = JSON.parse(localStorage.getItem("site_blogs") || "[]");
        combined = [...localBlogs];
      }

      const visible = combined.filter((p) => p.isVisible !== false && p.isPublished !== false);
      const unique = Array.from(
        new Map(visible.map((item) => [item.id || item.title, item])).values()
      );

      // مرتب‌سازی بر اساس علایق کاربر
      const topCat = userBehavior.getTopInterestCategory();
      if (topCat !== "all") {
        unique.sort((a, b) => {
          const aMatch = (a.category || "").toLowerCase().includes(topCat.toLowerCase()) ? 1 : 0;
          const bMatch = (b.category || "").toLowerCase().includes(topCat.toLowerCase()) ? 1 : 0;
          return bMatch - aMatch;
        });
      }

      setPosts(unique);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();

    const channel = supabase
      .channel("blog-archive-realtime-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => loadBlogs())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCatChange = (cat: string) => {
    soundEngine.playClick();
    setSelectedCat(cat);
  };

  const categories = Array.from(
    new Set(posts.map((p) => p.category || "مقاله تخصصی"))
  ).filter(Boolean);

  const filteredPosts = posts.filter((p) => {
    const matchCat =
      selectedCat === "all" || (p.category || "مقاله تخصصی") === selectedCat;
    const matchSearch =
      (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.metaDescription || p.meta_description || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.content || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      
      {/* سربرگ مجله */}
      <div className="text-center space-y-3">
        <span className="p-3.5 rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] inline-block text-2xl shadow-sm">
          📚
        </span>
        <h1 className="text-2xl md:text-4xl font-black">مجله تخصصی، راهنمای خرید و مقالات تحلیلی</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
          تحلیل‌های جامع بازار، مقایسه سخت‌افزارها، مانیتورهای تدوین ۵K و کالیبراسیون تخصصی تصویر
        </p>
      </div>

      {/* فیلترها و سرچ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleCatChange("all")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedCat === "all"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
            }`}
          >
            همه مقالات ({posts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCatChange(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                selectedCat === cat
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در مقالات..."
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {/* گرید ۳ ستونه مقالات */}
      {loading && posts.length === 0 ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری مقالات...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-[var(--text-secondary)]">
          مقاله‌ای مطابق با جستجوی شما پیدا نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const displayImg = post.imageUrl || post.image_url;
            return (
              <article
                key={post.id || post.title}
                className="p-6 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col justify-between space-y-4 hover:border-[var(--accent-blue)] transition duration-300 group"
              >
                <div className="space-y-3">
                  {displayImg && (
                    <div className="w-full h-44 rounded-2xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)]">
                      <img src={displayImg} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-0.5 rounded-full">
                      {post.category || "مقاله تخصصی"}
                    </span>
                    <span className="text-[var(--text-secondary)] font-mono">
                      📅 {post.createdAt || post.created_at ? new Date(post.createdAt || post.created_at!).toLocaleDateString("fa-IR") : "امروز"}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed line-clamp-3">
                    {post.metaDescription ||
                      post.meta_description ||
                      post.content.replace(/<[^>]*>?/gm, "").substring(0, 110) + "..."}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--card-border)] flex justify-between items-center">
                  <Link
                    href={`/blog/${post.id}`}
                    onClick={() => soundEngine.playClick()}
                    className="text-xs font-black text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                  >
                    <span>مطالعه کامل مقاله</span>
                    <span>←</span>
                  </Link>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                    📖 ۴ دقیقه مطالعه
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
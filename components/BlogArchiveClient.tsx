// File Path: components/BlogArchiveClient.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export interface BlogPostItem {
  id: string | number;
  title: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  meta_description?: string;
  content?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

function estimateReadingMinutes(htmlOrText?: string): number {
  const clean = String(htmlOrText || "")
    .replace(/<[^>]*>/g, " ")
    .trim();
  if (!clean) return 2;
  const words = clean.split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 180));
}

export default function BlogArchiveClient({
  initialPosts,
}: {
  initialPosts: BlogPostItem[];
}) {
  const [posts, setPosts] = useState<BlogPostItem[]>(initialPosts || []);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    setPosts(initialPosts || []);
  }, [initialPosts]);

  useEffect(() => {
    const refreshPosts = async () => {
      try {
        const res = await fetch("/api/blogs?published=true&t=" + Date.now(), {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        const list = json.posts || json.data || [];
        if (Array.isArray(list)) {
          setPosts(
            list.map((row: any) => ({
              id: String(row.id),
              title: row.title || "مقاله تخصصی",
              slug: row.slug || String(row.id),
              category: row.category || "راهنمای خرید و بررسی تخصصی",
              excerpt:
                row.meta_description ||
                row.excerpt ||
                String(row.content || "")
                  .replace(/<[^>]*>/g, " ")
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 140),
              content: row.content || "",
              image_url: row.image_url || "/placeholder.png",
              created_at: row.created_at,
            }))
          );
        }
      } catch {}
    };

    const channel = supabase
      .channel("public-blog-archive-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        refreshPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [posts]);

  const filtered = posts.filter((post) => {
    if (selectedCategory !== "all" && post.category !== selectedCategory) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (post.title || "").toLowerCase().includes(q) ||
      (post.category || "").toLowerCase().includes(q) ||
      (post.excerpt || post.meta_description || post.content || "")
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* نوار جستجو و فیلتر دسته‌بندی‌های مجله */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={
              "px-3.5 py-2 rounded-2xl font-black transition cursor-pointer " +
              (selectedCategory === "all"
                ? "bg-[var(--accent-blue)] text-white shadow"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
            }
          >
            همه مقالات ({posts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={
                "px-3.5 py-2 rounded-2xl font-bold transition cursor-pointer " +
                (selectedCategory === cat
                  ? "bg-[var(--accent-blue)] text-white shadow"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
              }
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در عنوان یا متن مقالات..."
            className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-16 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl text-xs font-bold text-[var(--text-secondary)] space-y-2">
          <span className="text-3xl block">📄</span>
          <p>مقاله‌ای متناسب با جستجوی شما یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => {
            const postHref = `/blog/${encodeURIComponent(String(post.slug || post.id))}`;
            const readMins = estimateReadingMinutes(post.content || post.excerpt);
            const cleanExcerpt =
              post.excerpt ||
              post.meta_description ||
              (post.content
                ? post.content
                    .replace(/<[^>]*>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 130) + "..."
                : "مطالعه بررسی تخصصی و راهنمای خرید در مجله آکسون کور...");

            return (
              <article
                key={post.id}
                className="rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-sm hover:shadow-xl hover:border-[var(--accent-blue)]/50 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4 p-5">
                  <Link
                    href={postHref}
                    className="block relative aspect-video rounded-2xl bg-[var(--input-bg)] overflow-hidden border border-[var(--card-border)]"
                  >
                    <img
                      src={post.image_url || "/placeholder.png"}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {post.category && (
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-black border border-white/15">
                        {post.category}
                      </span>
                    )}
                  </Link>

                  <div className="space-y-2">
                    <Link href={postHref}>
                      <h2 className="font-black text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition line-clamp-2 leading-snug">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed font-medium">
                      {cleanExcerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium bg-[var(--input-bg)]/40">
                  <div className="flex items-center gap-2">
                    <span>
                      📅{" "}
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString("fa-IR")
                        : "به‌روزرسانی تازه"}
                    </span>
                    <span>•</span>
                    <span>⏱️ {readMins} دقیقه مطالعه</span>
                  </div>
                  <Link
                    href={postHref}
                    className="font-black text-[var(--accent-blue)] hover:underline"
                  >
                    مطالعه کامل ←
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
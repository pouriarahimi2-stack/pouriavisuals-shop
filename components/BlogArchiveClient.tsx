"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export interface BlogPostItem {
  id: string | number;
  title: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  meta_description?: string;
  image_url?: string;
  created_at?: string;
  author?: string;
}

export default function BlogArchiveClient({
  initialPosts,
  categories,
}: {
  initialPosts: BlogPostItem[];
  categories: string[];
}) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = initialPosts.filter((post) => {
    const matchCat = selectedCat === "all" || post.category === selectedCat;
    const matchSearch =
      (post.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (post.category || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* فیلترها و جستجو ارگونومیک برای موبایل */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedCat("all");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedCat === "all"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
            }`}
          >
            همه مقالات ({initialPosts.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                soundEngine.playClick();
                setSelectedCat(c);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                selectedCat === c
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در مقالات سئو..."
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl text-xs font-bold text-[var(--text-secondary)]">
          مقاله‌ای مطابق با جستجوی شما پیدا نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <article
              key={post.id}
              className="rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-sm hover:shadow-xl hover:border-[var(--accent-blue)]/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4 p-5">
                <div className="relative aspect-video rounded-2xl bg-[var(--input-bg)] overflow-hidden border border-[var(--card-border)]">
                  <img
                    src={post.image_url || "/placeholder.png"}
                    alt={post.title}
                    width={480}
                    height={270}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/60 text-white text-[10px] font-bold backdrop-blur-md">
                    {post.category || "تکنولوژی"}
                  </span>
                </div>

                <div className="space-y-2">
                  <Link href={`/blog/${post.slug || post.id}`}>
                    <h3 className="font-black text-sm text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-medium">
                    {post.excerpt || post.meta_description || "بررسی مشخصات فنی و استانداردهای نمایش تصویر در این مقاله تخصصی..."}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-[var(--card-border)] flex items-center justify-between mt-3 text-[11px] text-[var(--text-secondary)] font-medium">
                <span>{post.created_at ? new Date(post.created_at).toLocaleDateString("fa-IR") : "به‌روزرسانی تازه"}</span>
                <Link
                  href={`/blog/${post.slug || post.id}`}
                  className="font-bold text-[var(--accent-blue)] hover:underline"
                >
                  مطالعه کامل ←
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

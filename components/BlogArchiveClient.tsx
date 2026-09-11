"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export interface BlogPostItem {
  id: string;
  title: string;
  slug?: string;
  meta_description?: string;
  content: string;
  created_at?: string;
  category?: string;
  image_url?: string;
}

export default function BlogArchiveClient({ initialPosts }: { initialPosts: BlogPostItem[] }) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  const categories = Array.from(
    new Set(initialPosts.map((p) => p.category || "مقاله تخصصی"))
  ).filter(Boolean);

  const filteredPosts = initialPosts.filter((p) => {
    const matchCat = selectedCat === "all" || (p.category || "مقاله تخصصی") === selectedCat;
    const matchSearch =
      (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.meta_description || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.content || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedCat("all");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedCat === "all"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
            }`}
          >
            همه مقالات ({initialPosts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                soundEngine.playClick();
                setSelectedCat(cat);
              }}
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

      {filteredPosts.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-[var(--text-secondary)]">
          مقاله‌ای مطابق با جستجوی شما پیدا نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const displayImg = post.image_url || "https://axoncore.ir/placeholder.png";
            return (
              <article
                key={post.id || post.title}
                className="p-6 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col justify-between space-y-4 hover:border-[var(--accent-blue)] transition duration-300 group"
              >
                <div className="space-y-3">
                  <div className="w-full h-44 rounded-2xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)]">
                    <img
                      src={displayImg}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-0.5 rounded-full">
                      {post.category || "مقاله تخصصی"}
                    </span>
                    <span className="text-[var(--text-secondary)] font-mono">
                      📅 {post.created_at ? new Date(post.created_at).toLocaleDateString("fa-IR") : "امروز"}
                    </span>
                  </div>

                  <h2 className="font-extrabold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition leading-snug line-clamp-2">
                    {post.title}
                  </h2>

                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed line-clamp-3">
                    {post.meta_description || post.content.replace(/<[^>]*>?/gm, "").substring(0, 110) + "..."}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--card-border)] flex justify-between items-center">
                  <Link
                    href={`/blog/${post.slug || post.id}`}
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

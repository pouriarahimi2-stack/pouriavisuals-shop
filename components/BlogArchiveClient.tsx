"use client";

import React, { useState } from "react";
import Link from "next/link";

export interface BlogPostItem {
  id: string | number;
  title: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  image_url?: string;
  created_at?: string;
}

export default function BlogArchiveClient({ initialPosts }: { initialPosts: BlogPostItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = initialPosts.filter((post) =>
    (post.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (post.excerpt || post.content || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* کادر جستجوی ساده و بدون منوهای ناخواسته */}
      <div className="max-w-md mx-auto">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 جستجو در مقالات..."
          className="w-full p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] shadow-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-16 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl text-xs font-bold text-[var(--text-secondary)] space-y-2">
          <span className="text-3xl block">📄</span>
          <p>هیچ مقاله‌ای در این بخش یافت نشد.</p>
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
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <Link href={`/blog/${post.slug || post.id}`}>
                    <h3 className="font-black text-sm text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-medium">
                    {post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, "").slice(0, 120) : "مطالعه بررسی تخصصی...")}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-[var(--card-border)] flex items-center justify-between mt-3 text-[11px] text-[var(--text-secondary)] font-medium">
                <span>{post.created_at ? new Date(post.created_at).toLocaleDateString("fa-IR") : "به‌روزرسانی تازه"}</span>
                <Link href={`/blog/${post.slug || post.id}`} className="font-bold text-[var(--accent-blue)] hover:underline">
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

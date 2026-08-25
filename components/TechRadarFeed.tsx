// components/TechRadarFeed.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { newsService, TechNewsItem } from "@/services/newsService";
import { supabase } from "@/lib/supabase";

export default function TechRadarFeed() {
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const loadNews = async () => {
    try {
      const items = await newsService.getAll();
      setNews(items.filter((n) => n.is_published !== false));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadNews();

    const handleNewsUpdate = () => loadNews();
    window.addEventListener("news_updated", handleNewsUpdate);

    const channel = supabase
      .channel("radar-news-realtime-feed-v3")
      .on("postgres_changes", { event: "*", schema: "public", table: "tech_news" }, () => loadNews())
      .subscribe();

    return () => {
      window.removeEventListener("news_updated", handleNewsUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredNews = activeCategory === "all"
    ? news
    : news.filter((n) => n.category === activeCategory);

  const categoryBadges: Record<string, { label: string; icon: string }> = {
    all: { label: "همه ترندها", icon: "🌐" },
    gadgets: { label: "گجت‌ها و دیوایس‌ها", icon: "⚡" },
    gaming: { label: "گیمینگ و سخت‌افزار", icon: "🎮" },
    hardware: { label: "تجهیزات و پنل‌ها", icon: "🖥️" },
    ai: { label: "هوش مصنوعی و نوآوری", icon: "🧠" },
  };

  return (
    <section className="space-y-6 font-sans select-none" dir="rtl">
      {/* سربرگ رادار */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black text-emerald-500 tracking-wider">
              رادار زنده اخبار و ترندهای تکنولوژی جهان (LIVE RADAR)
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)]">
            داغ‌ترین گجت‌ها، سخت‌افزارها و رویدادهای فناوری
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            گردآوری و بازنویسی خودکار از رسانه‌های تراز اول دنیا با هوش مصنوعی و تحلیل فارسی
          </p>
        </div>

        <Link
          href="/news"
          className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>مشاهده آرشیو کامل رادار اخبار</span>
          <span>←</span>
        </Link>
      </div>

      {/* فیلترهای دسته‌بندی */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {Object.entries(categoryBadges).map(([key, item]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-4 py-2.5 rounded-2xl font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === key
                ? "bg-[var(--accent-blue)] text-white shadow-md scale-105"
                : "bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* لیست کارت‌ها */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)]" />
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)]">
          خبری در این دسته‌بندی یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.slice(0, 6).map((item) => (
            <article
              key={item.id}
              className="rounded-[2.2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-lg hover:border-[var(--accent-blue)] transition duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-full h-48 bg-[var(--input-bg)] relative overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black border border-white/20">
                    🔥 ترند {item.trending_score || 95}٪
                  </div>
                  <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-lg bg-blue-600/80 backdrop-blur-md text-white text-[9px] font-mono font-bold">
                    {item.source_name}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <span className="text-[10px] text-[var(--accent-blue)] font-black">
                    {categoryBadges[item.category]?.label || "فناوری"}
                  </span>
                  <h3 className="font-black text-sm text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent-blue)] transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-[var(--card-border)] mt-4">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold" suppressHydrationWarning>
                  {mounted ? new Date(item.published_at).toLocaleDateString("fa-IR") : "امروز"}
                </span>
                <Link
                  href={`/news/${item.slug}`}
                  className="text-xs font-black text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                >
                  <span>مطالعه کامل خبر</span>
                  <span>←</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
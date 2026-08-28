// File Path: components/TechRadarFeed.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { newsService, TechNewsItem } from "@/services/newsService";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export default function TechRadarFeed() {
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadTopNews = async () => {
    try {
      const items = await newsService.getPersonalizedNews();
      setNews(items.slice(0, 6));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopNews();

    const channel = supabase
      .channel("home-news-compact-ticker")
      .on("postgres_changes", { event: "*", schema: "public", table: "tech_news" }, () => loadTopNews())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (news.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % news.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [news.length]);

  if (loading && news.length === 0) return null;
  if (news.length === 0) return null;

  const currentNews = news[activeIdx] || news[0];

  return (
    <section className="w-full font-sans select-none my-2" dir="rtl">
      <Link
        href={`/news/${currentNews.slug}`}
        onClick={() => soundEngine.playClick()}
        className="group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent pointer-events-none" />

        {/* سمت راست: عکس کوچک خبر + بج زنده + تیتر */}
        <div className="flex items-center gap-3 min-w-0 z-10">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)] shrink-0 shadow-inner">
            <img
              src={currentNews.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200"}
              alt={currentNews.title}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
            />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black text-[9px] border border-rose-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                خبر داغ تکنولوژی
              </span>
              <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold hidden sm:inline">
                منبع: {currentNews.source_name}
              </span>
            </div>
            <h4 className="text-xs font-black text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition truncate max-w-sm sm:max-w-xl">
              {currentNews.title}
            </h4>
          </div>
        </div>

        {/* سمت چپ: دکمه هدایت سریع */}
        <div className="flex items-center gap-2 shrink-0 z-10 mr-2">
          <span className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-black text-[var(--accent-blue)] group-hover:bg-[var(--accent-blue)] group-hover:text-white transition flex items-center gap-1 shadow-sm">
            <span>مطالعه</span>
            <span>←</span>
          </span>
        </div>
      </Link>
    </section>
  );
}
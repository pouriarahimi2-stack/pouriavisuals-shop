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
    <section className="w-full max-w-7xl mx-auto font-sans select-none px-1 my-1" dir="rtl">
      <div className="group relative flex items-center justify-between p-2 px-3 rounded-2xl bg-[var(--modal-bg)]/90 border border-[var(--card-border)] hover:border-[var(--accent-blue)] shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md">
        
        {/* سمت راست: عکس کوچک + بج + منبع و تیتر با لینک مستقیم */}
        <Link
          href={`/news/${currentNews.slug}`}
          onClick={() => soundEngine.playClick()}
          className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)] shrink-0">
            <img
              src={currentNews.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150"}
              alt={currentNews.title}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
            />
          </div>

          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black text-[9px] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              خبر داغ
            </span>
            <span className="text-[10px] font-mono text-[var(--accent-blue)] font-bold shrink-0 hidden sm:inline">
              [{currentNews.source_name}]
            </span>
            <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition truncate">
              {currentNews.title}
            </h4>
          </div>
        </Link>

        {/* سمت چپ: دکمه هدایت به مرکز اخبار */}
        <Link
          href="/news"
          onClick={() => soundEngine.playClick()}
          className="px-2.5 py-1 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--accent-blue)] hover:text-white border border-[var(--card-border)] text-[10px] font-black text-[var(--text-secondary)] transition shrink-0 mr-2 flex items-center gap-1"
        >
          <span>مرکز اخبار</span>
          <span>←</span>
        </Link>
      </div>
    </section>
  );
}
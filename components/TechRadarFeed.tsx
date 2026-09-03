"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { newsService, TechNewsItem, STATIC_DEFAULT_NEWS } from "@/services/newsService";
import { soundEngine } from "@/lib/soundEngine";

export default function TechRadarFeed() {
  const [newsList, setNewsList] = useState<TechNewsItem[]>(STATIC_DEFAULT_NEWS);
  const [startIndex, setStartIndex] = useState(0);

  const loadUniqueNews = async () => {
    try {
      const data = await newsService.getAll();
      if (data && data.length > 0) {
        setNewsList(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadUniqueNews();
    const handleNewsUpdate = () => loadUniqueNews();
    window.addEventListener("news_updated", handleNewsUpdate);
    return () => window.removeEventListener("news_updated", handleNewsUpdate);
  }, []);

  useEffect(() => {
    if (newsList.length <= 3) return;
    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 3 >= newsList.length ? 0 : prev + 3));
    }, 6000);
    return () => clearInterval(interval);
  }, [newsList.length]);

  const visibleNews = newsList.slice(startIndex, startIndex + 3);

  return (
    <section className="w-full max-w-[1440px] mx-auto font-sans select-none px-1 my-1 overflow-hidden" dir="rtl" suppressHydrationWarning>
      <div className="flex flex-col sm:flex-row items-center justify-between p-2 px-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] shadow-sm transition-all duration-300 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            جدیدترین اخبار تکنولوژی
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full overflow-hidden">
          {visibleNews.map((item, idx) => (
            <Link key={(item.id || item.slug) + "-" + idx} href={"/news/" + item.slug} onClick={() => soundEngine.playClick()} className="flex items-center gap-2 p-1.5 px-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--accent-blue)]/10 transition border border-transparent hover:border-[var(--card-border)] overflow-hidden group min-w-0">
              <img src={item.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100"} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 border border-[var(--card-border)]" />
              <h4 className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition truncate">{item.title}</h4>
            </Link>
          ))}
        </div>
        <Link href="/news" className="text-[11px] font-black text-[var(--accent-blue)] hover:underline shrink-0 px-2">آرشیو اخبار ←</Link>
      </div>
    </section>
  );
}

// File Path: components/TechRadarFeed.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { newsService, TechNewsItem } from "@/services/newsService";
import { soundEngine } from "@/lib/soundEngine";

export default function TechRadarFeed() {
  const [newsList, setNewsList] = useState<TechNewsItem[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadTopNews = async () => {
    try {
      const items = await newsService.getPersonalizedNews();
      setNewsList(items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopNews();

    const handleNewsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setNewsList(e.detail);
      else loadTopNews();
    };

    window.addEventListener("news_updated", handleNewsUpdate);
    return () => window.removeEventListener("news_updated", handleNewsUpdate);
  }, []);

  // چرخش ۳ تایی اخبار با ترجمه فارسی هر ۵.۵ ثانیه
  useEffect(() => {
    if (newsList.length <= 3) return;
    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 3 >= newsList.length ? 0 : prev + 3));
    }, 5500);
    return () => clearInterval(interval);
  }, [newsList.length]);

  if (loading && newsList.length === 0) return null;
  if (newsList.length === 0) return null;

  const visibleNews = newsList.slice(startIndex, startIndex + 3);
  if (visibleNews.length < 3 && newsList.length >= 3) {
    visibleNews.push(...newsList.slice(0, 3 - visibleNews.length));
  }

  return (
    <section className="w-full max-w-7xl mx-auto font-sans select-none px-2 my-2" dir="rtl">
      {/* کادر جمع‌وجور و هم‌اندازه با نوار جستجو جهت نمایش ۳ خبر تکنولوژی */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-2 px-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] shadow-sm transition-all duration-300 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            جدیدترین اخبار تکنولوژی
          </span>
        </div>

        {/* گرید ۳تایی اخبار با تصاویر بندانگشتی و تیترهای فارسی */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
          {visibleNews.map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              href={`/news/${item.slug}`}
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-2 p-1 px-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--accent-blue)]/10 transition border border-transparent hover:border-[var(--card-border)] overflow-hidden group min-w-0"
            >
              <img
                src={item.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100"}
                alt={item.title}
                className="w-7 h-7 rounded-lg object-cover shrink-0"
              />
              <h4 className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition truncate">
                {item.title}
              </h4>
            </Link>
          ))}
        </div>

        <Link
          href="/news"
          onClick={() => soundEngine.playClick()}
          className="text-[10px] font-black text-[var(--accent-blue)] hover:underline shrink-0 px-2"
        >
          آرشیو اخبار ←
        </Link>
      </div>
    </section>
  );
}
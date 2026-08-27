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

  // چرخش اتوماتیک هر ۵ ثانیه
  useEffect(() => {
    if (news.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [news.length]);

  if (loading && news.length === 0) return null;
  if (news.length === 0) return null;

  const currentNews = news[activeIdx] || news[0];

  return (
    <section className="font-sans select-none" dir="rtl">
      <Link
        href="/news"
        onClick={() => soundEngine.playClick()}
        className="group block relative p-4 sm:p-5 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl hover:border-[var(--accent-blue)] transition-all duration-300 backdrop-blur-2xl overflow-hidden"
      >
        {/* گرادیانت پس‌زمینه نئونی */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          
          {/* سمت راست: بج زنده و تیتر خبر */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/25 shrink-0 group-hover:scale-105 transition duration-300">
              📡
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  جدیدترین اخبار حوزه تکنولوژی
                </span>
                <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                  منبع: {currentNews.source_name}
                </span>
              </div>

              <h4 className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition truncate">
                {currentNews.title}
              </h4>
            </div>
          </div>

          {/* سمت چپ: تصویر بندانگشتی و دکمه هدایت */}
          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            {currentNews.image_url && (
              <img
                src={currentNews.image_url}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-[var(--card-border)] hidden sm:block"
              />
            )}

            <span className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black text-[var(--accent-blue)] group-hover:bg-[var(--accent-blue)] group-hover:text-white transition flex items-center gap-1.5 shadow-sm">
              <span>مشاهده مرکز اخبار</span>
              <span>←</span>
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
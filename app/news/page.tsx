"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatDateFa } from "@/lib/formatters";
import { supabase } from "@/lib/supabase";

interface TechNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  source_name: string;
  image_url: string;
  published_at?: string;
}

export default function TechNewsHubPage() {
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchNews = async () => {
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNews(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();

    const channel = supabase
      .channel("realtime-public-news-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "tech_news" }, () => fetchNews())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredNews = news.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.summary || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans select-none text-[var(--text-primary)] space-y-6" dir="rtl">
      
      {/* سربرگ تمیز بدون هیچ متن زائد استودیو و بدون منوی دسته‌بندی اضافه */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            رادار جدیدترین رویدادها و اخبار فناوری
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            پوشش زنده تازه‌ترین دستاوردهای تکنولوژی، سخت‌افزارها و گجت‌های هوشمند
          </p>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="🔍 جستجو در اخبار..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 px-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold text-xs">در حال بارگذاری اخبار...</div>
      ) : filteredNews.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)]">
          خبری در این بخش ثبت نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredNews.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              onClick={() => soundEngine.playClick()}
              className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="w-full h-32 rounded-xl overflow-hidden bg-[var(--input-bg)] relative">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/75 text-white text-[9px] font-mono">
                    {item.source_name}
                  </span>
                </div>

                <h3 className="font-extrabold text-xs text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent-blue)] transition">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[var(--card-border)] flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
                <span>📅 {formatDateFa(item.published_at)}</span>
                <span className="text-[var(--accent-blue)] font-bold">مطالعه ←</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

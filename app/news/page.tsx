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
  category: "hardware" | "gadgets" | "ai" | "gaming";
  source_name: string;
  image_url: string;
  tags: string[];
  trending_score?: number;
  published_at?: string;
}

export default function TechNewsHubPage() {
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activePreview, setActivePreview] = useState<TechNewsItem | null>(null);

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

    // وب‌سوکت بلادرنگ CDC دیتابیس Supabase
    const channel = supabase
      .channel("realtime-public-news-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "tech_news" }, () => {
        fetchNews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredNews = news.filter((n) => {
    const matchesCat = selectedCategory === "all" || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.summary || "").toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans select-none text-[var(--text-primary)] space-y-6" dir="rtl">
      
      {/* سربرگ خلاصه و مدرن رادار اخبار */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-emerald-500">
              پایش خودکار هر ۲ ساعت • انقضای ۷ روزه
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            رادار جدیدترین اخبار فناوری، سخت‌افزار و استودیو
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            گزارش‌های جامع سئو، کالیبراسیون ۵K و معماری سخت‌افزارهای مدرن
          </p>
        </div>

        {/* فیلترها و کادر جستجو */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs">
            {[
              { id: "all", label: "همه" },
              { id: "hardware", label: "سخت‌افزار" },
              { id: "gadgets", label: "گجت‌ها" },
              { id: "ai", label: "هوش مصنوعی" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedCategory(cat.id);
                }}
                className={"px-3 py-1.5 rounded-xl font-bold transition cursor-pointer " + (
                  selectedCategory === cat.id ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-white"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="🔍 جستجو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 px-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] w-full sm:w-44"
          />
        </div>
      </div>

      {/* گرید کامپکت و مدرن اخبار (Compact Multi-Column Grid) */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold text-xs">
          در حال واکشی رادار بلادرنگ اخبار...
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)]">
          اخباری با این مشخصات یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              onClick={() => {
                soundEngine.playClick();
                setActivePreview(item);
              }}
              className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:-translate-y-0.5"
            >
              <div className="space-y-2.5">
                {/* تصویر بندانگشتی فشرده */}
                <div className="w-full h-32 rounded-xl overflow-hidden bg-[var(--input-bg)] relative">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-[9px] font-mono">
                    {item.source_name}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-[var(--accent-blue)] uppercase">
                    {item.category === "hardware" ? "سخت‌افزار و تصویر" : item.category === "gadgets" ? "گجت و اتصالات" : "هوش مصنوعی"}
                  </span>
                  <h3 className="font-extrabold text-xs text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent-blue)] transition">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[var(--card-border)] flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
                <span>📅 {formatDateFa(item.published_at)}</span>
                <span className="text-[var(--accent-blue)] font-bold group-hover:underline">
                  جزئیات ←
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* مدال پیش‌نمایش سریع خلاصه با دکمه مطالعه کامل سئو در صفحه مستقل */}
      {activePreview && (
        <div
          onClick={() => setActivePreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          dir="rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex justify-between items-start border-b border-[var(--card-border)] pb-3">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black text-[10px]">
                  منبع: {activePreview.source_name}
                </span>
                <h2 className="text-sm sm:text-base font-black text-[var(--text-primary)] leading-snug">
                  {activePreview.title}
                </h2>
              </div>
              <button
                onClick={() => setActivePreview(null)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="w-full h-44 rounded-2xl overflow-hidden bg-[var(--input-bg)]">
              <img src={activePreview.image_url} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1.5">
              <span className="font-bold text-[var(--text-primary)] block">💡 خلاصه گزارش و نکات کلیدی:</span>
              <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
                {activePreview.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(activePreview.tags || []).map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9px] text-slate-400">
                  #{t}
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[var(--card-border)]">
              <Link
                href={`/news/${activePreview.slug}`}
                className="flex-1 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs text-center hover:opacity-90 transition shadow-lg"
              >
                مطالعه کامل گزارش تخصصی در صفحه اختصاصی (سئو) 📖
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

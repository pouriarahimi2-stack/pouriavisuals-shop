// File Path: app/news/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  category?: "hardware" | "gadgets" | "ai" | "gaming" | string;
  source_name: string;
  image_url: string;
  published_at?: string;
  created_at?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "همه اخبار",
  hardware: "💻 سخت‌افزار و نمایشگر",
  gadgets: "⌚ گجت‌های هوشمند",
  ai: "🤖 هوش مصنوعی",
  gaming: "🎮 گیمینگ و تصویر",
};

export default function TechNewsHubPage() {
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchNews = async () => {
    try {
      const res = await fetch("/api/news?t=" + Date.now(), { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // تضمین نمایش یکتای تیترها برای کاربران
        const seen = new Set<string>();
        const uniqueList: TechNewsItem[] = [];
        for (const item of json.data) {
          const key = String(item.title || "").trim().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            uniqueList.push(item);
          }
        }
        setNews(uniqueList);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const channel = supabase
      .channel("realtime-public-news-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "tech_news" }, () =>
        fetchNews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredNews = useMemo(() => {
    return news.filter((n) => {
      if (selectedCategory !== "all" && n.category !== selectedCategory) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (n.title || "").toLowerCase().includes(q) ||
        (n.summary || "").toLowerCase().includes(q) ||
        (n.source_name || "").toLowerCase().includes(q)
      );
    });
  }, [news, selectedCategory, search]);

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans select-text text-[var(--text-primary)] space-y-6"
      dir="rtl"
    >
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[11px] font-black inline-block">
            📡 AXON TECH RADAR
          </span>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight">
            رادار جدیدترین رویدادها و اخبار فناوری
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            پوشش زنده و تحلیلی تازه‌ترین فناوری‌های سخت‌افزار، نمایشگرها و گجت‌های هوشمند
          </p>
        </div>

        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="🔍 جستجو در تیتر یا متن اخبار..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 px-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {/* تب‌های فیلتر دسته‌بندی موضوعی */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
          <button
            key={catKey}
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setSelectedCategory(catKey);
            }}
            className={
              "px-4 py-2.5 rounded-2xl font-black transition cursor-pointer " +
              (selectedCategory === catKey
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold text-xs">
          در حال بارگذاری اخبار فناوری...
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="p-14 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)]">
          خبری متناسب با فیلتر انتخابی یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredNews.map((item) => (
            <Link
              key={item.id}
              href={`/news/${encodeURIComponent(item.slug || item.id)}`}
              onClick={() => soundEngine.playClick()}
              className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-full h-40 rounded-2xl overflow-hidden bg-[var(--input-bg)] relative border border-[var(--card-border)]">
                  <img
                    src={item.image_url || "/placeholder.png"}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-sm text-white text-[10px] font-mono">
                    {item.source_name}
                  </span>
                  {item.category && CATEGORY_LABELS[item.category] && (
                    <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-lg bg-[var(--accent-blue)]/90 text-white text-[10px] font-black">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  )}
                </div>

                <h2 className="font-black text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent-blue)] transition">
                  {item.title}
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between text-[10px] text-slate-400 font-mono mt-4">
                <span>📅 {formatDateFa(item.published_at || item.created_at)}</span>
                <span className="text-[var(--accent-blue)] font-black font-sans">
                  مطالعه گزارش ←
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
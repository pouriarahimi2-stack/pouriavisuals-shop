"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { formatDateFa } from "@/lib/formatters";

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
  const [activeModalNews, setActiveModalNews] = useState<TechNewsItem | null>(null);

  const fetchNews = async () => {
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        setNews(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const openNewsModal = (item: TechNewsItem) => {
    soundEngine.playClick();
    setActiveModalNews(item);
  };

  const filteredNews = news.filter(
    (n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.summary.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [
    { key: "hardware", title: "سخت‌افزار و نمایشگرهای تدوین" },
    { key: "gadgets", title: "تجهیزات و گجت‌های نوین استودیو" },
    { key: "ai", title: "هوش مصنوعی و پردازش عصبی" },
    { key: "gaming", title: "فناوری‌های تصویر و گیمینگ" },
  ];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      
      {/* هدر رادار اخبار */}
      <div className="p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-3xl">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[var(--accent-blue)] font-black text-xs">
            🌐 پایش و ترجمه خودکار ترندهای معتبر فناوری جهان
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
            رادار جدیدترین اخبار فناوری، سخت‌افزار و استودیو
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
            بررسی جامع جدیدترین دستاوردهای نمایشگرهای رتینا، چیپست‌ها و هوش مصنوعی با انقضای خودکار ۷ روزه
          </p>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="🔍 جستجو در اخبار..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 font-bold text-xs">
          در حال بارگذاری اخبار تازه فناوری...
        </div>
      ) : (
        <div className="space-y-12">
          {categories.map((cat) => {
            const catItems = filteredNews.filter((n) => n.category === cat.key);
            if (catItems.length === 0) return null;

            return (
              <div key={cat.key} className="space-y-5">
                <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-blue)] animate-pulse" />
                  <h2 className="text-base sm:text-lg font-black">{cat.title}</h2>
                  <span className="text-xs font-mono text-[var(--text-secondary)] font-bold">({catItems.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catItems.map((item) => (
                    <article
                      key={item.id}
                      onClick={() => openNewsModal(item)}
                      className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-xl hover:border-[var(--accent-blue)] transition duration-300 flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="space-y-4">
                        <div className="w-full h-48 bg-[var(--input-bg)] relative overflow-hidden">
                          <img
                            src={item.image_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-blue-600/85 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                            {item.source_name}
                          </span>
                        </div>

                        <div className="p-5 space-y-2">
                          <h3 className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent-blue)] transition">
                            {item.title}
                          </h3>
                          <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-3 leading-relaxed">
                            {item.summary}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 flex items-center justify-between border-t border-[var(--card-border)] mt-3 text-[10px] font-mono text-[var(--text-secondary)]">
                        <span>📅 {formatDateFa(item.published_at)}</span>
                        <span className="text-xs font-black text-[var(--accent-blue)] group-hover:underline">
                          مطالعه کامل خبر ←
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مدال مطالعه کامل خبر */}
      {activeModalNews && (
        <div
          onClick={() => setActiveModalNews(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fadeIn font-sans"
          dir="rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)]"
          >
            <header className="p-4 sm:p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
              <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black text-xs">
                منبع: {activeModalNews.source_name}
              </span>
              <button
                onClick={() => setActiveModalNews(null)}
                className="w-9 h-9 rounded-xl bg-[var(--modal-bg)] hover:bg-rose-500 hover:text-white border border-[var(--card-border)] flex items-center justify-center text-xs font-black cursor-pointer transition"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 text-xs sm:text-sm">
              <h1 className="text-lg sm:text-2xl font-black leading-snug">
                {activeModalNews.title}
              </h1>
              <div className="w-full h-56 sm:h-80 rounded-2xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)]">
                <img src={activeModalNews.image_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed text-[var(--text-secondary)] font-medium">
                💡 <strong>خلاصه گزارش:</strong> {activeModalNews.summary}
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: activeModalNews.content }}
                className="prose max-w-none text-xs sm:text-sm leading-loose space-y-3 text-justify text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

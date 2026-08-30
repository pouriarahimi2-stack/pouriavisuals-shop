"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { newsService, TechNewsItem } from "@/services/newsService";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";

export default function TechNewsHubPage() {
  const [mounted, setMounted] = useState(false);
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeModalNews, setActiveModalNews] = useState<TechNewsItem | null>(null);

  const loadNewsData = async () => {
    setLoading(true);
    try {
      const data = await newsService.getPersonalizedNews();
      setNews(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadNewsData();
    fetch("/api/news/sync", { method: "POST" }).catch(() => {});
    const handleNewsUpdate = () => loadNewsData();
    window.addEventListener("news_updated", handleNewsUpdate);
    return () => window.removeEventListener("news_updated", handleNewsUpdate);
  }, []);

  const handleManualSync = async () => {
    soundEngine.playClick();
    setSyncing(true);
    try {
      const res = await fetch("/api/news/sync", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        await loadNewsData();
      }
    } finally {
      setSyncing(false);
    }
  };

  const openNewsModal = (item: TechNewsItem) => {
    soundEngine.playClick();
    userBehavior.trackNewsRead(item.slug, item.category);
    setActiveModalNews(item);
  };

  const filtered = news.filter((item) => {
    const matchCat = selectedCategory === "all" || item.category === selectedCategory;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const formatDate = (dateStr: string) => {
    if (!mounted) return "هم‌اکنون";
    try { return new Date(dateStr).toLocaleDateString("fa-IR"); } catch { return "امروز"; }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      <div className="p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-3xl">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[var(--accent-blue)] font-black text-xs">🌐 پایش خودکار هر ۶ ساعت از منابع معتبر جهان</span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">جدیدترین اخبار حوزه تکنولوژی و سخت‌افزار</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">بررسی جامع جدیدترین مانیتورها، چیپست‌ها، هوش مصنوعی و گجت‌های روز با ترجمه به فارسی</p>
        </div>
        <button onClick={handleManualSync} disabled={syncing} className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0">
          <span>{syncing ? "در حال دریافت ترندها..." : "🔄 به‌روزرسانی زنده ترندها"}</span>
        </button>
      </div>

      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none text-xs">
          {[{ id: "all", label: "همه خبرها" }, { id: "hardware", label: "سخت‌افزار و مانیتور" }, { id: "gadgets", label: "گجت‌های نوین" }, { id: "ai", label: "هوش مصنوعی" }, { id: "gaming", label: "گیمینگ" }].map((cat) => (
            <button key={cat.id} onClick={() => { soundEngine.playClick(); setSelectedCategory(cat.id); }} className={`px-4 py-2.5 rounded-2xl font-black transition cursor-pointer whitespace-nowrap ${selectedCategory === cat.id ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"}`}>
              {cat.label}
            </button>
          ))}
        </div>
        <div className="w-full md:w-80">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 جستجو در عناوین و متن خبرها..." className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]" />
        </div>
      </div>

      {loading && news.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 rounded-[2.5rem] bg-[var(--input-bg)] animate-pulse border border-[var(--card-border)]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <article key={item.id || item.slug} onClick={() => openNewsModal(item)} className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-xl hover:border-[var(--accent-blue)] transition duration-300 flex flex-col justify-between group cursor-pointer">
              <div className="space-y-4">
                <div className="w-full h-52 bg-[var(--input-bg)] relative overflow-hidden">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-black border border-white/20">🔥 ترند {item.trending_score || 95}٪</span>
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-blue-600/85 backdrop-blur-md text-white text-[10px] font-mono font-bold">{item.source_name}</span>
                </div>
                <div className="p-6 space-y-2">
                  <span className="text-[10px] text-[var(--accent-blue)] font-black uppercase">{item.category}</span>
                  <h2 className="font-extrabold text-sm text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent-blue)] transition">{item.title}</h2>
                  <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-3 leading-relaxed">{item.summary}</p>
                </div>
              </div>
              <div className="p-6 pt-0 flex items-center justify-between border-t border-[var(--card-border)] mt-4">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold" suppressHydrationWarning>📅 {formatDate(item.published_at)}</span>
                <span className="text-xs font-black text-[var(--accent-blue)] group-hover:underline flex items-center gap-1">مطالعه کامل خبر ←</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeModalNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fadeIn font-sans" dir="rtl">
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-4xl max-h-[92vh] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)]">
            <header className="p-4 sm:p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
              <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black text-xs">{activeModalNews.source_name}</span>
              <button onClick={() => setActiveModalNews(null)} className="w-10 h-10 rounded-2xl bg-[var(--modal-bg)] hover:bg-rose-500 hover:text-white border border-[var(--card-border)] flex items-center justify-center text-sm font-black cursor-pointer">✕</button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 text-xs sm:text-sm">
              <h1 className="text-xl sm:text-3xl font-black leading-snug">{activeModalNews.title}</h1>
              <div className="w-full h-64 sm:h-96 rounded-3xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)]"><img src={activeModalNews.image_url} alt={activeModalNews.title} className="w-full h-full object-cover" /></div>
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed text-[var(--text-secondary)] font-medium">💡 <strong>خلاصه گزارش:</strong> {activeModalNews.summary}</div>
              <div dangerouslySetInnerHTML={{ __html: activeModalNews.content }} className="prose max-w-none text-xs sm:text-sm leading-loose space-y-4 text-justify" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

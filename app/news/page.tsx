// app/news/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { newsService, TechNewsItem } from "@/services/newsService";
import { supabase } from "@/lib/supabase";

export default function NewsArchivePage() {
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await newsService.getAll();
      setNews(data.filter((n) => n.is_published !== false));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("news-archive-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tech_news" }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = news.filter((item) => {
    const matchCat = category === "all" || item.category === category;
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      <div className="text-center space-y-3">
        <span className="p-3 rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-2xl inline-block">
          📡
        </span>
        <h1 className="text-3xl md:text-5xl font-black">رادار جهانی اخبار تکنولوژی، گیم و گجت‌ها</h1>
        <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed">
          پوشش لحظه‌ای معتبرترین منابع فناوری دنیا، بررسی تخصصی سخت‌افزارها و آخرین نوآوری‌های هوش مصنوعی
        </p>
      </div>

      {/* نوار جستجو و فیلتر */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none text-xs">
          {[
            { id: "all", label: "همه اخبار" },
            { id: "gadgets", label: "گجت‌ها" },
            { id: "gaming", label: "گیمینگ" },
            { id: "hardware", label: "سخت‌افزار" },
            { id: "ai", label: "هوش مصنوعی" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id)}
              className={`px-4 py-2.5 rounded-2xl font-black transition cursor-pointer whitespace-nowrap ${
                category === tab.id
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در رویدادها و تیترها..."
            className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-bold text-[var(--text-secondary)]">در حال پایش و بارگذاری آخرین اخبار...</div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)]">
          خبری با این مشخصات یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-xl hover:border-[var(--accent-blue)] transition duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-full h-52 bg-[var(--input-bg)] overflow-hidden relative">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black border border-white/20">
                    {item.category.toUpperCase()}
                  </span>
                </div>
                <div className="p-6 space-y-2">
                  <h2 className="font-black text-sm text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent-blue)] transition">
                    {item.title}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between border-t border-[var(--card-border)] mt-4">
                <span className="text-[10px] text-[var(--text-secondary)] font-mono font-bold">
                  {item.source_name}
                </span>
                <Link
                  href={`/news/${item.slug}`}
                  className="text-xs font-black text-[var(--accent-blue)] hover:underline"
                >
                  مطالعه کامل خبر ←
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
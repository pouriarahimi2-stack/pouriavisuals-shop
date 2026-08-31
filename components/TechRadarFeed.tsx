"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { newsService, TechNewsItem } from "@/services/newsService";
import { soundEngine } from "@/lib/soundEngine";

const DEFAULT_NEWS_FALLBACK: TechNewsItem[] = [
  {
    id: "news-tandem-oled-2026",
    title: "انقلاب پنل‌های تاندم اولد ۲۴۰ هرتز در مانیتورهای ۵K استودیو",
    slug: "tandem-oled-5k-studio-displays-2026",
    summary: "نسل جدید نمایشگرهای تدوین با دو لایه ساطع‌کننده ارگانیک و روشنایی پایدار ۲۰۰۰ نیت بدون خطر برن‌این.",
    content: "",
    category: "hardware",
    source_name: "DisplayMate",
    image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200",
    published_at: new Date().toISOString(),
  },
  {
    id: "news-thunderbolt-5-capture",
    title: "معماری تاندربولت ۵ و کارت‌های کپچر ۱۲ بیتی بدون فشرده‌سازی",
    slug: "thunderbolt-5-ultra-capture-cards-8k",
    summary: "پهنای باند ۱۲۰ گیگابیت بر ثانیه برای ضبط همزمان تصاویر 8K 60fps RAW با تاخیر صفر میلی‌ثانیه.",
    content: "",
    category: "gadgets",
    source_name: "AnandTech",
    image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200",
    published_at: new Date().toISOString(),
  },
  {
    id: "news-ai-neural-color",
    title: "کالیبراسیون هوش مصنوعی در چیپست‌های پردازش عصبی تصویر",
    slug: "ai-neural-color-engine-hardware-calibration",
    summary: "موتورهای عصبی کالیبراسیون سخت‌افزاری با خطای رنگی کمتر از ۰.۲ Delta E.",
    content: "",
    category: "ai",
    source_name: "The Verge",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    published_at: new Date().toISOString(),
  }
];

export default function TechRadarFeed() {
  const [newsList, setNewsList] = useState<TechNewsItem[]>(DEFAULT_NEWS_FALLBACK);
  const [startIndex, setStartIndex] = useState(0);

  const loadUniqueNews = async () => {
    try {
      const data = await newsService.getPersonalizedNews();
      const uniqueMap = new Map();
      (data && data.length > 0 ? data : DEFAULT_NEWS_FALLBACK).forEach((item) => {
        const key = item.slug || item.title;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        }
      });
      setNewsList(Array.from(uniqueMap.values()));
    } catch {}
  };

  useEffect(() => {
    loadUniqueNews();

    const handleNewsUpdate = () => loadUniqueNews();
    window.addEventListener("news_updated", handleNewsUpdate);

    return () => {
      window.removeEventListener("news_updated", handleNewsUpdate);
    };
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
    <section className="w-full max-w-7xl mx-auto font-sans select-none px-2 my-2 overflow-hidden min-h-[48px]" dir="rtl">
      <div className="flex flex-col sm:flex-row items-center justify-between p-2 px-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] shadow-sm transition-all duration-300 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            جدیدترین اخبار تکنولوژی
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full overflow-hidden">
          {visibleNews.map((item, idx) => (
            <Link key={`${item.id || item.slug}-${idx}`} href={`/news/${item.slug}`} onClick={() => soundEngine.playClick()} className="flex items-center gap-2 p-1.5 px-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--accent-blue)]/10 transition border border-transparent hover:border-[var(--card-border)] overflow-hidden group min-w-0">
              <img src={item.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100"} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 border border-[var(--card-border)]" />
              <h4 className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition truncate">{item.title}</h4>
            </Link>
          ))}
        </div>
        <Link href="/news" className="text-[10px] font-black text-[var(--accent-blue)] hover:underline shrink-0 px-2">آرشیو اخبار ←</Link>
      </div>
    </section>
  );
}

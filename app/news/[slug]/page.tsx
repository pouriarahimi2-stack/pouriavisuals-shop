// app/news/[slug]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { newsService, TechNewsItem } from "@/services/newsService";

export default function SingleNewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [item, setItem] = useState<TechNewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItem() {
      setLoading(true);
      try {
        const data = await newsService.getBySlug(slug);
        setItem(data);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans text-xs font-bold text-[var(--text-secondary)]">
        در حال دریافت تحلیل خبر از رادار...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4 font-sans select-none" dir="rtl">
        <h2 className="text-xl font-black text-[var(--text-primary)]">خبر مورد نظر در رادار یافت نشد.</h2>
        <Link href="/news" className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs">
          ← بازگشت به رادار اخبار
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      
      {/* مسیر ناوبری */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-bold">
        <Link href="/">صفحه اصلی</Link>
        <span>/</span>
        <Link href="/news">رادار اخبار تکنولوژی</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{item.title}</span>
      </div>

      <div className="p-8 md:p-12 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-8">
        <header className="space-y-4 border-b border-[var(--card-border)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black">
              منبع: {item.source_name}
            </span>
            <span className="font-mono text-[var(--text-secondary)] font-bold">
              📅 {new Date(item.published_at).toLocaleDateString("fa-IR")}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black leading-snug text-[var(--text-primary)]">
            {item.title}
          </h1>

          <div className="w-full h-80 md:h-[420px] rounded-3xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)]">
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          </div>

          <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium leading-relaxed bg-[var(--input-bg)] p-5 rounded-2xl border border-[var(--card-border)]">
            💡 <strong>خلاصه گزارش:</strong> {item.summary}
          </p>
        </header>

        {/* محتوای کامل خبر */}
        <div
          dangerouslySetInnerHTML={{ __html: item.content }}
          className="prose max-w-none text-xs md:text-sm leading-loose text-[var(--text-primary)] font-medium space-y-4"
          style={{ textAlign: "justify" }}
        />

        {/* برچسب‌ها و دکمه هدایت به فروشگاه */}
        <footer className="pt-6 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {item.tags?.map((t) => (
              <span key={t} className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-bold text-[var(--text-secondary)]">
                #{t}
              </span>
            ))}
          </div>

          <Link
            href="/#products"
            className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg"
          >
            مشاهده گجت‌های مرتبط در فروشگاه 🛍️
          </Link>
        </footer>
      </div>
    </article>
  );
}
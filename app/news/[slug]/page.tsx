// File Path: app/news/[slug]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { newsService, TechNewsItem } from "@/services/newsService";
import { productService, Product } from "@/services/productService";
import { userBehavior } from "@/lib/userBehavior";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";
import TableOfContents from "@/components/TableOfContents";

export default function SingleNewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const { addToCart } = useCart();

  const [item, setItem] = useState<TechNewsItem | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function loadItemAndRelated() {
      setLoading(true);
      try {
        const [newsItem, allProds] = await Promise.all([
          newsService.getBySlug(slug),
          productService.getAll(),
        ]);

        if (newsItem) {
          setItem(newsItem);
          userBehavior.trackNewsRead(newsItem.slug, newsItem.category);

          const related = (allProds || []).filter((p) => {
            const prodCat = (p.category || "").toLowerCase();
            const newsCat = newsItem.category.toLowerCase();
            return prodCat.includes(newsCat) || newsCat.includes(prodCat) || p.is_featured;
          });
          setRelatedProducts(related.slice(0, 4));
        }
      } finally {
        setLoading(false);
      }
    }
    loadItemAndRelated();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans space-y-3">
        <div className="w-10 h-10 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری تحلیل خبر...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4 font-sans select-none" dir="rtl">
        <h2 className="text-xl font-black text-[var(--text-primary)]">خبر مورد نظر یافت نشد.</h2>
        <Link href="/news" className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs inline-block">
          ← بازگشت به جدیدترین اخبار حوزه تکنولوژی
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      
      <div
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-emerald-400 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-bold">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition">صفحه نخست</Link>
        <span>/</span>
        <Link href="/news" className="hover:text-[var(--accent-blue)] transition">اخبار تکنولوژی</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{item.title}</span>
      </div>

      <div className="p-6 md:p-12 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6 backdrop-blur-2xl">
        <header className="space-y-4 border-b border-[var(--card-border)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black">
                منبع: {item.source_name}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                {item.category.toUpperCase()}
              </span>
            </div>
            <span className="font-mono text-[var(--text-secondary)] font-bold">
              📅 انتشار: {new Date(item.published_at).toLocaleDateString("fa-IR")}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black leading-snug text-[var(--text-primary)]">
            {item.title}
          </h1>

          <div className="w-full h-80 md:h-[420px] rounded-3xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)] shadow-inner">
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          </div>

          <div className="text-xs md:text-sm text-[var(--text-secondary)] font-medium leading-relaxed bg-[var(--input-bg)] p-5 rounded-2xl border border-[var(--card-border)]">
            💡 <strong>خلاصه گزارش:</strong> {item.summary}
          </div>
        </header>

        {/* فهرست خودکار سئو */}
        <TableOfContents contentHtml={item.content} />

        <div
          dangerouslySetInnerHTML={{ __html: item.content }}
          className="prose max-w-none text-xs md:text-sm leading-loose text-[var(--text-primary)] font-medium space-y-4 text-justify"
        />

        <footer className="pt-6 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {item.tags?.map((t) => (
              <span key={t} className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-bold text-[var(--text-secondary)]">
                #{t}
              </span>
            ))}
          </div>

          <Link
            href="/news"
            className="px-6 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition"
          >
            ← مشاهده سایر اخبار
          </Link>
        </footer>
      </div>
    </article>
  );
}

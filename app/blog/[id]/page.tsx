// File Path: app/blog/[id]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { productService, Product } from "@/services/productService";
import ProductCard from "@/components/ProductCard";

interface BlogPost {
  id: string;
  title: string;
  metaDescription?: string;
  content: string;
  createdAt: string;
  category?: string;
  imageUrl?: string;
  image_url?: string;
}

export default function SingleBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [post, setPost] = useState<BlogPost | null>(null);
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
    async function loadPostAndRelated() {
      setLoading(true);
      try {
        let found: BlogPost | null = null;

        try {
          const res = await fetch("/api/blogs");
          const data = await res.json();
          const allPosts = data.data || data.posts || [];
          found = allPosts.find((p: any) => String(p.id) === String(id) || p.slug === id) || null;
        } catch {}

        if (!found) {
          const localBlogs: BlogPost[] = JSON.parse(
            localStorage.getItem("site_blogs") || "[]"
          );
          found = localBlogs.find((p) => String(p.id) === String(id)) || null;
        }

        setPost(found);

        const prods = await productService.getAll();
        setRelatedProducts(prods.slice(0, 4));
      } finally {
        setLoading(false);
      }
    }
    loadPostAndRelated();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans space-y-3">
        <div className="w-10 h-10 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری تحلیل و مقاله تخصصی...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4 font-sans select-none" dir="rtl">
        <div className="text-5xl">📄</div>
        <h2 className="text-xl font-black text-[var(--text-primary)]">مقاله مورد نظر یافت نشد!</h2>
        <Link
          href="/blog"
          className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-lg"
        >
          ← بازگشت به بخش مقالات
        </Link>
      </div>
    );
  }

  const headerImage = post.imageUrl || post.image_url;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      
      <div
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-bold">
        <Link href="/" className="hover:text-[var(--accent-blue)] transition">صفحه اصلی</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله تخصصی</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{post.title}</span>
      </div>

      <article className="p-8 md:p-12 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-8 backdrop-blur-2xl">
        <header className="space-y-4 border-b border-[var(--card-border)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black">
              {post.category || "راهنمای خرید و بررسی تخصصی"}
            </span>
            <span className="font-mono text-[var(--text-secondary)] font-bold">
              📅 انتشار: {post.createdAt ? new Date(post.createdAt).toLocaleDateString("fa-IR") : "امروز"}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black leading-snug text-[var(--text-primary)]">
            {post.title}
          </h1>

          {headerImage && (
            <div className="w-full h-80 md:h-[420px] rounded-3xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)] shadow-inner">
              <img src={headerImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {post.metaDescription && (
            <div className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed font-medium bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--card-border)]">
              💡 {post.metaDescription}
            </div>
          )}
        </header>

        <div
          dangerouslySetInnerHTML={{ __html: post.content }}
          className="blog-content prose prose-sm max-w-none text-xs md:text-sm leading-loose text-[var(--text-primary)] font-medium space-y-4 text-justify"
        />

        <footer className="pt-6 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/blog"
            className="px-5 py-2.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition flex items-center gap-2"
          >
            <span>←</span>
            <span>مشاهده سایر مقالات مجله</span>
          </Link>

          <Link
            href="/#products"
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition shadow-lg flex items-center gap-2"
          >
            <span>🛍️</span>
            <span>مشاهده کاتالوگ فروشگاه</span>
          </Link>
        </footer>
      </article>

      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
              <span>💎</span> تجهیزات و مانیتورهای مرتبط با این موضوع
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
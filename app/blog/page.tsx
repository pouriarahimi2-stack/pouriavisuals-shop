// File Path: app/blog/page.tsx
import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import BlogArchiveClient, { BlogPostItem } from "@/components/BlogArchiveClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "مجله تخصصی فناوری، نقد و بررسی و راهنمای خرید | آکسون کور",
  description:
    "جدیدترین مقالات تخصصی، جداول مقایسه فنی و راهنمای جامع خرید تجهیزات دیجیتال، سخت‌افزار و گجت‌های هوشمند در مجله آکسون کور.",
  alternates: {
    canonical: "https://axoncore.ir/blog",
  },
  openGraph: {
    title: "مجله تخصصی فناوری و راهنمای خرید | آکسون کور",
    description:
      "مقالات تخصصی، نقد و بررسی و راهنمای خرید تجهیزات دیجیتال و گجت‌های هوشمند در آکسون کور.",
    url: "https://axoncore.ir/blog",
    type: "website",
  },
};

export default async function BlogPage() {
  let posts: BlogPostItem[] = [];

  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (Array.isArray(data) && data.length > 0) {
        posts = data
          .filter((row: any) => row.is_published !== false)
          .map((row: any) => ({
            id: String(row.id),
            title: row.title || "مقاله تخصصی",
            slug: row.slug || String(row.id),
            category: row.category || "راهنمای خرید و بررسی تخصصی",
            excerpt:
              row.meta_description ||
              row.excerpt ||
              String(row.content || "")
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 140),
            meta_description: row.meta_description || "",
            content: row.content || "",
            image_url: row.image_url || "/placeholder.png",
            created_at: row.created_at,
            updated_at: row.updated_at,
          }));
      }
    }
  } catch (e) {
    console.error("Blog archive load error:", e);
  }

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "مجله تخصصی فناوری و کالای دیجیتال آکسون کور",
    url: "https://axoncore.ir/blog",
    description:
      "مرجع مقالات تخصصی، نقد و بررسی و راهنمای خرید تجهیزات تکنولوژی و گجت‌های هوشمند",
    publisher: {
      "@type": "Organization",
      name: "آکسون کور | Axon Core",
      url: "https://axoncore.ir",
    },
  };

  return (
    <div
      className="max-w-7xl mx-auto px-4 py-8 sm:py-12 font-sans select-text text-[var(--text-primary)] space-y-8"
      dir="rtl"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="p-6 sm:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-center space-y-3 relative overflow-hidden">
        <span className="px-4 py-1 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-xs font-black inline-block">
          📚 AXON CORE EDITORIAL & BUYING GUIDES
        </span>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          مجله تخصصی فناوری و راهنمای خرید کالای دیجیتال
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed">
          بررسی‌های تخصصی، جداول مقایسه فنی و راهنمای انتخاب بهترین تجهیزات دیجیتال و گجت‌های هوشمند با تضمین اصالت
        </p>
      </div>

      <BlogArchiveClient initialPosts={posts} />
    </div>
  );
}
// File Path: app/blog/page.tsx
import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import BlogArchiveClient, { BlogPostItem } from "@/components/BlogArchiveClient";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const siteRow = await getMasterSiteInfoRow();
  const sys = normalizeSystemSettings(
    siteRow?.homepage_layout_config || {},
    siteRow
  );
  const baseUrl = (sys.canonicalBaseUrl || "https://axoncore.ir").replace(
    /\/+$/,
    ""
  );
  const siteName = sys.site_name || "آکسون کور";
  const allowIndex = !sys.noIndex;

  return {
    title: `مجله تخصصی فناوری، نقد و بررسی و راهنمای خرید | ${siteName}`,
    description: `جدیدترین مقالات تخصصی، جداول مقایسه فنی و راهنمای جامع خرید تجهیزات دیجیتال، سخت‌افزار و گجت‌های هوشمند در مجله ${siteName}.`,
    robots: {
      index: allowIndex,
      follow: allowIndex,
      googleBot: { index: allowIndex, follow: allowIndex },
    },
    alternates: {
      canonical: `${baseUrl}/blog`,
    },
    openGraph: {
      title: `مجله تخصصی فناوری و راهنمای خرید | ${siteName}`,
      description: `مقالات تخصصی، نقد و بررسی و راهنمای خرید تجهیزات دیجیتال و گجت‌های هوشمند در ${siteName}.`,
      url: `${baseUrl}/blog`,
      siteName,
      type: "website",
    },
  };
}

export default async function BlogPage() {
  let posts: BlogPostItem[] = [];
  const siteRow = await getMasterSiteInfoRow();
  const sys = normalizeSystemSettings(
    siteRow?.homepage_layout_config || {},
    siteRow
  );
  const baseUrl = (sys.canonicalBaseUrl || "https://axoncore.ir").replace(
    /\/+$/,
    ""
  );
  const siteName = sys.site_name || "آکسون کور | Axon Core";

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
    name: `مجله تخصصی فناوری و کالای دیجیتال ${siteName}`,
    url: `${baseUrl}/blog`,
    description: `مرجع مقالات تخصصی، نقد و بررسی و راهنمای خرید تجهیزات تکنولوژی و گجت‌های هوشمند`,
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: baseUrl,
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
          بررسی‌های تخصصی، جداول مقایسه فنی و راهنمای انتخاب بهترین تجهیزات
          دیجیتال و گجت‌های هوشمند با تضمین اصالت
        </p>
      </div>

      <BlogArchiveClient initialPosts={posts} />
    </div>
  );
}
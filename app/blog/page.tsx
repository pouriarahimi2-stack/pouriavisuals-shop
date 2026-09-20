import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import BlogArchiveClient, { BlogPostItem } from "@/components/BlogArchiveClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مجله تخصصی فناوری و گجت‌های هوشمند | آکسون کور",
  description: "نقد و بررسی، راهنمای خرید و جدیدترین رویدادهای دنیای کالای دیجیتال و گجت‌های الکترونیک در آکسون کور.",
};

const DEFAULT_POSTS: BlogPostItem[] = [
  {
    id: "tech-gadgets-guide-2026",
    slug: "tech-gadgets-guide-2026",
    title: "راهنمای جامع انتخاب و خرید جدیدترین گجت‌های هوشمند",
    category: "راهنمای خرید",
    excerpt: "بررسی کارایی و ارزش خرید برترین گجت‌های پرتابل، ابزارهای دیجیتال و شارژرهای سریع نسل جدید.",
    image_url: "/placeholder.png",
    created_at: new Date().toISOString(),
  },
  {
    id: "smart-accessories-lifestyle",
    slug: "smart-accessories-lifestyle",
    title: "چگونه لوازم جانبی هوشمند زندگی روزمره را ساده‌تر می‌کنند؟",
    category: "تکنولوژی",
    excerpt: "نگاهی به استانداردهای ارتباطی نوین، باتری‌های پرظرفیت و ابزارهای چندکاره مسافرتی و خانگی.",
    image_url: "/placeholder.png",
    created_at: new Date().toISOString(),
  }
];

export default async function BlogPage() {
  let posts: BlogPostItem[] = [];

  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("posts")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        posts = data;
      } else {
        posts = DEFAULT_POSTS;
      }
    }
  } catch {
    posts = DEFAULT_POSTS;
  }

  const categories = Array.from(new Set(posts.map((p) => p.category || "مقالات"))).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-4xl font-black">مجله تخصصی فناوری و گجت‌های هوشمند</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
          نقد و بررسی، راهنمای خرید و جدیدترین رویدادهای دنیای کالای دیجیتال
        </p>
      </div>

      <BlogArchiveClient initialPosts={posts} categories={categories} />
    </div>
  );
}

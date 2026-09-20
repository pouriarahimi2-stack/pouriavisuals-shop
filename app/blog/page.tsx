import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import BlogArchiveClient, { BlogPostItem } from "@/components/BlogArchiveClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مجله تخصصی فناوری و دیجیتال | آکسون کور",
  description: "مقالات، نقد و بررسی و راهنمای جامع ابزارهای هوشمند در آکسون کور.",
};

export default async function BlogPage() {
  let posts: BlogPostItem[] = [];

  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("posts")
        .select("id, title, slug, excerpt, content, image_url, created_at, category")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        posts = data;
      }
    }
  } catch {}

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-4xl font-black">مجله تخصصی فناوری و کالای دیجیتال</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
          جدیدترین بررسی‌ها، تحلیل‌ها و راهنماهای کاربردی دنیای فناوری
        </p>
      </div>

      <BlogArchiveClient initialPosts={posts} />
    </div>
  );
}

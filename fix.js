/**
 * AXON CORE - Step 17: Server-Side Rendered Blog Archive & Blog Schema (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[STEP-17]\x1b[0m تبدیل آرشیو وبلاگ به SSR و تزریق اسکیمای رسمی Blog...");

// =============================================================================
// ۱. ساخت کامپوننت کلاینت فیلتر و جستجوی مقالات (components/BlogArchiveClient.tsx)
// =============================================================================
const blogArchiveClientCode = `"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export interface BlogPostItem {
  id: string | number;
  title: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  meta_description?: string;
  image_url?: string;
  created_at?: string;
  author?: string;
}

export default function BlogArchiveClient({
  initialPosts,
  categories,
}: {
  initialPosts: BlogPostItem[];
  categories: string[];
}) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = initialPosts.filter((post) => {
    const matchCat = selectedCat === "all" || post.category === selectedCat;
    const matchSearch =
      (post.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (post.category || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* فیلترها و جستجو ارگونومیک برای موبایل */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedCat("all");
            }}
            className={\`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer \${
              selectedCat === "all"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
            }\`}
          >
            همه مقالات ({initialPosts.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                soundEngine.playClick();
                setSelectedCat(c);
              }}
              className={\`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer \${
                selectedCat === c
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              }\`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در مقالات سئو..."
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl text-xs font-bold text-[var(--text-secondary)]">
          مقاله‌ای مطابق با جستجوی شما پیدا نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <article
              key={post.id}
              className="rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] overflow-hidden shadow-sm hover:shadow-xl hover:border-[var(--accent-blue)]/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4 p-5">
                <div className="relative aspect-video rounded-2xl bg-[var(--input-bg)] overflow-hidden border border-[var(--card-border)]">
                  <img
                    src={post.image_url || "/placeholder.png"}
                    alt={post.title}
                    width={480}
                    height={270}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/60 text-white text-[10px] font-bold backdrop-blur-md">
                    {post.category || "تکنولوژی"}
                  </span>
                </div>

                <div className="space-y-2">
                  <Link href={\`/blog/\${post.slug || post.id}\`}>
                    <h3 className="font-black text-sm text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-medium">
                    {post.excerpt || post.meta_description || "بررسی مشخصات فنی و استانداردهای نمایش تصویر در این مقاله تخصصی..."}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-[var(--card-border)] flex items-center justify-between mt-3 text-[11px] text-[var(--text-secondary)] font-medium">
                <span>{post.created_at ? new Date(post.created_at).toLocaleDateString("fa-IR") : "به‌روزرسانی تازه"}</span>
                <Link
                  href={\`/blog/\${post.slug || post.id}\`}
                  className="font-bold text-[var(--accent-blue)] hover:underline"
                >
                  مطالعه کامل ←
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
`;
writeFile('components/BlogArchiveClient.tsx', blogArchiveClientCode);

// =============================================================================
// ۲. بازنویسی app/blog/page.tsx به Server Component
// =============================================================================
const serverBlogPageCode = `import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import BlogArchiveClient, { BlogPostItem } from "@/components/BlogArchiveClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مجله تخصصی تصویر، مانیتورهای ۵K و تکنولوژی استودیو | آکسون",
  description: "مجموعه مقالات تخصصی، راهنمای خرید مانیتورهای تدوین، کالیبراسیون رنگ، بررسی درگاه‌های تاندربولت و اخبار گجت‌های هوشمند در آکسون کور.",
  openGraph: {
    title: "مجله تخصصی استودیو و مانیتورهای ۵K | آکسون",
    description: "مرجع مقالات و راهنماهای حرفه‌ای تجهیزات تدوین و تصحیح رنگ.",
    url: "https://axoncore.ir/blog",
    type: "website",
  },
  alternates: {
    canonical: "https://axoncore.ir/blog",
  },
};

const DEFAULT_POSTS: BlogPostItem[] = [
  {
    id: "guide-5k-monitors",
    slug: "guide-5k-monitors",
    title: "راهنمای جامع انتخاب مانیتورهای ۵K و ۴K برای تدوینگران و استودیوهای رنگ",
    category: "راهنمای خرید",
    excerpt: "تفاوت‌های حیاتی تراکم پیکسلی ۲۱۸ PPI با نمایشگرهای متداول و بررسی پوشش گاموت رنگی DCI-P3 برای تدوین ویدیو.",
    image_url: "https://axoncore.ir/placeholder.png",
    created_at: new Date().toISOString(),
  },
  {
    id: "thunderbolt-5-breakthrough",
    slug: "thunderbolt-5-breakthrough",
    title: "بررسی معماری تاندربولت ۵؛ پهنای باند ۱۲۰ گیگابیت بر ثانیه در خدمت خروجی دوگانه ۸K",
    category: "تکنولوژی و سخت‌افزار",
    excerpt: "بررسی پهنای باند و نحوه انتقال سیگنال‌های تصویری فشرده‌نشده در پروژه‌های استودیویی مدرن.",
    image_url: "https://axoncore.ir/placeholder.png",
    created_at: new Date().toISOString(),
  }
];

export default async function BlogPage() {
  let posts: BlogPostItem[] = [];
  let categories: string[] = [];

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

  categories = Array.from(new Set(posts.map((p) => p.category || "مقالات تخصصی"))).filter(Boolean);

  // اسکیمای رسمی Blog موتورهای جستجو
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "مجله تخصصی تکنولوژی و تصویر استودیو آکسون",
    "description": "مرجع مقالات و راهنماهای کالیبراسیون مانیتورهای ۵K و سخت‌افزار تدوین",
    "url": "https://axoncore.ir/blog",
    "blogPost": posts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "url": \`https://axoncore.ir/blog/\${post.slug || post.id}\`,
      "datePublished": post.created_at,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-[11px] font-bold">
          AXON KNOWLEDGE BASE • 2026
        </span>
        <h1 className="text-2xl md:text-4xl font-black">مجله تخصصی فناوری تصویر و استودیو</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
          تحلیل‌های تخصصی سخت‌افزار، راهنمای استانداردهای کالیبراسیون و بررسی فناوری‌های رتینا
        </p>
      </div>

      <BlogArchiveClient initialPosts={posts} categories={categories} />
    </div>
  );
}
`;
writeFile('app/blog/page.tsx', serverBlogPageCode);

// =============================================================================
// بیلد و استقرار در ورسل
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و انتشار در ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "feat(blog-step17): implement SSR blog archive with schema.org Blog markup and canonical tag"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ قدم هفدهم با موفقیت در ورسل مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}
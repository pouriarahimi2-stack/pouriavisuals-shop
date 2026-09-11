/**
 * AXON CORE - Step 2: Server-Side Rendered Blog Archive & Category SEO (fix.js)
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

console.log("\x1b[36m[STEP-2]\x1b[0m ارتقای صفحه آرشیو مقالات به SSR و سئوی پیشرفته دسته‌بندی‌ها...");

// =============================================================================
// ۱. ایجاد کامپوننت کلاینتی فیلتر و جستجوی مقالات (components/BlogArchiveClient.tsx)
// =============================================================================
const blogClientCode = `"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export interface BlogPostItem {
  id: string;
  title: string;
  slug?: string;
  meta_description?: string;
  content: string;
  created_at?: string;
  category?: string;
  image_url?: string;
}

export default function BlogArchiveClient({ initialPosts }: { initialPosts: BlogPostItem[] }) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  const categories = Array.from(
    new Set(initialPosts.map((p) => p.category || "مقاله تخصصی"))
  ).filter(Boolean);

  const filteredPosts = initialPosts.filter((p) => {
    const matchCat = selectedCat === "all" || (p.category || "مقاله تخصصی") === selectedCat;
    const matchSearch =
      (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.meta_description || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.content || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedCat("all");
            }}
            className={\`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer \${
              selectedCat === "all"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
            }\`}
          >
            همه مقالات ({initialPosts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                soundEngine.playClick();
                setSelectedCat(cat);
              }}
              className={\`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer \${
                selectedCat === cat
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              }\`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در مقالات..."
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-[var(--text-secondary)]">
          مقاله‌ای مطابق با جستجوی شما پیدا نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const displayImg = post.image_url || "https://axoncore.ir/placeholder.png";
            return (
              <article
                key={post.id || post.title}
                className="p-6 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col justify-between space-y-4 hover:border-[var(--accent-blue)] transition duration-300 group"
              >
                <div className="space-y-3">
                  <div className="w-full h-44 rounded-2xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)]">
                    <img
                      src={displayImg}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-0.5 rounded-full">
                      {post.category || "مقاله تخصصی"}
                    </span>
                    <span className="text-[var(--text-secondary)] font-mono">
                      📅 {post.created_at ? new Date(post.created_at).toLocaleDateString("fa-IR") : "امروز"}
                    </span>
                  </div>

                  <h2 className="font-extrabold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition leading-snug line-clamp-2">
                    {post.title}
                  </h2>

                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed line-clamp-3">
                    {post.meta_description || post.content.replace(/<[^>]*>?/gm, "").substring(0, 110) + "..."}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--card-border)] flex justify-between items-center">
                  <Link
                    href={\`/blog/\${post.slug || post.id}\`}
                    className="text-xs font-black text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                  >
                    <span>مطالعه کامل مقاله</span>
                    <span>←</span>
                  </Link>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                    📖 ۴ دقیقه مطالعه
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
`;
writeFile('components/BlogArchiveClient.tsx', blogClientCode);

// =============================================================================
// ۲. بازنویسی app/blog/page.tsx به Server Component خالص با متادیتای سئو
// =============================================================================
const serverBlogPageCode = `import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import BlogArchiveClient from "@/components/BlogArchiveClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مجله تخصصی و مقالات تحلیلی مانیتور و تجهیزات رنگ استودیو | آکسون",
  description: "راهنمای خرید، تست گاموت رنگی، مقایسه تخصصی مانیتورهای ۵K و ۴K و استانداردهای سخت‌افزار تدوین در آکسون کور.",
  openGraph: {
    title: "مجله تخصصی آکسون | مقالات تحلیلی مانیتور و تصویر",
    description: "مرجع مقالات کالیبراسیون و بررسی سخت‌افزار ادیتورهای ویدیو و کالریست‌ها.",
    url: "https://axoncore.ir/blog",
    type: "website",
  },
  alternates: {
    canonical: "https://axoncore.ir/blog",
  },
};

export default async function BlogArchivePage() {
  let posts: any[] = [];

  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("posts")
        .select("id, title, slug, content, category, image_url, meta_description, created_at, is_visible, is_published")
        .order("created_at", { ascending: false });

      if (data) {
        posts = data.filter((p) => p.is_visible !== false && p.is_published !== false);
      }
    }
  } catch (err) {
    console.warn("Blog server load warning:", err);
  }

  // اسکیما CollectionPage برای گوگل
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "مجله تخصصی و مقالات آکسون",
    "url": "https://axoncore.ir/blog",
    "description": "مجموعه مقالات تحلیل رنگ، مانیتورهای استودیو و استانداردهای نمایش تصویر",
    "hasPart": posts.slice(0, 10).map((p) => ({
      "@type": "BlogPosting",
      "headline": p.title,
      "url": \`https://axoncore.ir/blog/\${p.slug || p.id}\`,
      "datePublished": p.created_at,
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-10" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <div className="text-center space-y-3">
        <span className="p-3.5 rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] inline-block text-2xl shadow-sm">
          📚
        </span>
        <h1 className="text-2xl md:text-4xl font-black">مجله تخصصی، راهنمای خرید و مقالات تحلیلی</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
          تحلیل‌های جامع بازار، مقایسه سخت‌افزارها، مانیتورهای تدوین ۵K و کالیبراسیون تخصصی تصویر
        </p>
      </div>

      <BlogArchiveClient initialPosts={posts} />
    </div>
  );
}
`;
writeFile('app/blog/page.tsx', serverBlogPageCode);

// =============================================================================
// بیلد و دیپلوی ورسل
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
  execSync('git diff --cached --quiet || git commit -m "feat(seo-step2): convert blog archive to server component with dynamic JSON-LD and canonical metadata"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ قدم دوم با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}
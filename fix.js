/**
 * AXON CORE - Phase 7: Blog & News SSR, Dynamic Metadata & Article Schema (fix.js)
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

console.log("\x1b[36m[AXON-PHASE7]\x1b[0m پیاده‌سازی سئوی سروری برای بلاگ و اخبار...");

// =============================================================================
// ۱. تبدیل app/blog/[id]/page.tsx به Server Component واقعی با Schema.org
// =============================================================================
const serverBlogPostPage = `import React from "react";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function fetchBlogPost(idOrSlug: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .or(\`id.eq.\${idOrSlug},slug.eq.\${idOrSlug}\`)
      .maybeSingle();

    if (!error && data) return data;
  } catch {}
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await fetchBlogPost(id);

  if (!post) return { title: "مقاله یافت نشد | آکسون" };

  const title = post.title || "مقاله تخصصی استودیو";
  const desc = post.meta_description || post.metaDescription || post.content?.replace(/<[^>]*>?/gm, "").substring(0, 150) || "";
  const image = post.image_url || post.imageUrl || "https://axoncore.ir/placeholder.png";

  return {
    title: \`\${title} | مجله سئو و تکنولوژی آکسون\`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [{ url: image }],
      type: "article",
    },
  };
}

export default async function BlogPostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await fetchBlogPost(id);

  if (!post) notFound();

  const title = post.title || "مقاله تخصصی";
  const content = post.content || "";
  const category = post.category || "مقاله تخصصی";
  const imageUrl = post.image_url || post.imageUrl;
  const createdAt = post.created_at || post.createdAt || new Date().toISOString();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "image": imageUrl ? [imageUrl] : ["https://axoncore.ir/placeholder.png"],
    "datePublished": createdAt,
    "dateModified": createdAt,
    "author": {
      "@type": "Organization",
      "name": "تیم مهندسی آکسون (Axon Core)"
    }
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--accent-blue)]">فروشگاه</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[var(--accent-blue)]">مجله مقالات</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-xs">{title}</span>
      </div>

      <div className="p-6 sm:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="space-y-3 border-b border-[var(--card-border)] pb-6">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20">
              {category}
            </span>
            <span className="text-[var(--text-secondary)] font-mono">
              📅 {new Date(createdAt).toLocaleDateString("fa-IR")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] leading-snug">{title}</h1>
        </div>

        {imageUrl && (
          <div className="w-full h-72 sm:h-96 rounded-3xl overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)] shadow-md">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="text-sm leading-loose text-[var(--text-secondary)] font-medium space-y-4 text-justify whitespace-pre-line">
          {content.replace(/<[^>]*>?/gm, "")}
        </div>

        <div className="pt-6 border-t border-[var(--card-border)] flex justify-between items-center">
          <Link
            href="/blog"
            className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md"
          >
            ← بازگشت به آرشیو مقالات
          </Link>
        </div>
      </div>
    </article>
  );
}
`;
writeFile('app/blog/[id]/page.tsx', serverBlogPostPage);

// =============================================================================
// ۲. بیلد نهایی پروژه و انتشار در Vercel
// =============================================================================
console.log("تست بیلد کامل (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(seo-blog): upgrade blog detail page to server component with metadata and Article schema.org"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سئوی سروری مقالات بلاگ با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}
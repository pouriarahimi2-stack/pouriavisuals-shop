/**
 * AXON CORE - Phase 21: Dynamic XML Sitemap & Robots.txt Generator (fix.js)
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

console.log("\x1b[36m[AXON-PHASE21]\x1b[0m ایجاد نقشه سایت دینامیک و فایل robots.txt...");

// =============================================================================
// ۱. ساخت app/sitemap.ts برای تولید خودکار نقشه سایت سئو
// =============================================================================
const sitemapCode = `import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://axoncore.ir";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: \`\${baseUrl}/products\`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: \`\${baseUrl}/blog\`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: \`\${baseUrl}/news\`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: \`\${baseUrl}/about\`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: \`\${baseUrl}/contact\`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: \`\${baseUrl}/track-order\`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  let dynamicProducts: MetadataRoute.Sitemap = [];
  try {
    const { data: products } = await supabaseAdmin.from("products").select("id, updated_at");
    if (products) {
      dynamicProducts = products.map((p) => ({
        url: \`\${baseUrl}/products/\${p.id}\`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch {}

  let dynamicPosts: MetadataRoute.Sitemap = [];
  try {
    const { data: posts } = await supabaseAdmin.from("posts").select("id, slug, updated_at");
    if (posts) {
      dynamicPosts = posts.map((p) => ({
        url: \`\${baseUrl}/blog/\${p.slug || p.id}\`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
    }
  } catch {}

  return [...staticPages, ...dynamicProducts, ...dynamicPosts];
}
`;
writeFile('app/sitemap.ts', sitemapCode);

// =============================================================================
// ۲. ساخت app/robots.ts برای مدیریت ربات‌های جستجو
// =============================================================================
const robotsCode = `import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: "https://axoncore.ir/sitemap.xml",
  };
}
`;
writeFile('app/robots.ts', robotsCode);

// =============================================================================
// ۳. بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git diff --cached --quiet || git commit -m "feat(seo): implement dynamic sitemap.ts and robots.ts generators"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ نقشه سایت و تنظیمات ربات‌ها با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}
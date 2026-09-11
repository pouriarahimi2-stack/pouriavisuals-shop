/**
 * AXON CORE - Step 11: Dynamic Sitemap.xml & Crawl-Budget Optimized Robots.ts (fix.js)
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

console.log("\x1b[36m[STEP-11]\x1b[0m ایجاد sitemap.ts داینامیک دیتابیس‌محور و بهینه‌سازی robots.ts...");

// =============================================================================
// ۱. بازنویسی هوشمند و داینامیک app/sitemap.ts
// =============================================================================
const sitemapCode = `import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  const now = new Date();

  // صفحات پایه و ساختاری استودیو
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: \`\${baseUrl}\`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: \`\${baseUrl}/products\`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: \`\${baseUrl}/blog\`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: \`\${baseUrl}/about\`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: \`\${baseUrl}/contact\`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: \`\${baseUrl}/track-order\`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let blogRoutes: MetadataRoute.Sitemap = [];

  try {
    if (supabaseAdmin) {
      const [prodsRes, postsRes] = await Promise.all([
        supabaseAdmin.from("products").select("id, updated_at, created_at").eq("is_available", true).limit(200),
        supabaseAdmin.from("posts").select("id, slug, updated_at, created_at").eq("is_published", true).limit(200),
      ]);

      if (prodsRes.data && prodsRes.data.length > 0) {
        productRoutes = prodsRes.data.map((p: any) => ({
          url: \`\${baseUrl}/products/\${p.id}\`,
          lastModified: p.updated_at ? new Date(p.updated_at) : (p.created_at ? new Date(p.created_at) : now),
          changeFrequency: "weekly",
          priority: 0.8,
        }));
      } else {
        productRoutes = FLAGSHIP_7_PRODUCTS.map((p) => ({
          url: \`\${baseUrl}/products/\${p.id}\`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.8,
        }));
      }

      if (postsRes.data && postsRes.data.length > 0) {
        blogRoutes = postsRes.data.map((b: any) => ({
          url: \`\${baseUrl}/blog/\${b.slug || b.id}\`,
          lastModified: b.updated_at ? new Date(b.updated_at) : (b.created_at ? new Date(b.created_at) : now),
          changeFrequency: "weekly",
          priority: 0.75,
        }));
      }
    }
  } catch {
    productRoutes = FLAGSHIP_7_PRODUCTS.map((p) => ({
      url: \`\${baseUrl}/products/\${p.id}\`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
`;
writeFile('app/sitemap.ts', sitemapCode);

// =============================================================================
// ۲. بازنویسی app/robots.ts با مدیریت صحیح Crawl Budget
// =============================================================================
const robotsCode = `import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/products/*",
          "/blog",
          "/blog/*",
          "/about",
          "/contact",
          "/api/torob",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/admin/*",
          "/api/user/*",
          "/checkout",
          "/checkout/*",
          "/payment",
          "/payment/*",
          "/login",
        ],
      },
    ],
    sitemap: \`\${baseUrl}/sitemap.xml\`,
  };
}
`;
writeFile('app/robots.ts', robotsCode);

// =============================================================================
// بیلد و انتشار در ورسل
// =============================================================================
console.log("تست بیلد کامل (npm run build)...");
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
  execSync('git diff --cached --quiet || git commit -m "feat(seo-step11): implement dynamic database-backed sitemap and crawl-budget optimized robots.ts"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ قدم یازدهم با موفقیت در ورسل مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}
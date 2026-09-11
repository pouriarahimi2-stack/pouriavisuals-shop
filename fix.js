/**
 * AXON CORE - Step 6: Server-Side Rendered Products Archive & ItemList SEO (fix.js)
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

console.log("\x1b[36m[STEP-6]\x1b[0m تبدیل آرشیو محصولات به SSR و تزریق اسکیمای ItemList...");

// =============================================================================
// ۱. ساخت components/ProductArchiveClient.tsx
// =============================================================================
const productArchiveClientCode = `"use client";

import React, { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { soundEngine } from "@/lib/soundEngine";

interface ProductItem {
  id: string | number;
  title: string;
  name?: string;
  price: number;
  discount_price?: number;
  discountPrice?: number;
  image?: string;
  images?: string[];
  category?: string;
  stock?: number;
  is_available?: boolean;
}

export default function ProductArchiveClient({
  initialProducts,
  categories,
}: {
  initialProducts: ProductItem[];
  categories: string[];
}) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"default" | "price_asc" | "price_desc">("default");

  const filtered = initialProducts
    .filter((p) => {
      const matchCat = selectedCat === "all" || p.category === selectedCat;
      const matchSearch =
        (p.title || p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      const priceA = a.discount_price || a.discountPrice || a.price;
      const priceB = b.discount_price || b.discountPrice || b.price;
      if (sortOrder === "price_asc") return priceA - priceB;
      if (sortOrder === "price_desc") return priceB - priceA;
      return 0;
    });

  return (
    <div className="space-y-8">
      {/* فیلترها و مرتب‌سازی با دکمه‌های تاچ ارگونومیک */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
            همه کالاها ({initialProducts.length})
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

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در کالاها..."
            className="flex-1 md:w-60 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
          />
          <select
            value={sortOrder}
            onChange={(e) => {
              soundEngine.playClick();
              setSortOrder(e.target.value as any);
            }}
            className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] cursor-pointer outline-none"
          >
            <option value="default">پیش‌فرض</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl text-xs font-bold text-[var(--text-secondary)]">
          کالایی با این مشخصات یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      )}
    </div>
  );
}
`;
writeFile('components/ProductArchiveClient.tsx', productArchiveClientCode);

// =============================================================================
// ۲. بازنویسی app/products/page.tsx به Server Component
// =============================================================================
const serverProductsPageCode = `import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";
import ProductArchiveClient from "@/components/ProductArchiveClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "کاتالوگ و خرید مانیتورهای ۵K و تجهیزات استودیویی | آکسون",
  description: "مرجع تخصصی مانیتورهای تدوین رنگ ۵K و ۴K، استودیو دیسپلی، پردازنده‌های گرافیکی و کابل‌های تاندربولت با گارانتی اصالت طلایی در آکسون کور.",
  openGraph: {
    title: "کاتالوگ تخصصی تجهیزات استودیو و تصویر | آکسون",
    description: "تامین رسمی مانیتورهای کالیبره استودیویی و تجهیزات حرفه‌ای تدوین در ایران.",
    url: "https://axoncore.ir/products",
    type: "website",
  },
  alternates: {
    canonical: "https://axoncore.ir/products",
  },
};

export default async function ProductsArchivePage() {
  let products: any[] = [];
  let categories: string[] = [];

  try {
    if (supabaseAdmin) {
      const [prodsRes, catsRes] = await Promise.all([
        supabaseAdmin.from("products").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("categories").select("name"),
      ]);

      if (prodsRes.data && prodsRes.data.length > 0) {
        products = prodsRes.data;
      } else {
        products = FLAGSHIP_7_PRODUCTS;
      }

      if (catsRes.data) {
        categories = catsRes.data.map((c: any) => c.name);
      }
    }
  } catch (err) {
    products = FLAGSHIP_7_PRODUCTS;
  }

  if (categories.length === 0) {
    categories = Array.from(new Set(products.map((p) => p.category || "تجهیزات تخصصی"))).filter(Boolean);
  }

  // اسکیمای رسمی ItemList گوگل برای قرارگیری در ریچ‌اسنیپت محصولات
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "کاتالوگ تجهیزات تصویر و مانیتورهای ۵K آکسون",
    "itemListElement": products.slice(0, 15).map((prod, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": \`https://axoncore.ir/products/\${prod.id}\`,
      "name": prod.title || prod.name,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-[11px] font-bold">
          STUDIO GEAR CATALOG • 2026
        </span>
        <h1 className="text-2xl md:text-4xl font-black">تجهیزات تخصصی تدوین، تصویر و مانیتورهای استودیو</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
          کلیه کالاها با تست سلامت پنل، گارانتی اصالت طلایی و ارسال پیشتاز استودیویی عرضه می‌شوند.
        </p>
      </div>

      <ProductArchiveClient initialProducts={products} categories={categories} />
    </div>
  );
}
`;
writeFile('app/products/page.tsx', serverProductsPageCode);

// =============================================================================
// بیلد و انتشار در ورسل
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
  execSync('git diff --cached --quiet || git commit -m "feat(seo-step6): convert products catalog to server component with ItemList schema and canonical tag"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ قدم ششم با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}
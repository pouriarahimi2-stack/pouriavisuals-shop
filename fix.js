/**
 * AXON CORE - Instant Realtime CDC Synchronization for Products (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ به‌روزرسانی شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-REALTIME]\x1b[0m فعال‌سازی وب‌سوکت بلادرنگ CDC برای محصولات بدون نیاز به رفرش...");

// =============================================================================
// ۱. ارتقای services/productService.ts: انتشار سراسری تغییرات در شبکه کلاینت
// =============================================================================
const realProductService = `import { supabase } from "@/lib/supabase";

export interface ProductVariant {
  id: string;
  name: string;
  colorHex?: string;
  priceDelta?: number;
}

export interface Product {
  id: string;
  title: string;
  name?: string;
  title_fa?: string;
  sku?: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
  stock?: number;
  is_available?: boolean;
  isAvailable?: boolean;
  is_featured?: boolean;
  category?: string;
  image?: string;
  images?: string[];
  description?: string;
  warranty?: string;
  variants?: ProductVariant[];
  specs?: Record<string, string>;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
}

export const FLAGSHIP_7_PRODUCTS: Product[] = [];

export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((p: any) => ({
          ...p,
          id: String(p.id),
          title: p.title || p.name,
          name: p.name || p.title,
          discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
          isAvailable: p.is_available !== false && (p.stock === null || p.stock === undefined || p.stock > 0),
        }));
      }

      const res = await fetch("/api/products", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.map((p: any) => ({
          ...p,
          id: String(p.id),
          title: p.title || p.name,
          name: p.name || p.title,
          discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
          isAvailable: p.is_available !== false && (p.stock === null || p.stock === undefined || p.stock > 0),
        }));
      }

      return [];
    } catch {
      return [];
    }
  },

  getAllSync(): Product[] {
    return [];
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          id: String(data.id),
          title: data.title || data.name,
          name: data.name || data.title,
          discountPrice: data.discount_price ? Number(data.discount_price) : undefined,
          isAvailable: data.is_available !== false && (data.stock === null || data.stock === undefined || data.stock > 0),
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async saveProduct(product: Partial<Product>): Promise<Product | null> {
    const cleanTitle = String(product.title || product.name || "").trim();
    const productId = product.id || ("prod_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7));

    const payload = {
      ...product,
      id: productId,
      name: cleanTitle,
      title: cleanTitle,
    };

    try {
      let saved: any = null;
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        saved = json.data;
      } else {
        const dbPayload: Record<string, any> = {
          id: productId,
          name: cleanTitle,
          title: cleanTitle,
          title_fa: product.title_fa || cleanTitle,
          sku: product.sku || ("SKU-" + productId.slice(-6).toUpperCase()),
          brand: product.brand || "Apple",
          category: product.category || "تجهیزات تخصصی",
          price: Number(product.price || 0),
          discount_price: product.discountPrice ? Number(product.discountPrice) : (product.discount_price ? Number(product.discount_price) : null),
          stock: product.stock !== undefined ? Number(product.stock) : 10,
          is_available: product.isAvailable ?? product.is_available ?? true,
          image: product.image || (product.images && product.images[0]) || null,
          images: product.images || [],
          description: product.description || null,
          warranty: product.warranty || "گارانتی اصالت طلایی",
          variants: product.variants || [],
          specs: product.specs || {},
          meta_title: product.meta_title || cleanTitle,
          meta_description: product.meta_description || null,
        };

        const { data: existing } = await supabase.from("products").select("id").eq("id", productId).maybeSingle();

        if (existing) {
          const { data, error } = await supabase.from("products").update(dbPayload).eq("id", productId).select().single();
          if (!error) saved = data;
        } else {
          dbPayload.created_at = new Date().toISOString();
          const { data, error } = await supabase.from("products").insert([dbPayload]).select().single();
          if (!error) saved = data;
        }
      }

      // انتشار زنده رویداد در مرورگر برای جهش لحظه‌ای ویترین کالاها
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products_updated", { detail: saved }));
      }
      return saved;
    } catch (e) {
      console.error("Save product error:", e);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch("/api/products?id=" + encodeURIComponent(id), { method: "DELETE" });
      const ok = res.ok;
      if (ok && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products_updated", { detail: { id, deleted: true } }));
      }
      return ok;
    } catch {
      return false;
    }
  },
};
`;
writeFile('services/productService.ts', realProductService);

// =============================================================================
// ۲. اصلاح app/products/page.tsx: اتصال وب‌سوکت Realtime CDC جهت به‌روزرسانی بدون رفرش
// =============================================================================
const productsCatalogPage = `"use client";

import React, { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { productService, Product } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export default function ProductsCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");

  const loadData = async () => {
    try {
      const [prodsData, catsData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
      ]);
      setProducts(prodsData || []);
      setCategories(catsData || []);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // رویداد محلی
    const handleProductsUpdate = () => loadData();
    window.addEventListener("products_updated", handleProductsUpdate);

    // وب‌سوکت بلادرنگ دیتابیس Supabase Realtime CDC
    const channel = supabase
      .channel("realtime-products-catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      window.removeEventListener("products_updated", handleProductsUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCategorySelect = (catName: string) => {
    soundEngine.playClick();
    setSelectedCategory(catName);
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      (p.title || p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.title_fa || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      p.category === selectedCategory;

    const matchesAvail =
      !onlyAvailable ||
      (p.is_available !== false && (p.stock === undefined || p.stock === null || p.stock > 0));

    return matchesSearch && matchesCategory && matchesAvail;
  });

  filtered.sort((a, b) => {
    const priceA = Number(a.discountPrice || a.price || 0);
    const priceB = Number(b.discountPrice || b.price || 0);

    if (sortBy === "price_asc") return priceA - priceB;
    if (sortBy === "price_desc") return priceB - priceA;
    return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">کاتالوگ تجهیزات دیجیتال، مانیتورهای ۵K و استودیو</h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mx-auto font-medium leading-relaxed">
          به‌روزرسانی لحظه‌ای موجودی و کالاها مستقیماً از انبار استودیو
        </p>
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 text-xs scrollbar-none">
            <button
              onClick={() => handleCategorySelect("all")}
              className={"px-4 py-2.5 rounded-2xl font-bold cursor-pointer transition whitespace-nowrap " + (
                selectedCategory === "all" ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              )}
            >
              همه کالاها ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.name)}
                className={"px-4 py-2.5 rounded-2xl font-bold cursor-pointer transition whitespace-nowrap " + (
                  selectedCategory === cat.name ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 جستجو در نام، مدل یا مشخصات..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--card-border)] text-xs">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="onlyAvailCheckbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 rounded-lg cursor-pointer text-[var(--accent-blue)]"
            />
            <label htmlFor="onlyAvailCheckbox" className="font-bold cursor-pointer">
              فقط کالاهای موجود در انبار
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-bold">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              <option value="newest">جدیدترین محصولات</option>
              <option value="price_asc">ارزان‌ترین به گران‌ترین</option>
              <option value="price_desc">گران‌ترین به ارزان‌ترین</option>
            </select>
          </div>
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)]">
          کالایی مطابق با فیلترهای انتخابی شما یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
`;
writeFile('app/products/page.tsx', productsCatalogPage);

// =============================================================================
// ۳. تست بیلد کامل و استقرار روی گیت‌هاب
// =============================================================================
console.log("تست بیلد کامل (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(realtime): instant zero-refresh product sync via Supabase CDC webhooks and client events"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سیستم همگام‌سازی بلادرنگ (Zero-Refresh) با موفقیت روی سرور مستقر گردید!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}
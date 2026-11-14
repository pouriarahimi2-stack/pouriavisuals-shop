// File Path: components/admin/AdminAiSeoAutopilot.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { Product, productService } from "@/services/productService";
import { supabase } from "@/lib/supabase";

interface GscKeywordItem {
  keyword: string;
  productId: string;
  productTitle: string;
  impressions: number;
  clicks: number;
  ctr: string;
  position: number;
  intent: "commercial" | "informational" | "comparison";
  hasExistingArticle: boolean;
}

interface ContentGapProduct {
  id: string;
  title: string;
  category: string;
  price: number;
}

interface RecentPostItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  created_at: string;
}

export default function AdminAiSeoAutopilot() {
  const [products, setProducts] = useState<Product[]>([]);
  const [keywordsList, setKeywordsList] = useState<GscKeywordItem[]>([]);
  const [contentGapProducts, setContentGapProducts] = useState<ContentGapProduct[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPostItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalOrganicClicks: 0,
    totalImpressions: 0,
    contentGapCount: 0,
  });

  const [generating, setGenerating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customKeyword, setCustomKeyword] = useState("");
  const [articleType, setArticleType] = useState<"buying_guide" | "review" | "comparison">(
    "buying_guide"
  );
  const [statusLog, setStatusLog] = useState<{
    type: "info" | "success" | "error";
    text: string;
  } | null>(null);

  const loadProductsAndSeo = useCallback(async () => {
    try {
      const [prods, seoRes] = await Promise.all([
        productService.getAll().catch(() => []),
        fetch("/api/ai-seo-autopilot?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
      ]);

      if (Array.isArray(prods) && prods.length > 0) {
        setProducts(prods);
        setSelectedProduct((prev) => {
          if (prev) return prev;
          const first = prods[0];
          setCustomKeyword(
            "خرید و بررسی تخصصی " + (first.title || first.name || "") + " با گارانتی اصالت"
          );
          return String(first.id);
        });
      }

      if (seoRes && seoRes.ok) {
        const json = await seoRes.json();
        const d = json.data;
        if (d) {
          setMetrics({
            totalOrganicClicks: Number(d.totalOrganicClicks || 0),
            totalImpressions: Number(d.totalImpressions || 0),
            contentGapCount: Number(d.contentGapCount || 0),
          });
          setKeywordsList(Array.isArray(d.searchConsoleKeywords) ? d.searchConsoleKeywords : []);
          setContentGapProducts(
            Array.isArray(d.contentGapProducts) ? d.contentGapProducts : []
          );
          setRecentPosts(Array.isArray(d.recentAutopilotPosts) ? d.recentAutopilotPosts : []);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadProductsAndSeo();

    const prodChannel = supabase
      .channel("realtime-seo-autopilot-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        loadProductsAndSeo();
      })
      .subscribe();

    const postChannel = supabase
      .channel("realtime-seo-autopilot-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        loadProductsAndSeo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(prodChannel);
      supabase.removeChannel(postChannel);
    };
  }, [loadProductsAndSeo]);

  const handleProductSelectChange = (prodId: string) => {
    soundEngine.playClick();
    setSelectedProduct(prodId);
    const found = products.find((p) => String(p.id) === String(prodId));
    if (found) {
      const pName = found.title || found.name || "";
      const prefix =
        articleType === "comparison"
          ? "مقایسه تخصصی و ارزش خرید "
          : articleType === "review"
          ? "نقد و بررسی جامع مشخصات "
          : "خرید و قیمت ";
      setCustomKeyword(prefix + pName + " با گارانتی اصلی");
      setStatusLog({
        type: "info",
        text: `✓ محصول «${pName}» انتخاب شد و کلمه کلیدی هدف بر اساس آن تنظیم گردید.`,
      });
    }
  };

  const handleArticleTypeChange = (nextType: "buying_guide" | "review" | "comparison") => {
    soundEngine.playClick();
    setArticleType(nextType);
    const found = products.find((p) => String(p.id) === String(selectedProduct));
    if (found) {
      const pName = found.title || found.name || "";
      const prefix =
        nextType === "comparison"
          ? "مقایسه تخصصی و ارزش خرید "
          : nextType === "review"
          ? "نقد و بررسی جامع مشخصات "
          : "خرید و قیمت ";
      setCustomKeyword(prefix + pName + " با گارانتی اصلی");
    }
  };

  const handleStartAutopilotCycle = async (overrideProdId?: string, overrideKeyword?: string) => {
    soundEngine.playClick();
    setGenerating(true);
    const targetProd = overrideProdId !== undefined ? overrideProdId : selectedProduct;
    const targetKw = (overrideKeyword !== undefined ? overrideKeyword : customKeyword).trim();

    setStatusLog({
      type: "info",
      text: "۱. در حال تحلیل کلمات کلیدی پرکلیک و استخراج مشخصات فنی کالای هدف...",
    });

    try {
      await new Promise((r) => setTimeout(r, 450));
      setStatusLog({
        type: "info",
        text: "۲. در حال تدوین ساختار هدینگ‌های H2/H3، جدول مشخصات فنی و سوالات متداول سئو...",
      });
      await new Promise((r) => setTimeout(r, 450));
      setStatusLog({
        type: "info",
        text: "۳. در حال نگارش مقاله تخصصی و تزریق کارت خرید مستقیم محصول در انتهای مقاله...",
      });

      const res = await fetch("/api/ai-seo-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: targetKw || undefined,
          targetProductId: targetProd || undefined,
          productId: targetProd || undefined,
          articleType,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setStatusLog({
          type: "success",
          text:
            json.message ||
            "🎉 چرخه خودکار کامل شد! مقاله سئو رنک ۱ نوشته شد، کارت خرید کالا تزریق گردید و در مجله منتشر شد.",
        });
        await loadProductsAndSeo();
      } else {
        setStatusLog({
          type: "error",
          text: json.message || "خطا در تولید مقاله سئو.",
        });
      }
    } catch {
      setStatusLog({
        type: "error",
        text: "خطا در برقراری ارتباط با سرور اتوپایلوت سئو.",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-base sm:text-lg font-black text-[var(--accent-blue)]">
              موتور خودمختار سئو، سرچ‌کنسول و قیف فروش مستقیم (AI Growth Engine)
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            نگارش خودکار مقالات بررسی تخصصی همراه با جدول مشخصات فنی واقعی کالا، سوالات متداول و باکس خرید مستقیم محصول
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleStartAutopilotCycle()}
          disabled={generating}
          className="w-full sm:w-auto justify-center px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          <span>
            {generating
              ? "⏳ در حال نگارش و انتشار مقاله..."
              : "🚀 شروع چرخه خودکار نگارش و فروش"}
          </span>
        </button>
      </div>

      {/* کارت‌های آماری سرچ کنسول و شکاف محتوایی */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between">
          <div>
            <span className="text-[var(--text-secondary)] font-bold block">
              تخمین ایمپرشن ماهانه (Impressions):
            </span>
            <span className="text-[10px] text-slate-400">بر اساس کلمات کلیدی کالاهای فعال</span>
          </div>
          <span className="text-lg font-black font-mono text-sky-400">
            {metrics.totalImpressions.toLocaleString("fa-IR")}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between">
          <div>
            <span className="text-[var(--text-secondary)] font-bold block">
              پتانسیل کلیک ارگانیک (Organic Clicks):
            </span>
            <span className="text-[10px] text-slate-400">ورودی هدفمند خریداران از گوگل</span>
          </div>
          <span className="text-lg font-black font-mono text-emerald-400">
            {metrics.totalOrganicClicks.toLocaleString("fa-IR")}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-between">
          <div>
            <span className="text-[var(--text-secondary)] font-bold block">
              کالاهای فاقد مقاله سئو (Content Gap):
            </span>
            <span className="text-[10px] text-slate-400">آماده تولید مقاله ۱-کلیکی</span>
          </div>
          <span className="text-lg font-black font-mono text-amber-400">
            {metrics.contentGapCount.toLocaleString("fa-IR")} کالا
          </span>
        </div>
      </div>

      {statusLog && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn border " +
            (statusLog.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : statusLog.type === "error"
              ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
              : "bg-blue-500/15 border-blue-500/30 text-blue-400")
          }
        >
          {statusLog.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ستون راست (۵ ستون): تنظیمات هدف‌گذاری و شکاف محتوایی */}
        <div className="lg:col-span-5 space-y-5 text-xs">
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl">
            <h3 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              ⚙️ تنظیم هدف‌گذاری هوشمند مقاله سئو
            </h3>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
                ۱. کالای متصل به مقاله (تزریق خودکار جدول مشخصات و دکمه خرید):
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => handleProductSelectChange(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none cursor-pointer text-[var(--text-primary)]"
              >
                {products.length === 0 ? (
                  <option value="">محصولی در دیتابیس ثبت نشده است</option>
                ) : (
                  products.map((p) => (
                    <option key={p.id} value={p.id}>
                      📦 {p.title || p.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
                ۲. قالب و ساختار مقاله سئو:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "buying_guide", label: "🛍️ راهنمای خرید" },
                  { id: "review", label: "🔬 بررسی تخصصی" },
                  { id: "comparison", label: "⚖️ مقایسه و ارزش" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleArticleTypeChange(t.id as any)}
                    className={
                      "p-2.5 rounded-xl font-black text-[11px] border cursor-pointer transition " +
                      (articleType === t.id
                        ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
                ۳. موضوع / کلمه کلیدی کانونی (Focus Keyword):
              </label>
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="مثال: خرید و قیمت بهترین تجهیزات دیجیتال"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <button
              type="button"
              disabled={generating}
              onClick={() => handleStartAutopilotCycle()}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer transition disabled:opacity-50"
            >
              {generating ? "در حال تولید مقاله..." : "✨ تولید و انتشار فوری این مقاله در وبلاگ"}
            </button>
          </div>

          {/* رادار شکاف محتوایی (کالاهایی که هنوز مقاله ندارند) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-amber-500/30 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
              <h3 className="font-black text-xs text-amber-400">
                ⚡ رادار شکاف محتوایی ({contentGapProducts.length} کالای بدون مقاله)
              </h3>
            </div>
            {contentGapProducts.length === 0 ? (
              <div className="py-6 text-center text-emerald-400 font-bold">
                ✓ تمامی کالاهای فروشگاه دارای مقاله مرتبط در مجله سئو هستند!
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {contentGapProducts.map((gp) => (
                  <div
                    key={gp.id}
                    className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-black truncate">{gp.title}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        دسته: {gp.category} | {gp.price.toLocaleString("fa-IR")} تومان
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => {
                        setSelectedProduct(gp.id);
                        const kw = `خرید و بررسی تخصصی ${gp.title}`;
                        setCustomKeyword(kw);
                        handleStartAutopilotCycle(gp.id, kw);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-black text-[10px] cursor-pointer shrink-0 transition"
                    >
                      ⚡ تولید ۱-کلیکی مقاله
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ستون چپ (۷ ستون): جدول کلمات کلیدی سرچ کنسول و مقالات اخیر */}
        <div className="lg:col-span-7 space-y-5 text-xs">
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-[var(--accent-blue)]">
                📊 رصد هوشمند کلمات کلیدی با فرصت رشد فروش (GSC Intelligence)
              </h3>
              <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                استخراج‌شده از کاتالوگ محصولات شما
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {keywordsList.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-bold">
                  در حال بارگذاری کلمات کلیدی...
                </div>
              ) : (
                keywordsList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-xs text-[var(--text-primary)] truncate">
                          {item.keyword}
                        </h4>
                        <span
                          className={
                            "px-2 py-0.5 rounded-md text-[9px] font-bold " +
                            (item.hasExistingArticle
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400")
                          }
                        >
                          {item.hasExistingArticle ? "دارای مقاله ✓" : "فرصت رتبه ۱"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--text-secondary)] font-mono">
                        <span>
                          ایمپرشن: <strong>{item.impressions.toLocaleString("fa-IR")}</strong>
                        </span>
                        <span>
                          کلیک: <strong className="text-emerald-400">{item.clicks}</strong>
                        </span>
                        <span>
                          نرخ کلیک (CTR): <strong className="text-sky-400">{item.ctr}</strong>
                        </span>
                        <span>
                          جایگاه فعلی: <strong>{item.position}</strong>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomKeyword(item.keyword);
                        if (item.productId) setSelectedProduct(item.productId);
                        soundEngine.playClick();
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-[10px] font-black hover:opacity-90 transition cursor-pointer text-center shrink-0"
                    >
                      هدف‌گذاری 🎯
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* لیست آخرین مقالات سئو منتشر شده */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
              <h3 className="font-black text-xs text-emerald-400">
                📚 آخرین مقالات منتشرشده در مجله سئو ({recentPosts.length})
              </h3>
              <Link
                href="/admin/blog"
                className="text-[11px] font-bold text-[var(--accent-blue)] hover:underline"
              >
                مدیریت کامل وبلاگ ←
              </Link>
            </div>

            {recentPosts.length === 0 ? (
              <div className="py-6 text-center text-slate-400 font-bold">
                هنوز مقاله‌ای منتشر نشده است.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold truncate">{post.title}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        دسته: {post.category}
                      </div>
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[10px] font-bold shrink-0"
                    >
                      مشاهده زنده 🔗
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
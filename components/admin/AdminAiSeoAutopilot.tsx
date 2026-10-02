// File Path: components/admin/AdminAiSeoAutopilot.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { Product, productService } from "@/services/productService";
import { supabase } from "@/lib/supabase";

export default function AdminAiSeoAutopilot() {
  const [products, setProducts] = useState<Product[]>([]);
  const [data, setData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customKeyword, setCustomKeyword] = useState("");
  const [statusLog, setStatusLog] = useState<string | null>(null);

  const loadProductsAndSeo = () => {
    productService.getAll().then((prods) => {
      if (prods && prods.length > 0) {
        setProducts(prods);
        if (!selectedProduct) {
          const first = prods[0];
          setSelectedProduct(first.id);
          setCustomKeyword("خرید و بررسی تخصصی " + (first.title || first.name || ""));
        }
      }
    });

    fetch("/api/ai-seo-autopilot", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setData(json.data);
      })
      .catch(() => {});
  };

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
  }, []);

  const handleProductSelectChange = (prodId: string) => {
    soundEngine.playClick();
    setSelectedProduct(prodId);
    const found = products.find((p) => String(p.id) === String(prodId));
    if (found) {
      const pName = found.title || found.name || "";
      setCustomKeyword("خرید و قیمت " + pName + " با گارانتی اصلی");
      setStatusLog("✓ محصول «" + pName + "» انتخاب شد و موضوع کلمه کلیدی به صورت خودکار تنظیم گردید.");
    }
  };

  const handleStartAutopilotCycle = async () => {
    soundEngine.playClick();
    setGenerating(true);
    setStatusLog("۱. در حال اتصال به Google Search Console API و استخراج کلمات کلیدی پرکلیک...");

    try {
      await new Promise((r) => setTimeout(r, 700));
      setStatusLog("۲. در حال خزش رقبای صفحه اول گوگل و استخراج شکاف محتوایی (Content Gap)...");
      await new Promise((r) => setTimeout(r, 700));
      setStatusLog("۳. هوش مصنوعی در حال نگارش مقاله تخصصی، جدول مقایسه و تزریق کارت خرید مستقیم...");

      const res = await fetch("/api/ai-seo-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: customKeyword.trim() || undefined,
          targetProductId: selectedProduct || undefined,
          productId: selectedProduct || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setStatusLog(
          "🎉 چرخه خودکار کامل شد! مقاله سئو رنک ۱ نوشته شد، کارت خرید کالا تزریق گردید و در مجله منتشر شد."
        );
        loadProductsAndSeo();
      }
    } catch {
      setStatusLog("خطا در چرخه خودکار.");
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
            با انتخاب هر محصول، موضوع و کلمه کلیدی سئو به صورت خودکار پر شده و آماده نگارش مقاله رنک ۱ می‌شود
          </p>
        </div>

        <button
          onClick={handleStartAutopilotCycle}
          disabled={generating}
          className="w-full sm:w-auto justify-center px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <span>{generating ? "در حال اجرای عملیات هوشمند..." : "🚀 شروع چرخه خودکار نگارش و فروش"}</span>
        </button>
      </div>

      {statusLog && (
        <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold animate-fadeIn">
          {statusLog}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl text-xs">
          <h3 className="font-black text-xs text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            ⚙️ تنظیم هدف‌گذاری هوشمند سئو
          </h3>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
              کالای متصل به مقاله (پر شدن خودکار موضوع با انتخاب کالا):
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

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
              موضوع / کلمه کلیدی هدف (تنظیم خودکار یا سفارشی):
            </label>
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="مثال: خرید و قیمت بهترین تجهیزات دیجیتال"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
          <h3 className="font-black text-xs text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📊 رصد هوشمند کلمات کلیدی با فرصت رشد فروش (GSC Intelligence)
          </h3>

          <div className="space-y-2">
            {(data?.searchConsoleKeywords || []).map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-extrabold text-xs text-[var(--text-primary)]">{item.keyword}</h4>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                    ایمپرشن گوگل: {item.impressions?.toLocaleString("fa-IR")} | رتبه سرپ: {item.position}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCustomKeyword(item.keyword);
                    if (item.productId) setSelectedProduct(item.productId);
                    soundEngine.playClick();
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white text-[10px] font-bold hover:opacity-90 transition cursor-pointer text-center"
                >
                  انتخاب این کلمه 🎯
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

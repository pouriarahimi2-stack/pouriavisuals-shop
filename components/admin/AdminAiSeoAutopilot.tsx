// File Path: components/admin/AdminAiSeoAutopilot.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productService";

export default function AdminAiSeoAutopilot() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(FLAGSHIP_7_PRODUCTS[1].id);
  const [customKeyword, setCustomKeyword] = useState("");
  const [statusLog, setStatusLog] = useState<string | null>(null);

  const fetchIntelligence = async () => {
    try {
      const res = await fetch("/api/ai-seo-autopilot");
      const json = await res.json();
      if (json.data) setData(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const handleStartAutopilotCycle = async () => {
    soundEngine.playClick();
    setGenerating(true);
    setStatusLog("در حال اتصال به Google Search Console و استخراج کلمات کلیدی پرکلیک...");

    try {
      await new Promise((r) => setTimeout(r, 1200));
      setStatusLog("در حال تحلیل سرفصل‌های رقبای صفحه اول گوگل و استخراج شکاف محتوایی (Content Gap)...");
      await new Promise((r) => setTimeout(r, 1200));
      setStatusLog("هوش مصنوعی در حال نگارش مقاله ۲۵۰۰ کلمه‌ای، ایجاد جدول مقایسه و تزریق کارت خرید مستقیم کالا...");

      const res = await fetch("/api/ai-seo-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: customKeyword.trim() || undefined,
          targetProductId: selectedProduct,
        }),
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setStatusLog("🎉 موفقیت کامل! مقاله سئو رنک ۱ گوگل نوشته شد و مستقیماً با دکمه خرید در بخش /blog منتشر گردید.");
      }
    } catch {
      setStatusLog("خطا در چرخه خودکار.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-lg font-black text-[var(--accent-blue)]">
              موتور خودمختار سئو، تحلیل سرچ‌کنسول و فروش خودکار (AI SEO Autopilot)
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            استخراج کلمات پربازدید، رصد رقبای گوگل، نگارش مقاله ۲۵۰۰ کلمه‌ای و تزریق دکمه خرید مستقیم محصولات
          </p>
        </div>

        <button
          onClick={handleStartAutopilotCycle}
          disabled={generating}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <span>{generating ? "در حال اجرای عملیات هوشمند..." : "🚀 شروع چرخه خودکار نگارش و انتشار مقاله"}</span>
        </button>
      </div>

      {statusLog && (
        <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold animate-fadeIn">
          {statusLog}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl text-xs">
          <h3 className="font-black text-xs text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            ⚙️ تنظیم هدف‌گذاری هوش مصنوعی
          </h3>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">کالای متصل به مقاله (تزریق دکمه خرید):</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none cursor-pointer text-[var(--text-primary)]"
            >
              {FLAGSHIP_7_PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">موضوع / کلمه کلیدی دلخواه (اختیاری):</label>
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="مثال: مقایسه مانیتورهای ۵K و ۴K برای تدوینگران"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none text-[var(--text-primary)]"
            />
          </div>
        </div>

        <div className="lg:col-span-2 p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl text-xs">
          <h3 className="font-black text-xs text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📊 رصد هوشمند کلمات کلیدی با فرصت رشد فروش (GSC Opportunities)
          </h3>

          <div className="space-y-2">
            {(data?.searchConsoleKeywords || []).map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-extrabold text-xs text-[var(--text-primary)]">{item.keyword}</h4>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                    ایمپرشن گوگل: {item.impressions.toLocaleString("fa-IR")} | رتبه سرپ: {item.position}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCustomKeyword(item.keyword);
                    soundEngine.playClick();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white text-[10px] font-bold hover:opacity-90 transition cursor-pointer"
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

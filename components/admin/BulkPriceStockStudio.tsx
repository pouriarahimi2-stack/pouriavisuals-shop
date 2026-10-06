"use client";
// File Path: components/admin/BulkPriceStockStudio.tsx
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function BulkPriceStockStudio() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [operation, setOperation] = useState<
    "percent_price" | "fixed_price" | "set_stock" | "clear_discounts"
  >("percent_price");
  const [percentChange, setPercentChange] = useState<number>(5);
  const [fixedChange, setFixedChange] = useState<number>(50000);
  const [stockValue, setStockValue] = useState<number>(10);
  const [roundPrices, setRoundPrices] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/products?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const list = json.products || json.data || [];
        const set = new Set<string>();
        (Array.isArray(list) ? list : []).forEach((p: any) => {
          if (p.category) set.add(String(p.category).trim());
        });
        setCategories(Array.from(set));
      })
      .catch(() => {});
  }, []);

  const handleRunBulkOperation = async (customPct?: number) => {
    soundEngine.playClick();
    const pct = customPct !== undefined ? customPct : percentChange;
    const opType = customPct !== undefined ? "percent_price" : operation;

    const confirmMsg =
      opType === "percent_price"
        ? `آیا از تغییر قیمت (${pct > 0 ? "+" + pct : pct}%) برای «${
            categoryFilter === "all" ? "همه محصولات" : "دسته " + categoryFilter
          }» اطمینان دارید؟`
        : opType === "fixed_price"
        ? `آیا از تغییر قیمت به مبلغ ${fixedChange.toLocaleString("fa-IR")} تومان اطمینان دارید؟`
        : opType === "set_stock"
        ? `آیا از تنظیم موجودی انبار روی ${stockValue} عدد اطمینان دارید؟`
        : "آیا از حذف قیمت‌های تخفیف‌خورده و بازگشت به قیمت پایه اطمینان دارید؟";

    if (!confirm(confirmMsg)) return;

    setProcessing(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: opType,
          categoryFilter,
          percentChange: pct,
          fixedChange,
          stockValue,
          roundPrices,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedback({ type: "ok", text: json.message });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setFeedback({
          type: "err",
          text: json.message || "خطا در انجام عملیات دسته‌جمعی.",
        });
      }
    } catch {
      setFeedback({ type: "err", text: "خطا در ارتباط با سرور." });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border-2 border-[var(--accent-blue)]/35 shadow-xl space-y-4 text-xs font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
        <div>
          <h2 className="font-black text-sm sm:text-base text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚡</span> استودیوی تغییر دسته‌جمعی قیمت‌ها و موجودی انبار (Bulk Price & Stock Studio)
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            افزایش یا کاهش درصدی/ریالی قیمت کل محصولات یا یک دسته‌بندی خاص با رند شدن خودکار به هزار تومان
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { pct: 10, label: "+10% افزایش", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
            { pct: 5, label: "+5% افزایش", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
            { pct: -5, label: "-5% کاهش", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
            { pct: -10, label: "-10% کاهش", cls: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
          ].map((btn) => (
            <button
              key={btn.pct}
              type="button"
              disabled={processing}
              onClick={() => handleRunBulkOperation(btn.pct)}
              className={
                "px-3 py-1.5 rounded-xl border font-mono font-black text-[11px] cursor-pointer transition hover:opacity-90 " +
                btn.cls
              }
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={
            "p-3.5 rounded-2xl font-black border " +
            (feedback.type === "ok"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/15 border-rose-500/30 text-rose-400")
          }
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block mb-1 font-bold text-[var(--text-secondary)]">
            ۱. دامنه محصولات هدف:
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
          >
            <option value="all">🌟 تمام محصولات فروشگاه</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                📁 فقط دسته: {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-bold text-[var(--text-secondary)]">
            ۲. نوع عملیات دسته‌جمعی:
          </label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value as any)}
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
          >
            <option value="percent_price">📈 تغییر درصدی قیمت (%)</option>
            <option value="fixed_price">💵 تغییر مبلغ ثابت (تومان)</option>
            <option value="set_stock">📦 تنظیم دسته‌جمعی موجودی انبار</option>
            <option value="clear_discounts">🏷️ حذف تخفیف‌ها (بازگشت به قیمت پایه)</option>
          </select>
        </div>

        {operation === "percent_price" && (
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">
              درصد تغییر (مثبت یا منفی):
            </label>
            <input
              type="number"
              dir="ltr"
              value={percentChange}
              onChange={(e) => setPercentChange(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-center outline-none"
            />
          </div>
        )}

        {operation === "fixed_price" && (
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">
              مبلغ تغییر (تومان - مثبت/منفی):
            </label>
            <input
              type="number"
              dir="ltr"
              step={1000}
              value={fixedChange}
              onChange={(e) => setFixedChange(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-center outline-none"
            />
          </div>
        )}

        {operation === "set_stock" && (
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">
              تعداد موجودی جدید:
            </label>
            <input
              type="number"
              dir="ltr"
              min={0}
              value={stockValue}
              onChange={(e) => setStockValue(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-center outline-none"
            />
          </div>
        )}

        {operation === "clear_discounts" && (
          <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-amber-400 font-bold text-center">
            قیمت ویژه همه موارد انتخابی پاک می‌شود
          </div>
        )}

        <div className="flex items-center">
          <label className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between cursor-pointer font-bold">
            <span>رند به ۱۰۰۰ تومان</span>
            <input
              type="checkbox"
              checked={roundPrices}
              onChange={(e) => setRoundPrices(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent-blue)]"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={processing}
          onClick={() => handleRunBulkOperation()}
          className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer hover:opacity-90 transition disabled:opacity-50"
        >
          {processing ? "در حال اعمال..." : "🚀 اعمال فوری روی محصولات"}
        </button>
      </div>
    </div>
  );
}

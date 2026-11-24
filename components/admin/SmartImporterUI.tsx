// File Path: components/admin/SmartImporterUI.tsx
"use client";

import { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function SmartImporterUI() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [profitMargin, setProfitMargin] = useState<number>(20);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({
        text: "لطفاً ابتدا یک فایل (result.json) انتخاب کنید.",
        type: "error",
      });
      return;
    }

    soundEngine.playClick();
    setLoading(true);
    setMessage({ text: "در حال خواندن و پردازش فایل...", type: "success" });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsedData = JSON.parse(fileContent);
        parsedData.profitMargin = profitMargin;

        setMessage({
          text: "در حال ارتباط با هسته هوشمند ایمپورت...",
          type: "success",
        });

        const response = await fetch("/api/admin/import-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedData),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          soundEngine.playSuccess();
          setMessage({ text: "✅ " + result.message, type: "success" });
          setFile(null);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("products_updated"));
          }
        } else {
          setMessage({ text: "❌ خطا: " + result.message, type: "error" });
        }
      } catch {
        setMessage({
          text: "❌ خطای پردازش فایل: لطفاً مطمئن شوید فایل انتخابی JSON معتبر تلگرام است.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setMessage({ text: "❌ خطا در خواندن فایل از سیستم شما.", type: "error" });
      setLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div
      className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl text-[var(--text-primary)] font-sans space-y-5"
      dir="rtl"
    >
      <div>
        <h2 className="text-base sm:text-lg font-black text-[var(--accent-blue)]">
          📥 ایمپورت هوشمند کاتالوگ (Universal JSON Importer)
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          فایل{" "}
          <code className="bg-[var(--input-bg)] px-1.5 py-0.5 rounded font-mono">
            result.json
          </code>{" "}
          استخراج‌شده از تلگرام را آپلود کنید تا کالاها، قیمت‌ها و تصاویر متصل شوند.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="md:col-span-2">
          <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
            فایل دیتا (JSON):
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={loading}
            className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs file:ml-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[var(--accent-blue)] file:text-white cursor-pointer"
          />
        </div>
        <div>
          <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
            حاشیه سود (درصد):
          </label>
          <input
            type="number"
            min={0}
            max={300}
            value={profitMargin}
            onChange={(e) => setProfitMargin(Number(e.target.value))}
            disabled={loading}
            className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleUpload}
        disabled={loading || !file}
        className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white font-black text-xs transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? "⏳ در حال پردازش..." : "🚀 شروع ایمپورت هوشمند"}
      </button>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold ${
            message.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
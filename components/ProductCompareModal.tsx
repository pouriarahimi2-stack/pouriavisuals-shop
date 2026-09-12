"use client";

import React from "react";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

export interface CompareProductItem {
  id: string | number;
  title: string;
  price: number;
  image?: string;
  category?: string;
  specs?: Record<string, string>;
}

interface ProductCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: CompareProductItem[];
}

export default function ProductCompareModal({
  isOpen,
  onClose,
  products = [],
}: ProductCompareModalProps) {
  if (!isOpen || products.length === 0) return null;

  const specKeys = [
    { key: "resolution", label: "رزولوشن و تراکم پیکسل", defaultVal: "5K Retina (218 PPI)" },
    { key: "color_gamut", label: "پوشش گاموت رنگ", defaultVal: "99% DCI-P3 (10-bit)" },
    { key: "brightness", label: "روشنایی پایدار", defaultVal: "600 Nits SDR" },
    { key: "ports", label: "درگاه‌های تاندربولت", defaultVal: "Thunderbolt 3 / 4 (96W PD)" },
    { key: "calibration", label: "کالیبراسیون سخت‌افزاری", defaultVal: "جدول رنگ داخلی 3D LUT" },
    { key: "panel_type", label: "نوع پنل", defaultVal: "IPS True Tone" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-sans select-none animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-[var(--text-primary)]">
        {/* هدر مدال */}
        <header className="p-4 sm:p-6 border-b border-[var(--card-border)] flex items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-sm sm:text-base">جدول مقایسه فنی مانیتورهای استودیویی</h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">مقایسه دقیق پارامترهای حیاتی اصلاح رنگ و تدوین تصویر</p>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-2xl bg-[var(--input-bg)] hover:bg-rose-500 hover:text-white border border-[var(--card-border)] text-xs font-bold transition flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </header>

        {/* بدنه جدول مقایسه‌ای با اسکرول افقی */}
        <div className="flex-1 overflow-x-auto p-4 sm:p-6">
          <table className="w-full min-w-[550px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="p-3 text-right font-black text-[var(--text-secondary)] w-1/4">پارامتر سخت‌افزاری</th>
                {products.map((p) => (
                  <th key={p.id} className="p-3 text-center w-1/3">
                    <div className="space-y-2 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] p-1.5 flex items-center justify-center">
                        <img src={p.image || "/placeholder.png"} alt={p.title} className="w-full h-full object-contain" />
                      </div>
                      <span className="font-bold line-clamp-2 max-w-[160px]">{p.title}</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
                        {formatPrice(p.price)} ت
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {specKeys.map((item) => (
                <tr key={item.key} className="hover:bg-[var(--input-bg)]/40 transition">
                  <td className="p-3 font-bold text-[var(--text-secondary)]">{item.label}</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-center font-medium font-mono text-[11px] text-[var(--text-primary)]">
                      {(p.specs && p.specs[item.key]) || item.defaultVal}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="p-4 border-t border-[var(--card-border)] bg-[var(--input-bg)]/30 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer"
          >
            بستن جدول مقایسه
          </button>
        </footer>
      </div>
    </div>
  );
}

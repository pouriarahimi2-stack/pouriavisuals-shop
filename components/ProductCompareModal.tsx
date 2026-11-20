// File Path: components/ProductCompareModal.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

export interface CompareProductItem {
  id: string | number;
  title: string;
  price: number;
  discount_price?: number | null;
  image?: string;
  category?: string;
  brand?: string;
  warranty?: string;
  stock?: number;
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
  const dynamicSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    products.forEach((p) => {
      if (p.specs && typeof p.specs === "object") {
        Object.keys(p.specs).forEach((k) => {
          if (k && String(p.specs?.[k] || "").trim()) {
            keys.add(k);
          }
        });
      }
    });
    return Array.from(keys);
  }, [products]);

  if (!isOpen || products.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-sans select-text animate-fadeIn"
      dir="rtl"
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-[var(--text-primary)]">
        <header className="p-4 sm:p-6 border-b border-[var(--card-border)] flex items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-sm sm:text-base">
              جدول مقایسه فنی و تخصصی محصولات ({products.length.toLocaleString("fa-IR")} کالا)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              مقایسه دقیق مشخصات فنی، گارانتی، وضعیت موجودی و قیمت کالاها
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-2xl bg-[var(--input-bg)] hover:bg-rose-500 hover:text-white border border-[var(--card-border)] text-xs font-bold transition flex items-center justify-center cursor-pointer shrink-0"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-x-auto p-4 sm:p-6">
          <table className="w-full min-w-[540px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="p-3 text-right font-black text-[var(--text-secondary)] w-1/4">
                  مشخصه / ویژگی
                </th>
                {products.map((p) => {
                  const effectivePrice =
                    p.discount_price && Number(p.discount_price) > 0
                      ? Number(p.discount_price)
                      : Number(p.price || 0);
                  return (
                    <th key={p.id} className="p-3 text-center">
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] p-1.5 flex items-center justify-center">
                          <img
                            src={p.image || "/placeholder.png"}
                            alt={p.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <Link
                          href={`/products/${p.id}`}
                          onClick={onClose}
                          className="font-bold line-clamp-2 max-w-[180px] hover:text-[var(--accent-blue)] transition"
                        >
                          {p.title}
                        </Link>
                        <span
                          className="font-mono font-black text-emerald-500 whitespace-nowrap"
                          suppressHydrationWarning
                        >
                          {formatPrice(effectivePrice)} تومان
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              <tr className="hover:bg-[var(--input-bg)]/40 transition">
                <td className="p-3 font-bold text-[var(--text-secondary)]">دسته‌بندی</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-center font-bold">
                    {p.category || "کالای دیجیتال"}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-[var(--input-bg)]/40 transition">
                <td className="p-3 font-bold text-[var(--text-secondary)]">برند / سازنده</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-center font-bold">
                    {p.brand || "—"}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-[var(--input-bg)]/40 transition">
                <td className="p-3 font-bold text-[var(--text-secondary)]">گارانتی و اصالت</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-center font-bold text-sky-400">
                    {p.warranty || "ضمانت اصالت طلایی"}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-[var(--input-bg)]/40 transition">
                <td className="p-3 font-bold text-[var(--text-secondary)]">وضعیت انبار</td>
                {products.map((p) => {
                  const inStock = p.stock === undefined || Number(p.stock) > 0;
                  return (
                    <td key={p.id} className="p-3 text-center font-black">
                      <span
                        className={
                          inStock ? "text-emerald-500" : "text-rose-500"
                        }
                      >
                        {inStock ? "موجود در انبار ✓" : "ناموجود"}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {dynamicSpecKeys.map((specKey) => (
                <tr key={specKey} className="hover:bg-[var(--input-bg)]/40 transition">
                  <td className="p-3 font-bold text-[var(--text-secondary)]">
                    {specKey}
                  </td>
                  {products.map((p) => (
                    <td
                      key={p.id}
                      className="p-3 text-center font-medium text-[11px] text-[var(--text-primary)]"
                    >
                      {(p.specs && p.specs[specKey]) || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="p-4 border-t border-[var(--card-border)] bg-[var(--input-bg)]/30 flex justify-end">
          <button
            type="button"
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
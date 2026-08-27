// File Path: components/ProductComparisonModal.tsx
"use client";

import React from "react";
import { Product } from "@/services/productService";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";

interface ProductComparisonModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveProduct: (id: string) => void;
}

export default function ProductComparisonModal({
  products,
  isOpen,
  onClose,
  onRemoveProduct,
}: ProductComparisonModalProps) {
  const { addToCart } = useCart();

  if (!isOpen || products.length === 0) return null;

  // استخراج تمام کلیدهای مشخصات فنی از تمام محصولات انتخاب‌شده
  const allSpecKeys = Array.from(
    new Set(products.flatMap((p) => Object.keys(p.specs || {})))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl font-sans select-none animate-fadeIn text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="w-full max-w-5xl max-h-[92vh] rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* سربرگ مقایسه */}
        <header className="p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] flex items-center justify-center text-xl font-black shadow-sm">
              ⚖️
            </span>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                ماتریس مقایسه فنی و تخصصی کالاها (Side-by-Side Comparison)
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                مقایسه رزولوشن، گاموت رنگی، چیپست و قیمت {products.length} محصول منتخب
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer"
          >
            ✕
          </button>
        </header>

        {/* جدول مقایسه ساید‌بای‌ساید */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-5 sm:p-6 text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="p-3 text-right font-black text-[var(--text-secondary)] w-40">مشخصات و کالا</th>
                {products.map((p) => (
                  <th key={p.id} className="p-3 text-center min-w-[220px]">
                    <div className="space-y-2.5 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] relative">
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          onRemoveProduct(p.id);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center font-bold text-[10px] transition cursor-pointer"
                        title="حذف از مقایسه"
                      >
                        ✕
                      </button>

                      <img
                        src={p.images?.[0] || p.image || "/placeholder.png"}
                        alt={p.title}
                        className="w-24 h-24 object-contain mx-auto rounded-xl p-1 bg-white/5"
                      />
                      <h4 className="font-extrabold text-xs text-[var(--text-primary)] line-clamp-2 leading-snug">
                        {p.title || p.name}
                      </h4>
                      <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {Number(p.discountPrice || p.price || 0).toLocaleString("fa-IR")} تومان
                      </div>
                      <button
                        onClick={() => {
                          soundEngine.playAddToCart();
                          addToCart({
                            id: p.id,
                            title: p.title,
                            price: p.discountPrice || p.price,
                            image: p.images?.[0] || p.image,
                          });
                        }}
                        className="w-full py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-[11px] shadow-md hover:opacity-90 transition cursor-pointer"
                      >
                        🛒 افزودن به سبد
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)] font-medium">
              <tr className="bg-black/5 dark:bg-white/5">
                <td className="p-3.5 font-black text-[var(--accent-blue)]">دسته‌بندی و اصالت</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3.5 text-center font-bold">
                    {p.category || "تجهیزات تخصصی"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-black text-[var(--text-secondary)]">وضعیت موجودی انبار</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3.5 text-center font-bold">
                    {p.isAvailable !== false && (p.stock ?? 0) > 0 ? (
                      <span className="text-emerald-500 font-bold">موجود در انبار ✓</span>
                    ) : (
                      <span className="text-rose-500 font-bold">ناموجود ✕</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-black text-[var(--text-secondary)]">گارانتی و خدمات</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3.5 text-center font-medium leading-relaxed">
                    {p.warranty || "۱۸ ماه گارانتی معتبر اصالت"}
                  </td>
                ))}
              </tr>

              {/* رندرر مشخصات فنی دقیق ساید‌بای‌ساید */}
              {allSpecKeys.map((specKey) => (
                <tr key={specKey} className="hover:bg-[var(--input-bg)] transition">
                  <td className="p-3.5 font-bold text-[var(--text-secondary)]">{specKey}</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3.5 text-center font-mono font-bold text-[var(--text-primary)]">
                      {p.specs?.[specKey] || "---"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* فوتر مدال */}
        <footer className="p-4 border-t border-[var(--card-border)] flex justify-end bg-[var(--input-bg)]">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer"
          >
            بستن جدول مقایسه
          </button>
        </footer>
      </div>
    </div>
  );
}
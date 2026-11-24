// File Path: context/CompareContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { soundEngine } from "@/lib/soundEngine";
import ProductComparisonModal from "@/components/ProductComparisonModal";

const COMPARE_STORAGE_KEY = "axon_compare_products_v1";
const MAX_COMPARE_ITEMS = 4;

export interface ComparableProduct {
  id: string | number;
  title?: string;
  name?: string;
  price: number;
  discount_price?: number | null;
  discountPrice?: number | null;
  image?: string | null;
  image_url?: string | null;
  images?: string[];
  category?: string;
  brand?: string;
  warranty?: string;
  stock?: number;
  is_available?: boolean;
  isAvailable?: boolean;
  specs?: Record<string, any>;
  specs_jsonb?: Record<string, any>;
}

interface CompareContextType {
  compareItems: ComparableProduct[];
  isCompareOpen: boolean;
  isInCompare: (id: string | number) => boolean;
  toggleCompareProduct: (product: ComparableProduct) => void;
  removeFromCompare: (id: string | number) => void;
  clearCompare: () => void;
  openCompareModal: () => void;
  closeCompareModal: () => void;
}

const CompareContext = createContext<CompareContextType>({
  compareItems: [],
  isCompareOpen: false,
  isInCompare: () => false,
  toggleCompareProduct: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
  openCompareModal: () => {},
  closeCompareModal: () => {},
});

export function useCompare() {
  return useContext(CompareContext);
}

function resolveThumb(p: ComparableProduct): string {
  if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) {
    return p.images[0];
  }
  if (p.image_url && String(p.image_url).trim()) return String(p.image_url);
  if (p.image && String(p.image).trim()) return String(p.image);
  return "/placeholder.png";
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareItems, setCompareItems] = useState<ComparableProduct[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [limitToast, setLimitToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompareItems(parsed.slice(0, MAX_COMPARE_ITEMS));
        }
      }
    } catch {}
  }, []);

  const persistItems = useCallback((next: ComparableProduct[]) => {
    setCompareItems(next);
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const isInCompare = useCallback(
    (id: string | number) =>
      compareItems.some((item) => String(item.id) === String(id)),
    [compareItems]
  );

  const toggleCompareProduct = useCallback(
    (product: ComparableProduct) => {
      const targetId = String(product.id);
      const exists = compareItems.some((i) => String(i.id) === targetId);

      if (exists) {
        soundEngine.playClick();
        const filtered = compareItems.filter((i) => String(i.id) !== targetId);
        persistItems(filtered);
        if (filtered.length === 0) setIsCompareOpen(false);
        return;
      }

      if (compareItems.length >= MAX_COMPARE_ITEMS) {
        soundEngine.playClick();
        setLimitToast(
          `حداکثر ${MAX_COMPARE_ITEMS.toLocaleString("fa-IR")} کالا را می‌توان هم‌زمان مقایسه کرد.`
        );
        setTimeout(() => setLimitToast(null), 3000);
        return;
      }

      soundEngine.playSuccess();
      const normalizedItem: ComparableProduct = {
        ...product,
        id: product.id,
        title: product.title || product.name || "کالای دیجیتال",
        image: resolveThumb(product),
        specs:
          product.specs && typeof product.specs === "object"
            ? product.specs
            : product.specs_jsonb && typeof product.specs_jsonb === "object"
            ? product.specs_jsonb
            : {},
      };
      persistItems([...compareItems, normalizedItem]);
    },
    [compareItems, persistItems]
  );

  const removeFromCompare = useCallback(
    (id: string | number) => {
      const filtered = compareItems.filter(
        (i) => String(i.id) !== String(id)
      );
      persistItems(filtered);
      if (filtered.length === 0) setIsCompareOpen(false);
    },
    [compareItems, persistItems]
  );

  const clearCompare = useCallback(() => {
    soundEngine.playClick();
    persistItems([]);
    setIsCompareOpen(false);
  }, [persistItems]);

  const openCompareModal = useCallback(() => {
    if (compareItems.length === 0) return;
    soundEngine.playClick();
    setIsCompareOpen(true);
  }, [compareItems.length]);

  const closeCompareModal = useCallback(() => {
    setIsCompareOpen(false);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        isCompareOpen,
        isInCompare,
        toggleCompareProduct,
        removeFromCompare,
        clearCompare,
        openCompareModal,
        closeCompareModal,
      }}
    >
      {children}

      {limitToast && (
        <div
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[120] px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs shadow-2xl animate-fadeIn font-sans"
          dir="rtl"
        >
          ⚠️ {limitToast}
        </div>
      )}

      {/* نوار شناور مقایسه فنی در پایین صفحه */}
      {compareItems.length > 0 && !isCompareOpen && (
        <div
          className="fixed bottom-16 md:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl px-3.5 py-2.5 rounded-3xl bg-[var(--modal-bg)]/95 backdrop-blur-2xl border-2 border-[var(--accent-blue)]/50 shadow-2xl flex items-center justify-between gap-3 font-sans animate-fadeIn"
          dir="rtl"
        >
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs font-black text-[var(--accent-blue)] whitespace-nowrap shrink-0 flex items-center gap-1">
              <span>⚖️</span>
              <span>مقایسه ({compareItems.length.toLocaleString("fa-IR")}/{MAX_COMPARE_ITEMS.toLocaleString("fa-IR")}):</span>
            </span>

            <div className="flex items-center gap-1.5">
              {compareItems.map((item) => (
                <div
                  key={item.id}
                  className="relative group w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] p-1 shrink-0"
                  title={item.title || item.name}
                >
                  <img
                    src={resolveThumb(item)}
                    alt={item.title || ""}
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromCompare(item.id)}
                    aria-label="حذف از مقایسه"
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={openCompareModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[var(--accent-blue)] to-indigo-600 text-white font-black text-[11px] shadow-md hover:opacity-90 transition cursor-pointer whitespace-nowrap"
            >
              مشاهده جدول مقایسه ←
            </button>
            <button
              type="button"
              onClick={clearCompare}
              className="px-2.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-rose-500 text-[var(--text-secondary)] hover:text-rose-500 font-bold text-[10px] transition cursor-pointer"
              title="پاکسازی لیست مقایسه"
            >
              حذف همه
            </button>
          </div>
        </div>
      )}

      <ProductComparisonModal
        products={compareItems as any[]}
        isOpen={isCompareOpen}
        onClose={closeCompareModal}
        onRemoveProduct={(id) => removeFromCompare(id)}
      />
    </CompareContext.Provider>
  );
}
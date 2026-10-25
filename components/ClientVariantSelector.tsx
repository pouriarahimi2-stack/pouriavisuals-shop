"use client";
import { useState } from "react";

interface Variant {
  id: string;
  name: string;
  price_adjustment: number;
  stock: number;
}

interface ClientVariantSelectorProps {
  variants: Variant[];
  basePrice: number;
  onVariantSelect: (variant: Variant | null) => void;
}

export default function ClientVariantSelector({ variants, basePrice, onVariantSelect }: ClientVariantSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!variants || variants.length === 0) return null;

  const handleSelect = (variant: Variant) => {
    if (variant.stock <= 0) return; // غیرفعال بودن انتخاب برای ناموجود
    const newId = selectedId === variant.id ? null : variant.id;
    setSelectedId(newId);
    onVariantSelect(newId ? variant : null);
  };

  return (
    <div className="my-6">
      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">انتخاب تنوع (رنگ / ظرفیت):</h4>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = selectedId === v.id;
          const isOutOfStock = v.stock <= 0;
          const finalPrice = basePrice + Number(v.price_adjustment);
          
          return (
            <button
              key={v.id}
              onClick={() => handleSelect(v)}
              disabled={isOutOfStock}
              className={`flex flex-col items-center justify-center border-2 rounded-xl px-4 py-2 transition-all ${
                isOutOfStock 
                  ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800' 
                  : isSelected 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 hover:border-blue-300 dark:border-gray-600'
              }`}
            >
              <span className={`text-xs font-bold ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {v.name}
              </span>
              {!isOutOfStock && v.price_adjustment !== 0 && (
                <span className="text-[10px] text-gray-500 mt-1">
                  {new Intl.NumberFormat('fa-IR').format(finalPrice)} تومان
                </span>
              )}
              {isOutOfStock && <span className="text-[9px] text-red-400 mt-1">ناموجود</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";

interface FilterSidebarProps {
  categories: string[];
  brands: string[];
  maxPrice: number;
  onFilterChange: (filters: any) => void;
}

export default function FacetedFilterSidebar({ categories, brands, maxPrice, onFilterChange }: FilterSidebarProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice || 100000000]);

  useEffect(() => {
    onFilterChange({
      categories: selectedCategories,
      brands: selectedBrands,
      minPrice: priceRange[0],
      maxPrice: priceRange[1]
    });
  }, [selectedCategories, selectedBrands, priceRange]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm sticky top-24">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white">فیلترها</h3>
        {(selectedCategories.length > 0 || selectedBrands.length > 0) && (
          <button 
            onClick={() => { setSelectedCategories([]); setSelectedBrands([]); setPriceRange([0, maxPrice]); }}
            className="text-xs text-red-500 hover:text-red-600"
          >
            حذف فیلترها
          </button>
        )}
      </div>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">دسته‌بندی‌ها</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {categories.map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="peer appearance-none w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 checked:bg-blue-600 checked:border-blue-600 transition-colors"
                  />
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition-colors">{cat}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Brands Filter */}
      {brands.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">برندها</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {brands.map(brand => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <input 
                    type="checkbox" 
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="peer appearance-none w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 checked:bg-blue-600 checked:border-blue-600 transition-colors"
                  />
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition-colors">{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">محدوده قیمت</h4>
        <div className="px-2">
          <input 
            type="range" 
            min="0" 
            max={maxPrice || 100000000} 
            step="50000"
            value={priceRange[1]} 
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500 font-medium">
            <span>0</span>
            <span>{new Intl.NumberFormat('fa-IR').format(priceRange[1])} تومان</span>
          </div>
        </div>
      </div>
    </div>
  );
}

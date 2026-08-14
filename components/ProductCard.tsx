"use client";

import Link from "next/link";

interface ProductProps {
  id: string;
  title: string;
  category: string;
  price: string;
  image: string;
  tag?: string;
}

export default function ProductCard({ id, title, category, price, image, tag }: ProductProps) {
  return (
    <div className="group relative rounded-3xl p-6 liquid-glass-card flex flex-col justify-between overflow-hidden">
      
      {/* انعکاس شیشه‌ای نور بالای کارت */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/20 dark:bg-white/5 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />

      {/* لینک کل کارت */}
      <Link href={`/products/${id}`} className="absolute inset-0 z-10" aria-label={title} />

      {/* برچسب ویژه شیشه‌ای */}
      {tag && (
        <span className="absolute top-4 right-4 bg-[var(--accent-blue)]/90 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-1.5 rounded-full z-20 shadow-lg pointer-events-none">
          {tag}
        </span>
      )}

      {/* تصویر محصول با انیمیشن float */}
      <div className="w-full h-52 my-2 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-500 ease-out pointer-events-none filter drop-shadow-xl">
        {image}
      </div>

      {/* اطلاعات محصول */}
      <div className="pointer-events-none z-20">
        <span className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
          {category}
        </span>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-blue)] transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--glass-border)]">
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-secondary)]">قیمت</span>
            <span className="text-base font-extrabold text-[var(--text-primary)]">
              {price} <span className="text-xs font-normal text-[var(--text-secondary)]">تومان</span>
            </span>
          </div>
          <span className="bg-[var(--accent-blue)] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-md group-hover:shadow-lg transition">
            مشاهده و خرید
          </span>
        </div>
      </div>
    </div>
  );
}
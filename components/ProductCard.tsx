'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';

export default function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const router = useRouter();

  const handleQuickBuy = () => {
    addToCart(product);
    router.push('/checkout');
  };

  const title = product.title || product.title_fa || product.name || 'محصول بدون عنوان';
  const price = Number(product.price) || 0;
  const image = product.image_url || product.image || (Array.isArray(product.images) && product.images[0]) || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=60';
  const category = product.category || product.category_fa || 'تجهیزات تخصصی';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="relative w-full h-52 bg-slate-100 dark:bg-slate-800/60 rounded-2xl overflow-hidden mb-4">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
          موجود در انبار
        </span>
        <span className="absolute top-3 left-3 bg-slate-900/40 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full">
          {category}
        </span>
      </div>

      <div className="flex flex-col flex-grow">
        <Link href={`/products/${product.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base line-clamp-2 leading-relaxed mb-2">
            {title}
          </h3>
        </Link>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
          {product.description || 'تجهیزات مرجع مانیتورینگ و کالیبراسیون تخصصی تصویر'}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">قیمت:</span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400">
              {price.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </span>
          </div>

          <Link
            href={`/products/${product.id}`}
            className="text-[11px] font-black text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition flex items-center gap-1"
          >
            مشخصات محصول 🔍
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => addToCart(product)}
            className="py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700"
          >
            <span>🛒 سبد خرید</span>
          </button>

          <button
            onClick={handleQuickBuy}
            className="py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <span>⚡ خرید سریع</span>
          </button>
        </div>
      </div>
    </div>
  );
}
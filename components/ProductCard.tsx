"use client";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export default function ProductCard({ product }: { product: any }) {
  const price = product.price || 0;
  const discountPrice = product.discount_price || product.discountPrice || 0;
  const finalPrice = discountPrice > 0 ? discountPrice : price;
  const imageUrl = product.image_url || product.image || (product.images && product.images[0]) || "/placeholder.png";

  return (
    <div className="flex flex-col bg-white dark:bg-[#161d2b] rounded-[1.2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all h-full group w-full">
      <Link href={`/products/${product.slug || product.id}`} onClick={() => soundEngine?.playClick?.()} className="relative aspect-square p-2 bg-gray-50/50 dark:bg-black/20 flex justify-center items-center w-full">
        <img src={imageUrl} alt={product.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2" />
      </Link>
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="flex-1">
          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md inline-block mb-1">
            {product.category || "دیجیتال"}
          </span>
          <Link href={`/products/${product.slug || product.id}`} onClick={() => soundEngine?.playClick?.()}>
            <h3 className="text-[11px] sm:text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug hover:text-blue-500 transition-colors">
              {product.title}
            </h3>
          </Link>
        </div>
        <div className="mt-auto pt-2 border-t border-gray-50 dark:border-gray-800 flex flex-col gap-1.5">
          <div className="flex flex-col justify-end h-9">
            {discountPrice > 0 && discountPrice < price && (
              <span className="text-[9px] text-gray-400 line-through block text-left w-full">{new Intl.NumberFormat('fa-IR').format(price)}</span>
            )}
            <span className="text-xs sm:text-sm font-black text-emerald-500 text-left w-full" dir="ltr">
              {new Intl.NumberFormat('fa-IR').format(finalPrice)} <span className="text-[9px] font-normal">تومان</span>
            </span>
          </div>
          <Link href={`/products/${product.slug || product.id}`} onClick={() => soundEngine?.playClick?.()} className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-2 rounded-xl transition-colors mt-1">
            مشاهده و خرید
          </Link>
        </div>
      </div>
    </div>
  );
}
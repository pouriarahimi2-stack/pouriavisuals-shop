"use client";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export default function ProductCard({ product }: { product: any }) {
  const price = product.price || 0;
  const discountPrice = product.discount_price || product.discountPrice || 0;
  const imageUrl = product.image_url || product.image || (product.images && product.images[0]) || (product.media_gallery && product.media_gallery[0]?.url) || "/placeholder.png";

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all h-full group">
      <Link href={`/products/${product.slug || product.id}`} className="relative aspect-square p-2 md:p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-center items-center">
        <img src={imageUrl} alt={product.title || product.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
      </Link>
      
      <div className="p-3 md:p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <span className="text-[9px] md:text-[11px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md">
            {product.category || "عمومی"}
          </span>
          <Link href={`/products/${product.slug || product.id}`}>
            <h3 className="mt-2.5 text-[11px] md:text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug hover:text-blue-600 transition-colors">
              {product.title || product.name}
            </h3>
          </Link>
        </div>
        
        <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-gray-50 dark:border-gray-700/50">
          <div className="flex flex-col h-10 justify-center">
            {discountPrice > 0 && discountPrice < price ? (
              <>
                <span className="text-[10px] text-gray-400 line-through">{new Intl.NumberFormat('fa-IR').format(price)}</span>
                <span className="text-xs md:text-sm font-black text-green-600">{new Intl.NumberFormat('fa-IR').format(discountPrice)} تومان</span>
              </>
            ) : (
              <span className="text-xs md:text-sm font-black text-green-600">{new Intl.NumberFormat('fa-IR').format(price)} تومان</span>
            )}
          </div>
          <Link 
            href={`/products/${product.slug || product.id}`} 
            onClick={() => soundEngine?.playClick?.()} 
            className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-[10px] md:text-xs font-bold py-2 md:py-2.5 rounded-xl transition-colors"
          >
            مشاهده و خرید
          </Link>
        </div>
      </div>
    </div>
  );
}

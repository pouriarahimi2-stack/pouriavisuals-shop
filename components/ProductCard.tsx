"use client";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export default function ProductCard({ product }: { product: any }) {
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discount_price || product.discountPrice || 0);
  const finalPrice = discountPrice > 0 && discountPrice < price ? discountPrice : price;
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  
  const imageUrl = product.image_url || product.image || (product.images && product.images[0]) || "/placeholder.png";
  const isOutOfStock = Number(product.stock || 0) <= 0 || product.is_available === false;

  return (
    <Link 
      href={`/products/${product.slug || product.id}`} 
      onClick={() => soundEngine?.playClick?.()} 
      className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 h-full group w-full relative"
      dir="rtl"
    >
      {(hasDiscount || isOutOfStock) && (
          <div className="absolute top-2 right-2 z-10">
              {isOutOfStock ? (
                  <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded-lg">ناموجود</span>
              ) : (
                  <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm">تخفیف</span>
              )}
          </div>
      )}

      <div className="relative aspect-square p-4 bg-white flex justify-center items-center w-full">
        <img 
          src={imageUrl} 
          alt={product.title} 
          loading="lazy"
          className={`w-full h-full object-contain transition-transform duration-500 ${isOutOfStock ? 'opacity-40 grayscale' : 'group-hover:scale-105'}`} 
        />
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2 bg-slate-50/50">
        <div className="flex-1">
          <h3 className="text-[11px] sm:text-xs font-black text-slate-800 line-clamp-2 leading-relaxed group-hover:text-sky-600 transition-colors">
            {product.title}
          </h3>
        </div>
        
        <div className="mt-auto pt-2 border-t border-slate-200/60 flex flex-col items-start gap-0.5">
          <div className="h-3 flex items-end w-full">
            {hasDiscount && !isOutOfStock && (
              <span className="text-[9px] text-slate-400 line-through font-bold">{price.toLocaleString('fa-IR')}</span>
            )}
          </div>
          <div className="flex items-center gap-1 w-full">
            <span className={`text-xs sm:text-sm font-black ${isOutOfStock ? 'text-slate-400' : 'text-slate-900'}`}>
              {finalPrice.toLocaleString('fa-IR')}
            </span>
            <span className={`text-[9px] font-bold ${isOutOfStock ? 'text-slate-300' : 'text-slate-500'}`}>تومان</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
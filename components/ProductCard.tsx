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
      className="flex flex-col bg-white rounded-3xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500 h-full group w-full border border-slate-100 relative"
      dir="rtl"
    >
      {/* برچسب‌های کالا */}
      {(hasDiscount || isOutOfStock) && (
          <div className="absolute top-3 right-3 z-10">
              {isOutOfStock ? (
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-full shadow-sm border border-slate-200/50">ناموجود</span>
              ) : (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">فروش ویژه</span>
              )}
          </div>
      )}

      {/* تصویر کالا */}
      <div className="relative aspect-square p-6 bg-white flex justify-center items-center w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={product.title} 
          className={`w-full h-full object-contain transition-transform duration-700 ease-out ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} 
        />
      </div>

      {/* اطلاعات کالا */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3 bg-slate-50/50">
        <div className="flex-1">
          <h3 className="text-[11px] sm:text-xs font-bold text-slate-700 line-clamp-2 leading-relaxed group-hover:text-black transition-colors">
            {product.title}
          </h3>
        </div>
        
        <div className="mt-auto flex flex-col gap-0.5 items-start">
          <div className="h-4 flex items-end">
            {hasDiscount && !isOutOfStock && (
              <span className="text-[10px] text-slate-400 line-through decoration-rose-400/50 font-bold">
                {price.toLocaleString('fa-IR')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-sm sm:text-base font-black tracking-tight ${isOutOfStock ? 'text-slate-400' : 'text-slate-900'}`}>
              {finalPrice.toLocaleString('fa-IR')}
            </span>
            <span className={`text-[9px] font-bold ${isOutOfStock ? 'text-slate-300' : 'text-slate-500'}`}>تومان</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
"use client";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }: { product: any }) {
  const { addToCart, setIsCartOpen } = useCart() as any;
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discount_price || product.discountPrice || 0);
  const finalPrice = discountPrice > 0 && discountPrice < price ? discountPrice : price;
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  
  const imageUrl = product.image_url || product.image || (product.images && product.images[0]) || "/placeholder.png";
  const isOutOfStock = Number(product.stock || 0) <= 0 || product.is_available === false;

  const handleFastBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      soundEngine?.playClick?.();
      addToCart({ id: product.id, title: product.title, price: finalPrice, quantity: 1, image: imageUrl });
      setIsCartOpen(true);
    }
  };

  return (
    <Link 
      href={`/products/${product.slug || product.id}`} 
      onClick={() => soundEngine?.playClick?.()} 
      className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full group w-full relative border border-slate-100/50"
      dir="rtl"
    >
      {/* لیبل تخفیف و ناموجود */}
      {(hasDiscount || isOutOfStock) && (
          <div className="absolute top-2 right-2 z-10">
              {isOutOfStock ? (
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded">ناموجود</span>
              ) : (
                  <span className="bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">%تخفیف</span>
              )}
          </div>
      )}

      {/* تصویر کالا */}
      <div className="relative w-full aspect-square p-2 bg-white flex justify-center items-center overflow-hidden">
        <img 
          src={imageUrl} 
          alt={product.title} 
          loading="lazy"
          className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} 
        />
      </div>

      {/* اطلاعات کالا */}
      <div className="p-3 flex flex-col flex-1 bg-white">
        <div className="flex-1 mb-2">
          <h3 className="text-xs text-slate-800 line-clamp-2 leading-relaxed font-medium">
            {product.title}
          </h3>
        </div>
        
        <div className="mt-auto flex flex-col items-end w-full">
          <div className="h-4 flex items-end justify-start w-full">
            {hasDiscount && !isOutOfStock && (
              <span className="text-[11px] text-slate-400 line-through">{price.toLocaleString('fa-IR')}</span>
            )}
          </div>
          
          <div className="flex items-center justify-between w-full mt-1">
            {/* دکمه + مشابه دیجی‌کالا */}
            <button 
              onClick={handleFastBuy} 
              disabled={isOutOfStock}
              className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 flex shrink-0 items-center justify-center hover:bg-rose-500 hover:text-white transition-colors disabled:bg-slate-50 disabled:text-slate-300 cursor-pointer"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>
            <div className="flex items-center gap-1">
              <span className={`text-sm sm:text-base font-bold tracking-tight ${isOutOfStock ? 'text-slate-400' : 'text-slate-800'}`}>
                {finalPrice.toLocaleString('fa-IR')}
              </span>
              <span className={`text-[9px] font-bold ${isOutOfStock ? 'text-slate-300' : 'text-slate-800'}`}>تومان</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
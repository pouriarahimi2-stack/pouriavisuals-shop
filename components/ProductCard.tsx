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
      className="flex flex-col bg-white/70 dark:bg-[#161d2b]/70 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300 h-full group w-full relative"
      dir="rtl"
    >
      {(hasDiscount || isOutOfStock) && (
          <div className="absolute top-3 right-3 z-10">
              {isOutOfStock ? (
                  <span className="bg-slate-800/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">ناموجود</span>
              ) : (
                  <span className="bg-rose-500/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">% تخفیف</span>
              )}
          </div>
      )}

      <div className="relative w-full aspect-square p-4 bg-transparent flex justify-center items-center overflow-hidden">
        <img src={imageUrl} alt={product.title} loading="lazy" className={`w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 ${isOutOfStock ? 'opacity-40 grayscale' : 'group-hover:scale-105'}`} />
      </div>

      <div className="p-4 flex flex-col flex-1 bg-white/40 dark:bg-black/20 backdrop-blur-md border-t border-white/30 dark:border-white/5">
        <div className="flex-1 mb-3">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-relaxed group-hover:text-sky-500 transition-colors">
            {product.title}
          </h3>
        </div>
        <div className="mt-auto flex flex-col items-end w-full gap-1">
          <div className="h-4 flex items-end justify-start w-full">
            {hasDiscount && !isOutOfStock && <span className="text-[11px] text-slate-400 line-through font-bold">{price.toLocaleString('fa-IR')}</span>}
          </div>
          <div className="flex items-center justify-between w-full">
             <button onClick={handleFastBuy} disabled={isOutOfStock} className="w-10 h-10 flex shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/50 text-sky-500 shadow-sm hover:bg-sky-500 hover:text-white transition-all disabled:opacity-50 cursor-pointer">
               <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             </button>
             <div className="flex flex-col items-end">
               <span className={`text-sm sm:text-base font-black tracking-tight ${isOutOfStock ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>{finalPrice.toLocaleString('fa-IR')}</span>
               <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-slate-300' : 'text-slate-500'}`}>تومان</span>
             </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
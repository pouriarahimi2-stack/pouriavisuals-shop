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
    e.preventDefault(); e.stopPropagation();
    if (!isOutOfStock) {
      soundEngine?.playClick?.();
      addToCart({ id: product.id, title: product.title, price: finalPrice, quantity: 1, image: imageUrl });
      setIsCartOpen(true);
    }
  };

  return (
    <Link href={`/products/${product.slug || product.id}`} onClick={() => soundEngine?.playClick?.()} className="flex flex-col bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 w-full relative" dir="rtl">
      {(hasDiscount || isOutOfStock) && (
          <div className="absolute top-3 right-3 z-10">
              {isOutOfStock ? <span className="bg-slate-800/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm">ناموجود</span> : <span className="bg-rose-500/90 backdrop-blur-md text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-sm">% تخفیف</span>}
          </div>
      )}
      <div className="relative w-full aspect-square p-4 flex justify-center items-center overflow-hidden">
        <img src={imageUrl} alt={product.title} loading="lazy" className={`w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 ${isOutOfStock ? 'opacity-40 grayscale' : 'hover:scale-105'}`} />
      </div>
      <div className="p-4 flex flex-col flex-1 bg-white/40 dark:bg-black/20 backdrop-blur-md border-t border-white/30 dark:border-white/5">
        <div className="flex-1 mb-3">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-relaxed group-hover:text-blue-500 transition-colors">{product.title}</h3>
        </div>
        <div className="mt-auto flex flex-col items-end w-full gap-1">
          <div className="h-4 flex items-end justify-start w-full">
            {hasDiscount && !isOutOfStock && <span className="text-[11px] text-slate-400 line-through font-bold">{price.toLocaleString('fa-IR')}</span>}
          </div>
          <div className="flex items-center justify-between w-full">
             <button onClick={handleFastBuy} disabled={isOutOfStock} className="w-10 h-10 flex shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/5 text-blue-600 dark:text-blue-400 shadow-sm hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
               <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
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
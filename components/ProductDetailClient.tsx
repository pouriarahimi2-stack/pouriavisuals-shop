"use client";
import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { ShieldCheck, Truck } from "lucide-react";
import ProductReviews from "@/components/ProductReviews";

export default function ProductDetailClient({ initialProduct, productId }: { initialProduct?: any; productId?: string }) {
  const { addToCart, setIsCartOpen } = useCart() as any;
  const [product] = useState(initialProduct || {});
  const [selectedImg, setSelectedImg] = useState(0);

  if (!product.id) return <div className="min-h-screen flex items-center justify-center font-bold">کالا یافت نشد.</div>;

  let rawDesc = String(product.description || "");
  let extractedImages = [];
  if (rawDesc.includes("MEDIA_METADATA")) {
    const parts = rawDesc.split(/<!--MEDIA_METADATA:|MEDIA_METADATA:/i);
    rawDesc = parts[0] ? parts[0].trim() : "";
    if (parts[1]) {
      try { const meta = JSON.parse(parts[1].replace(/-->[\s\S]*$/g, "").trim()); if (Array.isArray(meta.images)) extractedImages = meta.images; } catch (e) {}
    }
  }

  const allImages = [product.image_url || product.image || "/placeholder.png", ...(product.images || []), ...extractedImages].filter((v, i, a) => a.indexOf(v) === i);
  const currentPrice = Number(product.discount_price || product.price || 0);
  const oldPrice = Number(product.price || 0);
  const hasDiscount = currentPrice > 0 && currentPrice < oldPrice;
  const isAvailable = Number(product.stock || 0) > 0 && product.is_available !== false;
  
  const warrantyText = product.warranty || "";
  let shippingText = "";
  if (product.shipping_type === "post") shippingText = "ارسال فقط با پست پیشتاز";
  else if (product.shipping_type === "tipax") shippingText = "ارسال با تیپاکس (پس‌کرایه)";
  else if (product.shipping_type === "both") shippingText = "ارسال سراسری (پست / تیپاکس)";

  const handleBuy = () => { if (!isAvailable) return; soundEngine?.playClick?.(); addToCart({ id: product.id, title: product.title, price: currentPrice, quantity: 1, image: allImages[0] }); setIsCartOpen(true); };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white font-sans pb-32 lg:pb-10" dir="rtl">
      <div className="max-w-6xl mx-auto lg:mt-6 bg-white/70 dark:bg-black/40 backdrop-blur-2xl lg:rounded-[3rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border-y lg:border border-white/50 dark:border-white/10 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          
          <div className="w-full lg:w-5/12 p-6 flex flex-col gap-4 border-b lg:border-b-0 lg:border-l border-white/50 dark:border-white/10 relative">
             {hasDiscount && <span className="absolute top-6 right-6 bg-rose-500/90 backdrop-blur-md text-white text-xs font-black px-3 py-1.5 rounded-full shadow-sm z-10">فروش ویژه</span>}
             <div className="w-full aspect-square flex items-center justify-center bg-transparent">
                 <img src={allImages[selectedImg]} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt={product.title} />
             </div>
             {allImages.length > 1 && (
               <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar justify-center">
                 {allImages.map((img, idx) => (
                   <button key={idx} onClick={() => setSelectedImg(idx)} className={`flex-shrink-0 w-16 h-16 rounded-[1.2rem] border-2 p-1 transition-all cursor-pointer backdrop-blur-md ${selectedImg === idx ? 'border-sky-500 bg-white/80' : 'border-white/40 bg-white/40 opacity-60 hover:opacity-100'}`}>
                     <img src={img} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt="" />
                   </button>
                 ))}
               </div>
             )}
          </div>

          <div className="w-full lg:w-7/12 p-6 sm:p-8 flex flex-col">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white leading-snug">{product.title}</h1>
            
            <div className="mt-6 space-y-3">
              {warrantyText && <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300"><ShieldCheck className="w-4 h-4 text-emerald-500" /><span>{warrantyText}</span></div>}
              {shippingText && <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300"><Truck className="w-4 h-4 text-sky-500" /><span>{shippingText}</span></div>}
            </div>

            <div className="mt-8 pt-8 border-t border-white/50 dark:border-white/10">
                <p className="text-sm leading-loose text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{rawDesc || "توضیحات تکمیلی ثبت نشده است."}</p>
            </div>
            
            <div className="mt-auto hidden lg:flex items-center justify-between pt-10 border-t border-white/50 dark:border-white/10">
              <div className="flex flex-col">
                 {hasDiscount && <span className="text-sm font-bold text-slate-400 line-through">{oldPrice.toLocaleString("fa-IR")}</span>}
                 <span className="text-3xl font-black text-slate-900 dark:text-white">{currentPrice.toLocaleString("fa-IR")} <span className="text-sm font-bold text-slate-500 ml-1">تومان</span></span>
              </div>
              <button onClick={handleBuy} disabled={!isAvailable} className="px-10 py-4 bg-sky-500/90 backdrop-blur-md text-white rounded-full font-black hover:bg-sky-500 transition-colors shadow-[0_8px_20px_rgba(14,165,233,0.3)] disabled:opacity-50 cursor-pointer">
                 {isAvailable ? "افزودن به سبد خرید" : "ناموجود در انبار"}
              </button>
            </div>
          </div>
        </div>
        
        {/* بازگردانی ایمن کامپوننت نظرات به پایین صفحه محصول */}
        <div className="p-6 sm:p-8 border-t border-white/50 dark:border-white/10 bg-white/30 dark:bg-black/20">
           <ProductReviews productId={product.id || productId} />
        </div>
      </div>

      {/* 🔴 نوار کپسولی و شیشه‌ای خرید در موبایل (Apple Glassmorphism) 🔴 */}
      <div className="lg:hidden fixed bottom-6 inset-x-4 bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 p-3 z-[110] flex items-center justify-between shadow-[0_20px_40px_rgba(0,0,0,0.15)] rounded-[2rem]">
         <button onClick={handleBuy} disabled={!isAvailable} className="bg-sky-500/90 text-white px-6 py-3.5 rounded-full font-black shadow-md disabled:bg-slate-300 text-sm flex-1 ml-4 transition-transform active:scale-95 cursor-pointer">
             {isAvailable ? "افزودن به سبد" : "ناموجود"}
         </button>
         <div className="flex flex-col items-end shrink-0 pl-2">
            {hasDiscount && <span className="text-[10px] text-slate-400 line-through font-bold">{oldPrice.toLocaleString("fa-IR")}</span>}
            <span className="text-lg font-black text-slate-900 dark:text-white">{currentPrice.toLocaleString("fa-IR")} <span className="text-[10px] font-bold text-slate-500">تومان</span></span>
         </div>
      </div>
    </div>
  );
}
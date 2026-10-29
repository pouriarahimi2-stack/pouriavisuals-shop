"use client";
import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { ShieldCheck, Truck } from "lucide-react";

export default function ProductDetailClient({ initialProduct }: { initialProduct?: any; productId?: string }) {
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
      try {
        const meta = JSON.parse(parts[1].replace(/-->[\s\S]*$/g, "").trim());
        if (Array.isArray(meta.images)) extractedImages = meta.images;
      } catch (e) {}
    }
  }

  const allImages = [product.image_url || product.image || "/placeholder.png", ...(product.images || []), ...extractedImages].filter((v, i, a) => a.indexOf(v) === i);
  const currentPrice = Number(product.discount_price || product.price || 0);
  const oldPrice = Number(product.price || 0);
  const hasDiscount = currentPrice > 0 && currentPrice < oldPrice;
  const isAvailable = Number(product.stock || 0) > 0 && product.is_available !== false;
  
  const warrantyText = product.warranty || "";
  const shippingText = product.shipping_type === "post" ? "ارسال با پست پیشتاز" : product.shipping_type === "tipax" ? "ارسال با تیپاکس" : "ارسال سراسری (پست / تیپاکس)";

  const handleBuy = () => {
    if (!isAvailable) return;
    soundEngine?.playClick?.();
    addToCart({ id: product.id, title: product.title, price: currentPrice, quantity: 1, image: allImages[0] });
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-white md:bg-slate-50 text-slate-900 font-sans pb-28 lg:pb-10" dir="rtl">
      
      <div className="max-w-6xl mx-auto lg:mt-4 bg-white lg:rounded-2xl shadow-sm border-y lg:border border-slate-200 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          
          <div className="w-full lg:w-5/12 p-2 sm:p-4 flex flex-col gap-4 border-b lg:border-b-0 lg:border-l border-slate-100 relative">
             <div className="w-full aspect-square flex items-center justify-center bg-white">
                 <img src={allImages[selectedImg]} className="w-full h-full object-contain mix-blend-multiply" alt={product.title} />
             </div>
             {allImages.length > 1 && (
               <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar justify-center">
                 {allImages.map((img, idx) => (
                   <button key={idx} onClick={() => setSelectedImg(idx)} className={`flex-shrink-0 w-16 h-16 rounded-xl border p-1 transition-all cursor-pointer ${selectedImg === idx ? 'border-rose-500' : 'border-slate-200 opacity-60'}`}>
                     <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                   </button>
                 ))}
               </div>
             )}
          </div>

          <div className="w-full lg:w-7/12 p-4 sm:p-5 flex flex-col">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-800 leading-snug">{product.title}</h1>
            
            <div className="mt-4 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                 <ShieldCheck className="w-4 h-4 text-slate-400" />
                 <span>{warrantyText || "بدون گارانتی شرکتی"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                 <Truck className="w-4 h-4 text-slate-400" />
                 <span>{shippingText}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="font-bold text-sm mb-3">درباره محصول</h3>
                <p className="text-xs leading-loose text-slate-600 whitespace-pre-wrap">{rawDesc || "توضیحات تکمیلی ثبت نشده است."}</p>
            </div>
            
            <div className="mt-auto hidden lg:flex items-center justify-between pt-8 border-t border-slate-100">
              <div className="flex flex-col">
                 {hasDiscount && <span className="text-sm font-bold text-slate-400 line-through">{oldPrice.toLocaleString("fa-IR")}</span>}
                 <span className="text-2xl font-black text-slate-900">{currentPrice.toLocaleString("fa-IR")} <span className="text-sm font-bold text-slate-500 ml-1">تومان</span></span>
              </div>
              <button onClick={handleBuy} disabled={!isAvailable} className="px-10 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-md disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer">
                 {isAvailable ? "افزودن به سبد خرید" : "ناموجود در انبار"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔴 نوار چسبان پایین مخصوص موبایل (Digikala Style) 🔴 */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 pb-safe z-[90] flex items-center justify-between shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
         <button onClick={handleBuy} disabled={!isAvailable} className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm disabled:bg-slate-200 disabled:text-slate-400 text-sm flex-1 ml-4 transition-colors cursor-pointer">
             {isAvailable ? "افزودن به سبد خرید" : "ناموجود"}
         </button>
         <div className="flex flex-col items-end shrink-0">
            {hasDiscount && <span className="text-[11px] text-slate-400 line-through font-bold">{oldPrice.toLocaleString("fa-IR")}</span>}
            <span className="text-base font-black text-slate-900">{currentPrice.toLocaleString("fa-IR")} <span className="text-[10px] font-bold text-slate-500">تومان</span></span>
         </div>
      </div>
    </div>
  );
}
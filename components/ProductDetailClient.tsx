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
  const brandText = product.brand && product.brand !== "متفرقه" ? product.brand : "";
  
  let shippingText = "";
  if (product.shipping_type === "post") shippingText = "ارسال با پست پیشتاز";
  else if (product.shipping_type === "tipax") shippingText = "ارسال با تیپاکس (پس‌کرایه)";
  else if (product.shipping_type === "both") shippingText = "ارسال سراسری (پست / تیپاکس)";

  const handleBuy = () => {
    if (!isAvailable) return;
    soundEngine?.playClick?.();
    addToCart({ id: product.id, title: product.title, price: currentPrice, quantity: 1, image: allImages[0] });
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-28 lg:pb-10" dir="rtl">
      
      {/* بخش موبایل و دسکتاپ (گالری و مشخصات) */}
      <div className="max-w-6xl mx-auto lg:mt-8 bg-white lg:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          
          {/* گالری */}
          <div className="w-full lg:w-5/12 p-4 sm:p-6 lg:p-8 flex flex-col gap-4 border-b lg:border-b-0 lg:border-l border-slate-100 relative">
             {hasDiscount && <span className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-sm z-10">فروش ویژه</span>}
             <div className="w-full aspect-square flex items-center justify-center">
                 <img src={allImages[selectedImg]} className="w-full h-full object-contain mix-blend-multiply" alt={product.title} />
             </div>
             {allImages.length > 1 && (
               <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                 {allImages.map((img, idx) => (
                   <button key={idx} onClick={() => setSelectedImg(idx)} className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 p-1 transition-all cursor-pointer ${selectedImg === idx ? 'border-blue-600' : 'border-slate-100 opacity-60 hover:opacity-100'}`}>
                     <img src={img} className="w-full h-full object-contain rounded-lg mix-blend-multiply" alt="" />
                   </button>
                 ))}
               </div>
             )}
          </div>

          {/* اطلاعات محصول */}
          <div className="w-full lg:w-7/12 p-5 sm:p-6 lg:p-8 flex flex-col">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 leading-snug">{product.title}</h1>
            {brandText && <span className="inline-block mt-2 text-sm font-bold text-blue-600">{brandText}</span>}
            
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">ویژگی‌های محصول</h3>
              {warrantyText && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{warrantyText}</span>
                  </div>
              )}
              {shippingText && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Truck className="w-4 h-4 text-sky-500" />
                    <span>{shippingText}</span>
                  </div>
              )}
              <p className="mt-4 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{rawDesc || "توضیحات تکمیلی ثبت نشده است."}</p>
            </div>
            
            <div className="mt-auto hidden lg:flex items-center justify-between pt-8 border-t border-slate-100">
              <div className="flex flex-col">
                 {hasDiscount && <span className="text-sm font-bold text-slate-400 line-through">{oldPrice.toLocaleString("fa-IR")}</span>}
                 <span className="text-3xl font-black text-slate-900">{currentPrice.toLocaleString("fa-IR")} <span className="text-lg font-bold text-slate-500 ml-1">تومان</span></span>
              </div>
              <button onClick={handleBuy} disabled={!isAvailable} className="px-10 py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer">
                 {isAvailable ? "افزودن به سبد خرید" : "ناموجود در انبار"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* دکمه چسبان خرید مخصوص موبایل (Digikala Style) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 pb-safe z-[90] flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
         <button onClick={handleBuy} disabled={!isAvailable} className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-black shadow-md shadow-blue-600/20 disabled:opacity-50 text-sm cursor-pointer flex-1 mr-4">
             {isAvailable ? "افزودن به سبد خرید" : "ناموجود"}
         </button>
         <div className="flex flex-col items-end shrink-0 w-36">
            {hasDiscount && <span className="text-[11px] text-slate-400 line-through font-bold">{oldPrice.toLocaleString("fa-IR")}</span>}
            <span className="text-lg font-black text-slate-900">{currentPrice.toLocaleString("fa-IR")} <span className="text-xs text-slate-500">تومان</span></span>
         </div>
      </div>
    </div>
  );
}
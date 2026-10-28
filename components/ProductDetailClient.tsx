"use client";
import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { ShieldCheck, Truck, ChevronRight, CheckCircle2 } from "lucide-react";

export default function ProductDetailClient({ initialProduct }: { initialProduct?: any; productId?: string }) {
  const { addToCart, setIsCartOpen } = useCart();
  const [product] = useState(initialProduct || {});
  const [selectedImg, setSelectedImg] = useState(0);

  if (!product.id) return <div className="min-h-screen flex items-center justify-center font-bold">کالا یافت نشد.</div>;

  let rawDesc = String(product.description || "");
  let extractedImages = [];
  let extractedWarranty = product.warranty || "۱۸ ماه گارانتی اصالت طلایی آکسون";
  
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

  const allImages = [product.image || "/placeholder.png", ...(product.images || []), ...extractedImages].filter((v, i, a) => a.indexOf(v) === i);
  const currentPrice = Number(product.discount_price || product.price || 0);
  const oldPrice = Number(product.price || 0);
  const hasDiscount = currentPrice > 0 && currentPrice < oldPrice;
  const isAvailable = Number(product.stock || 0) > 0 && product.is_available !== false;

  const handleBuy = () => {
    if (!isAvailable) return;
    soundEngine.playClick();
    addToCart({ id: product.id, title: product.title, price: currentPrice, quantity: 1, image: allImages[0] });
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-200 pb-24 lg:pb-10" dir="rtl">
      {/* هدر مینیمال یا Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-2">
         <span className="text-[10px] sm:text-xs font-bold text-slate-400">آکسون کور / {product.category || "فروشگاه"} / {product.title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* بخش گالری تصاویر (راست) */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="w-full aspect-square bg-slate-50/50 rounded-[2rem] p-4 flex items-center justify-center overflow-hidden border border-slate-100">
             <img src={allImages[selectedImg]} className="w-full h-full object-contain drop-shadow-sm hover:scale-105 transition-transform duration-500" alt={product.title} />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {allImages.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImg(idx)} className={`flex-shrink-0 w-20 h-20 rounded-2xl border-2 overflow-hidden bg-white p-1 transition-all ${selectedImg === idx ? 'border-black' : 'border-transparent hover:border-slate-200'}`}>
                  <img src={img} className="w-full h-full object-contain" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* بخش اطلاعات محصول (چپ) */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug">{product.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 max-w-prose">{rawDesc || "توضیحات تکمیلی این کالا به زودی درج خواهد شد."}</p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>{extractedWarranty}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <Truck className="w-5 h-5 text-sky-500" />
              <span>ارسال سریع سراسری (پست / تیپاکس)</span>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100">
            {hasDiscount && (
               <div className="text-sm font-bold text-slate-400 line-through mb-1">{oldPrice.toLocaleString("fa-IR")} تومان</div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="text-3xl font-black tracking-tighter text-slate-900">
                {currentPrice.toLocaleString("fa-IR")} <span className="text-lg text-slate-500 font-bold ml-1">تومان</span>
              </div>
              <button onClick={handleBuy} disabled={!isAvailable} className="hidden lg:flex px-12 py-4 bg-black text-white rounded-full font-bold hover:bg-slate-800 hover:scale-105 transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:hover:scale-100">
                 {isAvailable ? "افزودن به سبد خرید" : "ناموجود در انبار"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* نوار چسبان پایین مخصوص موبایل (Conversion Optimized) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 pb-safe z-50 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <div className="flex flex-col">
            {hasDiscount && <span className="text-[10px] text-slate-400 line-through font-bold">{oldPrice.toLocaleString("fa-IR")}</span>}
            <span className="text-base font-black text-slate-900">{currentPrice.toLocaleString("fa-IR")} <span className="text-xs text-slate-500">تومان</span></span>
         </div>
         <button onClick={handleBuy} disabled={!isAvailable} className="bg-black text-white px-8 py-3 rounded-full font-bold shadow-lg disabled:opacity-50 text-sm">
             {isAvailable ? "خرید کالا" : "ناموجود"}
         </button>
      </div>
    </div>
  );
}
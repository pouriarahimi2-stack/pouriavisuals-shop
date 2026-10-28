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
  
  // دیتای داینامیک
  const warrantyText = product.warranty || "";
  const brandText = product.brand && product.brand !== "متفرقه" ? product.brand : "";
  let shippingText = "";
  if (product.shipping_type === "post") shippingText = "ارسال با پست پیشتاز";
  else if (product.shipping_type === "tipax") shippingText = "ارسال سریع با تیپاکس (پس‌کرایه)";
  else if (product.shipping_type === "both") shippingText = "ارسال سراسری (پست / تیپاکس)";

  const handleBuy = () => {
    if (!isAvailable) return;
    soundEngine?.playClick?.();
    addToCart({ id: product.id, title: product.title, price: currentPrice, quantity: 1, image: allImages[0] });
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-24 lg:pb-10" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-2 flex items-center gap-2 text-xs font-bold text-slate-400 overflow-x-auto whitespace-nowrap">
         <span>آکسون کور</span>
         <span>/</span>
         <span>{product.category || "فروشگاه"}</span>
         {brandText && (
             <>
                <span>/</span>
                <span className="text-slate-600">{brandText}</span>
             </>
         )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* گالری تصاویر */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="w-full aspect-square bg-slate-50 rounded-[2rem] p-4 flex items-center justify-center border border-slate-100">
             <img src={allImages[selectedImg]} className="w-full h-full object-contain drop-shadow-sm transition-transform duration-500" alt={product.title} />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {allImages.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImg(idx)} className={`flex-shrink-0 w-20 h-20 rounded-2xl border-2 bg-white p-1 transition-all ${selectedImg === idx ? 'border-slate-800' : 'border-transparent hover:border-slate-200'}`}>
                  <img src={img} className="w-full h-full object-contain rounded-xl" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* اطلاعات محصول */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">{product.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 whitespace-pre-wrap">{rawDesc || "توضیحات تکمیلی ثبت نشده است."}</p>

          <div className="mt-8 space-y-4">
            {warrantyText && (
                <div className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 w-fit pr-4 pl-6">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>{warrantyText}</span>
                </div>
            )}
            {shippingText && (
                <div className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 w-fit pr-4 pl-6">
                  <Truck className="w-5 h-5 text-sky-500" />
                  <span>{shippingText}</span>
                </div>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100">
            {hasDiscount && <div className="text-sm font-bold text-slate-400 line-through mb-1">{oldPrice.toLocaleString("fa-IR")} تومان</div>}
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="text-3xl font-black text-slate-900">
                {currentPrice.toLocaleString("fa-IR")} <span className="text-lg text-slate-500 font-bold ml-1">تومان</span>
              </div>
              <button onClick={handleBuy} disabled={!isAvailable} className="hidden lg:flex px-12 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 cursor-pointer">
                 {isAvailable ? "افزودن به سبد خرید" : "ناموجود در انبار"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* دکمه چسبان موبایل */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-4 pb-safe z-[90] flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
         <div className="flex flex-col">
            {hasDiscount && <span className="text-[10px] text-slate-400 line-through font-bold">{oldPrice.toLocaleString("fa-IR")}</span>}
            <span className="text-lg font-black text-slate-900">{currentPrice.toLocaleString("fa-IR")} <span className="text-xs text-slate-500">تومان</span></span>
         </div>
         <button onClick={handleBuy} disabled={!isAvailable} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-slate-900/20 disabled:opacity-50 text-sm cursor-pointer">
             {isAvailable ? "خرید کالا" : "ناموجود"}
         </button>
      </div>
    </div>
  );
}
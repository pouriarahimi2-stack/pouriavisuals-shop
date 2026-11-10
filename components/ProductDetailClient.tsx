"use client";
// File Path: components/ProductDetailClient.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { ShieldCheck, Truck } from "lucide-react";
import { ProductReviews } from "@/components/ProductReviews";
import AddToCartButton from "@/components/AddToCartButton";
import { supabase } from "@/lib/supabase";

export default function ProductDetailClient({
  initialProduct,
  productId,
}: {
  initialProduct?: any;
  productId?: string;
}) {
  const { addToCart, setIsCartOpen } = useCart() as any;
  const [product] = useState(initialProduct || {});
  const [selectedImg, setSelectedImg] = useState(0);

  // استیت‌های مربوط به نمایش هوشمند برچسب تخفیف
  const [targetedCoupon, setTargetedCoupon] = useState<{
    code: string;
    label: string;
    isProductSpecific: boolean;
  } | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const fetchApplicableCoupons = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/coupons?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      const allActive = json.coupons || [];

      // پنهان‌سازی کوپن‌ها برای کاربری که قبلا از آن‌ها استفاده کرده است (UX Hide)
      let usedLocal: string[] = [];
      try { usedLocal = JSON.parse(localStorage.getItem("axon_used_coupons") || "[]"); } catch {}
      
      const list = allActive.filter((c: any) => !usedLocal.includes(c.code));
      
      const prodId = String(product.id || productId);
      const prodCategory = String(product.category || "").trim();

      const specific = list.find(
        (c: any) => c.target_type === "product" && String(c.target_id) === prodId
      );

      if (specific) {
        const isPct = (specific.discount_type || specific.type) === "percent";
        const val = Number(specific.discount_percent ?? specific.value ?? specific.discount_value ?? 0);
        setTargetedCoupon({
          code: specific.code,
          label: isPct ? `${val}٪ اختصاصی` : `${val.toLocaleString("fa-IR")} ت اختصاصی`,
          isProductSpecific: true,
        });
        return;
      }

      const catCoupon = list.find(
        (c: any) => c.target_type === "category" && String(c.target_id).trim() === prodCategory
      );

      if (catCoupon) {
        const isPct = (catCoupon.discount_type || catCoupon.type) === "percent";
        const val = Number(catCoupon.discount_percent ?? catCoupon.value ?? catCoupon.discount_value ?? 0);
        setTargetedCoupon({
          code: catCoupon.code,
          label: isPct ? `${val}٪ دسته‌بندی` : `${val.toLocaleString("fa-IR")} ت دسته‌بندی`,
          isProductSpecific: false,
        });
        return;
      }

      const globalCoupon = list.find((c: any) => c.target_type === "all");
      if (globalCoupon) {
        const isPct = (globalCoupon.discount_type || globalCoupon.type) === "percent";
        const val = Number(globalCoupon.discount_percent ?? globalCoupon.value ?? globalCoupon.discount_value ?? 0);
        setTargetedCoupon({
          code: globalCoupon.code,
          label: isPct ? `${val}٪ با کد` : `${val.toLocaleString("fa-IR")} ت با کد`,
          isProductSpecific: false,
        });
        return;
      }

      setTargetedCoupon(null);
    } catch {
      setTargetedCoupon(null);
    }
  }, [product.id, productId, product.category]);

  useEffect(() => {
    fetchApplicableCoupons();

    const channel = supabase
      .channel(`realtime-product-detail-${product.id || productId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coupons" },
        () => { fetchApplicableCoupons(); }
      )
      .subscribe();

    window.addEventListener("coupons_updated", fetchApplicableCoupons);

    return () => {
      window.removeEventListener("coupons_updated", fetchApplicableCoupons);
      supabase.removeChannel(channel);
    };
  }, [fetchApplicableCoupons, product.id, productId]);

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!targetedCoupon) return;
    soundEngine.playSuccess();
    navigator.clipboard?.writeText(targetedCoupon.code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  if (!product.id)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold">
        کالا یافت نشد.
      </div>
    );

  let rawDesc = String(product.description || "");
  let extractedImages: string[] = [];
  if (rawDesc.includes("MEDIA_METADATA")) {
    const parts = rawDesc.split(/<!--MEDIA_METADATA:|MEDIA_METADATA:/i);
    rawDesc = parts[0] ? parts[0].trim() : "";
    if (parts[1]) {
      try {
        const meta = JSON.parse(
          parts[1].replace(/-->[\s\S]*$/g, "").trim()
        );
        if (Array.isArray(meta.images)) extractedImages = meta.images;
      } catch {}
    }
  }

  const allImages = [
    product.image_url || product.image || "/placeholder.png",
    ...(product.images || []),
    ...extractedImages,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const currentPrice = Number(product.discount_price || product.price || 0);
  const oldPrice = Number(product.price || 0);
  const hasDiscount = currentPrice > 0 && currentPrice < oldPrice;
  const isAvailable =
    Number(product.stock || 0) > 0 && product.is_available !== false;
  const discPct =
    hasDiscount && oldPrice > 0
      ? Math.round((1 - currentPrice / oldPrice) * 100)
      : 0;

  const warrantyText = product.warranty || "";
  const shippingText =
    product.shipping_type === "post"
      ? "پست پیشتاز"
      : product.shipping_type === "tipax"
      ? "تیپاکس (پس‌کرایه)"
      : "پست / تیپاکس";

  return (
    <div
      className="min-h-screen text-[var(--text-primary)] font-sans pb-32 lg:pb-10"
      style={{ background: "var(--bg-primary)" }}
      dir="rtl"
    >
      <div
        className="max-w-6xl mx-auto lg:mt-6 overflow-hidden"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid var(--glass-border)",
          borderRadius: "2rem",
          boxShadow: "var(--glass-shadow)",
        }}
      >
        <div className="flex flex-col lg:flex-row">
          {/* تصویر محصول */}
          <div
            className="w-full lg:w-5/12 p-5 sm:p-6 flex flex-col gap-4 relative"
            style={{
              borderBottom: "1px solid var(--glass-border)",
              borderLeft: "none",
            }}
          >
            <div
              className="lg:[border-left:1px_solid_var(--glass-border)]"
              style={{ display: "none" }}
            />
            {hasDiscount && (
              <span
                className="badge-capsule badge-discount self-start text-xs absolute top-8 right-8 z-10 shadow-lg"
              >
                {discPct}٪ تخفیف ویژه
              </span>
            )}
            {/* برچسب موجودی در صفحه محصول (در صورت کم بودن) */}
            {isAvailable && Number(product.stock) <= 3 && (
               <span
                 className="badge-capsule badge-warning self-start text-xs absolute top-8 left-8 z-10 shadow-lg"
               >
                 تنها {product.stock} عدد در انبار
               </span>
            )}
            
            <div className="w-full aspect-square flex items-center justify-center rounded-2xl overflow-hidden mt-6"
              style={{ background: "var(--input-bg)", border: "1px solid var(--glass-border)" }}
            >
              <img
                src={allImages[selectedImg]}
                className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                alt={product.title}
              />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none justify-center">
                {allImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(idx)}
                    className="flex-shrink-0 w-14 h-14 rounded-xl p-1 transition-all cursor-pointer"
                    style={{
                      border: idx === selectedImg
                        ? "2px solid var(--accent-blue)"
                        : "2px solid var(--glass-border)",
                      background: "var(--glass-bg)",
                      opacity: idx === selectedImg ? 1 : 0.65,
                    }}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-contain"
                      alt=""
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* اطلاعات محصول */}
          <div className="w-full lg:w-7/12 p-5 sm:p-8 flex flex-col"
            style={{ borderRight: "1px solid var(--glass-border)" }}
          >
            {/* باکس کد تخفیف هوشمند */}
            {targetedCoupon && (
              <div className="mb-4 inline-flex">
                 <button
                   type="button"
                   onClick={handleCopyCoupon}
                   className={
                     "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-black transition cursor-pointer shadow-md " +
                     (targetedCoupon.isProductSpecific
                       ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                       : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white")
                   }
                   title="کلیک برای کپی سریع کد تخفیف"
                 >
                   <span className="text-base">🏷️</span>
                   <span>{copiedCoupon ? "کد کپی شد ✓" : targetedCoupon.code}</span>
                   <span className="font-sans font-bold opacity-90">({targetedCoupon.label})</span>
                 </button>
              </div>
            )}

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              {product.title}
            </h1>

            <div className="mt-5 space-y-2.5">
              {warrantyText && (
                <div className="flex items-center gap-2 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-cyan)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>{warrantyText}</span>
                </div>
              )}
              {shippingText && (
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Truck className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-blue)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>{shippingText}</span>
                </div>
              )}
            </div>

            {rawDesc && (
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--glass-border)" }}>
                <p className="text-sm leading-loose whitespace-pre-wrap"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {rawDesc}
                </p>
              </div>
            )}

            {/* قیمت + دکمه — دسکتاپ */}
            <div className="mt-auto hidden lg:flex flex-col gap-4 pt-8"
              style={{ borderTop: "1px solid var(--glass-border)" }}
            >
              <div className="flex flex-col">
                {hasDiscount && (
                  <span className="text-sm font-bold line-through"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {oldPrice.toLocaleString("fa-IR")} تومان
                  </span>
                )}
                <span className="text-3xl font-black" style={{ color: "var(--accent-blue)" }}>
                  {currentPrice.toLocaleString("fa-IR")}
                  <span className="text-sm font-bold mr-1.5" style={{ color: "var(--text-secondary)" }}>تومان</span>
                </span>
              </div>
              <AddToCartButton product={product} showCounter={false} />
            </div>
          </div>
        </div>

        {/* بخش دیدگاه‌ها */}
        <div
          className="p-5 sm:p-8"
          style={{
            borderTop: "1px solid var(--glass-border)",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          <ProductReviews
            productId={product.id || productId}
            productTitle={product.title}
          />
        </div>
      </div>

      {/* نوار پایین موبایل — گرادیان کپسولی */}
      <div
        className="lg:hidden fixed bottom-14 inset-x-0 z-[110] px-3 py-2.5"
        style={{
          paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom,0px))",
          background: "var(--glass-bg-strong)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          borderTop: "1px solid var(--glass-border)",
          boxShadow: "0 -4px 24px var(--accent-glow)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col items-end shrink-0">
            {hasDiscount && (
              <span className="text-[10px] font-bold line-through"
                style={{ color: "var(--text-secondary)" }}
              >
                {oldPrice.toLocaleString("fa-IR")}
              </span>
            )}
            <span className="text-base font-black" style={{ color: "var(--accent-blue)" }}>
              {currentPrice.toLocaleString("fa-IR")}
              <span className="text-[10px] font-bold mr-1" style={{ color: "var(--text-secondary)" }}>ت</span>
            </span>
          </div>
          <div className="flex-1">
            <AddToCartButton product={product} showCounter={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
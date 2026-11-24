// File Path: components/ProductCard.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";
import AddToCartButton from "@/components/AddToCartButton";
import { supabase } from "@/lib/supabase";
import { useCompare } from "@/context/CompareContext";

interface ProductCardProps {
  product: {
    id: string | number;
    title?: string;
    name?: string;
    price: number;
    discount_price?: number | null;
    discountPrice?: number | null;
    image?: string | null;
    image_url?: string | null;
    images?: string[];
    category?: string;
    brand?: string;
    stock?: number;
    warranty?: string;
    specs?: Record<string, any>;
    specs_jsonb?: Record<string, any>;
  };
}

let sharedCouponsCache: any[] | null = null;
let sharedCouponsPromise: Promise<any[]> | null = null;
let sharedChannelRefCount = 0;
let sharedChannelInstance: any = null;
const couponSubscribers = new Set<() => void>();

async function getSharedPublicCoupons(forceRefresh = false): Promise<any[]> {
  if (!forceRefresh && sharedCouponsCache !== null) {
    return sharedCouponsCache;
  }
  if (!forceRefresh && sharedCouponsPromise) {
    return sharedCouponsPromise;
  }

  sharedCouponsPromise = fetch(`/api/public/coupons?t=${Date.now()}`, {
    cache: "no-store",
  })
    .then((r) => (r.ok ? r.json() : { coupons: [] }))
    .then((json): any[] => {
      const list: any[] = Array.isArray(json.coupons) ? json.coupons : [];
      sharedCouponsCache = list;
      return list;
    })
    .catch((): any[] => {
      sharedCouponsCache = [];
      return [];
    })
    .finally(() => {
      sharedCouponsPromise = null;
    });

  return sharedCouponsPromise;
}

function subscribeSharedCoupons(listener: () => void) {
  couponSubscribers.add(listener);
  sharedChannelRefCount++;

  if (sharedChannelRefCount === 1) {
    const refreshAll = () => {
      getSharedPublicCoupons(true).then(() => {
        couponSubscribers.forEach((fn) => fn());
      });
    };

    sharedChannelInstance = supabase
      .channel("shared-product-cards-coupons")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coupons" },
        refreshAll
      )
      .subscribe();

    if (typeof window !== "undefined") {
      window.addEventListener("coupons_updated", refreshAll);
    }
  }

  return () => {
    couponSubscribers.delete(listener);
    sharedChannelRefCount = Math.max(0, sharedChannelRefCount - 1);
    if (sharedChannelRefCount === 0 && sharedChannelInstance) {
      supabase.removeChannel(sharedChannelInstance);
      sharedChannelInstance = null;
    }
  };
}

function getImg(p: ProductCardProps["product"]): string {
  if (Array.isArray(p.images) && p.images.length > 0) {
    const f = p.images[0];
    if (f && (f.startsWith("http") || f.startsWith("/"))) return f;
  }
  if (p.image_url?.trim()) return p.image_url;
  if (p.image?.trim()) return p.image;
  return "/placeholder.png";
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isInCompare, toggleCompareProduct } = useCompare();
  const compared = isInCompare(product.id);

  const title = product.title || product.name || "کالای دیجیتال";
  const basePrice = Number(product.price || 0);
  const discountVal = product.discount_price || product.discountPrice;
  const finalPrice =
    discountVal && Number(discountVal) > 0 && Number(discountVal) < basePrice
      ? Number(discountVal)
      : basePrice;
  const discPct =
    discountVal && basePrice > 0 && Number(discountVal) < basePrice
      ? Math.round((1 - Number(discountVal) / basePrice) * 100)
      : 0;
  const [imgSrc, setImgSrc] = useState(getImg(product));

  const numericStock =
    product.stock !== undefined && product.stock !== null
      ? Number(product.stock)
      : 10;
  const isLowStock = numericStock > 0 && numericStock <= 3;
  const isOutOfStock = numericStock <= 0;

  const [targetedCoupon, setTargetedCoupon] = useState<{
    code: string;
    label: string;
    isProductSpecific: boolean;
  } | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const computeApplicableCoupon = useCallback(
    (allActive: any[]) => {
      let usedLocal: string[] = [];
      try {
        usedLocal = JSON.parse(
          localStorage.getItem("axon_used_coupons") || "[]"
        );
      } catch {}

      const list = allActive.filter((c: any) => !usedLocal.includes(c.code));
      const prodId = String(product.id);
      const prodCategory = String(product.category || "").trim();

      const specific = list.find(
        (c: any) =>
          c.target_type === "product" && String(c.target_id) === prodId
      );
      if (specific) {
        const isPct = (specific.discount_type || specific.type) === "percent";
        const val = Number(
          specific.discount_percent ??
            specific.value ??
            specific.discount_value ??
            0
        );
        setTargetedCoupon({
          code: specific.code,
          label: isPct
            ? `${val}٪ اختصاصی`
            : `${val.toLocaleString("fa-IR")} ت اختصاصی`,
          isProductSpecific: true,
        });
        return;
      }

      const catCoupon = list.find(
        (c: any) =>
          c.target_type === "category" &&
          String(c.target_id).trim() === prodCategory
      );
      if (catCoupon) {
        const isPct = (catCoupon.discount_type || catCoupon.type) === "percent";
        const val = Number(
          catCoupon.discount_percent ??
            catCoupon.value ??
            catCoupon.discount_value ??
            0
        );
        setTargetedCoupon({
          code: catCoupon.code,
          label: isPct
            ? `${val}٪ دسته‌بندی`
            : `${val.toLocaleString("fa-IR")} ت دسته‌بندی`,
          isProductSpecific: false,
        });
        return;
      }

      const globalCoupon = list.find((c: any) => c.target_type === "all");
      if (globalCoupon) {
        const isPct =
          (globalCoupon.discount_type || globalCoupon.type) === "percent";
        const val = Number(
          globalCoupon.discount_percent ??
            globalCoupon.value ??
            globalCoupon.discount_value ??
            0
        );
        setTargetedCoupon({
          code: globalCoupon.code,
          label: isPct ? `${val}٪ با کد` : `${val.toLocaleString("fa-IR")} ت با کد`,
          isProductSpecific: false,
        });
        return;
      }

      setTargetedCoupon(null);
    },
    [product.id, product.category]
  );

  useEffect(() => {
    let mounted = true;
    const sync = () => {
      getSharedPublicCoupons(false).then((list) => {
        if (mounted) computeApplicableCoupon(list);
      });
    };
    sync();
    const unsub = subscribeSharedCoupons(sync);
    return () => {
      mounted = false;
      unsub();
    };
  }, [computeApplicableCoupon]);

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!targetedCoupon) return;
    soundEngine.playSuccess();
    navigator.clipboard?.writeText(targetedCoupon.code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  return (
    <div
      className="group card-glass card-liquid-shine card-hover-glow flex flex-col justify-between relative h-full overflow-hidden"
      style={{ borderRadius: "1.5rem" }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%,var(--accent-glow) 0%,transparent 70%)",
          borderRadius: "inherit",
        }}
      />
      <Link
        href={"/products/" + product.id}
        onClick={() => soundEngine.playClick()}
        className="flex-1 block p-3 sm:p-4 space-y-2 sm:space-y-3 relative z-10"
      >
        <div
          className="relative aspect-square overflow-hidden flex items-center justify-center p-3 sm:p-4"
          style={{
            borderRadius: "1.25rem",
            background: "var(--input-bg)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            onError={() => {
              if (imgSrc !== "/placeholder.png") setImgSrc("/placeholder.png");
            }}
          />
          {discPct > 0 && (
            <span className="badge-capsule badge-discount absolute top-2.5 right-2.5 text-[10px]">
              {discPct}٪
            </span>
          )}
          {isLowStock && (
            <span className="badge-capsule badge-warning absolute top-2.5 left-2.5 text-[9px]">
              تنها {numericStock}
            </span>
          )}
          {isOutOfStock && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                borderRadius: "inherit",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            >
              <span
                className="badge-capsule text-[11px]"
                style={{
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                ناموجود
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5 px-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {product.category && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black"
                style={{
                  background:
                    "linear-gradient(135deg,var(--accent-blue),var(--accent-violet))",
                  color: "#fff",
                  opacity: 0.9,
                }}
              >
                {product.category}
              </span>
            )}

            {targetedCoupon && (
              <button
                type="button"
                onClick={handleCopyCoupon}
                className={
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black transition cursor-pointer shadow-sm " +
                  (targetedCoupon.isProductSpecific
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                    : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white")
                }
                title="کلیک برای کپی سریع کد تخفیف"
              >
                <span>🏷️</span>
                <span>{copiedCoupon ? "کپی شد ✓" : targetedCoupon.code}</span>
                <span className="font-sans font-bold">
                  ({targetedCoupon.label})
                </span>
              </button>
            )}
          </div>

          <h3
            className="text-[11px] sm:text-xs font-black line-clamp-2 leading-relaxed min-h-[30px] sm:min-h-[34px]"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
        </div>
      </Link>

      <div
        className="px-3.5 sm:px-4 pb-4 pt-2 relative z-10"
        style={{ borderTop: "1px solid var(--glass-border)" }}
      >
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          {discPct > 0 ? (
            <div className="space-y-0.5 min-w-0">
              <span
                className="line-through text-[9px] sm:text-[10px] block truncate"
                style={{ color: "var(--text-secondary)" }}
                suppressHydrationWarning
              >
                {formatPrice(basePrice)} ت
              </span>
              <span
                className="font-black text-xs sm:text-base block truncate"
                style={{ color: "var(--accent-blue)" }}
                suppressHydrationWarning
              >
                {formatPrice(finalPrice)} ت
              </span>
            </div>
          ) : (
            <span
              className="font-black text-xs sm:text-base truncate"
              style={{ color: "var(--text-primary)" }}
              suppressHydrationWarning
            >
              {formatPrice(basePrice)} ت
            </span>
          )}

          {/* دکمه مقایسه فنی کالا */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCompareProduct({ ...product, image: imgSrc });
            }}
            className={
              "px-2 sm:px-2.5 py-1 rounded-xl text-[9px] sm:text-[10px] font-black transition cursor-pointer shrink-0 flex items-center gap-1 border " +
              (compared
                ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-sm"
                : "bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--card-border)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]")
            }
            title={
              compared
                ? "حذف از لیست مقایسه فنی"
                : "افزودن به جدول مقایسه فنی کالاها"
            }
          >
            <span>{compared ? "✓" : "⚖️"}</span>
            <span>{compared ? "در مقایسه" : "مقایسه"}</span>
          </button>
        </div>

        <AddToCartButton
          product={{ ...product, image: imgSrc }}
          showCounter={false}
        />
      </div>
    </div>
  );
}
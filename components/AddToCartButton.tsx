// File Path: components/AddToCartButton.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  product: {
    id: string | number;
    title?: string;
    name?: string;
    price: number;
    discount_price?: number | null;
    image?: string | null;
    images?: string[];
    stock?: number;
    category?: string;
    color_options?: { name: string; hex: string }[];
    shipping_type?: string;
  };
  className?: string;
  showCounter?: boolean;
}

export default function AddToCartButton({
  product,
  className = "",
  showCounter = true,
}: AddToCartButtonProps) {
  const { cartItems, addToCart, openCart } = useCart();
  const [animState, setAnimState] = useState<"idle" | "adding">("idle");
  const [bumpCounter, setBumpCounter] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // استیت‌های سیستم پیامکی «موجود شد خبرم کن»
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyPhone, setNotifyPhone] = useState("");
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyResult, setNotifyResult] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const hasColors =
    Array.isArray(product.color_options) && product.color_options.length > 0;

  useEffect(() => {
    setMounted(true);
    try {
      const userRaw = localStorage.getItem("axon_user_session");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u?.phone) setNotifyPhone(String(u.phone));
        return;
      }
      const draftRaw = localStorage.getItem("axon_checkout_form_draft_v2027");
      if (draftRaw) {
        const d = JSON.parse(draftRaw);
        if (d?.phone) setNotifyPhone(String(d.phone));
      }
    } catch {}
  }, []);

  const cartItem = cartItems.find(
    (i) => String(i.id) === String(product.id)
  );
  const currentCount = cartItem?.quantity || 0;
  const stockLimit =
    product.stock !== undefined && product.stock !== null
      ? Number(product.stock)
      : 10;
  const isAvailable = stockLimit > 0;
  const isMaxReached = currentCount >= stockLimit;

  const guaranteedImage =
    (Array.isArray(product.images) && product.images[0]) ||
    product.image ||
    "/placeholder.png";

  const productTitle = product.title || product.name || "کالای دیجیتال";

  const doAddToCart = (colorName?: string) => {
    soundEngine.playAddToCart();
    setAnimState("adding");
    addToCart(
      {
        id: product.id,
        title: productTitle,
        name: productTitle,
        price: product.price,
        discount_price: product.discount_price,
        image: guaranteedImage,
        images: [guaranteedImage],
        stock: stockLimit,
        category: product.category || "تکنولوژی",
        quantity: 1,
        selectedColor: colorName || undefined,
        shipping_type: product.shipping_type || undefined,
      },
      false
    );
    setTimeout(() => {
      setBumpCounter(true);
      setTimeout(() => setBumpCounter(false), 500);
    }, 550);
    setTimeout(() => {
      setAnimState("idle");
      openCart();
    }, 1250);
  };

  const handlePrimaryAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable) {
      soundEngine.playClick();
      setNotifyResult(null);
      setNotifyModalOpen(true);
      return;
    }

    if (isMaxReached || animState !== "idle") return;
    if (hasColors) {
      setShowColorPicker((prev) => !prev);
      return;
    }
    doAddToCart();
  };

  const handleColorSelect = (e: React.MouseEvent, colorName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowColorPicker(false);
    doAddToCart(colorName);
  };

  const handleSubmitBackInStock = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundEngine.playClick();
    setNotifySubmitting(true);
    setNotifyResult(null);

    try {
      const res = await fetch("/api/products/back-in-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: String(product.id),
          productTitle,
          phone: notifyPhone.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setNotifyResult({ ok: true, text: json.message });
      } else {
        setNotifyResult({
          ok: false,
          text: json.message || "خطا در ثبت شماره موبایل.",
        });
      }
    } catch {
      setNotifyResult({
        ok: false,
        text: "خطا در برقراری ارتباط با سرور.",
      });
    } finally {
      setNotifySubmitting(false);
    }
  };

  const isAnimating = animState === "adding";

  return (
    <div
      className={
        "flex flex-col items-center gap-1.5 w-full select-text relative " +
        className
      }
      dir="rtl"
      suppressHydrationWarning
    >
      {/* Color Picker Popup */}
      {showColorPicker && hasColors && isAvailable && (
        <div
          className="absolute bottom-full mb-2 right-0 left-0 z-50 border rounded-2xl shadow-2xl p-3"
          style={{
            background: "var(--modal-bg)",
            border: "1px solid var(--card-border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span
              className="font-black text-[11px]"
              style={{ color: "var(--text-primary)" }}
            >
              انتخاب رنگ
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowColorPicker(false);
              }}
              className="w-5 h-5 flex items-center justify-center rounded-full text-base leading-none transition-colors cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
            >
              ×
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.color_options!.map((c) => (
              <button
                key={c.hex + c.name}
                type="button"
                onClick={(e) => handleColorSelect(e, c.name)}
                className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition cursor-pointer"
                title={c.name}
                style={{ border: "1px solid transparent" }}
              >
                <span
                  className="w-7 h-7 rounded-full border-2 shadow-md block"
                  style={{
                    backgroundColor: c.hex,
                    borderColor: "rgba(255,255,255,0.2)",
                  }}
                />
                <span
                  className="text-[9px] font-bold max-w-[52px] truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        type="button"
        disabled={isAvailable && isMaxReached}
        onClick={handlePrimaryAction}
        className="relative w-full h-[42px] sm:h-[44px] rounded-xl overflow-hidden transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-[0.98] px-2 sm:px-3"
        style={
          !isAvailable
            ? {
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.14))",
                border: "1px solid rgba(245,158,11,0.45)",
                color: "#f59e0b",
              }
            : isMaxReached
            ? {
                background: "rgba(148,163,184,0.25)",
                border: "1px solid rgba(148,163,184,0.2)",
                color: "var(--text-secondary)",
                cursor: "not-allowed",
                opacity: 0.55,
              }
            : {
                background:
                  "linear-gradient(135deg,var(--accent-blue) 0%,var(--accent-violet) 100%)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff",
                boxShadow:
                  "0 4px 20px var(--accent-glow),0 1px 4px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.25)",
              }
        }
      >
        <div className="relative w-full h-full flex items-center justify-center gap-1.5 sm:gap-2 px-0 overflow-hidden">
          {!isAvailable ? (
            <span className="font-black text-[11px] sm:text-xs tracking-tight whitespace-nowrap flex items-center gap-1.5">
              <span>🔔</span>
              <span>موجود شد خبرم کن</span>
            </span>
          ) : (
            <>
              <div
                className={
                  "flex items-center justify-center transition-all duration-300 shrink-0 " +
                  (isAnimating
                    ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-kinetic-cart-left z-20"
                    : "")
                }
              >
                {isAnimating && (
                  <div className="absolute -top-3.5 left-[8px] z-30 pointer-events-none animate-kinetic-item-drop">
                    <div className="w-3.5 h-3.5 rounded-[3px] bg-white shadow-md border border-slate-300 flex items-center justify-center relative">
                      <span className="w-full h-[1.5px] bg-blue-500 absolute top-1/2 -translate-y-1/2" />
                      <span className="h-full w-[1.5px] bg-blue-500 absolute left-1/2 -translate-x-1/2" />
                    </div>
                  </div>
                )}
                <svg
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 3H5.2L7.1 14.2C7.25 15.1 8 15.8 8.9 15.8H18.2C19.1 15.8 19.85 15.1 20 14.2L21.4 7.2C21.55 6.4 20.95 5.7 20.15 5.7H6.2"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9.5" cy="19.5" r="1.8" fill="currentColor" />
                  <circle cx="17.5" cy="19.5" r="1.8" fill="currentColor" />
                </svg>
              </div>

              <span
                className={
                  "font-black text-[11px] sm:text-xs tracking-tight transition-all duration-300 whitespace-nowrap " +
                  (isAnimating
                    ? "opacity-0 scale-75 pointer-events-none w-0 overflow-hidden"
                    : "opacity-100 scale-100")
                }
              >
                {isMaxReached ? "حداکثر موجودی" : "افزودن به سبد خرید"}
              </span>
            </>
          )}
        </div>
      </button>

      {showCounter && isAvailable && (
        <div
          className="flex items-center justify-center gap-1.5 text-[11px] font-bold font-sans"
          style={{ color: "var(--text-secondary)" }}
          suppressHydrationWarning
        >
          <span
            className={
              "font-mono font-black transition-all " +
              (bumpCounter
                ? "animate-kinetic-counter-bump text-emerald-500"
                : "")
            }
            style={!bumpCounter ? { color: "var(--text-primary)" } : {}}
          >
            {mounted ? currentCount : 0}
          </span>
          <span>عدد در سبد شما</span>
        </div>
      )}

      {/* مدال تمام‌صفحه ثبت شماره موبایل برای پیامک موجودی کالا */}
      {mounted &&
        notifyModalOpen &&
        createPortal(
          <div
            onClick={(e) => {
              e.stopPropagation();
              setNotifyModalOpen(false);
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans animate-fadeIn"
            dir="rtl"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-4 text-xs text-[var(--text-primary)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔔</span>
                  <h3 className="font-black text-sm text-amber-400">
                    اطلاع‌رسانی پیامکی موجود شدن کالا
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifyModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <img
                  src={guaranteedImage}
                  alt={productTitle}
                  className="w-12 h-12 rounded-xl object-contain bg-[var(--modal-bg)] p-1 border border-[var(--card-border)] shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-black text-xs line-clamp-2">
                    {productTitle}
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                    فعلاً ناموجود • ارسال پیامک خودکار به محض شارژ انبار
                  </span>
                </div>
              </div>

              {notifyResult && (
                <div
                  className={
                    "p-3.5 rounded-2xl font-bold leading-relaxed " +
                    (notifyResult.ok
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-400")
                  }
                >
                  {notifyResult.text}
                </div>
              )}

              <form onSubmit={handleSubmitBackInStock} className="space-y-3">
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    شماره موبایل شما جهت دریافت پیامک موجودی *
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    required
                    maxLength={11}
                    value={notifyPhone}
                    onChange={(e) => setNotifyPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-center text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={notifySubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg cursor-pointer hover:opacity-95 transition disabled:opacity-50"
                >
                  {notifySubmitting
                    ? "در حال ثبت درخواست..."
                    : "✓ ثبت شماره و اطلاع‌رسانی پیامکی"}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
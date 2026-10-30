"use client";

import React, { useState, useEffect } from "react";
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
  const hasColors =
    Array.isArray(product.color_options) && product.color_options.length > 0;

  useEffect(() => { setMounted(true); }, []);

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

  const doAddToCart = (colorName?: string) => {
    soundEngine.playAddToCart();
    setAnimState("adding");
    addToCart(
      {
        id: product.id,
        title: product.title || product.name,
        name: product.title || product.name,
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable || isMaxReached || animState !== "idle") return;
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

  const isAnimating = animState === "adding";

  return (
    <div
      className={"flex flex-col items-center gap-1.5 w-full select-text relative " + className}
      dir="rtl"
      suppressHydrationWarning
    >
      {/* Color Picker Popup */}
      {showColorPicker && hasColors && (
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
            <span className="font-black text-[11px]" style={{ color: "var(--text-primary)" }}>
              انتخاب رنگ
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowColorPicker(false);
              }}
              className="w-5 h-5 flex items-center justify-center rounded-full text-base leading-none transition-colors"
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
                className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition"
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

      {/* Main Button — گرادیان آبی‌بنفش کپسولی */}
      <button
        type="button"
        disabled={!isAvailable || isMaxReached}
        onClick={handleAddToCart}
        className="relative w-full h-[50px] rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-[0.98]"
        style={
          !isAvailable || isMaxReached
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
        <div className="relative w-full h-full flex items-center justify-center px-4 overflow-hidden">
          {/* Cart icon */}
          <div
            className={
              "flex items-center justify-center transition-all duration-300 " +
              (isAnimating
                ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-kinetic-cart-left z-20"
                : "translate-x-0")
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
              className="w-5 h-5 shrink-0"
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

          {/* Label */}
          <span
            className={
              "font-black text-xs tracking-wider mr-2.5 transition-all duration-300 whitespace-nowrap " +
              (isAnimating
                ? "opacity-0 scale-75 -translate-x-6 pointer-events-none w-0 overflow-hidden"
                : "opacity-100 scale-100 translate-x-0")
            }
          >
            {isMaxReached
              ? "حداکثر موجودی"
              : !isAvailable
              ? "ناموجود"
              : "افزودن به سبد خرید"}
          </span>
        </div>
      </button>

      {showCounter && (
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
            style={
              !bumpCounter ? { color: "var(--text-primary)" } : {}
            }
          >
            {mounted ? currentCount : 0}
          </span>
          <span>عدد در سبد شما</span>
        </div>
      )}
    </div>
  );
}

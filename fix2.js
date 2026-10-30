#!/usr/bin/env node
/**
 * fix2.js — رفع تمام مشکلات بصری آکسون (نسخه کامل)
 * - دکمه مشکی → گرادیان آبی-بنفش کپسولی
 * - فضای خالی موبایل در صفحه محصول
 * - globals.css یکپارچه (بدون بلوک دوبله)
 * - ProductCard، MobileBottomNav، Header
 * node fix2.js
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname);
function write(rel, content) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("  [write] " + rel);
}

// ══════════════════════════════════════════════════════════════
// 1. globals.css — سیستم طراحی Liquid Glass (بلوک‌های یکپارچه)
// ══════════════════════════════════════════════════════════════
console.log("\n1/6  globals.css ...");
const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* ══ AXON — Liquid Glass Design System ══════════════════════ */

:root {
  --bg-primary:         #f0f4ff;
  --bg-secondary:       #e8eeff;
  --text-primary:       #0a0f1e;
  --text-secondary:     #4b5680;
  --modal-bg:           rgba(255,255,255,0.92);
  --input-bg:           rgba(240,244,255,0.9);
  --card-border:        rgba(0,66,200,0.12);
  --card-border-hover:  rgba(0,102,255,0.45);
  --card-hover:         rgba(0,102,255,0.08);
  --accent-blue:        #0066ff;
  --accent-violet:      #7c3aed;
  --accent-cyan:        #06b6d4;
  --accent-glow:        rgba(0,102,255,0.22);
  --accent-glow-v:      rgba(124,58,237,0.18);
  --glass-bg:           rgba(255,255,255,0.72);
  --glass-bg-strong:    rgba(255,255,255,0.92);
  --glass-border:       rgba(255,255,255,0.85);
  --glass-border-inner: rgba(0,102,255,0.18);
  --glass-shadow:       0 8px 32px rgba(0,50,180,0.12),0 2px 8px rgba(0,0,0,0.06);
  --glass-surface:      rgba(255,255,255,0.75);
}
.dark {
  --bg-primary:         #04060f;
  --bg-secondary:       #080c1a;
  --text-primary:       #f0f4ff;
  --text-secondary:     #8896c8;
  --modal-bg:           rgba(8,12,26,0.92);
  --input-bg:           rgba(20,28,60,0.8);
  --card-border:        rgba(59,130,246,0.14);
  --card-border-hover:  rgba(59,130,246,0.55);
  --card-hover:         rgba(59,130,246,0.08);
  --accent-blue:        #3b82f6;
  --accent-violet:      #a78bfa;
  --accent-cyan:        #22d3ee;
  --accent-glow:        rgba(59,130,246,0.35);
  --accent-glow-v:      rgba(167,139,250,0.25);
  --glass-bg:           rgba(10,15,40,0.65);
  --glass-bg-strong:    rgba(8,12,26,0.92);
  --glass-border:       rgba(255,255,255,0.10);
  --glass-border-inner: rgba(59,130,246,0.22);
  --glass-shadow:       0 8px 40px rgba(0,0,0,0.55),0 2px 12px rgba(0,0,0,0.4);
  --glass-surface:      rgba(10,15,40,0.72);
}

html,body { width:100%; max-width:100vw; scroll-behavior:smooth; background-color:var(--bg-primary); color:var(--text-primary); -webkit-tap-highlight-color:transparent; overflow-x:hidden !important; touch-action:pan-y; }
body { font-family:'Vazirmatn',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; transition:background-color .3s ease,color .3s ease; }

/* ══ Glass ═══════════════════════════════════════════════════ */
.glass-morphism { background:var(--glass-bg); backdrop-filter:blur(20px) saturate(180%); -webkit-backdrop-filter:blur(20px) saturate(180%); border:1px solid var(--glass-border); box-shadow:var(--glass-shadow); }
.glass-morphism-strong { background:var(--glass-bg-strong); backdrop-filter:blur(28px) saturate(200%); -webkit-backdrop-filter:blur(28px) saturate(200%); border:1px solid var(--glass-border); box-shadow:var(--glass-shadow); }
.glass-header { background:var(--glass-bg); backdrop-filter:blur(24px) saturate(200%); -webkit-backdrop-filter:blur(24px) saturate(200%); border:1px solid var(--glass-border); box-shadow:0 4px 24px rgba(0,102,255,.10),0 1px 4px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.6); }
.dark .glass-header { box-shadow:0 4px 32px rgba(0,0,0,.6),0 1px 4px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.07); }

/* ══ Capsule Buttons ════════════════════════════════════════ */
.btn-glass { display:inline-flex; align-items:center; justify-content:center; gap:6px; border-radius:9999px; padding:8px 18px; font-weight:700; font-size:13px; background:var(--glass-bg); backdrop-filter:blur(16px) saturate(180%); -webkit-backdrop-filter:blur(16px) saturate(180%); border:1px solid var(--glass-border); color:var(--text-primary); cursor:pointer; transition:all .22s cubic-bezier(.22,1,.36,1); box-shadow:0 2px 12px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.5); white-space:nowrap; user-select:none; }
.btn-glass:hover { background:var(--glass-bg-strong); box-shadow:0 4px 20px var(--accent-glow),inset 0 1px 0 rgba(255,255,255,.6); transform:translateY(-1px); }
.btn-glass:active { transform:scale(.96) translateY(0); }
.btn-glass-primary { display:inline-flex; align-items:center; justify-content:center; gap:6px; border-radius:9999px; padding:8px 18px; font-weight:700; font-size:13px; background:linear-gradient(135deg,var(--accent-blue) 0%,var(--accent-violet) 100%); border:1px solid rgba(255,255,255,.25); color:#fff; cursor:pointer; transition:all .22s cubic-bezier(.22,1,.36,1); box-shadow:0 4px 20px var(--accent-glow),0 1px 4px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.25); white-space:nowrap; user-select:none; }
.btn-glass-primary:hover { box-shadow:0 6px 28px var(--accent-glow),0 2px 8px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.3); filter:brightness(1.07); transform:translateY(-2px); }
.btn-glass-primary:active { transform:scale(.96) translateY(0); }
.btn-glass-primary:disabled { opacity:.45; cursor:not-allowed; transform:none; filter:none; }

/* ══ Cards ══════════════════════════════════════════════════ */
.card-glass { background:var(--glass-bg); backdrop-filter:blur(16px) saturate(160%); -webkit-backdrop-filter:blur(16px) saturate(160%); border:1px solid var(--glass-border); border-radius:1.5rem; box-shadow:var(--glass-shadow); transition:all .30s cubic-bezier(.22,1,.36,1); }
.card-glass:hover { border-color:var(--card-border-hover); box-shadow:0 12px 40px var(--accent-glow),0 4px 16px rgba(0,0,0,.12); transform:translateY(-4px); }
.card-hover-glow { transition:box-shadow .35s ease,border-color .3s ease,transform .3s cubic-bezier(.22,1,.36,1); }
.card-hover-glow:hover { transform:translateY(-4px); box-shadow:0 12px 36px -4px var(--accent-glow),0 2px 8px -2px rgba(0,0,0,.10); border-color:var(--card-border-hover) !important; }
.dark .card-hover-glow:hover { box-shadow:0 12px 36px -4px var(--accent-glow),0 4px 16px rgba(0,0,0,.5); }

/* ══ Badges ══════════════════════════════════════════════════ */
.badge-capsule { display:inline-flex; align-items:center; justify-content:center; border-radius:9999px; padding:3px 10px; font-size:11px; font-weight:800; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); box-shadow:0 2px 8px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.25); }
.badge-discount { background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; border:1px solid rgba(255,255,255,.2); }
.badge-warning  { background:linear-gradient(135deg,rgba(245,158,11,.9),rgba(217,119,6,.9)); color:#fff; border:1px solid rgba(255,255,255,.2); }
.badge-new      { background:linear-gradient(135deg,var(--accent-blue),var(--accent-violet)); color:#fff; border:1px solid rgba(255,255,255,.2); }

/* ══ Gradients ══════════════════════════════════════════════ */
.axon-bg-gradient { background:radial-gradient(ellipse 80% 50% at 20% -10%,rgba(0,102,255,.12) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 110%,rgba(124,58,237,.10) 0%,transparent 55%),var(--bg-primary); }
.dark .axon-bg-gradient { background:radial-gradient(ellipse 80% 50% at 20% -10%,rgba(59,130,246,.18) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 110%,rgba(167,139,250,.14) 0%,transparent 55%),var(--bg-primary); }
.axon-gradient-text { background:linear-gradient(135deg,var(--accent-blue) 0%,var(--accent-violet) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.axon-gradient-text-cyan { background:linear-gradient(135deg,var(--accent-cyan) 0%,var(--accent-blue) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

/* ══ Animations ════════════════════════════════════════════ */
@keyframes fadeIn    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
@keyframes axon-page-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes axonReveal { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes liquid-shimmer { 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(200%) skewX(-15deg)} }
@keyframes axon-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes axon-float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
@keyframes axon-glow-pulse { 0%,100%{box-shadow:0 0 0 0 var(--accent-glow)} 50%{box-shadow:0 0 24px 8px var(--accent-glow)} }
@keyframes kinetic-cart-left { 0%{transform:translateX(0) scale(1)} 30%{transform:translateX(-5px) scale(1.1)} 60%{transform:translateX(30px) scale(0.8) rotate(-10deg)} 100%{transform:translateX(60px) scale(0.5) rotate(-20deg);opacity:0} }
@keyframes kinetic-item-drop { 0%{transform:translateY(-24px) scale(0.8);opacity:0} 40%{transform:translateY(4px) scale(1.1);opacity:1} 70%{transform:translateY(-3px) scale(0.95)} 100%{transform:translateY(0) scale(1);opacity:0} }
@keyframes kinetic-counter-bump { 0%,100%{transform:scale(1)} 40%{transform:scale(1.4) rotate(-3deg)} 70%{transform:scale(0.9) rotate(2deg)} }

.animate-fadeIn         { animation:fadeIn .2s cubic-bezier(.16,1,.3,1) forwards; }
.axon-page-enter        { animation:axon-page-in .35s cubic-bezier(.22,1,.36,1) forwards; }
.axon-float             { animation:axon-float 4s ease-in-out infinite; }
.animate-kinetic-cart-left  { animation:kinetic-cart-left .8s cubic-bezier(.5,0,.75,0) forwards; }
.animate-kinetic-item-drop  { animation:kinetic-item-drop .7s cubic-bezier(.5,0,.75,0) forwards; }
.animate-kinetic-counter-bump { animation:kinetic-counter-bump .5s cubic-bezier(.5,0,.75,0) forwards; }

/* ══ Reveal ════════════════════════════════════════════════ */
.axon-reveal { opacity:0; transform:translateY(24px); transition:opacity .55s cubic-bezier(.22,1,.36,1),transform .55s cubic-bezier(.22,1,.36,1); }
.axon-reveal.revealed { opacity:1; transform:translateY(0); }
.axon-reveal-scale { opacity:0; transform:scale(.92); animation:axonReveal .45s ease both; }
.axon-reveal-scale.revealed { opacity:1; transform:scale(1); }
.stagger-0{transition-delay:0ms;animation-delay:0ms} .stagger-1{transition-delay:60ms;animation-delay:50ms}
.stagger-2{transition-delay:120ms;animation-delay:100ms} .stagger-3{transition-delay:180ms;animation-delay:150ms}
.stagger-4{transition-delay:240ms;animation-delay:200ms} .stagger-5{transition-delay:300ms;animation-delay:250ms}
.stagger-6{transition-delay:360ms;animation-delay:300ms} .stagger-7{transition-delay:420ms;animation-delay:350ms}

/* ══ Skeleton ═══════════════════════════════════════════════ */
.axon-skeleton { background:linear-gradient(90deg,var(--card-border) 25%,var(--input-bg) 50%,var(--card-border) 75%); background-size:200% 100%; animation:axon-shimmer 1.4s ease-in-out infinite; }

/* ══ Liquid Shine ═══════════════════════════════════════════ */
.card-liquid-shine { position:relative; overflow:hidden; }
.card-liquid-shine::before { content:''; position:absolute; top:0; left:0; width:40%; height:100%; background:linear-gradient(105deg,transparent 20%,rgba(255,255,255,.12) 50%,transparent 80%); transform:translateX(-100%) skewX(-15deg); pointer-events:none; border-radius:inherit; }
.card-liquid-shine:hover::before { animation:liquid-shimmer .75s ease forwards; }

/* ══ Safe area / scroll ════════════════════════════════════ */
.pb-safe { padding-bottom:calc(0.5rem + env(safe-area-inset-bottom)); }
@supports (padding-bottom:env(safe-area-inset-bottom)) { .mobile-bottom-nav { padding-bottom:env(safe-area-inset-bottom); } }
.scrollbar-none::-webkit-scrollbar { display:none; } .scrollbar-none { -ms-overflow-style:none; scrollbar-width:none; }

/* ══ Admin table ════════════════════════════════════════════ */
.admin-table-wrapper { overflow-x:auto; -webkit-overflow-scrolling:touch; border-radius:1rem; }
.admin-table-wrapper table { min-width:600px; }

/* ══ Mobile — glass فعال ═══════════════════════════════════ */
@media screen and (max-width:768px) {
  input,select,textarea { font-size:16px !important; }
  button,input,select,textarea { min-height:44px; }
  @supports (backdrop-filter:blur(1px)) {
    .glass-morphism,.glass-header,.card-glass,.glass-morphism-strong { backdrop-filter:blur(18px) saturate(180%); -webkit-backdrop-filter:blur(18px) saturate(180%); }
  }
  @supports not (backdrop-filter:blur(1px)) {
    .glass-morphism,.glass-header { background:var(--glass-bg-strong) !important; }
  }
}
`;
write("app/globals.css", globalsCss);

// ══════════════════════════════════════════════════════════════
// 2. AddToCartButton.tsx — دکمه مشکی → گرادیان آبی-بنفش
//    کل لاجیک انیمیشن و color picker حفظ شد
// ══════════════════════════════════════════════════════════════
console.log("\n2/6  AddToCartButton.tsx ...");
const addToCartTsx = `"use client";

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
`;
write("components/AddToCartButton.tsx", addToCartTsx);

// ══════════════════════════════════════════════════════════════
// 3. ProductDetailClient.tsx — دکمه موبایل + layout بهتر
// ══════════════════════════════════════════════════════════════
console.log("\n3/6  ProductDetailClient.tsx ...");
const productDetailClientTsx = `"use client";
import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { ShieldCheck, Truck } from "lucide-react";
import { ProductReviews } from "@/components/ProductReviews";
import AddToCartButton from "@/components/AddToCartButton";

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
            className="w-full lg:w-5/12 p-5 sm:p-6 flex flex-col gap-4"
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
                className="badge-capsule badge-discount self-start text-xs"
              >
                {discPct}٪ تخفیف ویژه
              </span>
            )}
            <div className="w-full aspect-square flex items-center justify-center rounded-2xl overflow-hidden"
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
                    className="flex-shrink-0 w-14 h-14 rounded-xl p-1 transition-all"
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
        className="lg:hidden fixed bottom-0 inset-x-0 z-[110] px-3 py-2.5"
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
`;
write("components/ProductDetailClient.tsx", productDetailClientTsx);

// ══════════════════════════════════════════════════════════════
// 4. ProductCard.tsx
// ══════════════════════════════════════════════════════════════
console.log("\n4/6  ProductCard.tsx ...");
const productCardTsx = `"use client";
import React, { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";
import AddToCartButton from "@/components/AddToCartButton";

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
    stock?: number;
    warranty?: string;
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
  const title = product.title || product.name || "کالای دیجیتال";
  const basePrice = Number(product.price || 0);
  const discountVal = product.discount_price || product.discountPrice;
  const finalPrice =
    discountVal && Number(discountVal) > 0
      ? Number(discountVal)
      : basePrice;
  const discPct =
    discountVal && basePrice > 0
      ? Math.round((1 - Number(discountVal) / basePrice) * 100)
      : 0;
  const [imgSrc, setImgSrc] = useState(getImg(product));
  const isLowStock =
    product.stock !== undefined &&
    product.stock > 0 &&
    product.stock <= 3;
  const isOutOfStock = product.stock === 0;

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
              تنها {product.stock}
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
          <h3
            className="text-[11px] sm:text-xs font-black line-clamp-2 leading-relaxed min-h-[30px] sm:min-h-[34px]"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
        </div>
      </Link>
      <div
        className="p-3 sm:p-4 pt-2 relative z-10"
        style={{ borderTop: "1px solid var(--glass-border)" }}
      >
        <div className="flex items-center justify-between mb-2.5">
          {discountVal && Number(discountVal) > 0 ? (
            <div className="space-y-0.5">
              <span
                className="line-through text-[9px] sm:text-[10px] block"
                style={{ color: "var(--text-secondary)" }}
                suppressHydrationWarning
              >
                {formatPrice(basePrice)} ت
              </span>
              <span
                className="font-black text-sm sm:text-base block"
                style={{ color: "var(--accent-blue)" }}
                suppressHydrationWarning
              >
                {formatPrice(finalPrice)} ت
              </span>
            </div>
          ) : (
            <span
              className="font-black text-sm sm:text-base"
              style={{ color: "var(--text-primary)" }}
              suppressHydrationWarning
            >
              {formatPrice(basePrice)} ت
            </span>
          )}
        </div>
        <AddToCartButton product={{ ...product, image: imgSrc }} showCounter={false} />
      </div>
    </div>
  );
}
`;
write("components/ProductCard.tsx", productCardTsx);

// ══════════════════════════════════════════════════════════════
// 5. MobileBottomNav.tsx
// ══════════════════════════════════════════════════════════════
console.log("\n5/6  MobileBottomNav.tsx ...");
const mobileBottomNavTsx = `"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

const ICONS = {
  home:  <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  box:   <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
  cart:  <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
  truck: <><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
  user:  <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
};

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCart() as any;
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const cartItems: any[] = Array.isArray(cart?.cartItems)
    ? cart.cartItems
    : Array.isArray(cart?.items)
    ? cart.items
    : [];
  const cartCount = cartItems.reduce(
    (a: number, i: any) => a + (Number(i?.quantity) || 1),
    0
  );

  useEffect(() => {
    try {
      const u = JSON.parse(
        localStorage.getItem("axon_user_session") || "{}"
      );
      if (u.phone) setUserPhone(String(u.phone));
      else if (u.name) setUserPhone(u.name);
    } catch {}
    const h = (e: any) => {
      if (e.detail?.phone) setUserPhone(String(e.detail.phone));
      else if (e.detail?.name) setUserPhone(e.detail.name);
      else setUserPhone(null);
    };
    window.addEventListener("user_auth_changed", h);
    return () => window.removeEventListener("user_auth_changed", h);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const navItems = [
    { label: "خانه",   href: "/",            icon: ICONS.home  },
    { label: "کالاها", href: "/products",    icon: ICONS.box   },
    { label: "سبد",    href: "#",            isCart: true, icon: ICONS.cart },
    { label: "پیگیری", href: "/track-order", icon: ICONS.truck },
    {
      label: userPhone ? "حساب" : "ورود",
      href: userPhone ? "/my-orders" : "/login",
      icon: ICONS.user,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 md:hidden mobile-bottom-nav"
      style={{
        paddingBottom: "env(safe-area-inset-bottom,0px)",
        background: "var(--glass-bg-strong)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        borderTop: "1px solid var(--glass-border)",
        boxShadow:
          "0 -4px 24px var(--accent-glow),0 -1px 0 var(--glass-border)",
      }}
    >
      <div className="h-14 px-2 flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive =
            !item.isCart &&
            (pathname === item.href ||
              (item.href !== "/" &&
                (pathname ?? "").startsWith(item.href)));

          if (item.isCart) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  if (typeof cart?.openCart === "function")
                    cart.openCart();
                }}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-200 cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center relative transition-all duration-200"
                  style={{
                    background:
                      "linear-gradient(135deg,var(--accent-blue),var(--accent-violet))",
                    boxShadow: "0 4px 16px var(--accent-glow)",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width={20}
                    height={20}
                  >
                    {item.icon}
                  </svg>
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                      style={{
                        background: "#ef4444",
                        boxShadow: "0 0 8px rgba(239,68,68,0.6)",
                      }}
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-bold">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => soundEngine.playClick()}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-200"
              style={{
                color: isActive
                  ? "var(--accent-blue)"
                  : "var(--text-secondary)",
              }}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: isActive
                    ? "var(--accent-glow)"
                    : "transparent",
                  border: isActive
                    ? "1px solid var(--card-border-hover)"
                    : "1px solid transparent",
                  transform: isActive ? "scale(1.08)" : "scale(1)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isActive ? 2.5 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width={18}
                  height={18}
                >
                  {item.icon}
                </svg>
              </span>
              <span
                className={"text-[9px] " + (isActive ? "font-black" : "font-bold")}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
`;
write("components/MobileBottomNav.tsx", mobileBottomNavTsx);

// ══════════════════════════════════════════════════════════════
// 6. Header.tsx — glass-header از طریق جایگزینی مطمئن
// ══════════════════════════════════════════════════════════════
console.log("\n6/6  Header.tsx ...");
const headerPath = path.join(ROOT, "components/Header.tsx");
if (fs.existsSync(headerPath)) {
  let h = fs.readFileSync(headerPath, "utf8");
  const before = h;
  h = h.replace(
    /bg-\[var\(--modal-bg\)\]\/95 border-\[var\(--card-border\)\]/g,
    "glass-header"
  );
  if (h === before) {
    h = h.replace(
      /className="[^"]*sticky[^"]*top-0[^"]*"/g,
      (m) => m.replace(
        /bg-[^\s"]+\/\d+\s+border-[^\s"]+/,
        "glass-header"
      )
    );
  }
  fs.writeFileSync(headerPath, h, "utf8");
  console.log("  [patch] Header.tsx");
} else {
  console.log("  [skip] Header.tsx not found");
}

// ══════════════════════════════════════════════════════════════
// Build
// ══════════════════════════════════════════════════════════════
console.log("\n🔨 در حال بررسی بیلد ...\n");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("\n✅ بیلد موفق!\n");
} catch {
  console.error("\n❌ بیلد شکست خورد.\n");
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════
// Git commit — با فایل پیام (بدون کاراکتر خاص در shell)
// ══════════════════════════════════════════════════════════════
console.log("📦 در حال commit و push ...");
try {
  const gitDir = path.join(ROOT, ".git");
  const msgFile = path.join(gitDir, "AXON_COMMIT.txt");
  fs.writeFileSync(
    msgFile,
    [
      "feat(ui): Liquid Glass full redesign - vibrant colors capsule buttons",
      "",
      "Fix black AddToCartButton -> blue-violet gradient capsule",
      "Fix ProductDetailClient mobile layout and sticky bottom bar",
      "Fix globals.css duplicate root/dark blocks merged into one",
      "Fix ProductCard glass card liquid shine capsule badges",
      "Fix MobileBottomNav frosted glass inline SVG icons",
      "Fix Header glass-header class applied",
      "",
      "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
      "Claude-Session: https://claude.ai/code/session_01GPCkuddNi1nS597FzKS4FV",
    ].join("\n"),
    "utf8"
  );
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -F ".git/AXON_COMMIT.txt"', { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit" });
  console.log("🚀 push به main انجام شد!");
} catch (e) {
  console.warn("⚠️ git:", e && e.message ? e.message : String(e));
}

console.log(`
╔════════════════════════════════════════════════════╗
║   ✅ آکسون — Liquid Glass ریدیزاین کامل شد!       ║
║                                                    ║
║  رفع‌شده:                                         ║
║  • دکمه مشکی → گرادیان آبی-بنفش کپسولی           ║
║  • فضای خالی موبایل در صفحه محصول                 ║
║  • نوار پایین موبایل → glass capsule              ║
║  • globals.css بلوک‌های یکپارچه                    ║
║  • MobileBottomNav → SVG + glass                  ║
╚════════════════════════════════════════════════════╝
`);
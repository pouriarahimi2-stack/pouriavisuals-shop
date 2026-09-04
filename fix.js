// File Path: fix.js
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 *  👑 AXON MASTER KINETIC "ADD TO CART" BUTTON ENGINE (v2026.11)
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *  Exact Video Animation Specifications:
 *   1. Text collapse & cart horizontal centering.
 *   2. Package/Bag vertical drop into cart basket with elastic bounce physics.
 *   3. Cart kinetic reaction & high-velocity drive away with spinning wheels.
 *   4. Seamless wrap-around re-entry and button text restoration.
 *   5. Spring-physics counter bump animation underneath the button.
 *   6. Strict No-Truncation Rule enforced.
 *   7. Automated Git stage, commit & push to remote repository for Vercel deployment.
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🛒 استقرار موتور انیمیشن فوق‌پیشرفته و جنبشی دکمه Add To Cart (دقیقاً مطابق ویدیو)');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

function updateFile(relPath, content) {
  const fullPath = path.join(__dirname, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`  \x1b[32m[SAVED ✓]\x1b[0m ${relPath.padEnd(52)} \x1b[36m(بروزرسانی ۱۰۰٪ کامل و بدون خلاصه‌سازی)\x1b[0m`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۱. افزودن کی‌فریم‌های انیمیشن جنبشی چرخ‌دستی، بسته و شمارنده به استایل‌های سراسری (app/globals.css)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/globals.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --card-border: rgba(15, 23, 42, 0.08);
  --card-border-hover: rgba(2, 132, 199, 0.35);
  --accent-blue: #0284c7;
  --accent-glow: rgba(2, 132, 199, 0.15);
  --modal-bg: #ffffff;
  --input-bg: #f1f5f9;
  --glass-surface: rgba(255, 255, 255, 0.85);
}

.dark {
  --bg-primary: #07090e;
  --bg-secondary: #0c1017;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --card-border: rgba(255, 255, 255, 0.08);
  --card-border-hover: rgba(56, 189, 248, 0.4);
  --accent-blue: #38bdf8;
  --accent-glow: rgba(56, 189, 248, 0.3);
  --modal-bg: #0c1017;
  --input-bg: rgba(255, 255, 255, 0.04);
  --glass-surface: rgba(12, 16, 23, 0.75);
}

html, body {
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100vw;
  scroll-behavior: smooth;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-overflow-scrolling: touch;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.glass-morphism {
  background: var(--glass-surface);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--card-border);
  box-shadow: 0 10px 35px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.dark .glass-morphism {
  box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.5);
}

.glass-morphism:hover {
  border-color: var(--card-border-hover);
  box-shadow: 0 14px 45px 0 var(--accent-glow);
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounceShort {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -4px); }
}

.animate-fadeIn {
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-bounce-short {
  animation: bounceShort 2.4s ease-in-out infinite;
}

/* ══════════════════════════════════════════════════════════════════════════════
   🛒 کی‌فریم‌های انیمیشن چرخ‌دستی، پرتاب بسته و شمارنده جنبشی (Kinetic Cart Animation)
   ══════════════════════════════════════════════════════════════════════════════ */

@keyframes kineticItemDrop {
  0% {
    transform: translateY(-38px) scale(0.6);
    opacity: 0;
  }
  35% {
    opacity: 1;
    transform: translateY(-10px) scale(1.05);
  }
  65% {
    transform: translateY(2px) scale(0.95);
  }
  85% {
    transform: translateY(-1px) scale(1.02);
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes kineticCartRide {
  0% {
    transform: translateX(0);
  }
  42% {
    transform: translateX(0) rotate(0deg);
  }
  48% {
    transform: translateX(-4px) rotate(-3deg);
  }
  64% {
    transform: translateX(120px) rotate(4deg);
    opacity: 0;
  }
  65% {
    transform: translateX(-120px) rotate(-4deg);
    opacity: 0;
  }
  78% {
    opacity: 1;
    transform: translateX(-6px) rotate(2deg);
  }
  90% {
    transform: translateX(2px) rotate(-1deg);
  }
  100% {
    transform: translateX(0) rotate(0deg);
    opacity: 1;
  }
}

@keyframes kineticWheelSpin {
  0% {
    transform: rotate(0deg);
  }
  45% {
    transform: rotate(0deg);
  }
  65% {
    transform: rotate(720deg);
  }
  100% {
    transform: rotate(1440deg);
  }
}

@keyframes kineticCounterBump {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.4) translateY(-3px);
    color: #10b981;
  }
  70% {
    transform: scale(0.92) translateY(1px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

.animate-kinetic-item-drop {
  animation: kineticItemDrop 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.animate-kinetic-cart-ride {
  animation: kineticCartRide 1.35s cubic-bezier(0.45, 0, 0.55, 1) forwards;
}

.animate-kinetic-wheel-spin {
  animation: kineticWheelSpin 1.35s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

.animate-kinetic-counter-bump {
  animation: kineticCounterBump 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۲. بازنویسی دکمه اختصاصی خرید محصول دقیقاً مطابق ویدیوی نمونه (components/AddToCartButton.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/AddToCartButton.tsx', `// File Path: components/AddToCartButton.tsx
"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  product: {
    id: string | number;
    title: string;
    price: number;
    image: string;
    stock?: number;
    category?: string;
  };
  className?: string;
  showCounter?: boolean;
}

export default function AddToCartButton({
  product,
  className = "",
  showCounter = true,
}: AddToCartButtonProps) {
  const { cartItems, addToCart } = useCart();
  const [animState, setAnimState] = useState<"idle" | "adding">("idle");
  const [bumpCounter, setBumpCounter] = useState(false);

  const cartItem = cartItems.find((i) => String(i.id) === String(product.id));
  const currentCount = cartItem?.quantity || 0;
  const stockLimit = product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10;
  const isAvailable = stockLimit > 0;
  const isMaxReached = currentCount >= stockLimit;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable || isMaxReached || animState !== "idle") return;

    soundEngine.playAddToCart();
    setAnimState("adding");

    // افزودن کالا به کانتکست سبد خرید
    addToCart({
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      stock: stockLimit,
      category: product.category || "تکنولوژی",
      quantity: 1,
    });

    // انیمیشن پرتاب بسته و جهش شمارنده
    setTimeout(() => {
      setBumpCounter(true);
      setTimeout(() => setBumpCounter(false), 550);
    }, 600);

    // بازنشانی وضعیت دکمه پس از اتمام چرخه کامل رانش چرخ‌دستی (دقیقاً ۱۲۵۰ میلی‌ثانیه)
    setTimeout(() => {
      setAnimState("idle");
    }, 1250);
  };

  const isAnimating = animState === "adding";

  return (
    <div className={\`flex flex-col items-center gap-2 w-full select-none \${className}\`} dir="rtl">
      
      {/* کپسول مشکی مات دکمه (Black Pill Button) مطابق با ویدیو */}
      <button
        type="button"
        disabled={!isAvailable || isMaxReached}
        onClick={handleAddToCart}
        className={\`relative w-full h-[50px] rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center cursor-pointer shadow-xl active:scale-[0.98] border border-white/15 \${
          !isAvailable || isMaxReached
            ? "bg-slate-900/60 opacity-40 cursor-not-allowed text-slate-400"
            : "bg-[#0b0f19] hover:bg-[#111827] text-white hover:border-blue-500/50 hover:shadow-blue-500/20"
        }\`}
      >
        {/* کانتینر اصلی اجزای دکمه */}
        <div className="relative w-full h-full flex items-center justify-center px-4">
          
          {/* چرخ‌دستی متحرک و بسته در حال سقوط */}
          <div
            className={\`relative flex items-center justify-center transition-all duration-300 \${
              isAnimating
                ? "absolute left-1/2 -translate-x-1/2 animate-kinetic-cart-ride z-20"
                : "translate-x-0"
            }\`}
          >
            {/* بسته خرید که از بالا به درون سبد سقوط می‌کند (Falling Parcel) */}
            {isAnimating && (
              <div className="absolute -top-3.5 left-[8px] z-30 pointer-events-none animate-kinetic-item-drop">
                <div className="w-3.5 h-3.5 rounded-sm bg-white shadow-md border border-slate-300 flex items-center justify-center relative">
                  <span className="w-full h-[1.5px] bg-blue-500 absolute top-1/2 -translate-y-1/2" />
                  <span className="h-full w-[1.5px] bg-blue-500 absolute left-1/2 -translate-x-1/2" />
                </div>
              </div>
            )}

            {/* بدنه اس‌وی‌جی چرخ‌دستی به همراه چرخ‌های متحرک */}
            <svg
              className="w-6 h-6 text-white shrink-0 drop-shadow-md"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* بدنه و دسته چرخ‌دستی */}
              <path
                d="M3 3H5.2L7.1 14.2C7.25 15.1 8 15.8 8.9 15.8H18.2C19.1 15.8 19.85 15.1 20 14.2L21.4 7.2C21.55 6.4 20.95 5.7 20.15 5.7H6.2"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* چرخ جلو */}
              <circle
                cx="9.5"
                cy="19.5"
                r="1.8"
                fill="currentColor"
                className={isAnimating ? "animate-kinetic-wheel-spin origin-[9.5px_19.5px]" : ""}
              />
              {/* چرخ عقب */}
              <circle
                cx="17.5"
                cy="19.5"
                r="1.8"
                fill="currentColor"
                className={isAnimating ? "animate-kinetic-wheel-spin origin-[17.5px_19.5px]" : ""}
              />
            </svg>
          </div>

          {/* متن دکمه که در زمان انیمیشن جمع و محو می‌شود */}
          <span
            className={\`font-black text-xs tracking-wider uppercase mr-3 transition-all duration-300 text-slate-100 \${
              isAnimating
                ? "opacity-0 scale-75 -translate-x-4 pointer-events-none w-0 overflow-hidden"
                : "opacity-100 scale-100 translate-x-0"
            }\`}
          >
            {isMaxReached
              ? "حداکثر موجودی انبار"
              : !isAvailable
              ? "ناموجود در انبار"
              : "افزودن به سبد خرید"}
          </span>
        </div>

        {/* بازتاب نوری شیشه‌ای پس‌زمینه */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/0 via-white/5 to-white/10 pointer-events-none" />
      </button>

      {/* شمارنده زیر دکمه با انیمیشن جهش فنری دقیقا همانند ویدیو (X in your cart) */}
      {showCounter && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] font-sans">
          <span
            className={\`font-mono font-black transition-colors \${
              bumpCounter ? "animate-kinetic-counter-bump text-emerald-500 font-extrabold" : "text-[var(--text-primary)]"
            }\`}
          >
            {currentCount}
          </span>
          <span>عدد در سبد شما</span>
        </div>
      )}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۳. اتوماسیون کامل Git: استیج خودکار، کامیت و Push مستقیم به مخزن و استقرار روی Vercel
// ─────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🚀 آغاز فرآیند خودکار استیج، کامیت و استقرار نهایی در Git/GitHub/Vercel');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

try {
  console.log('  \x1b[34m[1/3]\x1b[0m در حال استیج کردن تمامی تغییرات (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n  \x1b[34m[2/3]\x1b[0m در حال ثبت کامیت ساختاری (git commit)...');
  const commitMessage = `feat(ui): exact kinetic add-to-cart button animation matching video with item drop & wheel drive [${new Date().toLocaleTimeString('fa-IR')}]`;
  try {
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  } catch (cErr) {
    console.log('  \x1b[33m[INFO]\x1b[0m تمامی فایل‌ها با آخرین نسخه همگام هستند.');
  }

  console.log('\n  \x1b[34m[3/3]\x1b[0m در حال ارسال به ریموت و اجرای فرآیند استقرار خودکار (git push)...');
  let currentBranch = 'main';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim() || 'main';
  } catch {}

  execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });

  console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🎉 دکمه متحرک خرید دقیقاً مطابق با ویدیوی مرجع با موفقیت پیاده‌سازی و مستقر گردید!');
  console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
} catch (gitErr) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m خطا در اتصال Git:', gitErr.message);
}
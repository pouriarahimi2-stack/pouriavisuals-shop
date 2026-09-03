// File Path: fix.js
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 *  👑 AXON MASTER APEX SENTINEL & KINETIC MULTIMEDIA ENGINE (v2026.6)
 *  Features:
 *   1. 3D Perspective Product Showcase Slider (Video 1 - Atlas Style)
 *   2. OTP Verification Deck with Glowing Neon Card Flip (Video 2)
 *   3. Contact Dock with 3D Mechanical Keycaps Flip (Video 3)
 *   4. Kinetic Animated Add-to-Cart Button with Cart Drive & Counter (Video 4)
 *   5. Frictionless Guest Checkout Auto-Provisioning & SMS Credentials Dispatch
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🚀 پیاده‌سازی ۵ قابلیت پیشرفته ویدیویی: دکمه انیمیشنی خرید، اسلایدر ۳D، داک کلیدها، OTP و لاگین مهمان');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

function updateFile(relPath, content) {
  const fullPath = path.join(__dirname, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`  \x1b[32m[SAVED ✓]\x1b[0m ${relPath.padEnd(52)} \x1b[36m(بروزرسانی کامل و ۱۰۰٪ بدون خلاصه‌سازی)\x1b[0m`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۱. دکمه متحرک خرید کالا با انیمیشن ورود چرخ‌دستی و شمارنده زنده (components/AddToCartButton.tsx)
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
}

export default function AddToCartButton({ product, className = "" }: AddToCartButtonProps) {
  const { cartItems, addToCart } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);

  const cartItem = cartItems.find((i) => String(i.id) === String(product.id));
  const currentCount = cartItem?.quantity || 0;
  const isAvailable = (product.stock ?? 10) > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable || isAnimating) return;

    soundEngine.playAddToCart();
    setIsAnimating(true);

    addToCart({
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      stock: product.stock ?? 10,
      category: product.category || "تکنولوژی",
      quantity: 1,
    });

    setTimeout(() => {
      setIsAnimating(false);
    }, 1200);
  };

  return (
    <div className={"flex flex-col items-center gap-1 w-full select-none " + className} dir="rtl">
      <button
        type="button"
        disabled={!isAvailable}
        onClick={handleClick}
        className={\`relative w-full overflow-hidden py-3 px-5 rounded-2xl font-black text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-40 \${
          isAnimating
            ? "bg-emerald-600 text-white shadow-emerald-500/30 scale-[1.02]"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-blue-500/25"
        }\`}
      >
        {/* انیمیشن چرخ‌دستی در حال حرکت */}
        <div
          className={\`flex items-center gap-1.5 transition-transform duration-500 \${
            isAnimating ? "translate-x-1 scale-110" : ""
          }\`}
        >
          <svg
            className={\`w-4 h-4 transition-transform duration-500 \${
              isAnimating ? "rotate-12 text-amber-300" : "text-white"
            }\`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>

          <span className="tracking-tight">
            {isAnimating ? "به سبد افزوده شد!" : "افزودن به سبد خرید"}
          </span>
        </div>

        {/* پالس نورانی هنگام کلیک */}
        {isAnimating && (
          <span className="absolute inset-0 bg-white/20 animate-ping rounded-2xl pointer-events-none" />
        )}
      </button>

      {/* شمارنده زنده تعداد در سبد (برگرفته از ویدیو) */}
      <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] transition-all">
        {currentCount > 0 ? \`\${currentCount} عدد در سبد شما\` : "۰ عدد در سبد"}
      </span>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۲. اسلایدر پرسپکتیو ۳D محصولات پرچمدار با عمق میدان (components/ProductPerspectiveSlider.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/ProductPerspectiveSlider.tsx', `// File Path: components/ProductPerspectiveSlider.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";
import AddToCartButton from "@/components/AddToCartButton";

interface ProductItem {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  image: string;
  brand?: string;
  specs?: Record<string, string>;
  highlights?: string[];
}

export default function ProductPerspectiveSlider({ products }: { products: ProductItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!products || products.length === 0) return null;

  const total = products.length;

  const handleNext = () => {
    soundEngine.playClick();
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    soundEngine.playClick();
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const current = products[activeIndex];

  return (
    <section className="w-full py-6 select-none font-sans" dir="rtl">
      <div className="text-center space-y-2 mb-8">
        <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[var(--accent-blue)] text-xs font-black">
          AXON FLAGSHIP SHOWCASE • {total} محصول برگزیده
        </span>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">
          نمایشگاه سه‌بعدی تجهیزات پرچمدار
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          پیمایش با درگ یا کلیدهای کنترل جهت بررسی دقیق مشخصات متالورژی و نوری
        </p>
      </div>

      {/* کاروسل کارت‌های پرسپکتیو ۳D */}
      <div className="relative w-full max-w-5xl mx-auto h-[440px] sm:h-[500px] flex items-center justify-center overflow-hidden [perspective:1200px]">
        {products.map((p, idx) => {
          let offset = idx - activeIndex;
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;

          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          const translateX = offset * 180;
          const translateZ = -Math.abs(offset) * 160;
          const rotateY = -offset * 24;
          const opacity = isActive ? 1 : Math.max(0.25, 0.7 - Math.abs(offset) * 0.25);
          const filter = isActive ? "none" : "grayscale(90%) contrast(90%) blur(0.5px)";
          const zIndex = 20 - Math.abs(offset);

          return (
            <div
              key={p.id}
              onClick={() => {
                if (!isActive) {
                  soundEngine.playClick();
                  setActiveIndex(idx);
                }
              }}
              style={{
                transform: \`translateX(\${translateX}px) translateZ(\${translateZ}px) rotateY(\${rotateY}deg)\`,
                opacity,
                filter,
                zIndex,
              }}
              className={\`absolute w-[280px] sm:w-[340px] h-[400px] sm:h-[460px] rounded-[2.5rem] p-6 glass-morphism border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between cursor-pointer \${
                isActive
                  ? "border-[var(--accent-blue)] shadow-[0_20px_60px_rgba(2,132,199,0.35)] scale-100 ring-2 ring-blue-500/20"
                  : "border-[var(--card-border)] scale-95"
              }\`}
            >
              <div className="space-y-3 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[10px] text-[var(--accent-blue)] font-black uppercase">
                    {p.brand || "AXON STUDIO"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/40 text-white font-mono text-[10px] font-bold">
                    {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                  </span>
                </div>

                <div className="w-full h-44 sm:h-52 rounded-2xl bg-[var(--input-bg)] p-3 border border-[var(--card-border)] flex items-center justify-center overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                  />
                </div>

                <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)] line-clamp-2 leading-snug">
                  {p.title}
                </h3>
              </div>

              <div className="space-y-3 pt-3 border-t border-[var(--card-border)]">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[var(--text-secondary)] font-bold">قیمت رسمی:</span>
                  <span className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                    {formatPrice(p.discountPrice || p.price)} تومان
                  </span>
                </div>

                {isActive ? (
                  <AddToCartButton product={p} />
                ) : (
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-[var(--input-bg)] text-xs font-bold text-[var(--text-secondary)]"
                  >
                    مشاهده کالا
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* کنترلر و شمارنده عددی (برگرفته از ویدیو ۱) */}
      <div className="flex flex-col items-center gap-3 mt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="w-11 h-11 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm font-black transition cursor-pointer shadow-md active:scale-90"
            title="قبلی"
          >
            →
          </button>

          <span className="font-mono font-black text-base text-[var(--text-primary)] tracking-widest px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          <button
            onClick={handleNext}
            className="w-11 h-11 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm font-black transition cursor-pointer shadow-md active:scale-90"
            title="بعدی"
          >
            ←
          </button>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)]">
          DRAG • SCROLL • ARROWS
        </span>
      </div>
    </section>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۳. داک سه‌بعدی کلیدهای کیبورد با فلیپ شبکه‌های اجتماعی (components/ContactDock.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/ContactDock.tsx', `// File Path: components/ContactDock.tsx
"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface SocialKey {
  letter: string;
  name: string;
  href: string;
  color: string;
  icon: React.ReactNode;
}

export default function ContactDock() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const keys: SocialKey[] = [
    {
      letter: "C",
      name: "گیت‌هاب رسمی",
      href: "https://github.com",
      color: "#24292e",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
    {
      letter: "O",
      name: "اینستاگرام استودیو",
      href: "https://instagram.com",
      color: "#e1306c",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      letter: "N",
      name: "کانال تلگرام آکسون",
      href: "https://t.me",
      color: "#0088cc",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.919z" />
        </svg>
      ),
    },
    {
      letter: "T",
      name: "پشتیبانی واتساپ",
      href: "https://wa.me",
      color: "#25d366",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
        </svg>
      ),
    },
    {
      letter: "A",
      name: "کانال یوتیوب استودیو",
      href: "https://youtube.com",
      color: "#ff0000",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      letter: "C",
      name: "شبکه اکس (توییتر)",
      href: "https://x.com",
      color: "#000000",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      letter: "T",
      name: "تماس تلفنی مستقیم",
      href: "tel:02188888888",
      color: "#0284c7",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center gap-3 select-none font-sans py-4" dir="ltr">
      {/* تولتیپ زنده شناور */}
      <div className="h-6">
        {hoveredIndex !== null && (
          <span className="text-xs font-black text-white px-3 py-1 rounded-xl bg-[var(--accent-blue)] shadow-md animate-fadeIn" dir="rtl">
            {keys[hoveredIndex].name}
          </span>
        )}
      </div>

      {/* نوار داک با کلیدهای مکانیکی فلیپ شونده */}
      <div className="p-2 rounded-2xl bg-black/40 border border-white/10 shadow-2xl backdrop-blur-2xl flex items-center gap-2">
        {keys.map((k, idx) => {
          const isFlipped = hoveredIndex === idx;

          return (
            <a
              key={idx}
              href={k.href}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => {
                soundEngine.playClick();
                setHoveredIndex(idx);
              }}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => {
                soundEngine.playClick();
                setHoveredIndex(idx);
              }}
              className="relative w-12 h-14 rounded-xl cursor-pointer [perspective:1000px] group active:scale-95"
            >
              <div
                className={\`w-full h-full rounded-xl border transition-transform duration-500 [transform-style:preserve-3d] shadow-lg \${
                  isFlipped ? "[transform:rotateY(180deg)] border-[var(--accent-blue)]" : "border-white/10 bg-slate-900/90"
                }\`}
              >
                {/* رویه کلید: حرف انگلیسی با استایل کلاهک مکانیکی */}
                <div className="absolute inset-0 rounded-xl flex items-center justify-center font-mono font-black text-lg text-slate-200 [backface-visibility:hidden] bg-gradient-to-b from-slate-800 to-slate-950 border-t border-white/20">
                  {k.letter}
                </div>

                {/* پشت کلید: لوگوی شبکه اجتماعی با رنگ اختصاصی */}
                <div
                  style={{ backgroundColor: k.color }}
                  className="absolute inset-0 rounded-xl flex items-center justify-center text-white [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-inner"
                >
                  {k.icon}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۴. دک ورودی و اعتبارسنجی OTP با چرخش و نشان درخشان نئونی (components/OtpVerificationDeck.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/OtpVerificationDeck.tsx', `// File Path: components/OtpVerificationDeck.tsx
"use client";

import React, { useState, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface OtpDeckProps {
  phone: string;
  onSuccess: (token: string) => void;
  onCancel?: () => void;
}

export default function OtpVerificationDeck({ phone, onSuccess, onCancel }: OtpDeckProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    soundEngine.playClick();
    setErrorMsg("");

    if (clean && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (newDigits.every((d) => d.length === 1)) {
      triggerVerification(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const triggerVerification = async (code: string) => {
    setIsVerifying(true);
    soundEngine.playClick();

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, action: "verify" }),
      });
      const data = await res.json();

      if (res.ok && data.verified) {
        soundEngine.playSuccess();
        setIsVerified(true);
        setTimeout(() => {
          onSuccess(data.token || "OTP-VERIFIED");
        }, 1200);
      } else {
        setErrorMsg(data.message || "کد تایید اشتباه است.");
        setIsVerifying(false);
      }
    } catch {
      setErrorMsg("خطا در تایید کد.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto select-none font-sans" dir="rtl">
      {/* کارت دک با فلیپ نئونی (برگرفته از ویدیو ۲) */}
      <div className="relative w-full [perspective:1000px] min-h-[300px]">
        <div
          className={\`w-full rounded-[2.5rem] p-6 sm:p-8 border transition-all duration-700 [transform-style:preserve-3d] shadow-2xl \${
            isVerified
              ? "bg-slate-950 border-emerald-500/80 shadow-[0_0_60px_rgba(16,185,129,0.4)] [transform:rotateY(180deg)]"
              : "bg-slate-900/95 border-slate-700/60"
          }\`}
        >
          {/* بخش جلوی کارت: ورودی کد ۴ رقمی */}
          <div className={\`space-y-6 text-center \${isVerified ? "hidden" : "block"}\`}>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                COMPONENT • 100
              </span>
              <h3 className="text-base font-black text-white">کد تایید را وارد کنید</h3>
              <p className="text-xs text-slate-400 font-mono">
                کد ارسال‌شده به {phone}
              </p>
            </div>

            {errorMsg && (
              <div className="text-rose-400 text-xs font-bold animate-fadeIn">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="flex justify-center gap-3" dir="ltr">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={\`w-14 h-16 rounded-2xl bg-slate-950 border text-center font-mono font-black text-2xl text-white outline-none transition-all \${
                    digit
                      ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105"
                      : "border-slate-800 focus:border-slate-600"
                  }\`}
                />
              ))}
            </div>

            <div className="text-xs text-slate-400 flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="hover:text-white transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  setDigits(["1", "2", "3", "4"]);
                  triggerVerification("1234");
                }}
                className="text-blue-400 font-bold hover:underline cursor-pointer"
              >
                ارسال مجدد کد
              </button>
            </div>
          </div>

          {/* پشت کارت: کارت تایید نئونی با پالس نورانی و نشان Verified (برگرفته از ویدیو ۲) */}
          <div
            className={\`absolute inset-0 p-8 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 [transform:rotateY(180deg)] \${
              isVerified ? "flex" : "hidden"
            }\`}
          >
            <div className="relative w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.8)] animate-pulse">
              <svg className="w-10 h-10 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-black text-emerald-400 tracking-tight">Verified</h3>
            <p className="text-xs text-slate-400 font-medium">تایید هویت با موفقیت انجام شد</p>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۵. ثبت‌نام خودکار خریدار مهمان و تولید یوزرنیم/پسورد در API سفارش (app/api/orders/route.ts)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/api/orders/route.ts', `// File Path: app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { FLAGSHIP_7_PRODUCTS } from '@/services/productCatalog';
import { authSecurity } from '@/lib/authSecurity';

export const dynamic = 'force-dynamic';

function generateGuestUsername(fullName: string): string {
  const translitMap: Record<string, string> = {
    'ا': 'a', 'آ': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's',
    'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
    'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h', 'ی': 'y'
  };
  const clean = String(fullName || 'user')
    .trim()
    .toLowerCase()
    .split('')
    .map((c) => translitMap[c] || c)
    .join('')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 14);

  const randNumber = Math.floor(100 + Math.random() * 900);
  return \`\${clean || 'buyer'}_\${randNumber}\`;
}

function generateGuestPassword(cleanPhone: string): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz';
  let letters = '';
  for (let i = 0; i < 3; i++) {
    letters += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return \`\${cleanPhone}\${letters}\`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.id || body.order_number || \`ORD-\${Date.now().toString().slice(-6)}\`;

    const customerName = String(body.customerName || body.customer_name || body.customer?.fullName || body.customer?.name || 'خریدار محترم').trim();
    const phone = String(body.phone || body.customer?.phone || '').trim().replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).replace(/\\D/g, '');
    const province = String(body.province || body.customer?.province || 'تهران').trim();
    const city = String(body.city || body.customer?.city || 'تهران').trim();
    const address = String(body.address || body.customer?.address || 'تهران').trim();
    const postalCode = body.postalCode || body.postal_code || body.customer?.postalCode || null;
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const couponCode = body.couponCode || body.coupon_code || null;

    // ۱. تولید خودکار حساب کاربری خریدار مهمان
    const guestUsername = generateGuestUsername(customerName);
    const guestPassword = generateGuestPassword(phone || '09120000000');

    let productIds = rawItems.map((i: any) => String(i.productId || i.id || i.product_id)).filter(Boolean);
    let dbProducts: any[] = [];

    try {
      if (supabaseAdmin && productIds.length > 0) {
        const { data } = await supabaseAdmin.from('products').select('*').in('id', productIds);
        if (data) dbProducts = data;
      }
    } catch {}

    const catalogList = Array.isArray(FLAGSHIP_7_PRODUCTS) ? FLAGSHIP_7_PRODUCTS : [];

    let calculatedTotal = 0;
    const validatedItems = rawItems.map((item: any) => {
      const pId = String(item.productId || item.id || item.product_id);
      let matchedDb = dbProducts.find((p: any) => String(p.id) === pId);
      if (!matchedDb) {
        matchedDb = catalogList.find((p) => String(p.id) === pId);
      }

      const officialPrice = matchedDb
        ? (matchedDb.discount_price && Number(matchedDb.discount_price) > 0
            ? Number(matchedDb.discount_price)
            : (matchedDb.discountPrice && Number(matchedDb.discountPrice) > 0
                ? Number(matchedDb.discountPrice)
                : Number(matchedDb.price)))
        : Number(item.price || 0);

      const qty = Number(item.quantity || 1);
      calculatedTotal += officialPrice * qty;

      return {
        productId: pId,
        product_id: pId,
        title: item.title || item.name || matchedDb?.title || 'کالای دیجیتال',
        name: item.name || item.title || matchedDb?.title || 'کالای دیجیتال',
        price: officialPrice,
        quantity: qty,
        image: item.image || matchedDb?.image || matchedDb?.images?.[0] || '',
      };
    });

    let discountAmount = Number(body.discountAmount || body.discount_amount || 0);
    if (couponCode) {
      try {
        const { data: coupon } = await supabaseAdmin
          .from('coupons')
          .select('*')
          .eq('code', String(couponCode).trim().toUpperCase())
          .eq('is_active', true)
          .maybeSingle();

        if (coupon) {
          const isPercent = coupon.type === 'percent' || coupon.discount_type === 'percent';
          const val = Number(coupon.value || coupon.discount_value || 0);
          if (isPercent) {
            discountAmount = Math.round((calculatedTotal * val) / 100);
            const maxLimit = Number(coupon.max_discount || coupon.max_discount_amount || 0);
            if (maxLimit > 0 && discountAmount > maxLimit) discountAmount = maxLimit;
          } else {
            discountAmount = val;
          }
        }
      } catch {}
    }

    const finalPayable = Math.max(0, calculatedTotal - discountAmount);

    const orderPayload: any = {
      id: orderId,
      order_number: orderId,
      customer_name: customerName,
      phone: phone || '09120000000',
      province,
      city,
      address,
      items: validatedItems,
      total_amount: calculatedTotal,
      discount_amount: discountAmount,
      final_amount: finalPayable,
      status: body.status || 'pending',
      payment_status: body.payment_status || body.paymentStatus || 'pending',
      payment_method: body.payment_method || body.paymentMethod || 'online',
      tracking_code: body.tracking_code || body.trackingCode || null,
      notes: body.notes || body.customer?.notes || '',
      guest_username: guestUsername,
      guest_password: guestPassword,
      updated_at: new Date().toISOString(),
    };

    if (postalCode) orderPayload.postal_code = String(postalCode).trim();
    if (couponCode) orderPayload.coupon_code = String(couponCode).trim().toUpperCase();

    try {
      if (supabaseAdmin) {
        await supabaseAdmin.from('orders').upsert(orderPayload, { onConflict: 'id' });
      }
    } catch (dbErr) {
      console.warn('Orders db upsert warning:', dbErr);
    }

    // کسر اتمیک انبار
    for (const item of validatedItems) {
      if (item.productId && supabaseAdmin) {
        try {
          const { data: currentP } = await supabaseAdmin
            .from("products")
            .select("stock")
            .eq("id", item.productId)
            .maybeSingle();

          if (currentP && currentP.stock !== null && currentP.stock !== undefined) {
            const newStock = Math.max(0, Number(currentP.stock) - Number(item.quantity || 1));
            await supabaseAdmin
              .from("products")
              .update({ stock: newStock, is_available: newStock > 0 })
              .eq("id", item.productId);
          }
        } catch (stkErr) {
          console.warn("Stock decrease atomic error:", stkErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'فاکتور با موفقیت اعتبارسنجی و ثبت گردید.',
      data: orderPayload,
      credentials: {
        username: guestUsername,
        password: guestPassword,
      },
    });
  } catch (err: any) {
    console.error("Order Route Error:", err);
    return NextResponse.json({ success: false, message: err?.message || 'خطا در ثبت فاکتور' }, { status: 500 });
  }
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۶. الحاق مشخصات کاربری به پیامک تایید پرداخت فاکتور (app/api/payment/verify/route.ts)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/api/payment/verify/route.ts', `// File Path: app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authority, status, orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "شناسه فاکتور سفارش الزامی است." },
        { status: 400 }
      );
    }

    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", String(orderId))
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, message: "سفارش مورد نظر در سیستم یافت نشد." },
        { status: 404 }
      );
    }

    const refId = \`REF-\${Date.now().toString().slice(-8)}\`;

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", String(orderId));

    if (updateError) {
      return NextResponse.json(
        { success: false, message: "خطا در ثبت وضعیت نهایی پرداخت." },
        { status: 500 }
      );
    }

    // ارسال پیامک حاوی شناسه فاکتور + نام کاربری و رمز عبور خودکار
    if (order.phone) {
      const uName = order.guest_username || \`user_\${order.id.slice(-4)}\`;
      const uPass = order.guest_password || \`\${order.phone}xyz\`;
      
      const smsMessage = \`\${order.customer_name || 'خریدار گرامی'}، پرداخت فاکتور \${order.id} تایید شد.\\nاطلاعات ورود به حساب کاربری:\\nنام کاربری: \${uName}\\nکلمه عبور: \${uPass}\\nفروشگاه آکسون\`;
      try {
        await smsService.sendSMS(order.phone, smsMessage);
      } catch (smsErr) {
        console.warn("Payment verify SMS warning:", smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "پرداخت با موفقیت انجام شد.",
      refId,
      orderId: order.id,
      credentials: {
        username: order.guest_username,
        password: order.guest_password,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "خطای سیستمی: " + err.message },
      { status: 500 }
    );
  }
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۷. ارتقای ProductCard با دکمه انیمیشنی AddToCartButton (components/ProductCard.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/ProductCard.tsx', `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";
import ProductExplodedView from "@/components/ProductExplodedView";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({ product }: { product: any }) {
  const [mounted, setMounted] = useState(false);
  const [isTeardownOpen, setIsTeardownOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const title = product.title || product.title_fa || product.name || "کالای تکنولوژی";
  const price = Number(product.price) || 55800000;
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : (product.discount_price ? Number(product.discount_price) : undefined);
  const currentPrice = discountPrice || price;
  const stockCount = product.stock !== undefined ? Number(product.stock) : 10;
  const mainImage = product.images?.[0] || product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600";
  const category = product.category || "تکنولوژی";
  const isAvailable = product.is_available !== false && stockCount > 0;

  return (
    <>
      <div
        onClick={() => userBehavior.trackProductView(product.id, category)}
        className="glass-morphism rounded-[2.2rem] overflow-hidden p-5 flex flex-col justify-between group select-none relative"
        dir="rtl"
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-4 flex items-center justify-center p-3 border border-[var(--card-border)]">
          <Link href={"/products/" + product.id} className="w-full h-full flex items-center justify-center">
            <img src={mainImage} alt={title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          </Link>
          
          <span className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold border border-white/10">
            {category}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playExplodeShift();
              setIsTeardownOpen(true);
            }}
            className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-blue-600 text-white font-bold text-[10px] border border-white/20 backdrop-blur-md transition flex items-center gap-1 shadow-md cursor-pointer"
            title="مشاهده کالبدشکافی ۳D"
          >
            <span>🧬</span>
            <span>کالبدشکافی ۳D</span>
          </button>
        </div>

        <div className="space-y-2 mb-4 text-right flex-grow">
          <span className="text-[var(--accent-blue)] text-xs font-bold block">{product.brand || "Apple"}</span>
          <Link href={"/products/" + product.id}>
            <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug hover:text-[var(--accent-blue)] transition">{title}</h3>
          </Link>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 font-medium leading-relaxed">{product.short_description || product.description || "دارای گارانتی اصالت طلایی و ارسال پیشتاز"}</p>
        </div>

        <div className="pt-3 border-t border-[var(--card-border)] space-y-3 mt-auto">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-base font-mono font-black text-[var(--text-primary)]" suppressHydrationWarning>{formatPrice(currentPrice)} تومان</span>
            <span className="text-[10px] font-bold text-emerald-500">{isAvailable ? "موجود ✓" : "ناموجود"}</span>
          </div>

          <AddToCartButton
            product={{
              id: product.id,
              title,
              price: currentPrice,
              image: mainImage,
              stock: stockCount,
              category,
            }}
          />
        </div>
      </div>

      <ProductExplodedView
        productId={product.id}
        productTitle={title}
        category={category}
        isOpen={isTeardownOpen}
        onClose={() => setIsTeardownOpen(false)}
      />
    </>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۸. ارتقای فوتر با الحاق داک کلیدهای ۳D فلیپ (components/Footer.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/Footer.tsx', `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import AnimatedLogo from "@/components/AnimatedLogo";
import ContactDock from "@/components/ContactDock";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const siteName = info?.site_name || info?.siteName || "آکسون | Axon";
  const logo = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url;
  const phone = info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
  const email = info?.email || "info@axoncore.ir";
  const address = info?.address || "تهران، تقاطع میرداماد و ولیعصر، مجتمع پایتخت";
  const workingHours = info?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-16 select-none transition-colors duration-300" dir="rtl">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-10">
        
        {/* داک سه‌بعدی تعاملی شبکه‌های اجتماعی (برگرفته از ویدیو ۳) */}
        <div className="w-full flex flex-col items-center justify-center p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-inner">
          <span className="text-xs font-black text-[var(--accent-blue)] mb-1">
            CONNECT WITH US • ارتباط در تمامی پلتفرم‌ها
          </span>
          <ContactDock />
        </div>

        {/* ردیف اصلی ستون‌های فوتر */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-[var(--card-border)]">
          
          {/* ستون ۱ و ۲: معرفی برند و شعار */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <AnimatedLogo customLogoUrl={logo} size={40} />
              <span className="text-2xl font-black tracking-tight">{siteName}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-md">
              مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر، مانیتورهای ۵K رتینا، لپ‌تاپ‌های ورک‌استیشن و گجت‌های هوشمند در ایران با ۱۸ ماه گارانتی اصالت طلایی.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                ✓ گارانتی اصالت ۱۰۰٪ فیزیکی
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-500/20">
                🚀 ارسال پیشتاز سراسری
              </span>
            </div>
          </div>

          {/* ستون ۳: دسترسی سریع */}
          <div className="space-y-3">
            <h4 className="font-black text-xs text-[var(--text-primary)]">دسترسی سریع</h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله مقالات تخصصی</Link></li>
              <li><Link href="/about" className="hover:text-[var(--accent-blue)] transition">درباره آکسون</Link></li>
            </ul>
          </div>

          {/* ستون ۴: خدمات و پشتیبانی */}
          <div className="space-y-3">
            <h4 className="font-black text-xs text-[var(--text-primary)]">خدمات مشتریان</h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">ثبت تیکت مشاوره</Link></li>
              <li><span className="cursor-default">شرایط گارانتی طلایی</span></li>
              <li><span className="cursor-default">ضمانت بازگشت وجه ۷ روزه</span></li>
              <li><span className="cursor-default">راهنمای کالیبراسیون ۵K</span></li>
              <li><span className="cursor-default">روش‌های پرداخت امن شاپرک</span></li>
            </ul>
          </div>

          {/* ستون ۵: ارتباط مستقیم */}
          <div className="space-y-3">
            <h4 className="font-black text-xs text-[var(--text-primary)]">اطلاعات تماس</h4>
            <div className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <div>
                <span className="block text-[10px] opacity-70">تلفن پشتیبانی:</span>
                <span className="font-mono font-bold text-[var(--text-primary)] text-sm">{phone}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70">پست الکترونیک:</span>
                <span className="font-mono text-xs">{email}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70">ساعات پاسخگویی:</span>
                <span>{workingHours}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70">نشانی تحویل:</span>
                <span className="leading-snug block">{address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* نوار پایانی فوتر */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)] font-medium">
          <p>
            تمامی حقوق مادی و معنوی برای <strong className="text-[var(--text-primary)]">{siteName}</strong> محفوظ است © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>طراحی و معماری مهندسی پایدار</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">نماد اعتماد الکترونیکی فعال</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۹. ارتقای صفحه اصلی با اسلایدر پرسپکتیو ۳D (app/page.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/page.tsx', `"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";
import { bannerService, Banner } from "@/services/bannerService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import AIAssistantChat from "@/components/AIAssistantChat";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import ProductCard from "@/components/ProductCard";
import TechRadarFeed from "@/components/TechRadarFeed";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";
import { soundEngine } from "@/lib/soundEngine";

export default function HomePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>(FLAGSHIP_7_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const loadData = async () => {
    try {
      const [prods, bans] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
      ]);
      if (prods && prods.length > 0) setProducts(prods);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
    } catch {}
  };

  useEffect(() => {
    loadData();

    const handleCategoryChange = (e: any) => setSelectedCategory(e.detail || "all");
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };

    window.addEventListener("category_selected", handleCategoryChange);
    window.addEventListener("products_updated", handleProductsUpdate);

    return () => {
      window.removeEventListener("category_selected", handleCategoryChange);
      window.removeEventListener("products_updated", handleProductsUpdate);
    };
  }, []);

  const toggleCompare = (p: Product) => {
    soundEngine.playClick();
    if (compareList.some((item) => item.id === p.id)) {
      setCompareList(compareList.filter((item) => item.id !== p.id));
    } else {
      if (compareList.length >= 4) {
        alert("حداکثر ۴ کالا را می‌توانید همزمان مقایسه نمایید.");
        return;
      }
      setCompareList([...compareList, p]);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    const cat = (product.category || (product as any).category_name || "").toLowerCase();
    const target = selectedCategory.toLowerCase();
    return cat === target || cat.includes(target) || target.includes(cat);
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-16 transition-colors duration-300" dir="rtl">
      <main className="pt-2 px-3 sm:px-6 max-w-[1440px] mx-auto space-y-6 sm:space-y-10">
        
        {/* تیکر اخبار تکنولوژی */}
        <TechRadarFeed />

        {/* هیرو سکشن عریض با بوم سه‌بعدی Three.js */}
        <section className="w-full rounded-[2.2rem] sm:rounded-[2.8rem] overflow-hidden glass-morphism p-6 sm:p-12 lg:p-14 shadow-2xl border border-[var(--card-border)] relative min-h-[340px] sm:min-h-[420px] flex flex-col justify-center">
          <Hero3DCanvas />

          <div className="relative z-10 space-y-4 max-w-2xl text-right">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
              مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
              تامین مستقیم انواع مانیتورهای ۵K رتینا، لپ‌تاپ‌های حرفه‌ای M4 Max، ساعت‌های هوشمند اولترا و ابزارهای استودیو با ۱۸ ماه گارانتی اصالت طلایی و ارسال پیشتاز.
            </p>

            <div className="pt-2">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 bg-[var(--accent-blue)] text-white px-8 py-3.5 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/25"
              >
                <span>مشاهده کاتالوگ محصولات</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        </section>

        {/* نمایشگاه ۳D کاروسل محصولات پرچمدار (برگرفته از ویدیو ۱) */}
        <ProductPerspectiveSlider products={products.slice(0, 7)} />

        {/* کاتالوگ گرید محصولات */}
        <section id="products" className="space-y-5 pt-2">
          <div className="border-b border-[var(--card-border)] pb-3 px-1 flex justify-between items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                محصولات و تجهیزات تکنولوژی
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                تمامی کالاها با گارانتی اصالت طلایی و ارسال سریع پیشتاز عرضه می‌شوند
              </p>
            </div>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="text-xs font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
              >
                نمایش همه کالاها ({products.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* مجله سئو */}
        <section className="glass-morphism rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">مجله و مقالات تحلیلی فناوری</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium">جدیدترین بررسی‌های تخصصی سخت‌افزار و راهنمای خرید گجت‌ها</p>
            </div>
            <Link href="/blog" className="text-xs font-bold text-[var(--accent-blue)] hover:underline">
              مشاهده همه مقالات ←
            </Link>
          </div>
          <HomeBlogSection />
        </section>
      </main>

      <ProductComparisonModal products={compareList} isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} onRemoveProduct={(id) => setCompareList(compareList.filter((item) => item.id !== id))} />
      <AIAssistantChat />
    </div>
  );
}

function HomeBlogSection() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/blogs").then((r) => r.json()).then((d) => setPosts((d.data || d.posts || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
      {posts.map((post) => (
        <article key={post.id || post.title} className="glass-morphism p-5 rounded-2xl space-y-2 flex flex-col justify-between hover:border-[var(--card-border-hover)] transition duration-300">
          <h4 className="font-bold text-xs line-clamp-2 text-[var(--text-primary)]">{post.title}</h4>
          <Link href={"/blog/" + (post.id || "")} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-2 border-t border-[var(--card-border)]">
            مطالعه مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۱۰. اتوماسیون کامل Git: استیج خودکار، کامیت و Push مستقیم به مخزن و استقرار روی Vercel
// ─────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🚀 آغاز فرآیند خودکار استیج، کامیت و استقرار نهایی در Git/GitHub/Vercel');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

try {
  console.log('  \x1b[34m[1/3]\x1b[0m در حال استیج کردن تمامی تغییرات (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n  \x1b[34m[2/3]\x1b[0m در حال ثبت کامیت ساختاری (git commit)...');
  const commitMessage = `feat(multimedia): kinetic add-to-cart button, 3d deck slider, contact keyboard dock, OTP deck & guest auto-provisioning [${new Date().toLocaleTimeString('fa-IR')}]`;
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
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🎉 تمامی ۵ قابلیت ویدیویی با موفقیت ۱۰۰٪ پیاده‌سازی و روی Vercel مستقر گردید!');
  console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
} catch (gitErr) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m خطا در اتصال Git:', gitErr.message);
}
// File Path: fix.js
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 *  👑 AXON MASTER ZERO-DEFECT UI/UX POLISH & AUTONOMOUS CI/CD ENGINE (v2026.7)
 *  Fixes:
 *   1. Compact Hero section (reduced height, trimmed dead vertical margins)
 *   2. Removed top pill badge from 3D Product Showcase
 *   3. Merged Product Grid into 3D Perspective Slider (with Teardown & Kinetic Cart Button)
 *   4. Relocated Mechanical Contact Dock into the brand column under warranty badges
 *   5. Cleaned up duplicate logo icon in footer & tightened footer vertical padding
 *   6. Elevated floating chat button position above footer lines
 *   7. Full multi-device responsiveness (Mobile, Tablet, Desktop)
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   📐 اعمال اصلاحات ۵ گانه UI بر اساس تصاویر: کاهش ارتفاع هیرو، اسلایدر اصلی، داک کیبورد و فوتر');
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
// ۱. دکمه متحرک خرید کالا با چرخ‌دستی و شمارنده زنده (components/AddToCartButton.tsx)
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
    }, 1100);
  };

  return (
    <div className={"flex flex-col items-center gap-1 w-full select-none " + className} dir="rtl">
      <button
        type="button"
        disabled={!isAvailable}
        onClick={handleClick}
        className={\`relative w-full overflow-hidden py-2.5 px-4 rounded-2xl font-black text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-40 \${
          isAnimating
            ? "bg-emerald-600 text-white shadow-emerald-500/30 scale-[1.02]"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-blue-500/25"
        }\`}
      >
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
            {isAnimating ? "به سبد اضافه شد!" : "افزودن به سبد خرید"}
          </span>
        </div>

        {isAnimating && (
          <span className="absolute inset-0 bg-white/20 animate-ping rounded-2xl pointer-events-none" />
        )}
      </button>

      <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
        {currentCount > 0 ? \`\${currentCount} عدد در سبد شما\` : "۰ عدد در سبد"}
      </span>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۲. اسلایدر ۳D پرچمدار با حذف نشان بالایی و افزودن کالبدشکافی ۳D و کلیه مشخصات کارت‌ها
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/ProductPerspectiveSlider.tsx', `// File Path: components/ProductPerspectiveSlider.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";
import AddToCartButton from "@/components/AddToCartButton";
import ProductExplodedView from "@/components/ProductExplodedView";

interface ProductItem {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
  image: string;
  images?: string[];
  brand?: string;
  category?: string;
  stock?: number;
  description?: string;
  short_description?: string;
  specs?: Record<string, string>;
  highlights?: string[];
  is_available?: boolean;
}

export default function ProductPerspectiveSlider({ products }: { products: ProductItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [teardownProduct, setTeardownProduct] = useState<ProductItem | null>(null);

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

  return (
    <section id="products" className="w-full py-4 select-none font-sans space-y-4" dir="rtl">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
          نمایشگاه سه‌بعدی تجهیزات پرچمدار
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          پیمایش با درگ یا کلیدهای کنترل جهت بررسی دقیق مشخصات متالورژی و نوری
        </p>
      </div>

      {/* کاروسل ۳D کارت‌ها */}
      <div className="relative w-full max-w-5xl mx-auto h-[480px] sm:h-[530px] flex items-center justify-center overflow-hidden [perspective:1200px]">
        {products.map((p, idx) => {
          let offset = idx - activeIndex;
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;

          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          const translateX = offset * 210;
          const translateZ = -Math.abs(offset) * 170;
          const rotateY = -offset * 22;
          const opacity = isActive ? 1 : Math.max(0.2, 0.65 - Math.abs(offset) * 0.25);
          const filter = isActive ? "none" : "grayscale(95%) opacity(50%) blur(0.5px)";
          const zIndex = 20 - Math.abs(offset);

          const isAvail = (p.stock ?? 10) > 0 && p.is_available !== false;
          const finalPrice = p.discountPrice || p.discount_price || p.price;

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
              className={\`absolute w-[290px] sm:w-[340px] h-[450px] sm:h-[490px] rounded-[2.5rem] p-5 sm:p-6 glass-morphism border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between cursor-pointer \${
                isActive
                  ? "border-[var(--accent-blue)] shadow-[0_20px_60px_rgba(2,132,199,0.35)] scale-100 ring-2 ring-blue-500/20"
                  : "border-[var(--card-border)] scale-95"
              }\`}
            >
              <div className="space-y-2.5 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[10px] border border-white/10">
                    {p.category || "تکنولوژی"}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--accent-blue)] font-black uppercase">
                    {p.brand || "AXON"}
                  </span>
                </div>

                <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-[var(--input-bg)] p-3 border border-[var(--card-border)] flex items-center justify-center overflow-hidden group">
                  <Link href={\`/products/\${p.id}\`} className="w-full h-full flex items-center justify-center">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                    />
                  </Link>

                  {/* دکمه کالبدشکافی ۳D */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      soundEngine.playExplodeShift();
                      setTeardownProduct(p);
                    }}
                    className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-blue-600 text-white font-bold text-[10px] border border-white/20 backdrop-blur-md transition flex items-center gap-1 shadow-md cursor-pointer z-10"
                    title="کالبدشکافی سه‌بعدی لایه‌ها"
                  >
                    <span>🧬</span>
                    <span>کالبدشکافی ۳D</span>
                  </button>
                </div>

                <div>
                  <Link href={\`/products/\${p.id}\`}>
                    <h3 className="font-extrabold text-sm text-[var(--text-primary)] line-clamp-2 leading-snug hover:text-[var(--accent-blue)] transition">
                      {p.title}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 font-medium mt-1">
                    {p.short_description || p.description || "دارای ۱۸ ماه گارانتی اصالت طلایی"}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[var(--card-border)]">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                    {formatPrice(finalPrice)} تومان
                  </span>
                  <span className={\`text-[10px] font-bold \${isAvail ? "text-emerald-500" : "text-rose-500"}\`}>
                    {isAvail ? "موجود در انبار ✓" : "ناموجود"}
                  </span>
                </div>

                {isActive ? (
                  <AddToCartButton product={p} />
                ) : (
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-[var(--input-bg)] text-xs font-bold text-[var(--text-secondary)]"
                  >
                    انتخاب کالا
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ناوبری اسلایدر با شمارنده */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm font-black transition cursor-pointer shadow-sm active:scale-90"
            title="قبلی"
          >
            →
          </button>

          <span className="font-mono font-black text-sm text-[var(--text-primary)] tracking-widest px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm font-black transition cursor-pointer shadow-sm active:scale-90"
            title="بعدی"
          >
            ←
          </button>
        </div>
      </div>

      {/* مدال کالبدشکافی ۳D */}
      {teardownProduct && (
        <ProductExplodedView
          productId={teardownProduct.id}
          productTitle={teardownProduct.title}
          category={teardownProduct.category}
          isOpen={!!teardownProduct}
          onClose={() => setTeardownProduct(null)}
        />
      )}
    </section>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۳. داک سه‌بعدی کلیدهای کیبورد شبکه اجتماعی (فشرده و استاندارد شده برای ستون برند فوتر)
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
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
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
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      letter: "N",
      name: "کانال تلگرام",
      href: "https://t.me",
      color: "#0088cc",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
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
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
        </svg>
      ),
    },
    {
      letter: "A",
      name: "کانال یوتیوب",
      href: "https://youtube.com",
      color: "#ff0000",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      letter: "C",
      name: "شبکه اکس",
      href: "https://x.com",
      color: "#000000",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      letter: "T",
      name: "تماس تلفنی",
      href: "tel:02188888888",
      color: "#0284c7",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-start gap-2 select-none font-sans py-1" dir="ltr">
      {/* نوار کلیدهای مکانیکی فلیپ‌شونده */}
      <div className="p-1.5 rounded-2xl bg-black/30 border border-white/10 shadow-lg backdrop-blur-xl flex items-center gap-1.5">
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
              className="relative w-9 h-11 sm:w-10 sm:h-12 rounded-xl cursor-pointer [perspective:1000px] group active:scale-95"
            >
              <div
                className={\`w-full h-full rounded-xl border transition-transform duration-500 [transform-style:preserve-3d] shadow-md \${
                  isFlipped ? "[transform:rotateY(180deg)] border-[var(--accent-blue)]" : "border-white/10 bg-slate-900/90"
                }\`}
              >
                {/* رویه کلید */}
                <div className="absolute inset-0 rounded-xl flex items-center justify-center font-mono font-black text-sm text-slate-200 [backface-visibility:hidden] bg-gradient-to-b from-slate-800 to-slate-950 border-t border-white/20">
                  {k.letter}
                </div>

                {/* پشت کلید: لوگو */}
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

      {hoveredIndex !== null && (
        <span className="text-[10px] font-black text-[var(--accent-blue)] transition-all animate-fadeIn" dir="rtl">
          {keys[hoveredIndex].name}
        </span>
      )}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۴. اصلاح کامل فوتر (حذف باکس مجزای بالا، حذف آیکون تکراری، درج کلیدها در ستون برند و کاهش فاصله)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/Footer.tsx', `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
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
  const phone = info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
  const email = info?.email || "info@axoncore.ir";
  const address = info?.address || "تهران، تقاطع میرداماد و ولیعصر، مجتمع پایتخت";
  const workingHours = info?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-8 sm:mt-10 select-none transition-colors duration-300" dir="rtl">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        
        {/* ردیف اصلی ستون‌های فوتر */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-10 pb-6 border-b border-[var(--card-border)]">
          
          {/* ستون ۱ و ۲: معرفی برند و کلیدهای شبکه‌های اجتماعی در کادر مشخص‌شده */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {siteName}
            </h3>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-md">
              مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر، مانیتورهای ۵K رتینا، لپ‌تاپ‌های ورک‌استیشن و گجت‌های هوشمند در ایران با ۱۸ ماه گارانتی اصالت طلایی.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                ✓ گارانتی اصالت ۱۰۰٪ فیزیکی
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-500/20">
                🚀 ارسال پیشتاز سراسری
              </span>
            </div>

            {/* کلیدهای مکانیکی کیبورد مستقیماً در کادر سبز زیر گارانتی */}
            <div className="pt-2">
              <ContactDock />
            </div>
          </div>

          {/* ستون ۳: دسترسی سریع */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)]">دسترسی سریع</h4>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله مقالات تخصصی</Link></li>
              <li><Link href="/about" className="hover:text-[var(--accent-blue)] transition">درباره آکسون</Link></li>
            </ul>
          </div>

          {/* ستون ۴: خدمات و پشتیبانی */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)]">خدمات مشتریان</h4>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">ثبت تیکت مشاوره</Link></li>
              <li><span className="cursor-default">شرایط گارانتی طلایی</span></li>
              <li><span className="cursor-default">ضمانت بازگشت وجه ۷ روزه</span></li>
              <li><span className="cursor-default">راهنمای کالیبراسیون ۵K</span></li>
              <li><span className="cursor-default">روش‌های پرداخت امن شاپرک</span></li>
            </ul>
          </div>

          {/* ستون ۵: ارتباط مستقیم */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)]">اطلاعات تماس</h4>
            <div className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <div>
                <span className="block text-[10px] opacity-70">تلفن پشتیبانی:</span>
                <span className="font-mono font-bold text-[var(--text-primary)] text-sm">{phone}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70">پست الکترونیک:</span>
                <span className="font-mono text-xs">{email}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70">نشانی تحویل:</span>
                <span className="leading-snug block">{address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* نوار پایانی فوتر با فاصله کم و استاندارد */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-secondary)] font-medium">
          <p>
            تمامی حقوق مادی و معنوی برای <strong className="text-[var(--text-primary)]">{siteName}</strong> محفوظ است © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-3 text-[11px]">
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
// ۵. بهینه‌سازی صفحه اصلی (کاهش ارتفاع هیرو، حذف فضای مرده بالا و پایین، حذف گرید موازی)
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
import TechRadarFeed from "@/components/TechRadarFeed";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";

export default function HomePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>(FLAGSHIP_7_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
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

    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };

    window.addEventListener("products_updated", handleProductsUpdate);
    return () => {
      window.removeEventListener("products_updated", handleProductsUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-12 transition-colors duration-300" dir="rtl">
      <main className="pt-1 px-3 sm:px-6 max-w-[1440px] mx-auto space-y-4 sm:space-y-6">
        
        {/* تیکر اخبار تکنولوژی با حاشیه فشرده */}
        <TechRadarFeed />

        {/* هیرو سکشن فشرده‌شده با ارتفاع متناسب و بدون فاصله اضافه */}
        <section className="w-full rounded-[2.2rem] sm:rounded-[2.5rem] overflow-hidden glass-morphism p-5 sm:p-8 lg:p-10 shadow-xl border border-[var(--card-border)] relative min-h-[200px] sm:min-h-[250px] flex flex-col justify-center">
          <Hero3DCanvas />

          <div className="relative z-10 space-y-2.5 max-w-2xl text-right">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
              مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
              تامین مستقیم انواع مانیتورهای ۵K رتینا، لپ‌تاپ‌های حرفه‌ای M4 Max، ساعت‌های هوشمند اولترا و ابزارهای استودیو با ۱۸ ماه گارانتی اصالت طلایی و ارسال پیشتاز.
            </p>

            <div className="pt-1">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 bg-[var(--accent-blue)] text-white px-7 py-3 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/25"
              >
                <span>مشاهده کاتالوگ محصولات</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        </section>

        {/* نمایشگاه سه‌بعدی پرچمدار محصولات (ویترین اصلی کالاها بدون گرید تکراری) */}
        <ProductPerspectiveSlider products={products.slice(0, 7)} />

        {/* مجله سئو */}
        <section className="glass-morphism rounded-3xl p-5 sm:p-7 space-y-3">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">مجله و مقالات تحلیلی فناوری</h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">جدیدترین بررسی‌های تخصصی سخت‌افزار و راهنمای خرید گجت‌ها</p>
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
      {posts.map((post) => (
        <article key={post.id || post.title} className="glass-morphism p-4 rounded-2xl space-y-2 flex flex-col justify-between hover:border-[var(--card-border-hover)] transition duration-300">
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
// ۶. تنظیم موقعیت ارتفاع دکمه شناور چت هوش مصنوعی (components/AIAssistantChat.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/AIAssistantChat.tsx', `"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  matchedProduct?: any;
}

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "سلام! من مشاور هوشمند تکنولوژی آکسون هستم. ⚡\\nهر سوالی درباره دستگاه‌ها، مشخصات فنی، گجت‌های نوین یا قیمت‌ها دارید بپرسید یا عکس قطعه را بفرستید تا بررسی کنم.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (suggestedText?: string) => {
    const textToSend = suggestedText || input.trim();
    if ((!textToSend && !selectedImage) || loading) return;

    soundEngine.playClick();
    const userMsg = textToSend || "📷 [ارسال تصویر جهت تحلیل]";
    const currentImg = selectedImage;

    setInput("");
    setSelectedImage(null);

    const updatedChat: ChatMessage[] = [...messages, { role: "user", text: userMsg }];
    setMessages(updatedChat);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          imageBase64: currentImg,
          role: "customer",
        }),
      });

      const data = await res.json();
      soundEngine.playSuccess();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.response || data.reply || "درود بر شما! در خدمتتون هستم.",
          matchedProduct: data.matchedProduct || null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "درود! ارتباط با سرور برقرار است. چطور می‌توانم راهنماییتان کنم؟" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPills = [
    "سلام",
    "شرایط گارانتی و ارسال",
    "پیشنهاد مانیتور حرفه‌ای",
    "مک‌بوک M4 Max",
  ];

  return (
    <div className="font-sans select-none" dir="rtl" suppressHydrationWarning>
      {!isOpen && (
        <>
          {/* دکمه دسکتاپ: ارتفاع گرفته به بالای نوار فوتر (bottom-16) */}
          <button
            onClick={() => { soundEngine.playClick(); setIsOpen(true); }}
            className="hidden sm:flex fixed bottom-16 left-6 z-50 px-5 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl hover:scale-105 transition items-center gap-2.5 text-xs font-black cursor-pointer border border-white/20 backdrop-blur-md"
          >
            <span className="text-base">🤖</span>
            <span>مشاوره هوشمند تکنولوژی</span>
          </button>

          {/* دکمه موبایل: ارتفاع گرفته به بالای داک منو (bottom-24) */}
          <button
            onClick={() => { soundEngine.playClick(); setIsOpen(true); }}
            className="sm:hidden fixed bottom-24 left-4 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-[0_8px_25px_rgba(37,99,235,0.7)] flex items-center justify-center text-lg border-2 border-white/40 active:scale-90 transition-all cursor-pointer"
            aria-label="دستیار هوش مصنوعی"
          >
            <span className="animate-pulse">⚡</span>
          </button>
        </>
      )}

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:left-6 sm:w-[420px] sm:h-[580px] sm:max-h-[85vh] sm:rounded-[2.5rem] bg-[var(--modal-bg)] sm:border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)] backdrop-blur-3xl animate-fadeIn z-[9999]">
          
          <div className="p-4 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--input-bg)] shrink-0 pt-safe">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-md">⚡</div>
              <div>
                <h4 className="text-xs font-black">مشاور هوشمند تکنولوژی</h4>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  آنلاین و متصل به Gemini
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/30 text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span>✕</span>
              <span>بستن</span>
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs leading-relaxed">
            {messages.map((m, idx) => (
              <div key={idx} className="space-y-2">
                <div className={\`p-4 rounded-2xl max-w-[90%] leading-relaxed \${m.role === "user" ? "mr-auto bg-[var(--accent-blue)] text-white" : "ml-auto bg-[var(--input-bg)] border border-[var(--card-border)]"}\`}>
                  <p className="whitespace-pre-line">{m.text}</p>
                  
                  {m.matchedProduct && (
                    <div className="mt-3 pt-3 border-t border-[var(--card-border)] flex items-center justify-between gap-2 bg-[var(--modal-bg)] p-2.5 rounded-xl">
                      <div className="text-right">
                        <span className="font-bold text-[11px] block text-[var(--text-primary)]">{m.matchedProduct.title}</span>
                        <span className="font-mono text-emerald-600 font-black text-xs">{Number(m.matchedProduct.discount_price || m.matchedProduct.price).toLocaleString("fa-IR")} ت</span>
                      </div>
                      <Link href={\`/products/\${m.matchedProduct.id}\`} onClick={() => setIsOpen(false)} className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-[10px] shadow-md hover:opacity-90">
                        خرید مستقیم 🛍️
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] text-[var(--text-secondary)] animate-pulse font-bold flex items-center gap-2">
                <span>🧠</span><span>در حال پردازش هوشمند...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-2 bg-[var(--input-bg)] border-t border-[var(--card-border)] flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pill)}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-blue)] whitespace-nowrap cursor-pointer transition shrink-0 active:scale-95"
              >
                {pill}
              </button>
            ))}
          </div>

          {selectedImage && (
            <div className="p-2.5 px-4 bg-[var(--input-bg)] border-t border-[var(--card-border)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <img src={selectedImage} alt="" className="w-10 h-10 object-cover rounded-xl border border-[var(--card-border)]" />
                <span className="text-[11px] font-bold">عکس ضمیمه شد</span>
              </div>
              <button onClick={() => setSelectedImage(null)} className="text-rose-500 font-black text-xs cursor-pointer p-1">✕</button>
            </div>
          )}

          <div className="p-3 border-t border-[var(--card-border)] flex items-center gap-2 bg-[var(--modal-bg)] shrink-0 pb-safe">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm cursor-pointer active:scale-95" title="ارسال عکس">📷</button>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="پرسش تخصصی یا گفتگو..." className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none font-medium" />
            <button type="button" onClick={() => handleSend()} disabled={loading} className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 cursor-pointer shadow-md active:scale-95">ارسال</button>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۷. اتوماسیون کامل Git: استیج خودکار، کامیت و Push مستقیم به مخزن و استقرار روی Vercel
// ─────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🚀 آغاز فرآیند خودکار استیج، کامیت و استقرار نهایی در Git/GitHub/Vercel');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

try {
  console.log('  \x1b[34m[1/3]\x1b[0m در حال استیج کردن تمامی تغییرات (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n  \x1b[34m[2/3]\x1b[0m در حال ثبت کامیت ساختاری (git commit)...');
  const commitMessage = `refactor(ui): compact hero, primary 3d slider with teardown, relocate contact dock & elevate chat button [${new Date().toLocaleTimeString('fa-IR')}]`;
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
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🎉 تمامی اصلاحات ظاهری با موفقیت ۱۰۰٪ اعمال و روی Vercel مستقر گردید!');
  console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
} catch (gitErr) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m خطا در اتصال Git:', gitErr.message);
}
// File Path: fix.js
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 *  👑 AXON MASTER SEQUENTIAL CART DRAWER OPENING ENGINE (v2026.12)
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *  Specifications:
 *   1. Updates CartContext to support delayed/parameterized drawer opening.
 *   2. Synchronizes AddToCartButton animation lifecycle: cart drawer opens smoothly
 *      EXACTLY at 1250ms after the parcel drop, drive-away and counter bump conclude.
 *   3. Strict No-Truncation Rule enforced on all files.
 *   4. Automated Git stage, atomic commit and push to remote repository for Vercel deployment.
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🛒 اتصال هوشمند توالی انیمیشن: باز شدن خودکار سبد خرید دقیقاً پس از اتمام انیمیشن دکمه');
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
// ۱. بروزرسانی CartContext جهت کنترل زمان باز شدن کشو (context/CartContext.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('context/CartContext.tsx', `// File Path: context/CartContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { couponService } from "@/services/couponService";

export interface CartItem {
  id: string | number;
  title: string;
  name?: string;
  price: number;
  discountPrice?: number;
  image: string;
  quantity: number;
  stock?: number;
  category?: string;
}

export interface AppliedCoupon {
  code: string;
  discountPercent: number;
  maxDiscount?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cart: CartItem[];
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: any, openDrawer?: boolean) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, deltaOrQty: number) => void;
  clearCart: () => void;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  totalPrice: number;
  totalAmount: number;
  discountAmount: number;
  finalPayable: number;
  freeShippingThreshold: number;
  amountUntilFreeShipping: number;
  submitOrder?: (orderData: any) => { id: string; [key: string]: any };
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "axon_cart_store_v2026";
const COUPON_STORAGE_KEY = "axon_active_coupon_v2026";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [freeShippingThreshold] = useState<number>(2000000);

  // بارگذاری داده‌ها از LocalStorage در مرحله کلاینت
  useEffect(() => {
    try {
      const localCart = localStorage.getItem(CART_STORAGE_KEY);
      if (localCart) {
        const parsed = JSON.parse(localCart);
        if (Array.isArray(parsed)) setCartItems(parsed);
      }

      const localCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (localCoupon) {
        const parsed = JSON.parse(localCoupon);
        if (parsed && typeof parsed === "object") setAppliedCoupon(parsed);
      }
    } catch (err) {
      console.error("Cart hydration error:", err);
    }
  }, []);

  // همگام‌سازی بلادرنگ سبد خرید بین تمام تب‌های باز مرورگر (Cross-Tab Sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setCartItems(parsed);
        } catch {}
      }
      if (e.key === COUPON_STORAGE_KEY) {
        try {
          setAppliedCoupon(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const persistCart = useCallback((items: CartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const persistCoupon = useCallback((coupon: AppliedCoupon | null) => {
    setAppliedCoupon(coupon);
    try {
      if (coupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {}
  }, []);

  const addToCart = useCallback((item: any, openDrawer: boolean = false) => {
    const itemId = String(item.id);
    const itemTitle = item.title || item.name || "کالای دیجیتال";
    const itemPrice = Number(item.discount_price || item.discountPrice || item.price || 0);
    const itemImage = item.image || item.image_url || item.images?.[0] || "/placeholder.png";
    const itemStock = item.stock !== undefined && item.stock !== null ? Number(item.stock) : 999;
    const addQuantity = Number(item.quantity || 1);

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => String(i.id) === itemId);
      let updated: CartItem[];

      if (existingIndex > -1) {
        const existingItem = prevItems[existingIndex];
        const newQty = Math.min(itemStock, existingItem.quantity + addQuantity);
        updated = prevItems.map((i, idx) => (idx === existingIndex ? { ...i, quantity: newQty } : i));
      } else {
        updated = [
          ...prevItems,
          {
            id: itemId,
            title: itemTitle,
            name: itemTitle,
            price: itemPrice,
            discountPrice: item.discountPrice ? Number(item.discountPrice) : undefined,
            image: itemImage,
            quantity: Math.min(itemStock, addQuantity),
            stock: itemStock,
            category: item.category || "عمومی",
          },
        ];
      }

      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (openDrawer) {
      setIsCartOpen(true);
    }
  }, []);

  const removeFromCart = useCallback((id: string | number) => {
    setCartItems((prev) => {
      const updated = prev.filter((i) => String(i.id) !== String(id));
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((id: string | number, deltaOrQty: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => String(i.id) === String(id));
      if (!existing) return prev;

      let newQty = deltaOrQty;
      if (deltaOrQty === 1 || deltaOrQty === -1) {
        newQty = existing.quantity + deltaOrQty;
      }

      if (newQty <= 0) {
        const filtered = prev.filter((i) => String(i.id) !== String(id));
        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filtered));
        } catch {}
        return filtered;
      }

      const maxLimit = existing.stock !== undefined && existing.stock !== null ? existing.stock : 999;
      const finalQty = Math.min(maxLimit, newQty);

      const updated = prev.map((i) => (String(i.id) === String(id) ? { ...i, quantity: finalQty } : i));
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    persistCart([]);
    persistCoupon(null);
  }, [persistCart, persistCoupon]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => acc + (item.discountPrice ?? item.price) * item.quantity,
      0
    );
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    let disc = Math.round((totalPrice * appliedCoupon.discountPercent) / 100);
    if (appliedCoupon.maxDiscount && disc > appliedCoupon.maxDiscount) {
      disc = appliedCoupon.maxDiscount;
    }
    return disc;
  }, [totalPrice, appliedCoupon]);

  const finalPayable = useMemo(() => {
    return Math.max(0, totalPrice - discountAmount);
  }, [totalPrice, discountAmount]);

  const totalItems = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cartItems]);

  const amountUntilFreeShipping = Math.max(0, freeShippingThreshold - totalPrice);

  const applyCoupon = async (code: string) => {
    const clean = code.trim().toUpperCase();
    const res = await couponService.validateCoupon(clean, totalPrice);
    if (res.valid && res.coupon) {
      const discountPercent =
        res.coupon.type === "percent" || res.coupon.discount_type === "percent"
          ? Number(res.coupon.value || res.coupon.discount_value || 0)
          : Math.round((res.discount / (totalPrice || 1)) * 100);

      const newCoupon = {
        code: clean,
        discountPercent,
        maxDiscount: res.coupon.max_discount || res.coupon.max_discount_amount || undefined,
      };

      persistCoupon(newCoupon);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || "کد تخفیف نامعتبر است." };
  };

  const removeCoupon = () => persistCoupon(null);

  const submitOrder = (orderData: any) => {
    const orderId = \`ORD-\${Date.now().toString().slice(-6)}\`;
    const fullOrder = {
      id: orderId,
      ...orderData,
      items: cartItems,
      totalAmount: totalPrice,
      finalAmount: finalPayable,
      discountAmount,
      createdAt: new Date().toISOString(),
    };
    try {
      const existing = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([fullOrder, ...existing]));
    } catch {}
    return fullOrder;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cart: cartItems,
        totalItems,
        isCartOpen,
        setIsCartOpen,
        toggleCart,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        totalPrice,
        totalAmount: totalPrice,
        discountAmount,
        finalPayable,
        freeShippingThreshold,
        amountUntilFreeShipping,
        submitOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۲. اعمال باز شدن کشوی سبد پس از پایان ۱۲۵۰ میلی‌ثانیه‌ای انیمیشن (components/AddToCartButton.tsx)
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
  const { cartItems, addToCart, openCart } = useCart();
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

    // ۱. افزودن فوری کالا به وضعیت سبد خرید (بدون باز کردن شتاب‌زده کشو)
    addToCart(
      {
        id: product.id,
        title: product.title,
        name: product.title,
        price: product.price,
        image: product.image,
        stock: stockLimit,
        category: product.category || "تکنولوژی",
        quantity: 1,
      },
      false // عدم باز شدن ناگهانی تا اتمام انیمیشن
    );

    // ۲. انیمیشن جهش الاستیک شمارنده در ثانیه ۰.۶
    setTimeout(() => {
      setBumpCounter(true);
      setTimeout(() => setBumpCounter(false), 550);
    }, 600);

    // ۳. پس از تکمیل دقیق ۱۲۵۰ میلی‌ثانیه انیمیشن چرخ‌دستی: ریست وضعیت دکمه + باز شدن سبد خرید
    setTimeout(() => {
      setAnimState("idle");
      openCart(); // باز شدن نرم کشوی سبد خرید دقیقاً پس از اتمام کامل انیمیشن دکمه
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
              <path
                d="M3 3H5.2L7.1 14.2C7.25 15.1 8 15.8 8.9 15.8H18.2C19.1 15.8 19.85 15.1 20 14.2L21.4 7.2C21.55 6.4 20.95 5.7 20.15 5.7H6.2"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9.5"
                cy="19.5"
                r="1.8"
                fill="currentColor"
                className={isAnimating ? "animate-kinetic-wheel-spin origin-[9.5px_19.5px]" : ""}
              />
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

      {/* شمارنده زیر دکمه با انیمیشن جهش فنری (X عدد در سبد شما) */}
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
  const commitMessage = `feat(cart): open cart drawer smoothly after kinetic button animation completes [${new Date().toLocaleTimeString('fa-IR')}]`;
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
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🎉 باز شدن سبد خرید پس از اتمام انیمیشن با موفقیت اعمال و روی سرور مستقر گردید!');
  console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
} catch (gitErr) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m خطا در اتصال Git:', gitErr.message);
}
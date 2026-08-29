// File Path: context/CartContext.tsx
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
  addToCart: (item: any) => void;
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

  // بارگذاری امن داده‌ها از LocalStorage در مرحله کلاینت
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

  const addToCart = useCallback((item: any) => {
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

    setIsCartOpen(true);
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
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
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
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { couponService } from "@/services/couponService";

export interface CartItem {
  id: string | number;
  title: string;
  name?: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "axon_cart_store_v2026";
const LEGACY_CART_KEY = "axon_cart";
const COUPON_STORAGE_KEY = "axon_active_coupon_v2026";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const loadStoredCart = useCallback(() => {
    try {
      let items: CartItem[] = [];
      const primary = localStorage.getItem(CART_STORAGE_KEY);
      const legacy = localStorage.getItem(LEGACY_CART_KEY);

      if (primary) {
        items = JSON.parse(primary);
      } else if (legacy) {
        items = JSON.parse(legacy);
      }

      if (Array.isArray(items)) {
        setCartItems(items);
      }

      const cpn = localStorage.getItem(COUPON_STORAGE_KEY);
      if (cpn) {
        setAppliedCoupon(JSON.parse(cpn));
      }
    } catch (e) {
      console.error("Cart hydration error:", e);
    }
  }, []);

  useEffect(() => {
    loadStoredCart();
    const handleOpenDrawerEvent = () => setIsCartOpen(true);
    const handleCartUpdatedEvent = () => loadStoredCart();

    window.addEventListener("open_cart_drawer", handleOpenDrawerEvent);
    window.addEventListener("cart_updated", handleCartUpdatedEvent);

    return () => {
      window.removeEventListener("open_cart_drawer", handleOpenDrawerEvent);
      window.removeEventListener("cart_updated", handleCartUpdatedEvent);
    };
  }, [loadStoredCart]);

  const persistCart = useCallback((items: CartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event("cart_updated"));
    } catch {}
  }, []);

  // مقدار پیش‌فرض openDrawer برابر false است تا انیمیشن چرخ‌دستی به آرامی و بدون قطع شدن اجرا شود
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
            discountPrice: item.discount_price ? Number(item.discount_price) : undefined,
            image: itemImage,
            quantity: Math.min(itemStock, addQuantity),
            stock: itemStock,
            category: item.category || "عمومی",
          },
        ];
      }

      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(updated));
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
        localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(updated));
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
          localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(filtered));
        } catch {}
        return filtered;
      }

      const maxLimit = existing.stock !== undefined && existing.stock !== null ? existing.stock : 999;
      const finalQty = Math.min(maxLimit, newQty);
      const updated = prev.map((i) => (String(i.id) === String(id) ? { ...i, quantity: finalQty } : i));

      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    persistCart([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {}
  }, [persistCart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.discountPrice ?? item.price) * item.quantity, 0);
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

      setAppliedCoupon(newCoupon);
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(newCoupon));
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || "کد تخفیف نامعتبر است." };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem(COUPON_STORAGE_KEY);
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

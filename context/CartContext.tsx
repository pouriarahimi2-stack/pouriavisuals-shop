"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  totalPrice: number;
  totalAmount: number;
  submitOrder?: (orderData: any) => { id: string; [key: string]: any };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    try {
      const local = localStorage.getItem("pv_cart_items");
      if (local) setCartItems(JSON.parse(local));
    } catch (err) {
      console.error("Error loading cart from localStorage:", err);
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem("pv_cart_items", JSON.stringify(items));
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  };

  const addToCart = (item: any) => {
    const itemId = String(item.id);
    const itemTitle = item.title || item.name || "محصول فروشگاه";
    const itemPrice = Number(item.discount_price || item.discountPrice || item.price || 0);
    const itemImage = item.image || item.image_url || item.images?.[0] || "/placeholder.png";

    const existing = cartItems.find((i) => String(i.id) === itemId);
    let updated: CartItem[];

    if (existing) {
      updated = cartItems.map((i) =>
        String(i.id) === itemId ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
      );
    } else {
      updated = [
        ...cartItems,
        {
          id: itemId,
          title: itemTitle,
          name: itemTitle,
          price: itemPrice,
          discountPrice: item.discountPrice ? Number(item.discountPrice) : undefined,
          image: itemImage,
          quantity: item.quantity || 1,
          stock: item.stock !== undefined ? Number(item.stock) : undefined,
          category: item.category,
        },
      ];
    }
    saveCart(updated);
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string | number) => {
    const updated = cartItems.filter((i) => String(i.id) !== String(id));
    saveCart(updated);
  };

  const updateQuantity = (id: string | number, deltaOrQty: number) => {
    const existing = cartItems.find((i) => String(i.id) === String(id));
    if (!existing) return;

    let newQty = deltaOrQty;
    if (deltaOrQty === 1 || deltaOrQty === -1) {
      newQty = existing.quantity + deltaOrQty;
    }

    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }

    const updated = cartItems.map((i) => (String(i.id) === String(id) ? { ...i, quantity: newQty } : i));
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
    setAppliedCoupon(null);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === "OFF10" || clean === "AXON") {
      setAppliedCoupon({ code: clean, discountPercent: 10 });
      return { success: true, message: "کد تخفیف ۱۰٪ با موفقیت اعمال شد." };
    }
    return { success: false, message: "کد تخفیف وارد شده معتبر نیست." };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const totalItems = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.discountPrice ?? item.price) * item.quantity,
    0
  );

  const submitOrder = (orderData: any) => {
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const fullOrder = {
      id: orderId,
      ...orderData,
      items: cartItems,
      totalAmount: totalPrice,
      createdAt: new Date().toISOString(),
    };
    try {
      const existing = JSON.parse(localStorage.getItem("site_orders") || "[]");
      localStorage.setItem("site_orders", JSON.stringify([fullOrder, ...existing]));
      localStorage.setItem("admin_orders_cache", JSON.stringify([fullOrder, ...existing]));
    } catch (err) {
      console.error("Error saving local order:", err);
    }
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
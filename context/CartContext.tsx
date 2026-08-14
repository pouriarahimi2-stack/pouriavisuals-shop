"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { couponService, Coupon } from "@/services/couponService";
import { orderService, Order } from "@/services/orderService";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  image: string;
  quantity: number;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  postalCode: string;
  isPhoneVerified?: boolean;
  otpHash?: string;
  otpSentAt?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  submitOrder: (customer: CustomerDetails) => Order;
  toastMessage: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const saved = localStorage.getItem("app_cart_db");
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("app_cart_db", JSON.stringify(items));
  };

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    const existing = cartItems.find((item) => item.id === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = cartItems.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updated = [...cartItems, { ...product, quantity: 1 }];
    }
    saveCart(updated);
    showToast(`🛒 "${product.title}" به سبد خرید اضافه شد.`);
  };

  const removeFromCart = (id: string) => {
    const item = cartItems.find((i) => i.id === id);
    const updated = cartItems.filter((i) => i.id !== id);
    saveCart(updated);
    if (item) showToast(`🗑️ "${item.title}" از سبد خرید حذف شد.`);
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    saveCart(updated);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("app_cart_db");
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string) => {
    const result = couponService.validateCoupon(code);
    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
      showToast(`🎉 کد تخفیف "${code.toUpperCase()}" اعمال شد.`);
      return { success: true, message: "کد تخفیف اعمال شد!" };
    }
    showToast(`⚠️ ${result.message}`);
    return { success: false, message: result.message };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast("کد تخفیف حذف شد.");
  };

  const submitOrder = (customer: CustomerDetails): Order => {
    const rawTotal = cartItems.reduce(
      (acc, item) => acc + (item.discountPrice ?? item.price) * item.quantity,
      0
    );

    let discountAmount = 0;
    if (appliedCoupon) {
      discountAmount = (rawTotal * appliedCoupon.discountPercent) / 100;
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    }

    const finalAmount = Math.max(0, rawTotal - discountAmount);

    const newOrder = orderService.addOrder({
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerPhone: customer.phone,
      isPhoneVerified: customer.isPhoneVerified ?? true,
      otpHash: customer.otpHash,
      otpSentAt: customer.otpSentAt,
      customerAddress: customer.address,
      postalCode: customer.postalCode,
      isPostalCodeVerifiedGNAF: true,
      items: cartItems.map((i) => ({
        productId: i.id,
        title: i.title,
        price: i.price,
        discountPrice: i.discountPrice,
        quantity: i.quantity,
        image: i.image,
      })),
      totalAmount: rawTotal,
      discountAmount,
      finalAmount,
      paymentStatus: "unpaid",
    });

    clearCart();
    setIsCartOpen(false);
    return newOrder;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        toggleCart: () => setIsCartOpen((prev) => !prev),
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        submitOrder,
        toastMessage,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 text-white font-bold text-xs shadow-2xl border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
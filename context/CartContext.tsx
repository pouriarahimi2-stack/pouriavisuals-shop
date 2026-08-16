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
  selectedColor?: string;
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
  notes?: string;
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
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  submitOrder: (customer: CustomerDetails) => Promise<Order>;
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
    const existing = cartItems.find((item) => item.id === product.id && item.selectedColor === product.selectedColor);
    let updated: CartItem[];
    if (existing) {
      updated = cartItems.map((item) =>
        item.id === product.id && item.selectedColor === product.selectedColor
          ? { ...item, quantity: item.quantity + 1 }
          : item
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

  const applyCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const rawTotal = cartItems.reduce(
      (acc, item) => acc + (item.discountPrice ?? item.price) * item.quantity,
      0
    );

    const result = await couponService.validateCoupon(cleanCode, rawTotal);
    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
      showToast(`🎉 کد تخفیف "${cleanCode}" با موفقیت اعمال شد.`);
      return { success: true, message: "کد تخفیف اعمال شد!" };
    }
    showToast(`⚠️ ${result.message}`);
    return { success: false, message: result.message };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast("کد تخفیف حذف شد.");
  };

  const submitOrder = async (customer: CustomerDetails): Promise<Order> => {
    const rawTotal = cartItems.reduce(
      (acc, item) => acc + (item.discountPrice ?? item.price) * item.quantity,
      0
    );

    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === "percent") {
        discountAmount = (rawTotal * Number(appliedCoupon.discount_value)) / 100;
        if (appliedCoupon.max_discount_amount && discountAmount > Number(appliedCoupon.max_discount_amount)) {
          discountAmount = Number(appliedCoupon.max_discount_amount);
        }
      } else {
        discountAmount = Number(appliedCoupon.discount_value);
      }
    }

    const finalAmount = Math.max(0, rawTotal - discountAmount);

    const orderPayload = {
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
      customerPhone: customer.phone,
      customer_phone: customer.phone,
      customerAddress: customer.address,
      shipping_address: customer.address,
      postalCode: customer.postalCode,
      notes: customer.notes,
      items: cartItems.map((i) => ({
        product_id: i.id,
        productId: i.id,
        product_name: i.title,
        title: i.title,
        product_price: i.discountPrice ?? i.price,
        price: i.discountPrice ?? i.price,
        quantity: i.quantity,
        selected_color: i.selectedColor,
        total_price: (i.discountPrice ?? i.price) * i.quantity,
        image: i.image,
      })),
      totalAmount: rawTotal,
      total_amount: finalAmount,
      discountAmount,
      finalAmount,
      status: "paid" as const,
      payment_method: "درگاه آنلاین شتاب",
    };

    let createdOrder: any;
    if (typeof orderService.addOrder === "function") {
      createdOrder = await orderService.addOrder(orderPayload);
    } else {
      createdOrder = { id: `ORD-${Date.now().toString().slice(-6)}`, ...orderPayload, created_at: new Date().toISOString() };
      const local = JSON.parse(localStorage.getItem("admin_orders_cache") || localStorage.getItem("site_orders") || "[]");
      local.unshift(createdOrder);
      localStorage.setItem("admin_orders_cache", JSON.stringify(local));
      localStorage.setItem("site_orders", JSON.stringify(local));
    }

    // ثبت خودکار ترخیص کالا در لاگ انبارداری
    try {
      const savedLogs = JSON.parse(localStorage.getItem("inventory_stock_logs") || "[]");
      const now = new Date();
      cartItems.forEach((item) => {
        savedLogs.unshift({
          id: `log-${Date.now()}-${Math.random()}`,
          productId: item.id,
          productName: item.title,
          type: "out",
          quantity: item.quantity,
          date: now.toLocaleDateString("fa-IR"),
          time: now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
          reason: `ثبت سفارش جدید آنلاین (${createdOrder.customer_name || createdOrder.customerName})`,
          operator: "درگاه تسویه‌حساب مشتری",
        });
      });
      localStorage.setItem("inventory_stock_logs", JSON.stringify(savedLogs));
    } catch {}

    clearCart();
    setIsCartOpen(false);
    return createdOrder;
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
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[var(--modal-bg)] text-[var(--text-primary)] font-bold text-xs shadow-2xl border border-[var(--card-border)] animate-bounce">
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
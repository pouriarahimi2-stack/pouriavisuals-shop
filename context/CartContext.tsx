'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string | number;
  title?: string;
  name?: string;
  title_fa?: string;
  price: number;
  image?: string;
  image_url?: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  cartItems: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalPrice: number;
  totalCount: number;
  toastMessage: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // لود سبد خرید از LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pv_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
    setIsHydrated(true);
  }, []);

  // ذخیره در LocalStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('pv_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart, isHydrated]);

  const addToCart = (product: any) => {
    const productId = product.id;
    const productName = product.title || product.title_fa || product.name || 'محصول پوریا ویژوالز';
    const productPrice = Number(product.price) || 0;
    const productImage = product.image_url || product.image || (Array.isArray(product.images) ? product.images[0] : '') || '/placeholder.png';

    setCart((prev) => {
      const existing = prev.find((item) => String(item.id) === String(productId));
      if (existing) {
        return prev.map((item) =>
          String(item.id) === String(productId)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: productId,
          title: productName,
          name: productName,
          price: productPrice,
          image: productImage,
          image_url: productImage,
          quantity: 1,
        },
      ];
    });

    setToastMessage(`"${productName}" به سبد خرید اضافه شد.`);
    setIsCartOpen(true);

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const removeFromCart = (id: string | number) => {
    setCart((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const updateQuantity = (id: string | number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (String(item.id) === String(id)) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalPrice,
        totalCount,
        toastMessage,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slide-up text-sm font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          {toastMessage}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
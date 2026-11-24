// File Path: context/CartContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

export interface CartItem {
  id: string | number;
  cartKey?: string;
  title: string;
  name?: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
  image: string;
  quantity: number;
  stock?: number;
  category?: string;
  selectedColor?: string;
  shipping_type?: string;
}

export interface AppliedCoupon {
  code: string;
  discountType?: "percent" | "fixed";
  discountPercent: number;
  fixedAmount?: number;
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
  removeFromCart: (idOrKey: string | number) => void;
  updateQuantity: (idOrKey: string | number, deltaOrQty: number) => void;
  clearCart: () => void;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (
    code: string,
    customerPhone?: string
  ) => Promise<{ success: boolean; message: string }>;
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

function buildCartItemKey(id: string | number, color?: string): string {
  const cleanColor = String(color || "").trim();
  return cleanColor ? `${String(id)}::${cleanColor}` : String(id);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null
  );

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
        const normalized = items.map((it) => ({
          ...it,
          cartKey:
            it.cartKey || buildCartItemKey(it.id, it.selectedColor),
        }));
        setCartItems(normalized);
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
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY || e.key === COUPON_STORAGE_KEY) {
        loadStoredCart();
      }
    };

    window.addEventListener("open_cart_drawer", handleOpenDrawerEvent);
    window.addEventListener("cart_updated", handleCartUpdatedEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("open_cart_drawer", handleOpenDrawerEvent);
      window.removeEventListener("cart_updated", handleCartUpdatedEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [loadStoredCart]);

  const writeCartStorage = (items: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(items));
    } catch {}
  };

  const persistCart = useCallback((items: CartItem[]) => {
    setCartItems(items);
    writeCartStorage(items);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cart_updated"));
    }
  }, []);

  const addToCart = useCallback((item: any, openDrawer: boolean = false) => {
    const itemId = String(item.id);
    const selectedColor = item.selectedColor
      ? String(item.selectedColor).trim()
      : undefined;
    const itemKey = buildCartItemKey(itemId, selectedColor);
    const itemTitle = item.title || item.name || "کالای دیجیتال";
    const itemPrice = Number(
      item.discount_price || item.discountPrice || item.price || 0
    );
    const itemImage =
      item.image || item.image_url || item.images?.[0] || "/placeholder.png";
    const itemStock =
      item.stock !== undefined && item.stock !== null
        ? Number(item.stock)
        : 999;
    const addQuantity = Math.max(1, Number(item.quantity || 1));

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) => (i.cartKey || buildCartItemKey(i.id, i.selectedColor)) === itemKey
      );
      let updated: CartItem[];

      if (existingIndex > -1) {
        const existingItem = prevItems[existingIndex];
        const newQty = Math.min(itemStock, existingItem.quantity + addQuantity);
        updated = prevItems.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: newQty } : i
        );
      } else {
        updated = [
          ...prevItems,
          {
            id: itemId,
            cartKey: itemKey,
            title: itemTitle,
            name: itemTitle,
            price: itemPrice,
            discountPrice: item.discount_price
              ? Number(item.discount_price)
              : undefined,
            image: itemImage,
            quantity: Math.min(itemStock, addQuantity),
            stock: itemStock,
            category: item.category || "عمومی",
            selectedColor,
            shipping_type: item.shipping_type || undefined,
          },
        ];
      }
      writeCartStorage(updated);
      return updated;
    });

    if (openDrawer) {
      setIsCartOpen(true);
    }
  }, []);

  const removeFromCart = useCallback((idOrKey: string | number) => {
    const target = String(idOrKey);
    setCartItems((prev) => {
      const updated = prev.filter(
        (i) =>
          (i.cartKey || buildCartItemKey(i.id, i.selectedColor)) !== target &&
          String(i.id) !== target
      );
      writeCartStorage(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback(
    (idOrKey: string | number, deltaOrQty: number) => {
      const target = String(idOrKey);
      setCartItems((prev) => {
        const existing = prev.find(
          (i) =>
            (i.cartKey || buildCartItemKey(i.id, i.selectedColor)) === target ||
            String(i.id) === target
        );
        if (!existing) return prev;

        const matchedKey =
          existing.cartKey ||
          buildCartItemKey(existing.id, existing.selectedColor);

        if (deltaOrQty <= 0) {
          const filtered = prev.filter(
            (i) =>
              (i.cartKey || buildCartItemKey(i.id, i.selectedColor)) !==
              matchedKey
          );
          writeCartStorage(filtered);
          return filtered;
        }

        const maxLimit =
          existing.stock !== undefined && existing.stock !== null
            ? existing.stock
            : 999;
        const finalQty = Math.min(maxLimit, deltaOrQty);
        const updated = prev.map((i) =>
          (i.cartKey || buildCartItemKey(i.id, i.selectedColor)) === matchedKey
            ? { ...i, quantity: finalQty }
            : i
        );

        writeCartStorage(updated);
        return updated;
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    persistCart([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coupons_updated"));
    }
  }, [persistCart]);

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
    if (!appliedCoupon || totalPrice <= 0) return 0;
    if (appliedCoupon.discountType === "fixed" && appliedCoupon.fixedAmount) {
      return Math.min(totalPrice, appliedCoupon.fixedAmount);
    }
    let disc = Math.round(
      (totalPrice * (appliedCoupon.discountPercent || 0)) / 100
    );
    if (appliedCoupon.maxDiscount && disc > appliedCoupon.maxDiscount) {
      disc = appliedCoupon.maxDiscount;
    }
    return Math.min(totalPrice, disc);
  }, [totalPrice, appliedCoupon]);

  const finalPayable = useMemo(() => {
    return Math.max(0, totalPrice - discountAmount);
  }, [totalPrice, discountAmount]);

  const totalItems = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cartItems]);

  const applyCoupon = async (code: string, customerPhone?: string) => {
    const clean = code.trim().toUpperCase();
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: clean,
          cartTotal: totalPrice,
          items: cartItems,
          customerPhone: customerPhone || "",
        }),
      });

      const res = await response.json();

      if (res.valid && res.coupon) {
        const cpn: any = res.coupon;
        const isFixed = cpn.type === "fixed" || cpn.discount_type === "fixed";
        const rawVal = Number(
          cpn.value ??
            cpn.discount_value ??
            cpn.discount_percent ??
            cpn.discount_amount ??
            0
        );

        const newCoupon: AppliedCoupon = {
          code: clean,
          discountType: isFixed ? "fixed" : "percent",
          discountPercent: isFixed ? 0 : rawVal,
          fixedAmount: isFixed ? rawVal : undefined,
          maxDiscount:
            Number(cpn.max_discount || cpn.max_discount_amount || 0) ||
            undefined,
        };

        setAppliedCoupon(newCoupon);
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(newCoupon));
        return {
          success: true,
          message: res.message || "✓ کد تخفیف با موفقیت اعمال شد.",
        };
      }
      return {
        success: false,
        message: res.message || "کد تخفیف نامعتبر است.",
      };
    } catch {
      return {
        success: false,
        message: "خطا در ارتباط با سرور جهت بررسی کد تخفیف.",
      };
    }
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
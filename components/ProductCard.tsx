"use client";

import React from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: {
    id: string | number;
    title?: string;
    name?: string;
    price: number;
    discount_price?: number | null;
    discountPrice?: number | null;
    image?: string | null;
    images?: string[];
    category?: string;
    stock?: number;
    warranty?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const cart = useCart() as any;

  const title = product.title || product.name || "کالای دیجیتال";
  const displayPrice = Number(product.price || 0);
  const discountVal = product.discount_price || product.discountPrice;
  const finalPrice = discountVal && Number(discountVal) > 0 ? Number(discountVal) : displayPrice;

  const imageSrc =
    product.image ||
    (Array.isArray(product.images) && product.images[0]) ||
    "/placeholder.png";

  const cartItems: any[] = Array.isArray(cart?.cartItems)
    ? cart.cartItems
    : (Array.isArray(cart?.items) ? cart.items : []);

  const cartItem = cartItems.find(
    (i: any) => String(i?.productId || i?.id) === String(product.id)
  );
  const qtyInCart = Number(cartItem?.quantity || 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundEngine.playSuccess();

    const itemPayload = {
      ...product,
      id: String(product.id),
      productId: String(product.id),
      title,
      price: finalPrice,
      image: imageSrc,
      quantity: 1,
    };

    if (typeof cart?.addToCart === "function") {
      cart.addToCart(itemPayload, 1);
    } else if (typeof cart?.addItem === "function") {
      cart.addItem(itemPayload);
    }

    if (typeof cart?.openCart === "function") {
      cart.openCart();
    }
  };

  return (
    <div className="group rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl">
      <Link href={`/products/${product.id}`} onClick={() => soundEngine.playClick()} className="space-y-3 block p-4">
        <div className="relative aspect-square rounded-2xl bg-black/5 dark:bg-white/5 overflow-hidden flex items-center justify-center">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          {discountVal && Number(discountVal) > 0 && (
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black shadow-md">
              تخفیف ویژه
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--accent-blue)] block truncate">
            {product.category || "تکنولوژی و لوازم دیجیتال"}
          </span>
          <h3 className="text-xs font-black text-[var(--text-primary)] line-clamp-2 leading-relaxed min-h-[36px] group-hover:text-[var(--accent-blue)] transition">
            {title}
          </h3>
        </div>
      </Link>

      <div className="p-4 pt-0 space-y-3 border-t border-[var(--card-border)]/50 mt-auto">
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-[10px] text-[var(--text-secondary)] font-bold">قیمت:</span>
          <div className="text-left font-mono">
            {discountVal && Number(discountVal) > 0 ? (
              <div className="space-y-0.5">
                <span className="line-through text-slate-400 text-[10px] block" suppressHydrationWarning>
                  {formatPrice(displayPrice)}
                </span>
                <span className="text-emerald-500 font-black text-sm block" suppressHydrationWarning>
                  {formatPrice(finalPrice)} تومان
                </span>
              </div>
            ) : (
              <span className="text-[var(--text-primary)] font-black text-sm" suppressHydrationWarning>
                {formatPrice(displayPrice)} تومان
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full py-3 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <span>🛒</span>
          <span>{qtyInCart > 0 ? `افزودن مجدد (${qtyInCart} در سبد)` : "افزودن به سبد خرید"}</span>
        </button>
      </div>
    </div>
  );
}

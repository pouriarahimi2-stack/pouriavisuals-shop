"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  const loadCart = () => {
    try {
      const items = JSON.parse(localStorage.getItem("axon_cart") || "[]");
      setCartItems(items);
    } catch (e) {
      setCartItems([]);
    }
  };

  useEffect(() => {
    loadCart();

    const handleUpdate = () => loadCart();
    const handleOpen = () => {
      loadCart();
      setIsOpen(true);
    };

    window.addEventListener("cart_updated", handleUpdate);
    window.addEventListener("open_cart_drawer", handleOpen);

    return () => {
      window.removeEventListener("cart_updated", handleUpdate);
      window.removeEventListener("open_cart_drawer", handleOpen);
    };
  }, []);

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cartItems];
    const newQty = (updated[index].quantity || 1) + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setCartItems(updated);
    localStorage.setItem("axon_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart_updated"));
  };

  const removeItem = (index: number) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
    localStorage.setItem("axon_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart_updated"));
  };

  const totalPrice = cartItems.reduce((acc, item) => {
    const p = item.discount_price ? Number(item.discount_price) : Number(item.price || 0);
    return acc + p * (item.quantity || 1);
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 bg-black/60 flex justify-start dir-rtl">
      <div className="w-full sm:max-w-md w-full max-w-full sm:max-w-md bg-[#121214] will-change-transform border-l border-[#27272a] h-full flex flex-col justify-between p-6 shadow-2xl animate-in slide-in-from-right duration-200">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#0071e3]" />
              <h2 className="text-base font-black text-white">سبد خرید شما</h2>
              <span className="text-xs text-zinc-400 font-bold">({cartItems.length} قلم کالا)</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="mt-4 space-y-3 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <div className="py-20 text-center text-xs text-zinc-500 font-bold">
                سبد خرید شما در حال حاضر خالی است.
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#1c1c1f] border border-[#27272a] flex items-center justify-between gap-3">
                  <img src={item.image || "/placeholder.png"} alt={item.title} className="w-14 h-14 object-contain rounded-xl bg-black/40 p-1" />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                    <div className="text-[11px] text-emerald-400 font-bold mt-1">
                      {Number(item.discount_price || item.price || 0).toLocaleString("fa-IR")} تومان
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-[#121214] px-2 py-1 rounded-xl border border-[#27272a]">
                    <button onClick={() => updateQuantity(idx, 1)} className="text-zinc-400 hover:text-white">
                      <Plus size={13} />
                    </button>
                    <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, -1)} className="text-zinc-400 hover:text-white">
                      <Minus size={13} />
                    </button>
                  </div>

                  <button onClick={() => removeItem(idx)} className="p-1.5 text-zinc-500 hover:text-rose-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {cartItems.length > 0 && (
          <div className="pt-4 border-t border-[#27272a] space-y-4">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-400">مبلغ قابل پرداخت:</span>
              <div className="text-left">
                <div className="text-base text-emerald-400 font-black">{totalPrice.toLocaleString("fa-IR")} تومان</div>
                <div className="text-[10px] text-zinc-500">{(totalPrice * 10).toLocaleString("fa-IR")} ریال</div>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              ثبت سفارش و ادامه خرید
              <ArrowLeft size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

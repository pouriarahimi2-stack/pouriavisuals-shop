// File Path: app/my-orders/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  id: string;
  order_number?: string;
  created_at: string;
  status: string;
  payment_status?: string;
  final_amount: number;
  total_amount?: number;
  tracking_code?: string;
  phone?: string;
  items: any[];
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCustomerOrders = useCallback(async (userPhone: string) => {
    const cleanPhone = String(userPhone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/orders/track?phone=${encodeURIComponent(cleanPhone)}&t=${Date.now()}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("axon_user_session");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user?.phone) {
          setPhone(user.phone);
          fetchCustomerOrders(user.phone);
          return;
        }
      }
    } catch {}
    setLoading(false);
  }, [fetchCustomerOrders]);

  useEffect(() => {
    if (!phone) return;
    const cleanPhone = String(phone).replace(/\D/g, "");

    const channel = supabase
      .channel("realtime-customer-orders-feed-" + cleanPhone)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchCustomerOrders(cleanPhone);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [phone, fetchCustomerOrders]);

  const handleCancelUnpaid = async (ord: OrderItem) => {
    if (!confirm("آیا از لغو و حذف این سفارش پرداخت‌نشده اطمینان دارید؟"))
      return;
    soundEngine.playClick();
    setDeletingId(ord.id);
    try {
      const cleanPhone = String(phone || ord.phone || "").replace(/\D/g, "");
      const res = await fetch(
        `/api/orders/track?id=${encodeURIComponent(
          ord.id
        )}&phone=${encodeURIComponent(cleanPhone)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        soundEngine.playSuccess();
        await fetchCustomerOrders(cleanPhone);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (ord: OrderItem) => {
    const st = String(ord.status || "");
    const paySt = String(ord.payment_status || "");
    if (st === "cancelled" || paySt === "failed") {
      return (
        <span className="px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 font-black text-[10px]">
          لغو شده
        </span>
      );
    }
    if (st === "delivered") {
      return (
        <span className="px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-black text-[10px]">
          تحویل داده شد 🎉
        </span>
      );
    }
    if (st === "shipped") {
      return (
        <span className="px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-black text-[10px]">
          تحویل به پست 🚚
        </span>
      );
    }
    if (st === "paid" || paySt === "paid" || st === "processing") {
      return (
        <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-black text-[10px]">
          پرداخت شده ✓
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 font-black text-[10px] animate-pulse">
        در انتظار تکمیل پرداخت
      </span>
    );
  };

  return (
    <div
      className="max-w-5xl mx-auto px-4 py-10 font-sans select-text text-[var(--text-primary)] space-y-8"
      dir="rtl"
    >
      <div className="border-b border-[var(--card-border)] pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg sm:text-2xl font-black">
              حساب کاربری و سوابق سفارش‌های من
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            {phone
              ? `سفارش‌های ثبت‌شده با شماره ${phone} (به‌روزرسانی بلادرنگ)`
              : "برای مشاهده سوابق فاکتورها وارد حساب کاربری خود شوید."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/account"
            className="px-4 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow hover:opacity-90 transition"
          >
            🧾 مشاهده جزئیات فاکتورها
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition"
          >
            ← فروشگاه
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs font-bold text-[var(--text-secondary)]">
          در حال بارگذاری فاکتورهای بلادرنگ...
        </div>
      ) : !phone ? (
        <div className="p-12 text-center rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl">
          <p className="text-xs font-bold text-[var(--text-secondary)]">
            شما هنوز وارد حساب کاربری خود نشده‌اید.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg hover:opacity-90 transition"
          >
            ورود به حساب کاربری ←
          </Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl">
          <span className="text-4xl block">📦</span>
          <p className="text-xs font-bold text-[var(--text-secondary)]">
            هنوز سفارشی با این شماره در سیستم ثبت نشده است.
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md hover:opacity-90 transition"
          >
            مشاهده کاتالوگ محصولات
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const finalAmt = Number(ord.final_amount || ord.total_amount || 0);
            const isUnpaid =
              ord.status === "pending" && ord.payment_status !== "paid";
            return (
              <div
                key={ord.id}
                className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-4 text-xs hover:border-[var(--accent-blue)]/50 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono font-black text-sm text-[var(--accent-blue)]"
                      dir="ltr"
                    >
                      #{ord.order_number || ord.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className="text-[11px] text-slate-400 font-mono"
                      suppressHydrationWarning
                    >
                      {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  <div>{getStatusBadge(ord)}</div>
                </div>

                {ord.tracking_code && (
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-wrap justify-between items-center gap-2">
                    <span className="font-bold text-blue-400 text-xs">
                      کد پیگیری مرسوله پستی:
                    </span>
                    <span
                      className="font-mono font-black tracking-widest text-xs text-blue-500 dark:text-blue-300"
                      dir="ltr"
                    >
                      {ord.tracking_code}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                  <div>
                    <span className="text-[var(--text-secondary)] font-bold ml-2">
                      مبلغ نهایی فاکتور:
                    </span>
                    <span
                      className="font-mono font-black text-emerald-500 text-sm"
                      suppressHydrationWarning
                    >
                      {formatPrice(finalAmt)} تومان
                    </span>
                  </div>

                  {isUnpaid && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/checkout/payment?orderId=${encodeURIComponent(
                          ord.id
                        )}&amount=${encodeURIComponent(
                          String(finalAmt)
                        )}&phone=${encodeURIComponent(phone)}`}
                        className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow hover:opacity-90 transition"
                      >
                        💳 پرداخت آنلاین
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === ord.id}
                        onClick={() => handleCancelUnpaid(ord)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white font-bold cursor-pointer transition disabled:opacity-50"
                      >
                        {deletingId === ord.id ? "..." : "🗑️ لغو سفارش"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
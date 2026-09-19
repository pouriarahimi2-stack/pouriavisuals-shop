"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  id: string;
  order_number?: string;
  created_at: string;
  status: string;
  final_amount: number;
  total_amount?: number;
  tracking_code?: string;
  items: any[];
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");

  const fetchCustomerOrders = async (userPhone: string) => {
    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(userPhone)}`);
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  // گوش دادن بلادرنگ به تغییرات سفارشات مربوط به این شماره
  useEffect(() => {
    if (!phone) return;

    const channel = supabase
      .channel("realtime-customer-orders-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `phone=eq.${phone}`,
        },
        () => {
          fetchCustomerOrders(phone);
          soundEngine.playSuccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [phone]);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "paid":
        return <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-black text-[10px]">پرداخت شده ✓</span>;
      case "shipped":
        return <span className="px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-black text-[10px]">تحویل به پست 🚚</span>;
      case "delivered":
        return <span className="px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-black text-[10px]">تحویل داده شد</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 font-black text-[10px]">لغو شده</span>;
      default:
        return <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 font-black text-[10px] animate-pulse">در انتظار بررسی</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="border-b border-[var(--card-border)] pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black">حساب کاربری و سوابق سفارش‌های من</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            {phone ? `سفارش‌های ثبت شده با شماره ${phone} (به‌روزرسانی بلادرنگ)` : "برای مشاهده سوابق فاکتورها وارد حساب کاربری خود شوید."}
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition"
        >
          ← بازگشت به فروشگاه
        </Link>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs font-bold text-[var(--text-secondary)]">
          در حال بارگذاری فاکتورهای بلادرنگ...
        </div>
      ) : !phone ? (
        <div className="p-12 text-center rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl">
          <p className="text-xs font-bold text-[var(--text-secondary)]">شما هنوز وارد حساب کاربری خود نشده‌اید.</p>
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
          <p className="text-xs font-bold text-[var(--text-secondary)]">هنوز سفارشی با این شماره در سیستم ثبت نشده است.</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md hover:opacity-90 transition"
          >
            مشاهده کاتالوگ تجهیزات استودیو
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-4 text-xs hover:border-[var(--accent-blue)]/50 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm text-[var(--accent-blue)]">
                    #{ord.order_number || ord.id.slice(0, 10)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono" suppressHydrationWarning>
                    {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                <div>{getStatusBadge(ord.status)}</div>
              </div>

              {ord.tracking_code && (
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-wrap justify-between items-center gap-2">
                  <span className="font-bold text-blue-400 text-xs">کد پیگیری مرسوله پستی:</span>
                  <span className="font-mono font-black tracking-widest text-xs text-blue-300">{ord.tracking_code}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-[var(--text-secondary)] font-bold">مبلغ نهایی فاکتور:</span>
                <span className="font-mono font-black text-emerald-500 text-sm" suppressHydrationWarning>
                  {formatPrice(Number(ord.final_amount || ord.total_amount || 0))} تومان
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

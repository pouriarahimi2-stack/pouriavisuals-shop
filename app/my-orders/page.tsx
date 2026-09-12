"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

interface OrderItem {
  id: string;
  order_number?: string;
  created_at: string;
  status: string;
  final_amount: number;
  tracking_code?: string;
  items: any[];
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    // استخراج شماره همراه کاربر وارد شده از سشن
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

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "paid":
        return <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">پرداخت شده ✓</span>;
      case "shipped":
        return <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-500 font-bold text-[10px]">تحویل به پست 🚚</span>;
      case "delivered":
        return <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-500 font-bold text-[10px]">تحویل داده شد</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-500 font-bold text-[10px]">لغو شده</span>;
      default:
        return <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-500 font-bold text-[10px]">در انتظار بررسی</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="border-b border-[var(--card-border)] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">حساب کاربری و تاریخچه سفارش‌های من</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {phone ? `سفارش‌های ثبت شده با شماره ${phone}` : "برای مشاهده سوابق فاکتورها وارد حساب خود شوید."}
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold"
        >
          ← بازگشت به فروشگاه
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-bold text-[var(--text-secondary)]">
          در حال بارگذاری فاکتورهای شما...
        </div>
      ) : !phone ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4">
          <p className="text-xs font-bold text-[var(--text-secondary)]">شما هنوز وارد حساب کاربری خود نشده‌اید.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg"
          >
            ورود به حساب کاربری ←
          </Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-3">
          <span className="text-3xl block">📦</span>
          <p className="text-xs font-bold text-[var(--text-secondary)]">هنوز سفارشی با این شماره در سیستم ثبت نشده است.</p>
          <Link
            href="/products"
            className="inline-block px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold"
          >
            مشاهده کاتالوگ مانیتورها
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm space-y-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm text-[var(--accent-blue)]">
                    #{ord.order_number || ord.id.slice(0, 8)}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                    {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                <div>{getStatusBadge(ord.status)}</div>
              </div>

              {ord.tracking_code && (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-wrap justify-between items-center gap-2">
                  <span className="font-bold text-blue-400 text-[11px]">کد رهگیری پست پیشتاز:</span>
                  <span className="font-mono font-black tracking-widest text-[11px] text-blue-300">{ord.tracking_code}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-[var(--text-secondary)]">مبلغ کل پرداختی:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm" suppressHydrationWarning>
                  {formatPrice(ord.final_amount)} تومان
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

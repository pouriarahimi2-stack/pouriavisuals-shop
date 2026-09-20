"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMsg(null);
    setOrder(null);
    setLoading(true);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: orderId.trim() || phone.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.orders) && json.orders.length > 0) {
        soundEngine.playSuccess();
        setOrder(json.orders[0]);
      } else {
        setErrorMsg("سفارشی با اطلاعات وارد شده در سامانه یافت نشد.");
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با سامانه رهگیری.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs">پرداخت شده / آماده ارسال</span>;
      case "shipped":
        return <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-500 font-bold text-xs">تحویل به شرکت پست 🚚</span>;
      case "delivered":
        return <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-500 font-bold text-xs">تحویل مشتری شد</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-500 font-bold text-xs">لغو شده</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 font-bold text-xs">در انتظار بررسی</span>;
    }
  };

  return (
    <div className="min-h-[80vh] py-12 px-4 max-w-3xl mx-auto space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black">📦 رهگیری آنلاین وضعیت سفارش</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          شماره سفارش یا تلفن همراه خریدار را جهت مشاهده وضعیت صدور بارنامه وارد نمایید.
        </p>
      </div>

      <form
        onSubmit={handleTrack}
        className="p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">شماره یا شناسه فاکتور:</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="مثال: AXON-..."
              className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">یا شماره تلفن همراه خریدار:</label>
            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912..."
              className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] text-center"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "در حال استعلام..." : "رهگیری آنلاین مرسوله 🔍"}
        </button>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold text-center">
            ⚠️ {errorMsg}
          </div>
        )}
      </form>

      {order && (
        <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 animate-fadeIn text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
            <div>
              <span className="text-[var(--text-secondary)]">سفارش بنام:</span>
              <span className="font-black text-sm text-[var(--text-primary)] mr-2">{order.customer_name}</span>
            </div>
            <div>{getStatusBadge(order.payment_status || order.status)}</div>
          </div>

          {order.tracking_code && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex justify-between items-center">
              <span className="font-bold text-blue-500">کد رهگیری پست پیشتاز:</span>
              <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-300 tracking-widest">{order.tracking_code}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-[var(--text-secondary)]">مبلغ کل فاکتور:</span>
            <span className="font-mono font-black text-emerald-500 text-base" suppressHydrationWarning>
              {formatPrice(order.total_price || order.final_amount)} تومان
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

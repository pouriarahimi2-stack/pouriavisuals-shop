"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Package, Clock, Truck, CheckCircle2, XCircle, ArrowLeft, Hash } from "lucide-react";

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">تایید شده / آماده ارسال</span>;
      case "shipped":
        return <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">تحویل به شرکت پست</span>;
      case "delivered":
        return <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold">تحویل داده شده</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold">لغو شده</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">در انتظار بررسی کارشناس</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 lg:p-12 dir-rtl">
      <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-8">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-bold">رهگیری و پیگیری سفارش</span>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-4">
            <Package size={32} />
          </div>
          <h1 className="text-xl font-black text-white">استعلام و رهگیری سفارشات</h1>
          <p className="text-xs text-zinc-400 mt-2">
            شماره موبایلی که هنگام خرید ثبت کرده‌اید یا شماره سفارش خود را وارد کنید:
          </p>

          <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثلاً: 09123456789 یا AXON-123456"
              className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-white outline-none focus:border-[#0071e3] text-center sm:text-right"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-black shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search size={16} />
              {loading ? "در حال استعلام..." : "رهگیری سفارش"}
            </button>
          </form>
        </div>

        {/* نتایج استعلام */}
        {orders !== null && (
          <div className="mt-8 space-y-4">
            {orders.length === 0 ? (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-12 text-center text-xs text-zinc-400 font-bold">
                سفارشی با اطلاعات وارد شده یافت نشد. لطفاً از صحت شماره تماس وارد شده اطمینان حاصل نمایید.
              </div>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 font-black text-xs flex items-center gap-1 font-mono">
                        <Hash size={13} />
                        {ord.order_number}
                      </span>
                      <span className="text-xs text-zinc-400">
                        تاریخ: {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                      </span>
                    </div>

                    <div>{getStatusBadge(ord.payment_status)}</div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row justify-between gap-4 text-xs">
                    <div>
                      <span className="text-zinc-400">اقلام ثبت شده:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Array.isArray(ord.items) && ord.items.map((it: any, i: number) => (
                          <span key={i} className="px-3 py-1 bg-black/30 rounded-xl text-zinc-300 border border-white/5">
                            {it.title} × {it.quantity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="sm:text-left">
                      <span className="text-zinc-400">مبلغ سفارش:</span>
                      <div className="text-base font-black text-emerald-400 mt-1">
                        {Number(ord.total_price || 0).toLocaleString("fa-IR")} تومان
                      </div>
                    </div>
                  </div>

                  {ord.tracking_code && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-xs">
                      <Truck size={15} className="text-blue-400" />
                      <span className="text-zinc-400">کد رهگیری پستی:</span>
                      <span className="font-mono font-bold text-white bg-black/40 px-2.5 py-1 rounded-lg">
                        {ord.tracking_code}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

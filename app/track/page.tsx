// File Path: app/track/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Package, Truck, Hash } from "lucide-react";
import { soundEngine } from "@/lib/soundEngine";

export default function TrackOrderAliasPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    soundEngine.playClick();
    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "processing":
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-bold">
            تایید شده / آماده ارسال ✓
          </span>
        );
      case "shipped":
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-500 text-xs font-bold">
            تحویل به شرکت پست 🚚
          </span>
        );
      case "delivered":
        return (
          <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-500 text-xs font-bold">
            تحویل داده شده 🎉
          </span>
        );
      case "cancelled":
      case "failed":
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-500 text-xs font-bold">
            لغو شده
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 text-xs font-bold">
            در انتظار بررسی کارشناس
          </span>
        );
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 font-sans select-text"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-8 font-bold">
        <Link href="/" className="hover:underline">
          خانه
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)]">
          رهگیری و پیگیری سفارش
        </span>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-xl text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] rounded-full flex items-center justify-center mb-4">
            <Package size={32} />
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-[var(--text-primary)]">
            استعلام و رهگیری سفارشات
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">
            شماره موبایلی که هنگام خرید ثبت کرده‌اید یا شماره سفارش خود را وارد
            کنید:
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثلاً: 09123456789 یا AXN-123456"
              className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] text-center sm:text-right"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white text-xs font-black shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Search size={16} />
              <span>{loading ? "در حال استعلام..." : "رهگیری سفارش"}</span>
            </button>
          </form>
        </div>

        {/* نتایج استعلام */}
        {orders !== null && (
          <div className="mt-8 space-y-4">
            {orders.length === 0 ? (
              <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-12 text-center text-xs text-[var(--text-secondary)] font-bold shadow-md">
                سفارشی با اطلاعات وارد شده یافت نشد. لطفاً از صحت شماره تماس
                وارد شده اطمینان حاصل نمایید.
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-md space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-black text-xs flex items-center gap-1 font-mono">
                        <Hash size={13} />
                        {ord.order_number || String(ord.id).slice(0, 8)}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        تاریخ:{" "}
                        {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                      </span>
                    </div>

                    <div>{getStatusBadge(ord.status || ord.payment_status)}</div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs">
                    <div>
                      <span className="text-[var(--text-secondary)] font-bold">
                        اقلام ثبت شده:
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Array.isArray(ord.items) &&
                          ord.items.map((it: any, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-[var(--input-bg)] rounded-xl text-[var(--text-primary)] border border-[var(--card-border)] font-bold"
                            >
                              {it.title || it.name} × {it.quantity || 1}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="sm:text-left">
                      <span className="text-[var(--text-secondary)] font-bold">
                        مبلغ سفارش:
                      </span>
                      <div className="text-base font-black text-emerald-500 mt-1 font-mono">
                        {Number(
                          ord.final_amount || ord.total_price || ord.total_amount || 0
                        ).toLocaleString("fa-IR")}{" "}
                        تومان
                      </div>
                    </div>
                  </div>

                  {ord.tracking_code && (
                    <div className="pt-3 border-t border-[var(--card-border)] flex items-center gap-2 text-xs">
                      <Truck size={15} className="text-[var(--accent-blue)]" />
                      <span className="text-[var(--text-secondary)] font-bold">
                        کد رهگیری پستی:
                      </span>
                      <span className="font-mono font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--card-border)] px-2.5 py-1 rounded-lg">
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
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

interface TrackedOrderItem {
  title: string;
  quantity: number;
  selected_color?: string;
  selected_storage?: string;
}

interface TrackedOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  tracking_code?: string | null;
  total_amount: number;
  items: TrackedOrderItem[];
  created_at: string;
}

const STEPS = [
  { key: "pending_manual_review", label: "بررسی فیش", icon: "🧾" },
  { key: "paid", label: "تایید پرداخت", icon: "💳" },
  { key: "processing", label: "پردازش انبار", icon: "📦" },
  { key: "shipped", label: "ارسال شد", icon: "🚚" },
  { key: "delivered", label: "تحویل گردید", icon: "✅" },
];

export default function OrderTrackingPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    soundEngine.playClick();
    setLoading(true);
    setErrorMsg(null);
    setOrders([]);

    try {
      const isPhone = /^09\d{9}$/.test(query.trim());
      const url = isPhone
        ? `/api/orders/track?phone=${encodeURIComponent(query.trim())}`
        : `/api/orders/track?q=${encodeURIComponent(query.trim())}`;

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setOrders(json.orders || []);
      } else {
        setErrorMsg(json.message || "سفارشی با این مشخصات یافت نشد.");
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با سامانه رهگیری.");
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
      case "pending_manual_review":
        return 0;
      case "paid":
        return 1;
      case "processing":
        return 2;
      case "shipped":
        return 3;
      case "delivered":
        return 4;
      default:
        return -1;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] font-sans py-12 px-4 sm:px-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* عنوان و توضیحات */}
        <div className="text-center space-y-3">
          <Link
            href="/"
            className="inline-block text-xs font-bold text-slate-400 hover:text-[var(--accent-blue)] transition"
          >
            ← بازگشت به فروشگاه
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--accent-blue)]">
            سامانه رهگیری و پیگیری سفارشات
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            کد رهگیری، شماره همراه یا شناسه سفارش خود را وارد کنید تا وضعیت لحظه‌ای مرسوله را ببینید.
          </p>
        </div>

        {/* فرم جستجو */}
        <form
          onSubmit={handleSearch}
          className="p-3 sm:p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: 09121234567 یا کد پیگیری پستی..."
            className="flex-1 px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? "در حال استعلام..." : "رهگیری مرسوله 🔍"}
          </button>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* نتایج رهگیری */}
        {orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((ord) => {
              const currentStepIdx = getStepIndex(ord.status);
              const isCancelled = ord.status === "cancelled";

              return (
                <div
                  key={ord.id}
                  className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
                    <div>
                      <span className="text-[11px] text-slate-400 font-mono">شناسه سفارش: #{ord.id.slice(0, 8)}</span>
                      <h3 className="text-sm font-black text-[var(--text-primary)] mt-0.5">
                        تحویل‌گیرنده: {ord.customer_name} ({ord.customer_phone})
                      </h3>
                    </div>

                    {ord.tracking_code ? (
                      <div className="text-right sm:text-left">
                        <span className="text-[10px] text-slate-400 block font-bold">کد پیگیری پست / تیپاکس:</span>
                        <span className="font-mono text-xs font-black text-emerald-400">{ord.tracking_code}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* تایم‌لاین مراحل */}
                  {isCancelled ? (
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
                      این سفارش لغو گردیده است.
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-2 text-center py-2">
                      {STEPS.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        return (
                          <div key={step.key} className="space-y-1.5">
                            <div
                              className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center text-sm border transition ${
                                isDone
                                  ? "bg-[var(--accent-blue)]/20 border-[var(--accent-blue)] text-[var(--accent-blue)]"
                                  : "bg-[var(--input-bg)] border-[var(--card-border)] text-slate-500"
                              }`}
                            >
                              {step.icon}
                            </div>
                            <span className={`text-[10px] block font-bold ${isDone ? "text-[var(--text-primary)]" : "text-slate-500"}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* خلاصه اقلام */}
                  <div className="space-y-2 border-t border-[var(--card-border)] pt-4">
                    <span className="text-xs font-bold text-slate-400 block">اقلام فاکتور:</span>
                    <div className="space-y-1">
                      {ord.items.map((item, i) => (
                        <div key={i} className="text-xs flex justify-between p-2 rounded-xl bg-[var(--input-bg)]">
                          <span>{item.title} × {item.quantity}</span>
                          <span className="text-slate-400">
                            {item.selected_color || ""} {item.selected_storage ? `[${item.selected_storage}]` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";

interface TrackedOrder {
  id: string;
  order_number?: string;
  status: string;
  payment_status?: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  created_at: string;
  customer_name: string;
  tracking_code?: string;
  items: Array<{
    title: string;
    quantity: number;
    price?: number;
    unit_price?: number;
    total_price?: number;
  }>;
}

const STEPS = [
  { key: "pending", title: "بررسی سفارش", desc: "در انتظار تایید فاکتور یا واریزی" },
  { key: "paid", title: "تایید پرداخت", desc: "سفارش آماده‌سازی در استودیو" },
  { key: "shipped", title: "ارسال شد", desc: "تحویل به باربری پیشتاز / تیپاکس" },
  { key: "delivered", title: "تحویل داده شد", desc: "مرسوله تحویل خریدار گردید" },
];

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // اشتراک وب‌سوکت بلادرنگ برای دریافت فوری تغییر وضعیت سفارش
  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`realtime-order-tracker-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          if (payload.new) {
            setOrder((prev) => (prev ? { ...prev, ...payload.new } : (payload.new as TrackedOrder)));
            soundEngine.playSuccess();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id]);

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
        body: JSON.stringify({ orderId: orderId.trim(), phone: phone.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.order) {
        soundEngine.playSuccess();
        setOrder(json.order);
      } else {
        setErrorMsg(json.message || "سفارشی با این مشخصات در سامانه یافت نشد.");
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با سامانه رهگیری.");
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    if (status === "cancelled") return -1;
    if (status === "pending" || status === "pending_manual_review") return 0;
    if (status === "paid" || status === "processing") return 1;
    if (status === "shipped") return 2;
    if (status === "delivered") return 3;
    return 0;
  };

  const activeStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-[80vh] py-12 px-4 max-w-3xl mx-auto space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[var(--accent-blue)] text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>پایش بلادرنگ با وب‌سوکت فعال است</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">📦 رهگیری آنلاین وضعیت سفارش</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          شماره سفارش و تلفن همراه خریدار را جهت مشاهده وضعیت صدور بارنامه و ارسال وارد نمایید.
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
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="ORD-..."
              className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">شماره تلفن خریدار:</label>
            <input
              type="tel"
              required
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912..."
              className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
          ) : (
            <span>رهگیری آنلاین مرسوله 🔍</span>
          )}
        </button>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold text-center animate-fadeIn">
            ⚠️ {errorMsg}
          </div>
        )}
      </form>

      {order && (
        <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
            <div>
              <span className="text-xs text-[var(--text-secondary)]">سفارش بنام:</span>
              <span className="font-black text-sm text-[var(--text-primary)] mr-2">{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
              <span>شناسه: #{order.order_number || order.id.slice(0, 10)}</span>
              <span>•</span>
              <span suppressHydrationWarning>{new Date(order.created_at).toLocaleDateString("fa-IR")}</span>
            </div>
          </div>

          {/* نوار وضعیت چندمرحله‌ای (Stepper) واکنش‌گرا */}
          {order.status === "cancelled" ? (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 font-bold text-xs text-center">
              ⚠️ این سفارش لغو شده است.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STEPS.map((step, idx) => {
                const isPassed = idx <= activeStep;
                const isCurrent = idx === activeStep;
                return (
                  <div
                    key={step.key}
                    className={`p-3.5 rounded-2xl border text-center transition ${
                      isCurrent
                        ? "bg-[var(--accent-blue)]/15 border-[var(--accent-blue)] text-[var(--accent-blue)] shadow-md"
                        : isPassed
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] text-slate-500 opacity-60"
                    }`}
                  >
                    <span className="text-xs font-black block">{step.title}</span>
                    <span className="text-[10px] mt-1 block opacity-85 leading-tight">{step.desc}</span>
                  </div>
                );
              })}
            </div>
          )}

          {order.tracking_code && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-wrap justify-between items-center gap-2">
              <span className="font-bold text-xs text-blue-400">کد رهگیری پست پیشتاز / تیپاکس:</span>
              <span className="font-mono font-black text-sm text-blue-300 tracking-widest">{order.tracking_code}</span>
            </div>
          )}

          {/* اقلام فاکتور */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] block">اقلام خریداری‌شده:</span>
            <div className="space-y-2">
              {Array.isArray(order.items) &&
                order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
                  >
                    <span className="font-bold text-[var(--text-primary)]">
                      {item.title} × {item.quantity}
                    </span>
                    <span className="font-mono font-bold text-slate-300" suppressHydrationWarning>
                      {formatPrice(Number(item.total_price || (item.unit_price || item.price || 0) * item.quantity))} تومان
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* مجموع مبالغ */}
          <div className="border-t border-[var(--card-border)] pt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">مبلغ پرداختی فاکتور:</span>
            <span className="text-base font-black text-emerald-500 font-mono" suppressHydrationWarning>
              {formatPrice(Number(order.final_amount || order.total_amount))} تومان
            </span>
          </div>

          <div className="pt-2 text-center">
            <Link href="/" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
              ← بازگشت به صفحه اصلی فروشگاه
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

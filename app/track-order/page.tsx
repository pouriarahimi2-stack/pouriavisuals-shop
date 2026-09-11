"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";
  const isSuccess = searchParams.get("success") === "true";

  const [query, setQuery] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const searchOrder = async (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;

    soundEngine.playClick();
    setLoading(true);
    setErrorMessage("");
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (res.ok && data.success && data.order) {
        soundEngine.playSuccess();
        setOrder(data.order);
      } else {
        setErrorMessage(data.message || "سفارشی با این کد رهگیری یا شماره تماس یافت نشد.");
      }
    } catch {
      setErrorMessage("خطا در برقراری ارتباط با سرور پیگیری.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      searchOrder(initialOrderId);
    }
  }, [initialOrderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center text-2xl shadow-sm">
          📦
        </div>
        <h1 className="text-2xl font-black">سامانه هوشمند رهگیری و استعلام سفارشات</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          شماره موبایل یا شناسه فاکتور (ORD-xxxx) را جهت مشاهده وضعیت بسته وارد نمایید
        </p>
      </div>

      {isSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center animate-fadeIn">
          ✓ پرداخت شما با موفقیت ثبت شد. اطلاعات فاکتور و مرسوله شما در کادر زیر قابل پیگیری است.
        </div>
      )}

      {/* فرم جستجو */}
      <div className="p-3 sm:p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchOrder()}
          placeholder="مثال: ORD-123456 یا ۰۹۱۲۳۴۵۶۷۸۹..."
          className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold font-mono outline-none text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => searchOrder()}
          className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50 shrink-0"
        >
          {loading ? "در حال استعلام..." : "رهگیری مرسوله 🔍"}
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold text-center animate-fadeIn">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* کارت نتایج سفارش */}
      {order && (
        <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
            <div>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono block">شناسه فاکتور رسمی:</span>
              <h2 className="text-base font-mono font-black text-[var(--accent-blue)]">{order.order_number || order.id}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                order.status === "shipped" ? "bg-blue-500/15 text-blue-500 border border-blue-500/30" :
                order.status === "paid" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" :
                order.status === "delivered" ? "bg-purple-500/15 text-purple-500 border border-purple-500/30" :
                order.status === "cancelled" ? "bg-rose-500/15 text-rose-500 border border-rose-500/30" :
                "bg-amber-500/15 text-amber-500 border border-amber-500/30"
              }`}>
                {order.status === "shipped" ? "ارسال به پست 🚚" :
                 order.status === "paid" ? "پرداخت شده و آماده‌سازی ✓" :
                 order.status === "delivered" ? "تحویل خریدار شد" :
                 order.status === "cancelled" ? "لغو شده" : "در انتظار پرداخت"}
              </span>
            </div>
          </div>

          {/* بارنامه پستی */}
          {order.tracking_code ? (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 space-y-2">
              <span className="text-[11px] font-bold text-blue-500 block">📮 کد رهگیری ۲۴ رقمی شرکت ملی پست:</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sm text-[var(--text-primary)] tracking-widest">{order.tracking_code}</span>
                <a
                  href={`https://tracking.post.ir/?id=${order.tracking_code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-500 transition"
                >
                  رهگیری در سامانه پست ←
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-secondary)] font-medium">
              مرسوله در حال حاضر در مرحله آماده‌سازی و بسته‌بندی ضدضربه استودیویی است و به محض تحویل به پست، کد ۲۴ رقمی پیامک خواهد شد.
            </div>
          )}

          {/* مشخصات گیرنده */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold block">تحویل‌گیرنده:</span>
              <p className="font-black text-[var(--text-primary)]">{order.customer_name || "خریدار محترم"}</p>
              <p className="font-mono text-[11px] text-[var(--text-secondary)]">{order.phone}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold block">مبلغ فاکتور:</span>
              <p className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
                {formatPrice(order.final_amount || order.total_amount)} تومان
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">بسته‌بندی و ارسال پیشتاز: رایگان</p>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold block">نشانی تحویل مرسوله:</span>
              <p className="text-[11px] text-[var(--text-primary)] leading-relaxed font-medium">
                {order.address || `استان ${order.province || ""}، شهر ${order.city || ""}`}
              </p>
            </div>
          </div>

          {/* اقلام خریداری‌شده */}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
              <span className="text-xs font-black block">اقلام این سفارش:</span>
              <div className="space-y-2">
                {order.items.map((it: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex justify-between items-center text-xs">
                    <span className="font-bold text-[var(--text-primary)]">{it.title || it.name} (×{it.quantity || 1})</span>
                    <span className="font-mono font-black text-[var(--accent-blue)]" suppressHydrationWarning>
                      {formatPrice(it.price * (it.quantity || 1))} ت
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-center pt-4">
        <Link href="/" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition">
          ← بازگشت به صفحه نخست فروشگاه
        </Link>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans text-xs font-bold text-[var(--text-secondary)]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mb-3" />
          در حال آماده‌سازی سامانه رهگیری...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}

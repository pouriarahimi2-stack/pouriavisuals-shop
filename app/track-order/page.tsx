"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { orderService, Order } from "@/services/orderService";
import Link from "next/link";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";
  const isNewSuccess = searchParams.get("success") === "true";

  const [query, setQuery] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<Order[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setLoading(true);
    setErrorMsg("");
    setSearched(true);

    try {
      if (clean.startsWith("09")) {
        const orders = await orderService.getByPhone(clean);
        setResults(orders);
      } else {
        const order = await orderService.getById(clean);
        setResults(order ? [order] : []);
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با پایگاه داده.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      handleSearch();
    }
  }, [initialOrderId]);

  const getStatusInfo = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return {
          title: "در انتظار پرداخت",
          desc: "فاکتور صادر شده و در انتظار تکمیل تراکنش بانکی است.",
          color: "text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30",
          icon: "⏳",
        };
      case "processing":
        return {
          title: "در حال پردازش و انبارداری",
          desc: "سفارش شما تأیید شده و در حال بسته‌بندی ایمن در انبار مرکزی است.",
          color: "text-blue-600 dark:text-blue-400 bg-blue-500/15 border-blue-500/30",
          icon: "📦",
        };
      case "shipped":
        return {
          title: "تحویل به شرکت ملی پست",
          desc: "مرسوله با پست پیشتاز ارسال شده و کد رهگیری ۲۴ رقمی صادر گردیده است.",
          color: "text-purple-600 dark:text-purple-400 bg-purple-500/15 border-purple-500/30",
          icon: "🚚",
        };
      case "delivered":
        return {
          title: "تحویل نهایی به مشتری",
          desc: "بسته توسط مامور پست به گیرنده تحویل داده شد.",
          color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
          icon: "✅",
        };
      case "cancelled":
        return {
          title: "سفارش لغو شده",
          desc: "این سفارش لغو یا مرجوع شده است.",
          color: "text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30",
          icon: "✕",
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      
      {/* پیام تبریک ثبت سفارش */}
      {isNewSuccess && (
        <div className="p-6 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 space-y-2 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 font-black text-sm">
            <span>🎉</span>
            <span>سفارش شما با موفقیت در سیستم ثبت گردید!</span>
          </div>
          <p className="text-xs font-medium leading-relaxed">
            کد رهگیری و جزئیات سفارش در این صفحه نمایش داده شده و از طریق پیامک نیز به شماره همراه شما ارسال خواهد شد.
          </p>
        </div>
      )}

      {/* هدر صفحه پیگیری */}
      <div className="text-center space-y-2">
        <span className="p-3 rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] inline-block text-2xl">
          🔍
        </span>
        <h1 className="text-2xl md:text-3xl font-black">پیگیری و استعلام وضعیت مرسوله</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          جهت مشاهده آخرین وضعیت بسته، شماره فاکتور یا شماره موبایل ثبت‌شده در هنگام خرید را وارد نمایید
        </p>
      </div>

      {/* باکس فرم جستجو */}
      <form onSubmit={handleSearch} className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          required
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="شماره فاکتور (مثال: ORD-123456) یا شماره موبایل (۰۹۱۲۳۴۵۶۷۸۹)..."
          className="flex-1 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>{loading ? "در حال استعلام..." : "استعلام وضعیت فاکتور 🚀"}</span>
        </button>
      </form>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {/* نمایش نتایج استعلام */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[var(--text-secondary)]">در حال استعلام اطلاعات فاکتور...</p>
        </div>
      ) : searched && results.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center space-y-3 shadow-xl">
          <span className="text-4xl block">🔍</span>
          <h3 className="font-black text-sm text-[var(--text-primary)]">فاکتوری با این مشخصات یافت نشد!</h3>
          <p className="text-xs text-[var(--text-secondary)]">لطفاً از صحت شناسه فاکتور یا شماره تلفن اطمینان حاصل فرمایید.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div
                key={order.id}
                className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6 animate-fadeIn"
              >
                {/* سربرگ فاکتور */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold block">شماره شناسه فاکتور:</span>
                    <span className="font-mono font-black text-sm text-[var(--accent-blue)]">{order.id}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold block">نام خریدار:</span>
                    <span className="font-bold text-xs">{order.customerName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold block">تاریخ ثبت:</span>
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                      {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>

                {/* وضعیت جاری سفارش */}
                <div className={`p-5 rounded-3xl border flex items-start gap-4 ${statusInfo.color}`}>
                  <span className="text-2xl">{statusInfo.icon}</span>
                  <div className="space-y-1">
                    <h4 className="font-black text-xs">{statusInfo.title}</h4>
                    <p className="text-[11px] opacity-90 leading-relaxed font-medium">{statusInfo.desc}</p>
                  </div>
                </div>

                {/* بخش کد رهگیری پستی پیشتاز */}
                {order.trackingCode && (
                  <div className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-bold block">
                        کد مرسوله پستی پیشتاز (۲۴ رقمی):
                      </span>
                      <span className="font-mono font-black text-sm tracking-wider text-[var(--text-primary)]">
                        {order.trackingCode}
                      </span>
                    </div>

                    <a
                      href={`https://tracking.post.ir/?id=${order.trackingCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700 transition shadow-md flex items-center gap-1.5"
                    >
                      <span>سامانه رهگیری شرکت ملی پست</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}

                {/* لیست اقلام فاکتور */}
                <div className="space-y-3">
                  <h4 className="font-black text-xs text-[var(--text-secondary)]">اقلام ثبت‌شده در سفارش:</h4>
                  <div className="divide-y divide-[var(--card-border)]">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--text-primary)]">
                          {item.title} <span className="text-[var(--text-secondary)] font-mono">× {item.quantity}</span>
                        </span>
                        <span className="font-mono font-black text-[var(--text-primary)]">
                          {((item.price || 0) * (item.quantity || 1)).toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* اطلاعات نشانی و مبلغ کل */}
                <div className="pt-4 border-t border-[var(--card-border)] flex flex-wrap justify-between items-center gap-4 text-xs">
                  <div className="text-[var(--text-secondary)] text-[11px] max-w-md leading-relaxed">
                    <strong>نشانی تحویل:</strong> {order.address} {order.postalCode && `(کد پستی: ${order.postalCode})`}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text-secondary)]">مبلغ کل فاکتور:</span>
                    <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                      {(order.totalAmount || 0).toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* دکمه بازگشت */}
      <div className="text-center pt-4">
        <Link href="/" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition">
          ← بازگشت به صفحه اصلی فروشگاه
        </Link>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center font-sans text-xs">در حال بارگذاری بخش رهگیری...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
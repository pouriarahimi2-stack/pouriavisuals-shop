"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { orderService, Order } from "@/services/orderService";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("orderId");
  const paymentStatus = searchParams.get("payment");
  const refId = searchParams.get("refId");

  const [searchInput, setSearchInput] = useState(urlOrderId || "");
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (urlOrderId) {
      const found = orderService.getOrderById(urlOrderId);
      if (found) {
        setCurrentOrder(found);
        setErrorMsg(null);
      } else {
        setErrorMsg("سفارشی با این شماره در سیستم یافت نشد.");
      }
    }
  }, [urlOrderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCurrentOrder(null);

    if (!searchInput.trim()) {
      setErrorMsg("لطفاً شماره سفارش را وارد کنید.");
      return;
    }

    const found = orderService.getOrderById(searchInput.trim());
    if (found) {
      setCurrentOrder(found);
    } else {
      setErrorMsg("هیچ سفارشی با این شماره ثبت نشده است.");
    }
  };

  // نگاشت مراحل وضعیت سفارش برای نمایش Timeline
  const getStatusStep = (status: string) => {
    switch (status) {
      case "pending":
        return 1;
      case "processing":
        return 2;
      case "shipped":
        return 3;
      case "completed":
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-xs text-white">
      {/* پیام بازگشت از درگاه پرداخت */}
      {paymentStatus === "success" && (
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 text-center animate-fadeIn shadow-2xl backdrop-blur-xl">
          <span className="text-3xl block">🎉</span>
          <h3 className="font-black text-sm">پرداخت با موفقیت انجام شد!</h3>
          <p className="opacity-80">
            تراکنش شما تایید گردید و سفارش در دست پردازش انبار قرار گرفت.
          </p>
          {refId && (
            <p className="font-mono text-[11px] pt-1">
              کد پیگیری بانکی: <strong className="text-white">{refId}</strong>
            </p>
          )}
        </div>
      )}

      {paymentStatus === "failed" && (
        <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2 text-center animate-fadeIn shadow-2xl backdrop-blur-xl">
          <span className="text-3xl block">❌</span>
          <h3 className="font-black text-sm">پرداخت ناموفق بود یا لغو شد</h3>
          <p className="opacity-80">
            در صورت کسر وجه از حساب شما، حداکثر ظرف ۷۲ ساعت توسط بانک بازگردانده می‌شود.
          </p>
        </div>
      )}

      {/* فرم جستجوی کد پیگیری */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 space-y-4 text-center backdrop-blur-2xl shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-lg font-black text-indigo-300 flex items-center justify-center gap-2">
            <span>🔍</span> پیگیری هوشمند وضعیت سفارش
          </h1>
          <p className="opacity-60 text-[11px]">
            شماره سفارش خود را وارد کنید تا آخرین وضعیت مرسوله را مشاهده نمایید.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2 pt-2">
          <input
            type="text"
            placeholder="مثلاً: ORD-172345678"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 p-3 rounded-2xl bg-black/40 border border-white/15 text-xs text-white font-mono outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition shadow-lg shrink-0"
          >
            جستجو 🔎
          </button>
        </form>

        {errorMsg && (
          <p className="text-rose-400 font-bold text-[11px] pt-2 animate-pulse">⚠️ {errorMsg}</p>
        )}
      </section>

      {/* جزئیات و تایم‌لاین وضعیت سفارش */}
      {currentOrder && (
        <section className="p-6 md:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 space-y-8 backdrop-blur-2xl shadow-2xl animate-fadeIn">
          {/* هدر فاکتور */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <span className="text-[10px] text-indigo-400 font-bold block">شماره فاکتور:</span>
              <h2 className="text-base font-black font-mono text-white">#{currentOrder.id}</h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="opacity-60">وضعیت پرداخت:</span>
              <span
                className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                  currentOrder.paymentStatus === "paid"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {currentOrder.paymentStatus === "paid" ? "✅ پرداخت شده" : "⏳ در انتظار پرداخت"}
              </span>
            </div>
          </div>

          {/* نوار پیشرفت جابجایی (Status Timeline) */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-indigo-300">📍 وضعیت فیزیکی مرسوله:</h4>
            <div className="grid grid-cols-4 gap-2 text-center pt-2">
              {[
                { step: 1, title: "ثبت سفارش", icon: "📝" },
                { step: 2, title: "پردازش انبار", icon: "📦" },
                { step: 3, title: "تحویل پست", icon: "🚚" },
                { step: 4, title: "تحویل خریدار", icon: "🏠" },
              ].map((s) => {
                const currentStep = getStatusStep(currentOrder.status);
                const isPassed = currentStep >= s.step;
                return (
                  <div key={s.step} className="space-y-2">
                    <div
                      className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${
                        isPassed
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-110"
                          : "bg-white/5 border border-white/10 opacity-40"
                      }`}
                    >
                      {s.icon}
                    </div>
                    <span className={`block text-[10px] font-bold ${isPassed ? "text-indigo-300" : "opacity-40"}`}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* کد رهگیری پستی (در صورت وجود) */}
          {currentOrder.trackingCode && (
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
              <span className="font-bold">📫 کد رهگیری ۲۴ رقمی پست پیشتاز:</span>
              <span className="font-mono font-black text-indigo-300 text-sm tracking-wider select-all">
                {currentOrder.trackingCode}
              </span>
            </div>
          )}

          {/* مشخصات گیرنده و آدرس */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/20 border border-white/5">
            <div className="space-y-1">
              <span className="opacity-60 block text-[10px]">تحویل‌گیرنده:</span>
              <span className="font-bold">
                {currentOrder.firstName} {currentOrder.lastName} ({currentOrder.phone})
              </span>
            </div>
            <div className="space-y-1">
              <span className="opacity-60 block text-[10px]">کد پستی:</span>
              <span className="font-mono font-bold">{currentOrder.postalCode}</span>
            </div>
            <div className="md:col-span-2 space-y-1 pt-2 border-t border-white/5">
              <span className="opacity-60 block text-[10px]">آدرس دقیق ارسال:</span>
              <p className="leading-relaxed opacity-90">{currentOrder.address}</p>
            </div>
          </div>

          {/* لیست کالاهای اقلام سفارش */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-indigo-300">📦 اقلام خریده شده:</h4>
            <div className="space-y-2">
              {currentOrder.items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || "/placeholder.png"}
                      alt={item.title}
                      className="w-10 h-10 object-cover rounded-xl bg-black/30"
                    />
                    <div>
                      <h5 className="font-bold text-xs">{item.title}</h5>
                      <span className="text-[10px] opacity-60 font-mono">
                        تعداد: {item.quantity} عدد
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-indigo-300">
                    {((item.discountPrice ?? item.price) * item.quantity).toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* خلاصه فاکتور مالی */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2 font-bold">
            <div className="flex justify-between opacity-70">
              <span>مبلغ کل کالاها:</span>
              <span className="font-mono">{currentOrder.totalAmount.toLocaleString("fa-IR")} تومان</span>
            </div>
            {currentOrder.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>تخفیف اعمال‌شده:</span>
                <span className="font-mono">
                  - {currentOrder.discountAmount.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm text-indigo-300 pt-2 border-t border-white/10 font-black">
              <span>مبلغ نهایی پرداختی:</span>
              <span className="font-mono text-base">
                {currentOrder.finalAmount.toLocaleString("fa-IR")} تومان
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-white font-sans flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="text-center py-20 text-xs">درحال دریافت اطلاعات...</div>}>
          <TrackOrderContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
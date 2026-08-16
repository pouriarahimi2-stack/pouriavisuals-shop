"use client";

import React, { useState } from "react";
import { orderService, Order } from "@/services/orderService";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setSearched(true);
    setErrorMsg("");
    setOrder(null);

    try {
      const cleanId = orderId.trim().toUpperCase();
      const found = await orderService.getOrderById(cleanId);

      if (found) {
        setOrder(found);
      } else {
        setErrorMsg("سفارشی با این شماره پیگیری در سامانه یافت نشد.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در برقراری ارتباط با پایگاه داده.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: "pending", title: "ثبت سفارش", desc: "سفارش ثبت شده و در انتظار پرداخت است", icon: "📝" },
    { key: "paid", title: "پرداخت موفق", desc: "تایید مالی انجام شد و آماده پردازش است", icon: "💳" },
    { key: "shipped", title: "تحویل به پست", desc: "بسته تحویل پست پیشتاز شد و کد رهگیری صادر گردید", icon: "🚚" },
    { key: "delivered", title: "تحویل مشتری", desc: "مرسوله با موفقیت تحویل خریدار شد", icon: "✅" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "paid":
      case "processing":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto font-sans select-none text-[var(--text-primary)]">
      
      {/* سربرگ */}
      <div className="text-center space-y-2 mb-8">
        <span className="w-14 h-14 rounded-3xl bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] text-2xl flex items-center justify-center mx-auto shadow-md">
          🔍
        </span>
        <h1 className="text-xl font-black">سامانه هوشمند پیگیری سفارش و مرسوله پستی</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          شماره سفارش خود را (مثال: ORD-123456) وارد کنید تا وضعیت لحظه‌ای را مشاهده کنید
        </p>
      </div>

      {/* فرم جستجو */}
      <form
        onSubmit={handleSearch}
        className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex gap-2 mb-8"
      >
        <input
          type="text"
          required
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="شماره سفارش (مثال: ORD-492812)..."
          className="flex-1 px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-center"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 min-w-[110px]"
        >
          {loading ? "در حال استعلام..." : "پیگیری سفارش 🚀"}
        </button>
      </form>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs text-center mb-8">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* نمایش نوار وضعیت ۴ مرحله‌ای */}
      {order && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
            
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[var(--card-border)] pb-4 text-xs">
              <div>
                <span className="text-[var(--text-secondary)] font-medium">شماره فاکتور: </span>
                <span className="font-mono font-black text-[var(--accent-blue)]">{order.id}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] font-medium">گیرنده: </span>
                <span className="font-bold">{order.customer_name || order.customerName}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] font-medium">مبلغ کل: </span>
                <span className="font-mono font-black">{Number(order.total_amount || order.totalAmount || 0).toLocaleString("fa-IR")} تومان</span>
              </div>
            </div>

            {/* مراحل تحویل گرافیکی */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {steps.map((st, i) => {
                const isPassed = i <= currentStep;
                const isCurrent = i === currentStep;

                return (
                  <div
                    key={st.key}
                    className={`p-4 rounded-2xl border transition text-center space-y-2 ${
                      isCurrent
                        ? "bg-[var(--accent-blue)]/15 border-[var(--accent-blue)] text-[var(--accent-blue)] shadow-md"
                        : isPassed
                        ? "bg-[var(--input-bg)] border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-[var(--input-bg)]/50 border-[var(--card-border)] opacity-40"
                    }`}
                  >
                    <span className="text-2xl block">{st.icon}</span>
                    <h4 className="font-black text-xs">{st.title}</h4>
                    <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed">{st.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* کد رهگیری پستی شاپرک/پست ایران */}
            {order.tracking_code && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1 text-xs">
                <span className="text-[var(--text-secondary)] font-bold">کد ۲۴ رقمی رهگیری مرسوله پستی:</span>
                <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 tracking-wider">
                  {order.tracking_code}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
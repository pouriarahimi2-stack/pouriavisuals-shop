"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { orderService } from "@/services/orderService";
import { smsService } from "@/services/smsService";

export default function CheckoutPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const resolvedParams = use(searchParams);
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cardNumber, setCardNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [pass, setPass] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const orderId = resolvedParams.orderId;

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      let found: any = null;
      if (typeof orderService.getOrderById === "function") {
        found = await orderService.getOrderById(orderId);
      }

      if (!found) {
        const local = JSON.parse(localStorage.getItem("site_orders") || "[]");
        found = local.find((o: any) => o.id === orderId);
      }

      if (!found) {
        const pending = JSON.parse(localStorage.getItem("pending_order") || "null");
        if (pending && pending.id === orderId) {
          found = pending;
        }
      }

      setOrder(found);
      setLoading(false);
    }

    loadOrder();
  }, [orderId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (cardNumber.replace(/\s/g, "").length < 16) {
      setErrorMsg("شماره کارت باید ۱۶ رقم باشد.");
      return;
    }
    if (cvv2.length < 3) {
      setErrorMsg("کد CVV2 معتبر نیست.");
      return;
    }
    if (!pass) {
      setErrorMsg("رمز اینترنتی را وارد کنید.");
      return;
    }

    setPaying(true);

    try {
      if (orderId) {
        if (typeof orderService.updateOrderStatus === "function") {
          await orderService.updateOrderStatus(orderId, "paid");
        }

        const localOrders = JSON.parse(localStorage.getItem("site_orders") || "[]");
        const updatedOrders = localOrders.map((o: any) =>
          o.id === orderId ? { ...o, status: "paid" } : o
        );
        localStorage.setItem("site_orders", JSON.stringify(updatedOrders));

        // 📲 ارسال پیامک خودکار تایید پرداخت به شماره مشتری
        const targetPhone = order?.customer_phone || order?.customerPhone;
        const targetName = order?.customer_name || order?.customerName || "مشتری گرامی";
        if (targetPhone) {
          await smsService.sendOrderConfirmation(targetPhone, orderId, targetName);
        }
      }

      localStorage.removeItem("site_cart");
      setPaying(false);
      setPaymentSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در پردازش پرداخت.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 font-sans text-xs font-bold text-[var(--text-secondary)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
        در حال اتصال به شاپرک...
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-3xl flex items-center justify-center mx-auto animate-bounce">
            ✓
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-emerald-600 dark:text-emerald-400">پرداخت با موفقیت انجام شد</h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium">سفارش شما در سیستم ثبت و پیامک تایید ارسال شد.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs space-y-2 text-right">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">شماره سفارش:</span>
              <span className="font-mono font-bold text-[var(--accent-blue)]">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">مبلغ پرداختی:</span>
              <span className="font-mono font-bold">
                {Number(order?.total_amount || order?.totalAmount || 0).toLocaleString("fa-IR")} تومان
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href={`/track-order?orderId=${orderId}`}
              className="flex-1 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition shadow-md"
            >
              پیگیری سفارش 📦
            </Link>
            <Link
              href="/"
              className="flex-1 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition"
            >
              صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-10 px-4 max-w-lg mx-auto font-sans select-none text-[var(--text-primary)]">
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6">
        
        {/* سربرگ درگاه شاپرک */}
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg">
              💳
            </span>
            <div>
              <h1 className="text-sm font-black">درگاه پرداخت الکترونیک شاپرک</h1>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium">اتصال امن به شبکه بانکی کشور</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
            SSL 256-bit
          </span>
        </div>

        {/* اطلاعات مبلغ سفارش */}
        <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex justify-between items-center text-xs">
          <span className="text-[var(--text-secondary)] font-bold">مبلغ قابل پرداخت:</span>
          <span className="font-mono font-black text-sm text-[var(--accent-blue)]">
            {Number(order?.total_amount || order?.totalAmount || 0).toLocaleString("fa-IR")} تومان
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* فرم پرداخت */}
        <form onSubmit={handlePay} className="space-y-4 text-xs">
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره کارت (۱۶ رقم):</label>
            <input
              type="text"
              maxLength={19}
              required
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="۶۰۳۷-۹۹۱۸-XXXX-XXXX"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold tracking-widest text-center text-xs focus:border-[var(--accent-blue)] transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">کد CVV2:</label>
              <input
                type="password"
                maxLength={4}
                required
                value={cvv2}
                onChange={(e) => setCvv2(e.target.value)}
                placeholder="۳ یا ۴ رقم"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-xs focus:border-[var(--accent-blue)] transition"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">انقضا (ماه / سال):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={2}
                  placeholder="ماه"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-1/2 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-xs focus:border-[var(--accent-blue)]"
                />
                <input
                  type="text"
                  maxLength={2}
                  placeholder="سال"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-1/2 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-xs focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">رمز دوم پویا / رمز اینترنتی:</label>
            <input
              type="password"
              required
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="رمز دوم کارت"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-center text-xs focus:border-[var(--accent-blue)] transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={paying}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paying ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <span>پرداخت و ثبت نهایی سفارش 🔒</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
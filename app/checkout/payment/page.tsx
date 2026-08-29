"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { orderService } from "@/services/orderService";
import { smsService } from "@/services/smsService";
import { soundEngine } from "@/lib/soundEngine";

function PaymentGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cardNumber, setCardNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [pass, setPass] = useState("");
  const [otpTimer, setOtpTimer] = useState(120);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      let found: any = null;
      try {
        found = await orderService.getById(orderId);
      } catch {}

      if (!found) {
        try {
          const local = JSON.parse(localStorage.getItem("axon_orders_registry_cache_v2026") || "[]");
          found = local.find((o: any) => String(o.id) === String(orderId) || o.orderNumber === orderId);
        } catch {
          found = null;
        }
      }

      setOrder(found);
      setLoading(false);
    }

    loadOrder();

    const timer = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMsg("");

    const cleanCard = cardNumber.replace(/\D/g, "");
    if (cleanCard.length !== 16) {
      setErrorMsg("شماره کارت بانکی باید دقیقاً ۱۶ رقم باشد.");
      return;
    }
    if (cvv2.length < 3 || cvv2.length > 4) {
      setErrorMsg("کد CVV2 نامعتبر است (۳ یا ۴ رقم).");
      return;
    }
    if (!pass || pass.length < 5) {
      setErrorMsg("رمز دوم پویا را به طور کامل وارد نمایید.");
      return;
    }

    setPaying(true);

    try {
      await new Promise((res) => setTimeout(res, 1200));

      if (orderId) {
        await orderService.updateStatus(orderId, "paid");

        const targetPhone = order?.customer?.phone || order?.phone;
        const targetName = order?.customer?.fullName || order?.customer_name || "مشتری گرامی";
        if (targetPhone) {
          await smsService.sendTrackingCode(targetPhone, targetName, `پرداخت فاکتور ${orderId} با موفقیت تایید شد.`);
        }
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("axon_cart_store_v2026");
        localStorage.removeItem("axon_active_coupon_v2026");
      }

      soundEngine.playSuccess();
      setPaying(false);
      setPaymentSuccess(true);
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMsg("خطا در پردازش تراکنش بانکی.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 font-sans text-xs font-bold text-[var(--text-secondary)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
        در حال اتصال امن به درگاه شاپرک...
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 font-sans select-none" dir="rtl">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center space-y-5 shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-3xl flex items-center justify-center mx-auto animate-bounce">
            ✓
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-emerald-600 dark:text-emerald-400">پرداخت با موفقیت تایید شد</h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium">سفارش شما در مرحله آماده‌سازی و صدور بارنامه پستی قرار گرفت.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs space-y-2 text-right">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">شماره فاکتور:</span>
              <span className="font-mono font-bold text-[var(--accent-blue)]">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">مبلغ پرداختی:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {Number(order?.finalAmount || order?.totalAmount || order?.total_amount || 0).toLocaleString("fa-IR")} تومان
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href={`/track-order?orderId=${orderId}&success=true`}
              className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition shadow-md"
            >
              پیگیری مرسوله 📦
            </Link>
            <Link
              href="/"
              className="flex-1 py-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition"
            >
              صفحه نخست
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const payableAmount = Number(order?.finalAmount || order?.totalAmount || order?.total_amount || 0);

  return (
    <div className="min-h-[85vh] py-10 px-4 max-w-lg mx-auto font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg">
              💳
            </span>
            <div>
              <h1 className="text-sm font-black">درگاه پرداخت الکترونیک شاپرک</h1>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium">اتصال امن به سوئیچ شبکه بانکی کشور</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
            SSL 256-bit
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex justify-between items-center text-xs">
          <span className="text-[var(--text-secondary)] font-bold">مبلغ قابل پرداخت فاکتور:</span>
          <span className="font-mono font-black text-base text-[var(--accent-blue)]">
            {payableAmount.toLocaleString("fa-IR")} تومان
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handlePay} className="space-y-4 text-xs">
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره کارت بانکی (۱۶ رقم):</label>
            <input
              type="text"
              maxLength={19}
              required
              value={cardNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                const formatted = val.match(/.{1,4}/g)?.join(" - ") || val;
                setCardNumber(formatted);
              }}
              placeholder="۶۰۳۷ - ۹۹۱۸ - XXXX - XXXX"
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold tracking-widest text-center text-xs focus:border-[var(--accent-blue)] transition text-[var(--text-primary)]"
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
                onChange={(e) => setCvv2(e.target.value.replace(/\D/g, ""))}
                placeholder="۳ یا ۴ رقم"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-xs focus:border-[var(--accent-blue)] transition text-[var(--text-primary)]"
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
                  onChange={(e) => setMonth(e.target.value.replace(/\D/g, ""))}
                  className="w-1/2 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
                />
                <input
                  type="text"
                  maxLength={2}
                  placeholder="سال"
                  value={year}
                  onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
                  className="w-1/2 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-[var(--text-secondary)]">رمز دوم پویا:</label>
              <span className="text-[10px] font-mono text-amber-500 font-bold">
                {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, "0")} مانده
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                required
                maxLength={7}
                value={pass}
                onChange={(e) => setPass(e.target.value.replace(/\D/g, ""))}
                placeholder="رمز پیامک‌شده"
                className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-center text-xs focus:border-[var(--accent-blue)] transition text-[var(--text-primary)]"
              />
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPass("584920");
                  setOtpTimer(120);
                }}
                className="px-4 py-3 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-[11px] font-bold text-[var(--accent-blue)] transition cursor-pointer"
              >
                دریافت رمز
              </button>
            </div>
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
                <span>پرداخت نهایی و تایید فاکتور 🔒</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans text-xs font-bold text-[var(--text-secondary)]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mb-3" />
          در حال اتصال به درگاه شاپرک...
        </div>
      }
    >
      <PaymentGatewayContent />
    </Suspense>
  );
}
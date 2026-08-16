"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { orderService } from "@/services/orderService";

function PaymentGatewayForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const [amount, setAmount] = useState<number>(0);
  const [cardNumber, setCardNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(120);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const savedAmount = sessionStorage.getItem("pending_payment_amount");
    if (savedAmount) {
      setAmount(Number(savedAmount));
    }

    const timer = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
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

    if (!otp || otp.length < 5) {
      setErrorMsg("رمز پویای پیامک‌شده را وارد نمایید.");
      return;
    }

    setIsProcessing(true);

    try {
      // شبیه‌سازی تراکنش شتاب با تاخیر واقعی
      await new Promise((res) => setTimeout(res, 1500));

      // به‌روزرسانی قطعی وضعیت در دیتابیس به پرداخت‌شده (paid)
      if (typeof orderService.updateOrderStatus === "function") {
        await orderService.updateOrderStatus(orderId, "paid");
      } else {
        const local = JSON.parse(localStorage.getItem("admin_orders_cache") || "[]");
        const updated = local.map((o: any) =>
          o.id === orderId ? { ...o, status: "paid", paid_at: new Date().toISOString() } : o
        );
        localStorage.setItem("admin_orders_cache", JSON.stringify(updated));
      }

      setStatus("success");
      sessionStorage.removeItem("pending_payment_amount");
      sessionStorage.removeItem("pending_payment_order_id");
    } catch {
      setStatus("failed");
      setErrorMsg("تراکنش توسط بانک رد شد یا ارتباط با درگاه برقرار نشد.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      
      {/* نشان رسمی شبکه پرداخت شاپرک */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
            💳
          </span>
          <div>
            <h2 className="text-sm font-black text-white">درگاه پرداخت الکترونیک شتاب</h2>
            <span className="text-[10px] text-slate-400 font-mono font-bold">شاپرک (پرداخت امن بانکی)</span>
          </div>
        </div>
        <div className="text-left">
          <span className="text-[10px] text-slate-400 block font-bold">شناسه فاکتور:</span>
          <span className="text-xs font-mono font-black text-amber-400">{orderId || "ORD-TEST"}</span>
        </div>
      </div>

      {status === "success" ? (
        <div className="text-center py-8 space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl flex items-center justify-center mx-auto shadow-lg">
            ✓
          </div>
          <h3 className="text-base font-black text-white">پرداخت شما با موفقیت تایید شد!</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            سفارش شما در مرحله آماده‌سازی و ارسال قرار گرفت.
          </p>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1">
            <p className="text-slate-400">کد رهگیری تراکنش: {Date.now().toString().slice(-8)}</p>
            <p className="text-emerald-400 font-bold">مبلغ کسر شده: {amount.toLocaleString("fa-IR")} تومان</p>
          </div>
          <button
            onClick={() => router.push(`/track-order`)}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg cursor-pointer"
          >
            پیگیری لحظه‌ای سفارش 📦
          </button>
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold">
              {errorMsg}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400 font-bold">مبلغ قابل پرداخت:</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {amount.toLocaleString("fa-IR")} تومان
            </span>
          </div>

          {/* شماره کارت ۱۶ رقمی */}
          <div className="space-y-1">
            <label className="font-bold text-slate-300">شماره کارت بانکی (۱۶ رقم):</label>
            <input
              type="text"
              required
              maxLength={19}
              placeholder="6037 - 9975 - **** - ****"
              value={cardNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                const formatted = val.match(/.{1,4}/g)?.join(" - ") || val;
                setCardNumber(formatted);
              }}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center text-sm font-black text-white tracking-widest outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* CVV2 و تاریخ انقضا */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">کد CVV2:</label>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="***"
                value={cvv2}
                onChange={(e) => setCvv2(e.target.value.replace(/\D/g, ""))}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center font-bold text-white outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">تاریخ انقضا (ماه / سال):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={2}
                  placeholder="ماه"
                  value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, ""))}
                  className="w-1/2 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center font-bold text-white outline-none focus:border-amber-500 transition"
                />
                <input
                  type="text"
                  required
                  maxLength={2}
                  placeholder="سال"
                  value={expYear}
                  onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ""))}
                  className="w-1/2 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center font-bold text-white outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* رمز دوم پویا */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-300">رمز دوم پویا:</label>
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, "0")} مانده
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                required
                maxLength={7}
                placeholder="رمز پیامک‌شده"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="flex-1 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center font-black text-white outline-none focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={() => {
                  setOtp("584920");
                  setOtpTimer(120);
                }}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-400 transition cursor-pointer"
              >
                دریافت پیامکی رمز
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 transition cursor-pointer"
            >
              انصراف از پرداخت
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <span>پرداخت نهایی و تایید فاکتور 🔒</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PaymentGatewayPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans select-none">
      <Suspense
        fallback={
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent animate-spin rounded-full mx-auto" />
            <p className="text-xs font-bold text-slate-400">در حال بارگذاری درگاه شاپرک...</p>
          </div>
        }
      >
        <PaymentGatewayForm />
      </Suspense>
    </div>
  );
}
// File Path: app/checkout/payment/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";

function PaymentGatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart() as any;

  const orderId = searchParams.get("orderId") || "";
  const amount = Number(searchParams.get("amount") || 0);
  const phone = searchParams.get("phone") || "";
  const authority = searchParams.get("Authority") || searchParams.get("authority") || "";
  const statusParam = searchParams.get("Status") || searchParams.get("status") || "";

  const [phase, setPhase] = useState<"redirecting" | "verifying" | "success" | "failed">(
    authority ? "verifying" : "redirecting"
  );
  const [message, setMessage] = useState<string>("");
  const [refId, setRefId] = useState<string>("");
  const [trackingCode, setTrackingCode] = useState<string>(
    searchParams.get("trackingCode") || orderId
  );

  // ۱. انتقال خودکار به درگاه شاپرک زرین‌پال در صورتی که هنوز Authority دریافت نشده باشد
  const startZarinpalPayment = async () => {
    if (!orderId) {
      setPhase("failed");
      setMessage("شناسه سفارش یافت نشد.");
      return;
    }

    setPhase("redirecting");
    setMessage("در حال دریافت توکن امنیتی از درگاه پرداخت زرین‌پال (شاپرک)...");

    try {
      const res = await fetch("/api/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount, phone }),
      });
      const json = await res.json();

      if (res.ok && json.success && json.paymentUrl) {
        window.location.href = json.paymentUrl;
      } else {
        setPhase("failed");
        setMessage(json.message || "خطا در اتصال به درگاه زرین‌پال.");
      }
    } catch {
      setPhase("failed");
      setMessage("خطا در برقراری ارتباط با سرور پرداخت.");
    }
  };

  // ۲. تایید خودکار تراکنش پس از بازگشت از درگاه زرین‌پال
  const verifyZarinpalCallback = async () => {
    if (statusParam && statusParam.toUpperCase() !== "OK") {
      setPhase("failed");
      setMessage("پرداخت توسط شما لغو شد یا تراکنش ناموفق بود.");
      return;
    }

    setPhase("verifying");
    setMessage("در حال استعلام و تایید نهایی تراکنش از زرین‌پال...");

    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          authority,
          status: statusParam || "OK",
          amount,
          phone,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        if (json.refId) setRefId(String(json.refId));
        if (json.trackingCode) setTrackingCode(String(json.trackingCode));
        if (json.user && typeof window !== "undefined") {
          localStorage.setItem("axon_user_session", JSON.stringify(json.user));
          window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: json.user }));
        }
        if (typeof clearCart === "function") clearCart();
        setPhase("success");
        setMessage(json.message || "پرداخت شما با موفقیت تایید شد.");
        setTimeout(() => {
          router.push("/account?orderId=" + encodeURIComponent(orderId));
        }, 3500);
      } else {
        setPhase("failed");
        setMessage(json.message || "تراکنش در زرین‌پال تایید نشد.");
      }
    } catch {
      setPhase("failed");
      setMessage("خطا در تایید تراکنش.");
    }
  };

  useEffect(() => {
    if (authority) {
      verifyZarinpalCallback();
    } else if (orderId) {
      startZarinpalPayment();
    }
  }, [authority, orderId]);

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4 py-10 font-sans select-none text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="max-w-md w-full p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl text-center space-y-6">
        {phase === "redirecting" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-3 border-[var(--accent-blue)] border-t-transparent animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-lg font-black text-[var(--accent-blue)]">
                در حال انتقال به درگاه امن زرین‌پال
              </h1>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{message}</p>
            </div>
            {amount > 0 && (
              <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs flex justify-between items-center">
                <span className="font-bold text-[var(--text-secondary)]">مبلغ قابل پرداخت:</span>
                <span className="font-mono font-black text-emerald-500">
                  {amount.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={startZarinpalPayment}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg cursor-pointer"
            >
              ورود مستقیم به درگاه زرین‌پال 💳
            </button>
          </>
        )}

        {phase === "verifying" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin" />
            </div>
            <h1 className="text-lg font-black text-emerald-400">
              در حال تایید تراکنش شاپرک...
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">{message}</p>
          </>
        )}

        {phase === "success" && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-4xl font-black shadow-[0_0_40px_rgba(16,185,129,0.6)]">
              ✓
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-black text-emerald-400">پرداخت با موفقیت انجام شد!</h1>
              <p className="text-xs text-[var(--text-secondary)]">{message}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs space-y-2.5 text-right">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">شماره سفارش:</span>
                <span className="font-mono font-black text-[var(--accent-blue)]">{orderId}</span>
              </div>
              {refId && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">شماره مرجع شاپرک (RefID):</span>
                  <span className="font-mono font-black text-emerald-400">{refId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">کد رهگیری مرسوله:</span>
                <span className="font-mono font-black text-amber-400">{trackingCode}</span>
              </div>
            </div>

            <Link
              href={"/account?orderId=" + encodeURIComponent(orderId)}
              className="block w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xl transition"
            >
              ورود به حساب کاربری و مشاهده فاکتور ←
            </Link>
          </>
        )}

        {phase === "failed" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center text-3xl font-black">
              ✕
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-black text-rose-500">خطا یا انصراف از پرداخت</h1>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{message}</p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={startZarinpalPayment}
                className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg cursor-pointer"
              >
                🔄 تلاش مجدد و اتصال به درگاه زرین‌پال
              </button>
              <Link
                href="/checkout"
                className="block w-full py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold"
              >
                بازگشت به صفحه تسویه‌حساب
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-xs font-bold">
          در حال اتصال به درگاه زرین‌پال...
        </div>
      }
    >
      <PaymentGatewayContent />
    </Suspense>
  );
}

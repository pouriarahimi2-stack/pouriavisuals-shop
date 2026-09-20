"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { orderService } from "@/services/orderService";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

function PaymentGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const [order, setOrder] = useState<any>(null);
  const [amount, setAmount] = useState<number>(0);
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (orderId) {
      orderService.getById(orderId).then((found) => {
        if (found) {
          setOrder(found);
          const finalVal = Number(found.finalAmount || (found as any).final_amount || found.totalAmount || 0);
          if (finalVal > 0) setAmount(finalVal);
        }
      });
    }
  }, [orderId]);

  const handleConnectZarinpal = async () => {
    if (!orderId) {
      setErrorMsg("شناسه سفارش یافت نشد.");
      return;
    }

    soundEngine.playClick();
    setConnecting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setErrorMsg(data.message || "خطا در اتصال به درگاه پرداخت شاپرک.");
        setConnecting(false);
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با سرور پرداخت.");
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 max-w-lg mx-auto font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg">
              💳
            </span>
            <div>
              <h1 className="text-sm font-black">درگاه پرداخت الکترونیک شاپرک (زرین‌پال)</h1>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium">اتصال امن به سوئیچ شبکه بانکی شتاب</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
            SSL 256-bit
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex justify-between items-center text-xs">
          <span className="text-[var(--text-secondary)] font-bold">مبلغ قابل پرداخت فاکتور:</span>
          <span className="font-mono font-black text-base text-[var(--accent-blue)]" suppressHydrationWarning>
            {formatPrice(amount)} تومان
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 leading-relaxed font-medium">
          🔒 شما در حال انتقال به درگاه پرداخت رسمی زرین‌پال هستید. پس از تکمیل تراکنش، به صورت خودکار به صفحه پیگیری مرسوله هدایت خواهید شد.
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled={connecting || amount <= 0}
            onClick={handleConnectZarinpal}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {connecting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <span>انتقال مستقیم به درگاه پرداخت زرین‌پال 🚀</span>
            )}
          </button>
        </div>

        <div className="pt-2 text-center">
          <Link href="/cart" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
            ← بازگشت به سبد خرید
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans text-xs font-bold text-[var(--text-secondary)]">
          در حال بارگذاری درگاه پرداخت...
        </div>
      }
    >
      <PaymentGatewayContent />
    </Suspense>
  );
}

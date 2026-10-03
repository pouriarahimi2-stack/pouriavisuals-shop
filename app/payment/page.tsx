"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SecurePaymentRedirector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderId =
      searchParams.get("orderId") ||
      (typeof window !== "undefined" ? sessionStorage.getItem("pending_payment_order_id") : "") ||
      "";
    const amount =
      searchParams.get("amount") ||
      (typeof window !== "undefined" ? sessionStorage.getItem("pending_payment_amount") : "") ||
      "";
    const authority = searchParams.get("Authority") || searchParams.get("authority") || "";
    const status = searchParams.get("Status") || searchParams.get("status") || "";

    const params = new URLSearchParams();
    if (orderId) params.set("orderId", orderId);
    if (amount) params.set("amount", amount);
    if (authority) params.set("Authority", authority);
    if (status) params.set("Status", status);

    const qs = params.toString();
    router.replace("/checkout/payment" + (qs ? "?" + qs : ""));
  }, [router, searchParams]);

  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center p-6 font-sans text-xs font-bold text-[var(--text-secondary)] space-y-3"
      dir="rtl"
    >
      <div className="w-9 h-9 rounded-full border-3 border-[var(--accent-blue)] border-t-transparent animate-spin" />
      <p>در حال انتقال امن به درگاه پرداخت شاپرک (زرین‌پال)...</p>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-xs font-bold">
          در حال انتقال به درگاه پرداخت...
        </div>
      }
    >
      <SecurePaymentRedirector />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { orderService } from "@/services/orderService";

function PaymentGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [isProcessing, setIsProcessing] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      const found = orderService.getOrderById(orderId);
      if (found) setOrder(found);
    }
  }, [orderId]);

  const handlePaySuccess = () => {
    if (!orderId) return;
    setIsProcessing(true);
    setTimeout(() => {
      orderService.updateOrderStatus(orderId, "completed", "paid");
      router.push(`/track-order?orderId=${orderId}&payment=success`);
    }, 1500);
  };

  const handlePayCancel = () => {
    if (!orderId) return;
    setIsProcessing(true);
    setTimeout(() => {
      orderService.updateOrderStatus(orderId, "cancelled", "failed");
      router.push(`/track-order?orderId=${orderId}&payment=failed`);
    }, 1000);
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs">
        درحال انتقال به درگاه پرداخت...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-xs select-none">
      <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-6 text-white space-y-6 shadow-2xl">
        <div className="text-center space-y-2 border-b border-white/10 pb-4">
          <div className="w-12 h-12 bg-blue-500/10 text-[var(--accent-blue)] rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
            💳
          </div>
          <h2 className="text-lg font-black">درگاه پرداخت الکترونیک</h2>
          <p className="text-[11px] opacity-60">اتصال امن به شبکه شتاب</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="opacity-60">شماره سفارش:</span>
            <span className="font-bold text-[var(--accent-blue)]">#{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">نام پذیرنده:</span>
            <span>فروشگاه BitByPouria</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-green-400 pt-2 border-t border-white/10">
            <span>مبلغ قابل پرداخت:</span>
            <span>{order.finalAmount.toLocaleString("fa-IR")} تومان</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block opacity-70">شماره کارت بانکی (فرضی):</label>
          <input
            type="text"
            value="۶۰۳۷ - ۹۹۷۵ - ۱۲۳۴ - ۵۶۷۸"
            disabled
            className="w-full p-3 rounded-xl bg-black/20 border border-white/10 font-mono text-center text-sm font-bold opacity-80"
          />
        </div>

        {isProcessing ? (
          <div className="text-center py-4 text-yellow-400 font-bold animate-pulse">
            ⏳ در حال بررسی و تایید تراکنش...
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <button
              onClick={handlePaySuccess}
              className="w-full py-3.5 rounded-xl bg-green-500 text-white font-bold cursor-pointer hover:bg-green-600 transition shadow-lg text-xs"
            >
              ✅ تایید و پرداخت موفق
            </button>
            <button
              onClick={handlePayCancel}
              className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-bold cursor-pointer hover:bg-red-500/30 transition text-xs"
            >
              ❌ انصراف از پرداخت
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentGatewayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">درحال بارگذاری...</div>}>
      <PaymentGatewayContent />
    </Suspense>
  );
}
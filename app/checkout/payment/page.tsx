// File Path: app/checkout/payment/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import * as CartContextModule from "@/context/CartContext";

function PaymentGatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const useCartHook = (CartContextModule as any).useCart;
  const cartCtx = typeof useCartHook === "function" ? useCartHook() : null;

  const orderId = searchParams.get("orderId") || "";
  const initialTracking = searchParams.get("trackingCode") || "";
  const amountParam = Number(searchParams.get("amount") || 0);
  const phoneParam = searchParams.get("phone") || "";

  const [paymentMethod, setPaymentMethod] = useState<"online_gateway" | "manual_receipt">("online_gateway");
  const [receiptRef, setReceiptRef] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState(initialTracking);
  const [refId, setRefId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const clearShoppingCartAndDraft = () => {
    try {
      if (cartCtx && typeof cartCtx.clearCart === "function") {
        cartCtx.clearCart();
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("axon_cart");
        localStorage.removeItem("cart");
        localStorage.removeItem("axon_checkout_draft_v2026");
        window.dispatchEvent(new CustomEvent("cart_updated", { detail: [] }));
      }
    } catch {}
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      setErrorMsg("شناسه سفارش یافت نشد. لطفاً از صفحه تسویه‌حساب مجدداً اقدام نمایید.");
      return;
    }

    soundEngine.playClick();
    setProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          trackingCode: initialTracking,
          phone: phoneParam,
          paymentMethod,
          receiptRef: receiptRef.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setTrackingCode(json.trackingCode || initialTracking || orderId);
        setRefId(json.refId || "REF-AXON");
        setPaymentSuccess(true);

        // لاگین خودکار خریدار در حساب کاربری
        if (typeof window !== "undefined") {
          const existingRaw = localStorage.getItem("axon_user_session");
          const existingUser = existingRaw ? JSON.parse(existingRaw) : {};
          const userObj = {
            ...existingUser,
            phone: json.user?.phone || phoneParam || existingUser.phone || "",
            name: json.user?.name || existingUser.name || "خریدار محترم",
            full_name: json.user?.full_name || existingUser.full_name || "خریدار محترم",
            lastOrderId: orderId,
            lastTrackingCode: json.trackingCode || initialTracking,
            token: json.user?.token || existingUser.token || ("USER-" + Date.now()),
          };
          localStorage.setItem("axon_user_session", JSON.stringify(userObj));
          window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: userObj }));
        }

        clearShoppingCartAndDraft();

        // انتقال خودکار به پنل حساب کاربری پس از ۳ ثانیه جهت مشاهده جزئیات سفارش
        setTimeout(() => {
          router.push("/account?orderId=" + encodeURIComponent(orderId));
        }, 3200);
      } else {
        setErrorMsg(json.message || "خطا در تایید پرداخت.");
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با درگاه پرداخت.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6 text-xs">
        {paymentSuccess ? (
          <div className="space-y-6 text-center py-6 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500 text-slate-950 flex items-center justify-center text-4xl font-black shadow-[0_0_50px_rgba(16,185,129,0.6)]">
              ✓
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-emerald-400">
                پرداخت و ثبت سفارش شما با موفقیت انجام شد!
              </h1>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                کد پیگیری سفارش به شماره همراه <strong className="font-mono text-[var(--text-primary)]">{phoneParam}</strong> پیامک شد و شما به صورت خودکار وارد حساب کاربری خود شدید.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[var(--input-bg)] border border-emerald-500/30 space-y-3 text-right">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] font-bold">شماره فاکتور:</span>
                <span className="font-mono font-black text-[var(--accent-blue)]">{orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] font-bold">کد پیگیری اختصاصی مرسوله:</span>
                <span className="font-mono font-black text-sm text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                  {trackingCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] font-bold">شماره مرجع تراکنش:</span>
                <span className="font-mono text-slate-400">{refId}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Link
                href={"/account?orderId=" + encodeURIComponent(orderId)}
                className="block w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs sm:text-sm shadow-xl hover:opacity-90 transition"
              >
                ورود مستقیم به حساب کاربری و مشاهده وضعیت سفارش ←
              </Link>
              <p className="text-[11px] text-slate-400 animate-pulse">
                در حال انتقال خودکار به پنل حساب کاربری شما...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <h1 className="text-base sm:text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
                  <span>💳</span> درگاه پرداخت امن و تایید نهایی سفارش
                </h1>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  شناسه فاکتور: <strong className="font-mono">{orderId || "---"}</strong>
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 font-mono font-bold text-[11px]">
                SSL 256-Bit ✓
              </span>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] font-bold">شماره موبایل تاییدشده:</span>
                <span className="font-mono font-bold">{phoneParam || "---"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] font-bold">مبلغ قابل پرداخت:</span>
                <span className="font-mono font-black text-base text-emerald-400">
                  {amountParam > 0 ? amountParam.toLocaleString("fa-IR") + " تومان" : "طبق فاکتور"}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setPaymentMethod("online_gateway");
                  }}
                  className={
                    "p-3.5 rounded-2xl border font-black text-right transition cursor-pointer " +
                    (paymentMethod === "online_gateway"
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 text-[var(--text-primary)]"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)]")
                  }
                >
                  <div className="text-sm mb-1">🌐 پرداخت آنلاین شتاب</div>
                  <div className="text-[10px] font-normal opacity-80">
                    تایید آنی و صدور خودکار کد پیگیری
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setPaymentMethod("manual_receipt");
                  }}
                  className={
                    "p-3.5 rounded-2xl border font-black text-right transition cursor-pointer " +
                    (paymentMethod === "manual_receipt"
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 text-[var(--text-primary)]"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)]")
                  }
                >
                  <div className="text-sm mb-1">🧾 ثبت فیش واریزی / کارت به کارت</div>
                  <div className="text-[10px] font-normal opacity-80">
                    ثبت شماره پیگیری فیش بانکی
                  </div>
                </button>
              </div>

              {paymentMethod === "manual_receipt" && (
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    شماره پیگیری فیش واریزی یا ۴ رقم آخر کارت:
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    placeholder="مثال: 849201"
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-xl transition cursor-pointer disabled:opacity-50"
              >
                {processing
                  ? "در حال تایید تراکنش و ارسال پیامک کد پیگیری..."
                  : "✓ تکمیل و تایید نهایی پرداخت (دریافت کد پیگیری)"}
              </button>
            </form>
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
        <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">
          در حال بارگذاری درگاه پرداخت امن آکسون...
        </div>
      }
    >
      <PaymentGatewayContent />
    </Suspense>
  );
}

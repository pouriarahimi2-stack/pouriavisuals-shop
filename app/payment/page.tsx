"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

function PaymentForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const orderId      = searchParams.get("orderId") || "";
  const sandbox      = searchParams.get("sandbox") === "1";

  const [amount,   setAmount]   = useState(0);
  const [order,    setOrder]    = useState<any>(null);
  const [card,     setCard]     = useState("");
  const [cvv2,     setCvv2]     = useState("");
  const [month,    setMonth]    = useState("");
  const [year,     setYear]     = useState("");
  const [otp,      setOtp]      = useState("");
  const [timer,    setTimer]    = useState(120);
  const [paying,   setPaying]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [ref,      setRef]      = useState("");
  const [error,    setError]    = useState("");

  useEffect(() => {
    // خواندن مبلغ از session یا DB
    const saved = sessionStorage.getItem("pending_payment_amount");
    if (saved) setAmount(Number(saved) || 0);

    if (orderId) {
      fetch("/api/orders/" + orderId).then(r => r.json()).then(d => {
        if (d.success && d.order) {
          setOrder(d.order);
          const v = Number(d.order.final_amount || d.order.total_amount || 0);
          if (v > 0) setAmount(v);
        }
      }).catch(() => {});
    }

    const iv = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, [orderId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanCard = card.replace(/\D/g, "");
    if (cleanCard.length !== 16) { setError("شماره کارت باید ۱۶ رقم باشد"); return; }
    if (cvv2.length < 3)         { setError("CVV2 نامعتبر است");             return; }
    if (!otp || otp.length < 5)  { setError("رمز پویا الزامی است");          return; }

    soundEngine.playClick();
    setPaying(true);
    try {
      const res  = await fetch("/api/payment/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, authority: "PAY-" + Date.now().toString().slice(-8) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "پرداخت تأیید نشد");
      setRef(String(data.trackingRef || ""));
      try {
        localStorage.removeItem("axon_cart_store_v2026");
        sessionStorage.removeItem("pending_payment_amount");
        sessionStorage.removeItem("pending_payment_order_id");
        window.dispatchEvent(new CustomEvent("cart_updated", { detail: [] }));
      } catch {}
      soundEngine.playSuccess?.();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "خطا در پردازش پرداخت");
    } finally {
      setPaying(false);
    }
  };

  const inp = "w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-white text-sm font-mono outline-none focus:border-blue-500 transition placeholder:text-slate-500";

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[var(--modal-bg)] border border-emerald-500/30 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-500 text-4xl flex items-center justify-center mx-auto">✓</div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-emerald-500">پرداخت موفق!</h2>
            <p className="text-xs text-[var(--text-secondary)]">سفارش شما ثبت شد و در حال آماده‌سازی است.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs space-y-2 text-right font-mono">
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">کد پیگیری:</span><span className="font-black text-[var(--accent-blue)]">{ref}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">شماره سفارش:</span><span className="font-black">{orderId?.slice(0,8).toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">مبلغ:</span><span className="font-black text-emerald-500" suppressHydrationWarning>{formatPrice(amount)} تومان</span></div>
          </div>
          <div className="flex gap-3">
            <a href="/my-orders" className="flex-1 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs text-center hover:opacity-90 transition">پیگیری سفارش</a>
            <a href="/"          className="flex-1 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-center hover:border-[var(--accent-blue)] transition">صفحه اصلی</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans" dir="rtl"
      style={{ background: "linear-gradient(135deg, #0a0c10 0%, #0f1420 50%, #0a0c10 100%)" }}>
      <div className="w-full max-w-md space-y-4">
        {/* هدر */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-bold">
            🔒 اتصال امن SSL — درگاه پرداخت آکسون
          </div>
          {sandbox && <p className="text-amber-400 text-[10px] font-bold">⚠️ حالت آزمایشی — پرداخت واقعی نیست</p>}
        </div>

        {/* مبلغ */}
        <div className="p-5 rounded-3xl border border-slate-700 bg-slate-900/80 text-center space-y-1">
          <p className="text-slate-400 text-xs">مبلغ قابل پرداخت</p>
          <p className="text-3xl font-black text-white" suppressHydrationWarning>
            {amount > 0 ? formatPrice(amount) : "—"}
          </p>
          <p className="text-slate-400 text-xs font-bold">تومان</p>
        </div>

        {/* فرم کارت */}
        <form onSubmit={handlePay} className="p-6 rounded-3xl border border-slate-700 bg-slate-900/80 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">{error}</div>
          )}

          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-bold">شماره کارت بانکی</label>
            <input type="text" value={card} onChange={e => setCard(e.target.value.replace(/\D/g,"").slice(0,16))}
              placeholder="xxxx xxxx xxxx xxxx" inputMode="numeric" maxLength={16}
              className={inp} dir="ltr"/>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 text-xs font-bold">ماه</label>
              <input type="text" value={month} onChange={e => setMonth(e.target.value.replace(/\D/g,"").slice(0,2))}
                placeholder="MM" inputMode="numeric" maxLength={2} className={inp} dir="ltr"/>
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 text-xs font-bold">سال</label>
              <input type="text" value={year} onChange={e => setYear(e.target.value.replace(/\D/g,"").slice(0,2))}
                placeholder="YY" inputMode="numeric" maxLength={2} className={inp} dir="ltr"/>
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 text-xs font-bold">CVV2</label>
              <input type="password" value={cvv2} onChange={e => setCvv2(e.target.value.replace(/\D/g,"").slice(0,4))}
                placeholder="***" inputMode="numeric" maxLength={4} className={inp} dir="ltr"/>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 text-xs font-bold">رمز پویا (OTP)</label>
              <span className="text-slate-500 text-[10px] font-mono">{timer > 0 ? timer + "s" : "منقضی"}</span>
            </div>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
              placeholder="رمز ۶ رقمی پیامک‌شده" inputMode="numeric" maxLength={6}
              autoComplete="one-time-code" className={inp} dir="ltr"/>
          </div>

          <button type="submit" disabled={paying}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-black text-sm transition disabled:opacity-50 cursor-pointer shadow-lg">
            {paying ? "در حال پردازش..." : "💳 پرداخت " + (amount > 0 ? formatPrice(amount) + " تومان" : "")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white text-sm">بارگذاری...</div>}>
      <PaymentForm/>
    </Suspense>
  );
}

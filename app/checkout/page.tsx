"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight, ShoppingBag, ShieldCheck, Phone, MapPin,
  User, Hash, CheckCircle2, Lock, AlertCircle, RefreshCw,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";
import { IRAN_PROVINCES, getCitiesOfProvince } from "@/lib/iranLocations";

const FORM_KEY = "axon_checkout_v2";
const OTP_DURATION = 120; // seconds

type Step = "form" | "otp" | "processing";

export default function CheckoutPage() {
  const { cartItems, totalPrice, finalPayable, discountAmount, clearCart } = useCart();

  // ── فیلدهای فرم ──────────────────────────────────────────────
  const [fullName,    setFullName]    = useState("");
  const [phone,       setPhone]       = useState("");
  const [province,    setProvince]    = useState("");
  const [city,        setCity]        = useState("");
  const [postalCode,  setPostalCode]  = useState("");
  const [address,     setAddress]     = useState("");
  const [notes,       setNotes]       = useState("");
  const cities = getCitiesOfProvince(province);

  // ── OTP ──────────────────────────────────────────────────────
  const [step,        setStep]        = useState<Step>("form");
  const [otpCode,     setOtpCode]     = useState("");
  const [otpLoading,  setOtpLoading]  = useState(false);
  const [otpError,    setOtpError]    = useState("");
  const [otpTimer,    setOtpTimer]    = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── UI ───────────────────────────────────────────────────────
  const [formError,   setFormError]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);

  // ── بارگذاری از sessionStorage ────────────────────────────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(FORM_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.fullName)   setFullName(d.fullName);
        if (d.phone)      setPhone(d.phone);
        if (d.province)   setProvince(d.province);
        if (d.city)       setCity(d.city);
        if (d.postalCode) setPostalCode(d.postalCode);
        if (d.address)    setAddress(d.address);
        if (d.notes)      setNotes(d.notes);
      }
    } catch {}

    // بارگذاری از حساب کاربری لاگین‌شده
    try {
      const u = JSON.parse(
        localStorage.getItem("axon_user_session") ||
        document.cookie.match(/axon_user_session=([^;]+)/)?.[1] ||
        "{}"
      );
      if (u.name  && !fullName) setFullName(u.name);
      if (u.phone && !phone)    setPhone(u.phone);
    } catch {}
  }, []);

  // ── ذخیره خودکار در sessionStorage ──────────────────────────
  const saveForm = useCallback(() => {
    try {
      sessionStorage.setItem(FORM_KEY, JSON.stringify({
        fullName, phone, province, city, postalCode, address, notes,
      }));
    } catch {}
  }, [fullName, phone, province, city, postalCode, address, notes]);

  useEffect(() => { saveForm(); }, [saveForm]);

  // ── تایمر OTP ────────────────────────────────────────────────
  useEffect(() => {
    if (otpTimer <= 0) return;
    timerRef.current = setTimeout(() => setOtpTimer(t => t - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [otpTimer]);

  // وقتی استان عوض میشه، شهر پاک بشه
  useEffect(() => { setCity(""); }, [province]);

  // ── اعتبارسنجی فرم ───────────────────────────────────────────
  const validateForm = (): string | null => {
    if (!fullName.trim() || fullName.trim().length < 3)
      return "نام و نام خانوادگی کامل را وارد کنید (حداقل ۳ نویسه)";
    const ph = phone.replace(/\D/g, "");
    if (ph.length !== 11 || !ph.startsWith("09"))
      return "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود";
    if (!province) return "انتخاب استان الزامی است";
    if (!city)     return "انتخاب شهر الزامی است";
    const pc = postalCode.replace(/\D/g, "");
    if (pc.length !== 10) return "کد پستی باید دقیقاً ۱۰ رقم باشد";
    if (!address.trim() || address.trim().length < 10)
      return "آدرس دقیق الزامی است (حداقل ۱۰ نویسه)";
    if (cartItems.length === 0) return "سبد خرید شما خالی است";
    return null;
  };

  // ── مرحله ۱: تایید نهایی → ارسال OTP ────────────────────────
  const handleProceed = async () => {
    setFormError("");
    const err = validateForm();
    if (err) { setFormError(err); return; }

    soundEngine.playClick();
    setOtpLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const res  = await fetch("/api/auth/otp/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setStep("otp");
        setOtpTimer(OTP_DURATION);
        setTimeout(() => otpRef.current?.focus(), 200);
      } else {
        setFormError(data.message || "خطا در ارسال کد پیامکی. مجدداً تلاش کنید.");
      }
    } catch {
      setFormError("خطا در ارتباط با سامانه پیامکی.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── مرحله ۲: تایید OTP → ثبت سفارش → درگاه ─────────────────
  const handleVerifyAndPay = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setOtpError("لطفاً کد پیامک‌شده را وارد کنید"); return;
    }
    soundEngine.playClick();
    setOtpLoading(true); setOtpError(""); setStep("processing");

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const cleanPostal = postalCode.replace(/\D/g, "");

      // ۱. تایید OTP
      const verRes  = await fetch("/api/auth/otp/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: cleanPhone, code: otpCode.trim() }),
      });
      const verData = await verRes.json();
      if (!verRes.ok || !verData.success) {
        setOtpError(verData.message || "کد تایید نادرست است. مجدداً بررسی کنید.");
        setStep("otp"); setOtpLoading(false); return;
      }

      setSubmitting(true);

      // ۲. ثبت سفارش
      const orderRes  = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          customer_name:    fullName.trim(),
          phone:            cleanPhone,
          customer_phone:   cleanPhone,
          province:         province.trim(),
          city:             city.trim(),
          postal_code:      cleanPostal,
          address:          address.trim(),
          customer_address: address.trim(),
          notes:            notes.trim(),
          items:            cartItems,
          total_price:      finalPayable,
          phone_verified:   true,
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "خطا در ثبت سفارش. مجدداً تلاش کنید.");
      }

      // ۳. ذخیره session کاربر
      const userSession = orderData.user || { name: fullName.trim(), phone: cleanPhone };
      const sessionStr  = JSON.stringify(userSession);
      try {
        localStorage.setItem("axon_user_session", sessionStr);
        document.cookie = `axon_user_session=${encodeURIComponent(sessionStr)}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
      } catch {}

      // ۴. درخواست لینک زرین‌پال
      const orderId  = orderData.orderId || orderData.order?.id;
      const payRes   = await fetch("/api/payment/request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderId }),
      });
      const payData  = await payRes.json();

      if (payRes.ok && payData.success && payData.paymentUrl) {
        soundEngine.playSuccess();
        // پاک‌سازی sessionStorage بعد از ثبت موفق سفارش
        try { sessionStorage.removeItem(FORM_KEY); } catch {}
        clearCart();
        window.location.href = payData.paymentUrl;
      } else {
        throw new Error(payData.message || "خطا در اتصال به درگاه زرین‌پال.");
      }
    } catch (err: any) {
      setFormError(err.message);
      setStep("form");
      setSubmitting(false);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setStep("form");
    setOtpCode(""); setOtpError("");
    await handleProceed();
  };

  // ══════════════════════════════════════════════════════════════
  // JSX
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-10 dir-rtl font-sans select-none pb-32 md:pb-10" dir="rtl">

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6 font-bold">
        <Link href="/"        className="hover:underline">خانه</Link>
        <span>/</span>
        <Link href="/products" className="hover:underline">کاتالوگ</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)]">ثبت سفارش و پرداخت</span>
      </div>

      {/* خطای سراسری */}
      {formError && (
        <div className="max-w-6xl mx-auto mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {formError}
          <button onClick={() => setFormError("")} className="mr-auto text-rose-300 hover:text-rose-400">✕</button>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── ستون اصلی ─────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">

          {/* فرم مشخصات */}
          {(step === "form" || step === "otp") && (
            <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
              <div className="pb-3 border-b border-[var(--card-border)]">
                <h1 className="text-sm sm:text-base font-black flex items-center gap-2">
                  <MapPin size={18} className="text-[var(--accent-blue)]" />
                  مشخصات تحویل‌گیرنده و نشانی ارسال
                </h1>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">تمام فیلدها جهت صدور بارنامه پستی الزامی‌اند</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

                {/* نام */}
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی *</label>
                  <div className="relative">
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="مثال: پوریا رحیمی"
                      disabled={step === "otp"}
                      className="w-full p-3.5 pr-3.5 pl-9 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] disabled:opacity-70" />
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* تلفن */}
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شماره موبایل *</label>
                  <div className="relative">
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="09123456789" dir="ltr"
                      disabled={step === "otp"}
                      className="w-full p-3.5 pl-9 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)] disabled:opacity-70" />
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* استان */}
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">استان *</label>
                  <select value={province} onChange={e => setProvince(e.target.value)}
                    disabled={step === "otp"}
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] cursor-pointer disabled:opacity-70">
                    <option value="">انتخاب استان...</option>
                    {IRAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* شهر */}
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شهر *</label>
                  <select value={city} onChange={e => setCity(e.target.value)}
                    disabled={step === "otp" || !province}
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] cursor-pointer disabled:opacity-70">
                    <option value="">{province ? "انتخاب شهر..." : "ابتدا استان انتخاب کنید"}</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* کد پستی */}
                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد پستی ۱۰ رقمی *</label>
                  <div className="relative">
                    <input type="text" required maxLength={10} dir="ltr"
                      value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="1234567890" disabled={step === "otp"}
                      className="w-full p-3.5 pl-9 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)] disabled:opacity-70" />
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {postalCode.length > 0 && postalCode.length !== 10 && (
                    <p className="text-rose-400 text-[10px] mt-1 font-bold">{postalCode.length}/10 رقم — هنوز ناقص است</p>
                  )}
                </div>

                {/* آدرس */}
                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نشانی دقیق پستی *</label>
                  <textarea rows={3} required value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="خیابان، کوچه، پلاک، طبقه، واحد..."
                    disabled={step === "otp"}
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-medium leading-relaxed outline-none focus:border-[var(--accent-blue)] disabled:opacity-70" />
                </div>

                {/* توضیحات */}
                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">توضیحات تحویل (اختیاری)</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="نکات هماهنگی ارسال..."
                    disabled={step === "otp"}
                    className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-medium outline-none" />
                </div>
              </div>

              {/* ── مرحله OTP ── */}
              {step === "otp" && (
                <div className="mt-4 p-5 rounded-3xl bg-blue-500/5 border-2 border-blue-500/30 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-sm font-black text-[var(--accent-blue)]">
                    <Phone size={18} /> تایید شماره موبایل
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    کد ۶ رقمی به <strong className="text-[var(--text-primary)] font-mono">{phone}</strong> ارسال شد.
                  </p>

                  {otpError && (
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                      ⚠️ {otpError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <input
                      ref={otpRef}
                      type="text" inputMode="numeric" maxLength={6}
                      value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="_ _ _ _ _ _"
                      className="flex-1 p-4 rounded-2xl bg-[var(--input-bg)] border-2 border-[var(--accent-blue)] font-mono font-black text-2xl text-center tracking-widest outline-none"
                    />
                    <button type="button" onClick={handleVerifyAndPay} disabled={otpLoading || otpCode.length < 4}
                      className="px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg transition disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                      {otpLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <><ShieldCheck size={16} /> تایید</>}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <button type="button" onClick={handleResendOtp} disabled={otpTimer > 0}
                      className="flex items-center gap-1 font-bold text-[var(--accent-blue)] disabled:text-slate-500 cursor-pointer">
                      <RefreshCw size={13} />
                      {otpTimer > 0 ? `ارسال مجدد پس از ${otpTimer} ثانیه` : "ارسال مجدد کد"}
                    </button>
                    <button type="button" onClick={() => { setStep("form"); setOtpCode(""); setOtpError(""); }}
                      className="text-slate-400 hover:text-[var(--text-primary)] cursor-pointer">
                      ویرایش اطلاعات
                    </button>
                  </div>
                </div>
              )}

              {/* دکمه اصلی */}
              {step === "form" && (
                <div className="pt-3 border-t border-[var(--card-border)]">
                  <button type="button" onClick={handleProceed} disabled={otpLoading}
                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                    {otpLoading
                      ? <><div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> در حال ارسال کد پیامکی...</>
                      : <><Lock size={16} /> تایید نهایی و دریافت کد پیامکی <ArrowRight size={16} /></>
                    }
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
                    پس از تایید موبایل، مستقیماً به درگاه بانکی زرین‌پال منتقل می‌شوید
                  </p>
                </div>
              )}
            </div>
          )}

          {/* صفحه در حال پردازش */}
          {step === "processing" && (
            <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 border-4 border-[var(--accent-blue)] border-t-transparent animate-spin rounded-full mx-auto" />
              <h2 className="text-base font-black">در حال پردازش سفارش و اتصال به درگاه...</h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium">لطفاً صبر کنید — این صفحه را نبندید</p>
            </div>
          )}
        </div>

        {/* ── سبد خرید خلاصه ────────────────────────────────── */}
        <div className="lg:col-span-4 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-5 shadow-xl space-y-4 text-xs sticky top-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
            <span className="font-black flex items-center gap-2"><ShoppingBag size={16} className="text-[var(--accent-blue)]" /> سبد خرید</span>
            <span className="text-slate-400 font-bold">({cartItems.length} قلم)</span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-[var(--card-border)]/40">
                <img src={item.image || "/placeholder.png"} alt="" className="w-12 h-12 object-contain rounded-xl bg-[var(--card-bg)] p-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{item.title}</p>
                  <p className="text-[10px] text-slate-400">{item.quantity} عدد</p>
                </div>
                <span className="font-mono font-black text-emerald-500 whitespace-nowrap">
                  {formatPrice(Number(item.discountPrice || item.price) * item.quantity)} ت
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
            <div className="flex justify-between text-slate-400">
              <span>هزینه ارسال:</span>
              <span className="text-emerald-500 font-bold">رایگان</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-500 font-bold">
                <span>تخفیف:</span>
                <span className="font-mono">- {formatPrice(discountAmount)} ت</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--card-border)] text-sm font-black">
              <span>مبلغ نهایی:</span>
              <span className="text-emerald-500 font-mono text-base">{formatPrice(finalPayable)} ت</span>
            </div>
          </div>

          {/* بج‌های اعتماد */}
          <div className="pt-2 border-t border-[var(--card-border)] flex flex-col gap-1.5">
            {["🔒 پرداخت امن از طریق شاپرک زرین‌پال", "✅ تضمین اصالت ۱۰۰٪ کالا", "📦 ارسال پیشتاز سراسری"].map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] font-bold">{b}</div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

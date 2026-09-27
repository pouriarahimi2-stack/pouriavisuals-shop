"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, ShieldCheck, Phone, MapPin, User, Hash, CheckCircle2, Lock, AlertCircle, RefreshCw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";
import { IRAN_PROVINCES, getCitiesOfProvince } from "@/lib/iranLocations";

const FORM_KEY    = "axon_checkout_v2";
const OTP_DURATION = 120;
type Step = "form" | "otp" | "processing";

export default function CheckoutPage() {
  const { cartItems, totalPrice, finalPayable, discountAmount, clearCart } = useCart() as any;

  const [fullName,   setFullName]   = useState("");
  const [phone,      setPhone]      = useState("");
  const [province,   setProvince]   = useState("");
  const [city,       setCity]       = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address,    setAddress]    = useState("");
  const [notes,      setNotes]      = useState("");
  const cities = getCitiesOfProvince(province);

  const [step,       setStep]       = useState<Step>("form");
  const [otpCode,    setOtpCode]    = useState("");
  const [otpToken,   setOtpToken]   = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError,   setOtpError]   = useState("");
  const [otpTimer,   setOtpTimer]   = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formError,  setFormError]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);

  // ── بارگذاری از sessionStorage ──
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
    try {
      const u = JSON.parse(localStorage.getItem("axon_user_session") || "{}");
      if (u.name  && !fullName) setFullName(u.name);
      if (u.phone && !phone)    setPhone(u.phone);
    } catch {}
  }, []);

  const saveForm = useCallback(() => {
    try { sessionStorage.setItem(FORM_KEY, JSON.stringify({ fullName, phone, province, city, postalCode, address, notes })); } catch {}
  }, [fullName, phone, province, city, postalCode, address, notes]);
  useEffect(() => { saveForm(); }, [saveForm]);

  useEffect(() => { setCity(""); }, [province]);

  useEffect(() => {
    if (otpTimer <= 0) return;
    timerRef.current = setTimeout(() => setOtpTimer(t => t - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [otpTimer]);

  const validateForm = (): string | null => {
    if (!fullName.trim() || fullName.trim().length < 3) return "نام و نام خانوادگی کامل الزامی است";
    const ph = phone.replace(/\D/g, "");
    if (ph.length !== 11 || !ph.startsWith("09")) return "شماره موبایل معتبر ۱۱ رقمی الزامی است";
    if (!province) return "انتخاب استان الزامی است";
    if (!city)     return "انتخاب شهر الزامی است";
    const pc = postalCode.replace(/\D/g, "");
    if (pc.length !== 10) return "کد پستی باید ۱۰ رقم باشد";
    if (!address.trim() || address.trim().length < 10) return "آدرس دقیق الزامی است";
    if (!cartItems || cartItems.length === 0) return "سبد خرید خالی است";
    return null;
  };

  const handleProceed = async () => {
    setFormError("");
    const err = validateForm();
    if (err) { setFormError(err); return; }
    soundEngine.playClick();
    setOtpLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      // اول از /api/send-otp استفاده کن، اگر نداشت از /api/auth/otp/send
      const res  = await fetch("/api/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, action: "send" }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpToken(data.token || "");
        setStep("otp");
        setOtpTimer(OTP_DURATION);
        setTimeout(() => otpRef.current?.focus(), 300);
      } else {
        setFormError(data.message || "خطا در ارسال کد تأیید");
      }
    } catch { setFormError("خطا در ارتباط با سرور"); }
    finally { setOtpLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.replace(/\D/g, "").length < 4) { setOtpError("کد تأیید را وارد کنید"); return; }
    setOtpError(""); setSubmitting(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const res  = await fetch("/api/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: otpCode.replace(/\D/g, ""), token: otpToken, action: "verify" }),
      });
      const data = await res.json();
      if (!data.success) { setOtpError(data.message || "کد نادرست است"); setSubmitting(false); return; }

      setStep("processing");
      await handleCreateOrder(cleanPhone);
    } catch { setOtpError("خطا در بررسی کد"); setSubmitting(false); }
  };

  const handleCreateOrder = async (cleanPhone: string) => {
    try {
      const items = Array.isArray(cartItems) ? cartItems : [];
      const total = Number(finalPayable || totalPrice || 0);

      const orderPayload = {
        customer_name: fullName.trim(),
        phone:         cleanPhone,
        province, city,
        postal_code:   postalCode.replace(/\D/g, ""),
        address:       address.trim(),
        notes:         notes.trim(),
        items: items.map((i: any) => ({
          product_id:    i.id,
          title:         i.title || i.name || "کالا",
          quantity:      Number(i.quantity) || 1,
          price:         Number(i.discount_price || i.price || 0),
          image:         i.image || i.image_url || "",
        })),
        total_amount:  total,
        final_amount:  total,
        discount:      Number(discountAmount || 0),
        status:        "pending",
      };

      const res  = await fetch("/api/orders/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();

      if (!data.success || !data.orderId) throw new Error(data.message || "خطا در ثبت سفارش");

      // ذخیره اطلاعات پرداخت
      try {
        sessionStorage.setItem("pending_payment_amount",   String(total));
        sessionStorage.setItem("pending_payment_order_id", data.orderId);
        const userSession = { name: fullName, phone: cleanPhone };
        localStorage.setItem("axon_user_session", JSON.stringify(userSession));
      } catch {}

      clearCart?.();
      soundEngine.playSuccess?.();

      // هدایت به صفحه پرداخت
      window.location.href = "/payment?orderId=" + data.orderId;
    } catch (err: any) {
      setOtpError(err.message || "خطا در ثبت سفارش");
      setStep("otp");
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setOtpError(""); setOtpCode(""); setOtpLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const res  = await fetch("/api/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, action: "send" }),
      });
      const data = await res.json();
      if (data.success) { setOtpToken(data.token || ""); setOtpTimer(OTP_DURATION); }
      else setOtpError(data.message || "خطا در ارسال مجدد");
    } catch { setOtpError("خطا در اتصال"); }
    finally { setOtpLoading(false); }
  };

  const items     = Array.isArray(cartItems) ? cartItems : [];
  const totalAmt  = Number(finalPayable || totalPrice || 0);
  const discount  = Number(discountAmount || 0);

  const inp = "w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)] transition placeholder:text-[var(--text-secondary)]/50";

  if (step === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans" dir="rtl">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 rounded-full border-4 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto"/>
          <p className="text-sm font-black text-[var(--text-primary)]">در حال ثبت سفارش و هدایت به درگاه...</p>
          <p className="text-xs text-[var(--text-secondary)]">لطفاً صفحه را نبندید</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans pt-20 pb-24 md:pb-8" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 space-y-6">

        {/* هدر */}
        <div className="flex items-center gap-3">
          <Link href="/products" className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition">
            <ArrowRight size={18} className="text-[var(--text-secondary)]"/>
          </Link>
          <div>
            <h1 className="text-xl font-black text-[var(--text-primary)]">تکمیل سفارش</h1>
            <p className="text-xs text-[var(--text-secondary)]">{items.length} کالا در سبد</p>
          </div>
        </div>

        {/* خلاصه سبد */}
        {items.length > 0 && (
          <div className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--card-border)] last:border-0">
                {item.image || item.image_url ? (
                  <img src={item.image || item.image_url} alt="" className="w-12 h-12 rounded-xl object-contain bg-white/5"/>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-lg">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate">{item.title || item.name}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">×{item.quantity || 1}</p>
                </div>
                <span className="text-xs font-mono font-black text-emerald-500 shrink-0" suppressHydrationWarning>
                  {formatPrice(Number(item.discount_price || item.price || 0) * (Number(item.quantity) || 1))} ت
                </span>
              </div>
            ))}
            <div className="pt-2 space-y-1 text-xs">
              {discount > 0 && (
                <div className="flex justify-between text-rose-500 font-bold">
                  <span>تخفیف</span>
                  <span suppressHydrationWarning>- {formatPrice(discount)} ت</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-[var(--text-primary)]">
                <span>مبلغ قابل پرداخت</span>
                <span className="text-emerald-500" suppressHydrationWarning>{formatPrice(totalAmt)} تومان</span>
              </div>
            </div>
          </div>
        )}

        {/* فرم اطلاعات */}
        {step === "form" && (
          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
            <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <User size={16}/> اطلاعات تحویل گیرنده
            </h2>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={14}/>{formError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">نام و نام خانوادگی *</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inp} placeholder="نام کامل"/>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">شماره موبایل *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="09xxxxxxxxx" inputMode="numeric" dir="ltr"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">استان *</label>
                  <select value={province} onChange={e => setProvince(e.target.value)} className={inp + " cursor-pointer"}>
                    <option value="">انتخاب استان</option>
                    {IRAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">شهر *</label>
                  <select value={city} onChange={e => setCity(e.target.value)} className={inp + " cursor-pointer"} disabled={!province}>
                    <option value="">انتخاب شهر</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">کد پستی ۱۰ رقمی *</label>
                <input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} className={inp} placeholder="XXXXXXXXXX" inputMode="numeric" maxLength={10}/>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">آدرس دقیق *</label>
                <textarea rows={3} value={address} onChange={e => setAddress(e.target.value)} className={inp + " resize-none"} placeholder="خیابان، کوچه، پلاک، واحد..."/>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">توضیحات تحویل (اختیاری)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inp} placeholder="نکات هماهنگی ارسال..."/>
              </div>
            </div>

            <button onClick={handleProceed} disabled={otpLoading || items.length === 0}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-lg flex items-center justify-center gap-2">
              {otpLoading ? <><RefreshCw size={16} className="animate-spin"/> در حال ارسال کد...</>
                          : <><ShieldCheck size={16}/> تأیید و ادامه به پرداخت</>}
            </button>
          </div>
        )}

        {/* مرحله OTP */}
        {step === "otp" && (
          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 flex items-center justify-center mx-auto">
                <Phone size={24} className="text-[var(--accent-blue)]"/>
              </div>
              <h2 className="text-base font-black text-[var(--text-primary)]">تأیید شماره موبایل</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                کد ۶ رقمی به <span className="font-black text-[var(--accent-blue)]">{phone}</span> ارسال شد.
              </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={14}/>{otpError}
              </div>
            )}

            <div className="space-y-3">
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="_ _ _ _ _ _"
                className="w-full px-4 py-4 rounded-2xl bg-[var(--input-bg)] border-2 border-[var(--accent-blue)] text-center text-2xl font-mono font-black tracking-widest text-[var(--text-primary)] outline-none"
                style={{ fontSize: "24px", letterSpacing: "0.5em" }}
              />
              <button onClick={handleVerifyOtp} disabled={submitting || otpCode.length < 4}
                className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-lg flex items-center justify-center gap-2">
                {submitting ? <><RefreshCw size={16} className="animate-spin"/> در حال پردازش...</>
                            : <><CheckCircle2 size={16}/> تأیید و ثبت سفارش</>}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button onClick={() => { setStep("form"); setOtpCode(""); setOtpError(""); }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer flex items-center gap-1">
                <ArrowRight size={12}/> ویرایش اطلاعات
              </button>
              <button onClick={handleResendOtp} disabled={otpTimer > 0 || otpLoading}
                className="text-[var(--accent-blue)] hover:underline transition disabled:text-[var(--text-secondary)] disabled:no-underline cursor-pointer flex items-center gap-1">
                <RefreshCw size={12} className={otpLoading ? "animate-spin" : ""}/>
                {otpTimer > 0 ? "ارسال مجدد پس از " + otpTimer + " ثانیه" : "ارسال مجدد کد"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

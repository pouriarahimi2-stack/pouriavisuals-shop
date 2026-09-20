"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, ShieldCheck, CheckCircle2, Phone, MapPin, User, Hash } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, totalPrice, finalPayable, discountAmount, clearCart } = useCart();

  // فیلدهای الزامی فرم تحویل
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // استیت‌های پیامک OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // خواندن خودکار اطلاعات خریدار در صورت لاگین قبلی
    try {
      const userRaw = localStorage.getItem("axon_user_session");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u.name) setFullName(u.name);
        if (u.phone) {
          setPhone(u.phone);
          setIsPhoneVerified(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // ارسال کد تایید پیامکی از طریق وب‌سرویس پترن IPPanel
  const handleSendOtp = async () => {
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      setErrorMessage("شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود.");
      return;
    }

    soundEngine.playClick();
    setOtpLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setOtpSent(true);
        setTimer(120);
      } else {
        setErrorMessage(data.message || "خطا در ارسال پیامک کد تایید.");
      }
    } catch {
      setErrorMessage("خطا در برقراری ارتباط با سامانه پیامکی.");
    } finally {
      setOtpLoading(false);
    }
  };

  // بررسی صحت کد تایید پیامکی
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMessage("لطفاً کد تایید پیامک‌شده را وارد نمایید.");
      return;
    }

    soundEngine.playClick();
    setOtpLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: otpCode.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setIsPhoneVerified(true);
      } else {
        setErrorMessage(data.message || "کد تایید وارد شده نادرست است.");
      }
    } catch {
      setErrorMessage("خطا در بررسی کد تایید.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ثبت نهایی فاکتور و انتقال به درگاه شاپرک زرین‌پال
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (cartItems.length === 0) {
      setErrorMessage("سبد خرید شما خالی است.");
      return;
    }

    // اعتبارسنجی فیلدهای اجباری
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      setErrorMessage("شماره موبایل وارد شده باید ۱۱ رقمی باشد.");
      return;
    }

    const cleanPostal = postalCode.trim().replace(/\D/g, "");
    if (cleanPostal.length !== 10) {
      setErrorMessage("کد پستی الزامی است و باید دقیقاً ۱۰ رقم عددی باشد.");
      return;
    }

    if (!fullName.trim() || !province.trim() || !city.trim() || address.trim().length < 8) {
      setErrorMessage("لطفاً تمامی فیلدهای نام، استان، شهر و نشانی پستی دقیق را کامل فرمایید.");
      return;
    }

    if (!isPhoneVerified) {
      setErrorMessage("لطفاً ابتدا شماره موبایل خود را با کد پیامکی تایید فرمایید.");
      return;
    }

    soundEngine.playClick();
    setSubmitting(true);

    try {
      // ۱. ایجاد فاکتور سفارش در پایگاه داده
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: fullName.trim(),
          phone: cleanPhone,
          customer_phone: cleanPhone,
          province: province.trim(),
          city: city.trim(),
          postal_code: cleanPostal,
          address: address.trim(),
          customer_address: address.trim(),
          notes: notes.trim(),
          items: cartItems,
          total_price: finalPayable,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "خطا در ثبت فاکتور سفارش.");
      }

      const orderId = orderData.orderId || orderData.order?.id;

      // ۲. درخواست لینک پرداخت زرین‌پال (شاپرک)
      const payRes = await fetch("/api/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const payData = await payRes.json();
      if (payRes.ok && payData.success && payData.paymentUrl) {
        // انتقال مستقیم به درگاه شاپرک
        window.location.href = payData.paymentUrl;
      } else {
        throw new Error(payData.message || "خطا در اتصال به درگاه بانکی زرین‌پال.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "خطا در پردازش تراکنش.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 dir-rtl font-sans select-none">
      <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6 font-bold">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <Link href="/products" className="hover:underline">کاتالوگ</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)]">ثبت مشخصات و اتصال به درگاه بانکی</span>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* فرم ثبت اطلاعات پستی و تایید شماره خریدار */}
        <div className="lg:col-span-8 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="pb-4 border-b border-[var(--card-border)]">
            <h1 className="text-base sm:text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
              <MapPin size={20} className="text-[var(--accent-blue)]" />
              <span>مشخصات تحویل‌گیرنده و نشانی پستی مرسوله</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              تمامی فیلدها جهت صدور بارنامه پستی و بیمه مرسوله الزامی هستند
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold text-center animate-fadeIn">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleProceedToPayment} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* نام و نام خانوادگی */}
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی خریدار *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: پوریا رحیمی"
                    className="w-full p-3.5 pl-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* شماره موبایل و تایید OTP */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-[var(--text-secondary)]">شماره تلفن همراه *</label>
                  {isPhoneVerified && (
                    <span className="text-emerald-500 font-bold text-[11px] flex items-center gap-1">
                      <ShieldCheck size={14} /> شماره تایید شد ✓
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      disabled={isPhoneVerified}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      className="w-full p-3.5 pl-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] disabled:opacity-75"
                    />
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {!isPhoneVerified && (
                    <button
                      type="button"
                      disabled={otpLoading || timer > 0}
                      onClick={handleSendOtp}
                      className="px-4 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold whitespace-nowrap hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      {timer > 0 ? `${timer} ثانیه` : otpSent ? "ارسال مجدد" : "ارسال کد پیامکی"}
                    </button>
                  )}
                </div>

                {/* کادر ورود کد پیامکی */}
                {otpSent && !isPhoneVerified && (
                  <div className="flex gap-2 mt-3 animate-fadeIn">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="کد ۵ یا ۶ رقمی پیامک‌شده"
                      className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)] text-center font-mono font-bold text-sm outline-none"
                    />
                    <button
                      type="button"
                      disabled={otpLoading}
                      onClick={handleVerifyOtp}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold whitespace-nowrap shadow cursor-pointer"
                    >
                      {otpLoading ? "..." : "تایید کد ✓"}
                    </button>
                  </div>
                )}
              </div>

              {/* استان */}
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">استان *</label>
                <input
                  type="text"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="مثال: تهران / فارس / اصفهان"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              {/* شهر */}
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شهر *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثال: شیراز"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              {/* کد پستی ۱۰ رقمی اجباری */}
              <div className="sm:col-span-2">
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد پستی ۱۰ رقمی ایران (الزامی) *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    dir="ltr"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="کد پستی ۱۰ رقمی بدون خط فاصله..."
                    className="w-full p-3.5 pl-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                  />
                  <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* نشانی دقیق پستی */}
              <div className="sm:col-span-2">
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نشانی دقیق پستی تحویل *</label>
                <textarea
                  rows={3}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="خیابان، کوچه، پلاک، طبقه، واحد..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] leading-relaxed"
                />
              </div>

              {/* یادداشت اختیاری */}
              <div className="sm:col-span-2">
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">یادداشت تحویل به پستچی (اختیاری)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات هماهنگی ارسال..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-medium text-[var(--text-primary)] outline-none"
                />
              </div>

            </div>

            {/* دکمه انتقال مستقیم به زرین‌پال */}
            <div className="pt-4 border-t border-[var(--card-border)]">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <span>تایید نهایی و اتصال به درگاه بانکی زرین‌پال (شاپرک) 💳</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* فاکتور خلاصه سبد خرید در ستون کناری */}
        <div className="lg:col-span-4 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-2 font-black">
              <ShoppingBag size={18} className="text-[var(--accent-blue)]" />
              <span>اقلام سفارش شما</span>
            </div>
            <span className="font-mono text-slate-400 font-bold">({cartItems.length} قلم)</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-2 border-b border-[var(--card-border)]/50">
                <img src={item.image || "/placeholder.png"} alt="" className="w-12 h-12 object-contain rounded-xl bg-black/5 dark:bg-white/5 p-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-black truncate">{item.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold block">{item.quantity} عدد</span>
                </div>
                <div className="font-mono font-black text-emerald-500 text-left" suppressHydrationWarning>
                  {formatPrice(Number(item.discountPrice || item.price) * item.quantity)} ت
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
            <div className="flex justify-between text-slate-400">
              <span>هزینه بسته‌بندی و ارسال پیشتاز:</span>
              <span className="text-emerald-500 font-bold">رایگان (ویژه خرید)</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-500 font-bold">
                <span>تخفیف اعمال‌شده:</span>
                <span className="font-mono" suppressHydrationWarning>- {formatPrice(discountAmount)} تومان</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 text-sm font-black border-t border-[var(--card-border)]">
              <span>مبلغ نهایی فاکتور:</span>
              <span className="text-emerald-500 font-mono text-base" suppressHydrationWarning>
                {formatPrice(finalPayable)} تومان
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

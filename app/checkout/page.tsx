"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, CheckCircle2, UserCheck, ShieldCheck, Send } from "lucide-react";

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // اطلاعات کاربر
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // وضعیت‌های OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    // بازخوانی نشست کاربر در صورت لاگین بودن قبلی
    try {
      const match = document.cookie.match(/(^|;)\s*axon_user_session=([^;]+)/);
      if (match) {
        const currentUser = JSON.parse(decodeURIComponent(match[2]));
        if (currentUser.name) setFullName(currentUser.name);
        if (currentUser.phone) {
          setPhone(currentUser.phone);
          setIsPhoneVerified(true);
        }
      }
    } catch (e) {}
    try {
      const items = JSON.parse(localStorage.getItem("axon_cart") || "[]");
      setCartItems(items);
    } catch (e) {
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const totalPrice = cartItems.reduce((acc, item) => {
    const p = item.discount_price ? Number(item.discount_price) : Number(item.price || 0);
    return acc + p * (item.quantity || 1);
  }, 0);

  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 10) {
      alert("لطفاً شماره موبایل معتبر ۱۱ رقمی وارد نمایید.");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setTimer(120);
      } else {
        alert(data.message || "خطا در ارسال پیامک");
      }
    } catch (e) {
      alert("خطا در برقراری ارتباط با سامانه پیامکی");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      alert("لطفاً کد تایید پیامک‌شده را وارد نمایید.");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: otpCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsPhoneVerified(true);
      } else {
        alert(data.message || "کد تایید وارد شده اشتباه است.");
      }
    } catch (e) {
      alert("خطا در تایید کد");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("سبد خرید شما خالی است.");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      alert("لطفاً نام، شماره تماس و نشانی دقیق را وارد نمایید.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: fullName.trim(),
            phone: phone.trim(),
            province: province.trim(),
            city: city.trim(),
            postal_code: postalCode.trim(),
            address: address.trim(),
            notes: notes.trim(),
            phone_verified: isPhoneVerified,
          },
          items: cartItems,
          total_price: totalPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در ثبت اطلاعات");
      }

      localStorage.removeItem("axon_cart");
      if (data.user) {
        localStorage.setItem("axon_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("user_session_updated"));
      }
      window.dispatchEvent(new Event("cart_updated"));
      setIsSubmitted(true);
    } catch (err: any) {
      alert("خطا: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 dir-rtl flex items-center justify-center">
        <div className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-5">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-lg font-black text-white">اطلاعات شما با موفقیت ثبت شد</h2>
          <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
            درخواست سفارش شما با موفقیت دریافت گردید. کارشناسان آکسون جهت هماهنگی و ارسال با شما تماس خواهند گرفت.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold transition"
            >
              بازگشت به صفحه اصلی
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 lg:p-12 dir-rtl">
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-8">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-bold">ثبت سفارش و اطلاعات گیرنده</span>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* فرم ثبت مشخصات */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 md:p-8">
          <h2 className="text-base font-black text-white pb-4 border-b border-[var(--card-border)] mb-6 flex items-center gap-2">
            <UserCheck size={18} className="text-[#0071e3]" />
            مشخصات گیرنده و آدرس تحویل
          </h2>

          <form onSubmit={handleSubmitOrder} id="checkout-form" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: پوریا رحیمی"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
                />
              </div>

              {/* بخش شماره موبایل و تایید پیامکی OTP */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">
                  شماره موبایل همراه *
                  {isPhoneVerified && (
                    <span className="text-emerald-400 text-[11px] mr-2 inline-flex items-center gap-1">
                      <ShieldCheck size={13} /> تایید شده
                    </span>
                  )}
                </label>

                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    disabled={isPhoneVerified}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-white outline-none focus:border-[#0071e3] text-left disabled:opacity-60"
                  />
                  {!isPhoneVerified && (
                    <button
                      type="button"
                      disabled={otpLoading || timer > 0}
                      onClick={handleSendOtp}
                      className="px-3.5 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold whitespace-nowrap transition disabled:opacity-50"
                    >
                      {timer > 0 ? `${timer} ثانیه` : otpSent ? "ارسال مجدد" : "ارسال کد"}
                    </button>
                  )}
                </div>

                {/* فیلد ورود کد دریافتی */}
                {otpSent && !isPhoneVerified && (
                  <div className="flex gap-2 mt-3 animate-in fade-in duration-200">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="کد ۵ رقمی پیامک‌شده"
                      className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[#0071e3] text-xs font-bold text-white outline-none text-center font-mono"
                    />
                    <button
                      type="button"
                      disabled={otpLoading}
                      onClick={handleVerifyOtp}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap"
                    >
                      تایید کد
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">استان</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="مثلاً: تهران"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">شهر</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثلاً: تهران"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">کد پستی</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="۱۰ رقمی"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-white outline-none focus:border-[#0071e3] text-left"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">نشانی پستی دقیق *</label>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="خیابان، کوچه، پلاک، واحد..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">توضیحات تکمیلی (اختیاری)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="یادداشت هماهنگی ارسال..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-white outline-none focus:border-[#0071e3]"
              />
            </div>
          </form>
        </div>

        {/* خلاصه اقلام سفارش */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 h-fit space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[var(--card-border)]">
            <ShoppingBag size={18} className="text-[#0071e3]" />
            <h3 className="text-sm font-black text-white">اقلام سفارش</h3>
            <span className="text-xs text-zinc-500 font-bold">({cartItems.length})</span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-white truncate">{item.title}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{item.quantity} عدد</div>
                </div>
                <div className="text-left font-bold text-emerald-400">
                  {(Number(item.discount_price || item.price || 0) * (item.quantity || 1)).toLocaleString("fa-IR")} ت
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--card-border)] space-y-3">
            <div className="flex justify-between items-center text-xs pt-2">
              <span className="text-zinc-300 font-bold">مجموع مبلغ:</span>
              <div className="text-lg font-black text-emerald-400">
                {totalPrice.toLocaleString("fa-IR")} تومان
              </div>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={loading || cartItems.length === 0}
            className="w-full py-4 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-black shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? "در حال پردازش و ثبت..." : "ثبت نهایی اطلاعات سفارش"}
          </button>
        </div>
      </div>
    </div>
  );
}

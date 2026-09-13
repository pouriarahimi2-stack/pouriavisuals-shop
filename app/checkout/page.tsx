// File Path: app/checkout/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";
import { IRAN_PROVINCES } from "@/lib/iranProvinces";

function toEnglishDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, totalAmount, finalPayable, appliedCoupon, applyCoupon, removeCoupon } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState(IRAN_PROVINCES[0]?.name || "تهران");
  const [city, setCity] = useState(IRAN_PROVINCES[0]?.cities[0] || "تهران");
  const [availableCities, setAvailableCities] = useState<string[]>(IRAN_PROVINCES[0]?.cities || []);
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const selected = IRAN_PROVINCES.find((p) => p.name === province);
    if (selected) {
      setAvailableCities(selected.cities);
      if (!selected.cities.includes(city)) {
        setCity(selected.cities[0]);
      }
    }
  }, [province]);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;

    soundEngine.playClick();
    setCheckingCoupon(true);
    setCouponMsg(null);

    const res = await applyCoupon(code);
    if (res.success) {
      soundEngine.playSuccess();
      setCouponMsg({ type: "success", text: res.message });
      setCouponInput("");
    } else {
      setCouponMsg({ type: "error", text: res.message });
    }
    setCheckingCoupon(false);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMsg("");

    const cleanPhone = toEnglishDigits(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      setErrorMsg("شماره تلفن همراه باید ۱۱ رقم و با ۰۹ شروع شود.");
      return;
    }

    const cleanPostal = toEnglishDigits(postalCode).replace(/\D/g, "");
    if (cleanPostal && cleanPostal.length !== 10) {
      setErrorMsg("کد پستی ۱۰ رقمی ایران را بدون خط تیره وارد کنید.");
      return;
    }

    if (address.trim().length < 8) {
      setErrorMsg("لطفاً نشانی پستی دقیق خود را جهت تحویل مرسوله وارد نمایید.");
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setErrorMsg("سبد خرید شما خالی است.");
      return;
    }

    setSubmitting(true);

    try {
      const orderPayload = {
        customer_name: fullName.trim(),
        phone: cleanPhone,
        province,
        city,
        postal_code: cleanPostal || null,
        address: address.trim(),
        notes: notes.trim() || null,
        items: cartItems.map((it) => ({
          id: it.id,
          productId: it.id,
          title: it.title,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
        })),
        coupon_code: appliedCoupon?.code || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در ثبت فاکتور سفارش.");
      }

      const orderId = data.orderId || data.order?.id;
      sessionStorage.setItem("pending_payment_amount", String(data.order?.final_amount || finalPayable));
      sessionStorage.setItem("pending_payment_order_id", String(orderId));

      soundEngine.playSuccess();
      router.push(`/checkout/payment?orderId=${orderId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در برقراری ارتباط با سرور.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="border-b border-[var(--card-border)] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">اطلاعات ارسال مرسوله و صدور فاکتور</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">بسته‌بندی ضدضربه استودیویی با ۱۸ ماه گارانتی اصالت طلایی</p>
        </div>
        <Link href="/products" className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold">
          ← ادامه خرید
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ستون راست: فرم نشانی تحویل */}
        <div className="lg:col-span-7 space-y-5 p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
          <h2 className="text-sm font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📍</span>
            <span>مشخصات تحویل‌گیرنده و نشانی پستی</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">نام و نام خانوادگی *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: پوریا رحیمی"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">شماره تلفن همراه (پیامک رهگیری) *</label>
              <input
                type="tel"
                required
                dir="ltr"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs text-center focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">استان مقصد *</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs cursor-pointer focus:border-[var(--accent-blue)]"
              >
                {IRAN_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">شهر / شهرستان *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs cursor-pointer focus:border-[var(--accent-blue)]"
              >
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[var(--text-secondary)]">کد پستی ۱۰ رقمی (اختیاری):</label>
            <input
              type="text"
              dir="ltr"
              maxLength={10}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="کد ۱۰ رقمی بدون خط تیره"
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs text-center focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[var(--text-secondary)]">نشانی دقیق پستی تحویل مرسوله *</label>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="خیابان، کوچه، پلاک، طبقه، واحد..."
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-xs leading-relaxed focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[var(--text-secondary)]">یادداشت تحویل (اختیاری):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="نکات هماهنگی با مامور پست..."
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-xs focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        {/* ستون چپ: خلاصه سفارش و کوپن تخفیف */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
            <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <span>🧾</span>
              <span>خلاصه صورت‌حساب سفارش</span>
            </h2>

            {/* بخش کوپن تخفیف */}
            <div className="pt-3 border-t border-[var(--card-border)] space-y-2">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] block">کد تخفیف دارید؟</label>
              {appliedCoupon ? (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-xs">
                  <span className="font-mono font-black text-emerald-500">{appliedCoupon.code} (اعمال شد)</span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      removeCoupon();
                      setCouponMsg(null);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-500 font-bold text-[10px]"
                  >
                    حذف کوپن
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="کد تخفیف..."
                    className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold outline-none uppercase text-center"
                  />
                  <button
                    type="button"
                    disabled={checkingCoupon || !couponInput.trim()}
                    onClick={handleApplyCoupon}
                    className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {checkingCoupon ? "..." : "اعمال"}
                  </button>
                </div>
              )}

              {couponMsg && (
                <p className={`text-[11px] font-bold ${couponMsg.type === "success" ? "text-emerald-500" : "text-rose-500"}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            {/* فاکتور مالی */}
            <div className="space-y-3 pt-3 border-t border-[var(--card-border)] text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>جمع کل اقلام ({cartItems.length} کالا):</span>
                <span className="font-mono font-bold" suppressHydrationWarning>{formatPrice(totalAmount)} تومان</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>هزینه بسته‌بندی و ارسال پیشتاز:</span>
                <span className="font-bold">رایگان (ویژه استودیو)</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[var(--card-border)] text-sm font-black">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base" suppressHydrationWarning>
                  {formatPrice(finalPayable)} تومان
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-xl shadow-emerald-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
            >
              {submitting ? "در حال صدور فاکتور..." : "تایید اطلاعات و اتصال به درگاه شاپرک 💳"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

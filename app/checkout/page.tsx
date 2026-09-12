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
  const { cartItems, totalAmount } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState(IRAN_PROVINCES[0]?.name || "تهران");
  const [city, setCity] = useState(IRAN_PROVINCES[0]?.cities[0] || "تهران");
  const [availableCities, setAvailableCities] = useState<string[]>(IRAN_PROVINCES[0]?.cities || []);
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
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
    const code = couponCode.trim();
    if (!code) return;

    soundEngine.playClick();
    setCheckingCoupon(true);
    setCouponMsg(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, totalAmount }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const discount = Number(data.discount || 0);
        setDiscountAmount(discount);
        setCouponMsg({ type: "success", text: "کد تخفیف اعمال شد: " + formatPrice(discount) + " تومان کسر گردید." });
        soundEngine.playSuccess();
      } else {
        setDiscountAmount(0);
        setCouponMsg({ type: "error", text: data.message || "کد تخفیف نامعتبر یا منقضی شده است." });
      }
    } catch {
      setCouponMsg({ type: "error", text: "خطا در استعلام کد تخفیف." });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMsg("");

    const cleanPhone = toEnglishDigits(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      setErrorMsg("شماره همراه باید ۱۱ رقم بوده و با ۰۹ شروع شود.");
      return;
    }

    const cleanPostal = toEnglishDigits(postalCode).replace(/\D/g, "");
    if (cleanPostal.length !== 10) {
      setErrorMsg("کد پستی ۱۰ رقمی معتبر الزامی است.");
      return;
    }

    if (address.trim().length < 10) {
      setErrorMsg("نشانی پستی برای ارسال ایمن مرسوله الزامی است.");
      return;
    }

    setSubmitting(true);
    const payableAmount = Math.max(0, totalAmount - discountAmount);

    try {
      const orderPayload = {
        customer_name: fullName.trim(),
        phone: cleanPhone,
        province,
        city,
        postal_code: cleanPostal,
        address: address.trim(),
        notes: notes.trim(),
        items: cartItems.map((it) => ({
          id: it.id,
          title: it.title,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
        })),
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: payableAmount,
        coupon_code: couponCode.trim() || null,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در ثبت سفارش.");
      }

      const orderId = data.order?.order_number || data.order?.id;
      sessionStorage.setItem("pending_payment_amount", String(payableAmount));
      sessionStorage.setItem("pending_payment_order_id", String(orderId));

      soundEngine.playSuccess();
      router.push("/payment?orderId=" + orderId);
    } catch (err: any) {
      setErrorMsg(err.message || "ثبت سفارش با اختلال مواجه شد.");
      setSubmitting(false);
    }
  };

  const finalPayable = Math.max(0, totalAmount - discountAmount);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="border-b border-[var(--card-border)] pb-4">
        <h1 className="text-xl sm:text-2xl font-black">اطلاعات ارسال و صدور فاکتور استودیویی</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">مشخصات دقیق تحویل‌گیرنده را جهت بارنامه پستی ضدضربه وارد فرمایید.</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-5 p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
          <h2 className="text-sm font-black text-[var(--accent-blue)]">📍 مشخصات تحویل‌گیرنده مرسوله</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">نام و نام خانوادگی:</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="پوریا رحیمی"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">شماره همراه (پیامک رهگیری):</label>
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
              <label className="font-bold text-[var(--text-secondary)]">استان مقصد:</label>
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
              <label className="font-bold text-[var(--text-secondary)]">شهر / شهرستان:</label>
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
            <label className="font-bold text-[var(--text-secondary)]">کد پستی ۱۰ رقمی:</label>
            <input
              type="text"
              required
              dir="ltr"
              maxLength={10}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="1234567890"
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs text-center focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[var(--text-secondary)]">نشانی دقیق پستی:</label>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="خیابان، پلاک، طبقه، واحد..."
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-xs leading-relaxed focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm space-y-4">
            <h2 className="text-sm font-black text-[var(--text-primary)]">🧾 خلاصه سفارش</h2>

            <div className="pt-3 border-t border-[var(--card-border)] space-y-2">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] block">کد تخفیف:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="AXON-DISCOUNT"
                  className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold outline-none uppercase text-center"
                />
                <button
                  type="button"
                  disabled={checkingCoupon || !couponCode.trim()}
                  onClick={handleApplyCoupon}
                  className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold transition disabled:opacity-50"
                >
                  {checkingCoupon ? "..." : "اعمال"}
                </button>
              </div>
              {couponMsg && (
                <p className={"text-[10px] font-bold " + (couponMsg.type === "success" ? "text-emerald-500" : "text-rose-500")}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-[var(--card-border)] text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>جمع کل اقلام:</span>
                <span className="font-mono font-bold" suppressHydrationWarning>{formatPrice(totalAmount)} تومان</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>تخفیف:</span>
                  <span className="font-mono font-bold" suppressHydrationWarning>- {formatPrice(discountAmount)} تومان</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-[var(--card-border)] text-sm">
                <span className="font-black">مبلغ قابل پرداخت:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base" suppressHydrationWarning>
                  {formatPrice(finalPayable)} تومان
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? "در حال ثبت..." : "تایید فاکتور و اتصال به درگاه شاپرک ←"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

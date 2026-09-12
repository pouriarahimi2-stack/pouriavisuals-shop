"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

// تبدیل ارقام فارسی و عربی به انگلیسی
function toEnglishDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalAmount, clearCart } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("تهران");
  const [city, setCity] = useState("تهران");
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
    try {
      const savedCoupon = localStorage.getItem("axon_active_coupon_v2026");
      if (savedCoupon) {
        const parsed = JSON.parse(savedCoupon);
        if (parsed && parsed.discount) {
          setDiscountAmount(Number(parsed.discount));
          setCouponCode(parsed.code || "");
        }
      }
    } catch {}
  }, []);

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
        localStorage.setItem("axon_active_coupon_v2026", JSON.stringify({ code, discount }));
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
      setErrorMsg("شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود.");
      return;
    }

    const cleanPostal = toEnglishDigits(postalCode).replace(/\D/g, "");
    if (cleanPostal.length !== 10) {
      setErrorMsg("کد پستی ده رقمی معتبر را وارد نمایید.");
      return;
    }

    if (address.trim().length < 10) {
      setErrorMsg("نشانی دقیق پستی برای تحویل مرسوله الزامی است.");
      return;
    }

    if (cart.length === 0) {
      setErrorMsg("سبد خرید شما خالی است.");
      return;
    }

    setSubmitting(true);
    const payableAmount = Math.max(0, totalAmount - discountAmount);

    try {
      const orderPayload = {
        customer_name: fullName.trim(),
        phone: cleanPhone,
        province: province.trim(),
        city: city.trim(),
        postal_code: cleanPostal,
        address: address.trim(),
        notes: notes.trim(),
        items: cart.map((it) => ({
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
        throw new Error(data.message || "خطا در ثبت فاکتور سفارش.");
      }

      const orderId = data.order?.order_number || data.order?.id;
      sessionStorage.setItem("pending_payment_amount", String(payableAmount));
      sessionStorage.setItem("pending_payment_order_id", String(orderId));

      soundEngine.playSuccess();
      router.push("/checkout/payment?orderId=" + orderId);
    } catch (err: any) {
      setErrorMsg(err.message || "ثبت سفارش با اختلال مواجه شد. لطفاً دوباره تلاش کنید.");
      setSubmitting(false);
    }
  };

  const finalPayable = Math.max(0, totalAmount - discountAmount);

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 font-sans select-none text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-3xl">
          🛍️
        </div>
        <h2 className="text-lg font-black text-[var(--text-primary)]">سبد خرید شما خالی است</h2>
        <p className="text-xs text-[var(--text-secondary)]">تجهیزات و مانیتورهای مورد نظر خود را به سبد اضافه کنید.</p>
        <Link
          href="/products"
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition"
        >
          مشاهده کاتالوگ استودیو ←
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="border-b border-[var(--card-border)] pb-4">
        <h1 className="text-xl sm:text-2xl font-black">اطلاعات ارسال و صدور فاکتور رسمی</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">مشخصات تحویل‌گیرنده را جهت صدور بارنامه پستی ضدضربه وارد فرمایید.</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* فرم اطلاعات گیرنده */}
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
                placeholder="مثلاً: پوریا رحیمی"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)] transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">شماره موبایل (جهت پیامک رهگیری):</label>
              <input
                type="tel"
                required
                dir="ltr"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">استان:</label>
              <input
                type="text"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="تهران"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)] transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">شهر:</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="تهران"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs focus:border-[var(--accent-blue)] transition"
              />
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
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] transition"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[var(--text-secondary)]">نشانی دقیق پستی:</label>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="خیابان، کوچه، پلاک، واحد..."
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-xs focus:border-[var(--accent-blue)] transition leading-relaxed"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[var(--text-secondary)]">توضیحات سفارش (اختیاری):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="نکات هماهنگی با مامور پست یا تست بسته‌بندی..."
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-xs focus:border-[var(--accent-blue)] transition"
            />
          </div>
        </div>

        {/* خلاصه فاکتور و پرداخت */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm space-y-4">
            <h2 className="text-sm font-black text-[var(--text-primary)]">🧾 خلاصه اقلام فاکتور ({cart.length})</h2>

            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  <div className="overflow-hidden">
                    <span className="font-bold truncate block max-w-[200px]">{item.title}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">{item.quantity} عدد</span>
                  </div>
                  <span className="font-mono font-bold text-[var(--accent-blue)]" suppressHydrationWarning>
                    {formatPrice(item.price * item.quantity)} ت
                  </span>
                </div>
              ))}
            </div>

            {/* کوپن تخفیف */}
            <div className="pt-3 border-t border-[var(--card-border)] space-y-2">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] block">کد تخفیف دارید؟</label>
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
                  className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition disabled:opacity-50"
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

            {/* ریز مبالغ */}
            <div className="space-y-2 pt-3 border-t border-[var(--card-border)] text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>جمع کل اقلام:</span>
                <span className="font-mono font-bold" suppressHydrationWarning>{formatPrice(totalAmount)} تومان</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>تخفیف اعمال‌شده:</span>
                  <span className="font-mono font-bold" suppressHydrationWarning>- {formatPrice(discountAmount)} تومان</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>بسته‌بندی و ارسال پیشتاز:</span>
                <span className="text-emerald-500 font-bold">رایگان (ویژه استودیو)</span>
              </div>
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
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <span>تایید اطلاعات و اتصال به درگاه بانکی ←</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

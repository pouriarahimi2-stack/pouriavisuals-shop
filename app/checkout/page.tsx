"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { IRAN_PROVINCES_CITIES } from "@/lib/iranProvinces";
import { formatPrice } from "@/lib/formatters";

const CHECKOUT_DRAFT_KEY = "axon_checkout_form_draft_v2026";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cartItems,
    totalPrice,
    discountAmount,
    finalPayable,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("فارس");
  const [city, setCity] = useState("شیراز");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifiedToken, setVerifiedToken] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const shippingCost = finalPayable > 0 ? (finalPayable >= 5000000 ? 0 : 65000) : 0;
  const grandTotal = finalPayable + shippingCost;

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.province && IRAN_PROVINCES_CITIES[parsed.province]) {
          setProvince(parsed.province);
        }
        if (parsed.city) setCity(parsed.city);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.postalCode) setPostalCode(parsed.postalCode);
        if (parsed.notes) setNotes(parsed.notes);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        CHECKOUT_DRAFT_KEY,
        JSON.stringify({
          fullName,
          phone,
          province,
          city,
          address,
          postalCode,
          notes,
        })
      );
    } catch {}
  }, [fullName, phone, province, city, address, postalCode, notes]);

  const availableCities = IRAN_PROVINCES_CITIES[province] || ["مرکز استان"];

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const cities = IRAN_PROVINCES_CITIES[newProv] || [];
    setCity(cities[0] || "");
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    soundEngine.playClick();
    const res = await applyCoupon(couponInput.trim());
    setCouponMsg({
      type: res.success ? "ok" : "err",
      text: res.message,
    });
  };

  const finalizeOrderWithVerifiedToken = async (tokenToUse: string) => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const cleanPhone = phone
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/\D/g, "");

      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otpVerificationToken: tokenToUse,
          customer: {
            fullName: fullName.trim(),
            phone: cleanPhone,
            province,
            city,
            address: address.trim(),
            postalCode: postalCode.trim(),
            notes: notes.trim(),
          },
          items: cartItems,
          subtotal: totalPrice,
          discountAmount,
          shippingCost,
          finalAmount: grandTotal,
          couponCode: appliedCoupon?.code || null,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "خطا در ثبت سفارش");
      }

      const orderId = orderData.order?.id || orderData.order?.order_number;
      const trackingCode = orderData.order?.tracking_code || orderId;

      soundEngine.playSuccess();
      router.push(
        "/checkout/payment?orderId=" +
          encodeURIComponent(String(orderId)) +
          "&amount=" +
          encodeURIComponent(String(grandTotal)) +
          "&phone=" +
          encodeURIComponent(cleanPhone) +
          "&trackingCode=" +
          encodeURIComponent(String(trackingCode))
      );
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ثبت نهایی سفارش.");
      setSubmitting(false);
    }
  };

  const handlePrimaryCheckoutClick = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMsg(null);

    const cleanPhone = phone
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/\D/g, "");

    if (!fullName.trim() || cleanPhone.length !== 11 || !address.trim()) {
      setErrorMsg("لطفاً نام گیرنده، شماره موبایل ۱۱ رقمی و نشانی دقیق پستی را وارد نمایید.");
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg("سبد خرید شما خالی است.");
      return;
    }

    if (verifiedToken) {
      await finalizeOrderWithVerifiedToken(verifiedToken);
      return;
    }

    setSubmitting(true);
    try {
      const otpRes = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, action: "send" }),
      });
      const otpJson = await otpRes.json();

      if (otpRes.ok && otpJson.success) {
        setOtpModalOpen(true);
        setSubmitting(false);
      } else {
        setErrorMsg(otpJson.message || "خطا در ارسال پیامک تایید.");
        setSubmitting(false);
      }
    } catch {
      setErrorMsg("خطا در ارتباط با سرویس پیامک.");
      setSubmitting(false);
    }
  };

  const handleVerifyOtpAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const cleanPhone = phone
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/\D/g, "");

      const vRes = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          code: otpCode.trim(),
          action: "verify",
        }),
      });
      const vJson = await vRes.json();

      if (vRes.ok && vJson.verified && vJson.otpVerificationToken) {
        setVerifiedToken(vJson.otpVerificationToken);
        setOtpModalOpen(false);
        await finalizeOrderWithVerifiedToken(vJson.otpVerificationToken);
      } else {
        setErrorMsg(vJson.message || "کد تایید وارد شده صحیح نیست.");
        setSubmitting(false);
      }
    } catch {
      setErrorMsg("خطا در اعتبارسنجی کد تایید.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 font-sans select-text text-[var(--text-primary)] space-y-6"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🛡️</span> تکمیل مشخصات گیرنده و پرداخت امن
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            مجهز به حافظه هوشمند فرم (اطلاعات شما با رفرش شدن صفحه یا قطع اینترنت پاک نمی‌شود)
          </p>
        </div>

        <Link
          href="/products"
          className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition"
        >
          ← بازگشت به فروشگاه
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handlePrimaryCheckoutClick} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            ۱. مشخصات خریدار و نشانی دقیق تحویل مرسوله
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                نام و نام خانوادگی گیرنده *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: پوریا رحیمی"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                شماره تلفن همراه (جهت دریافت کد پیگیری) *
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                maxLength={11}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setVerifiedToken("");
                }}
                placeholder="09123456789"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                انتخاب استان *
              </label>
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer focus:border-[var(--accent-blue)]"
              >
                {Object.keys(IRAN_PROVINCES_CITIES).map((prov) => (
                  <option key={prov} value={prov}>
                    📍 استان {prov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                انتخاب شهر *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer focus:border-[var(--accent-blue)]"
              >
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    🏙️ {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                نشانی کامل پستی (خیابان، کوچه، پلاک، واحد) *
              </label>
              <textarea
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="نشانی دقیق جهت ارسال مرسوله پیشتاز..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] leading-relaxed"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                کد پستی ۱۰ رقمی
              </label>
              <input
                type="text"
                dir="ltr"
                maxLength={10}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="7138141536"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                توضیحات سفارش (اختیاری)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ساعت تحویل یا نکته خاص..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs h-fit">
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            ۲. صورتحساب و تایید نهایی پرداخت
          </h2>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <div className="font-black truncate">{item.title}</div>
                  <div className="text-[10px] text-slate-400">تعداد: {item.quantity} عدد</div>
                </div>
                <span className="font-mono font-bold text-emerald-500 shrink-0">
                  {formatPrice((item.discountPrice ?? item.price) * item.quantity)} تومان
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
            <label className="block font-bold text-[var(--text-secondary)]">کد تخفیف دارید؟</label>
            <div className="flex gap-2">
              <input
                type="text"
                dir="ltr"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="VIP20"
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono uppercase outline-none"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="px-4 py-3 rounded-2xl bg-rose-500/15 text-rose-500 font-bold cursor-pointer"
                >
                  حذف کد
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black cursor-pointer"
                >
                  اعمال کد
                </button>
              )}
            </div>
            {couponMsg && (
              <p
                className={
                  "text-[11px] font-bold " +
                  (couponMsg.type === "ok" ? "text-emerald-500" : "text-rose-500")
                }
              >
                {couponMsg.text}
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">مجموع اقلام:</span>
              <span className="font-mono font-bold">{formatPrice(totalPrice)} تومان</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>کسر کد تخفیف:</span>
                <span className="font-mono font-bold">-{formatPrice(discountAmount)} تومان</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">هزینه ارسال پستی:</span>
              <span className="font-mono font-bold">
                {shippingCost === 0 ? "رایگان ✓" : formatPrice(shippingCost) + " تومان"}
              </span>
            </div>
            <div className="pt-2.5 border-t border-[var(--card-border)] flex justify-between items-center text-sm">
              <span className="font-black">مبلغ قابل پرداخت:</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">
                {formatPrice(grandTotal)} تومان
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-xl cursor-pointer transition disabled:opacity-50"
          >
            {submitting
              ? "در حال پردازش..."
              : verifiedToken
              ? "💳 ثبت سفارش و ورود به درگاه زرین‌پال ←"
              : "🔒 تایید شماره همراه و پرداخت آنلاین ←"}
          </button>
        </div>
      </form>

      {otpModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={() => setOtpModalOpen(false)}
        >
          <form
            onSubmit={handleVerifyOtpAndPay}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-5 text-center text-xs"
          >
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-[var(--accent-blue)]">
                📲 تایید شماره موبایل جهت ورود به درگاه پرداخت
              </h3>
              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[var(--text-secondary)] leading-relaxed">
              کد تایید پیامکی به شماره <strong className="font-mono">{phone}</strong> ارسال گردید. پس از وارد کردن کد، به درگاه زرین‌پال منتقل می‌شوید:
            </p>

            <input
              type="text"
              inputMode="numeric"
              required
              dir="ltr"
              maxLength={8}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="کد تایید را وارد کنید"
              className="w-full p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-lg text-center outline-none focus:border-[var(--accent-blue)]"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xl cursor-pointer disabled:opacity-50"
            >
              {submitting ? "در حال انتقال به درگاه..." : "✓ تایید کد و ورود به درگاه پرداخت"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

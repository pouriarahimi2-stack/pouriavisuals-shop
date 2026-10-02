// File Path: components/CheckoutModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { couponService, Coupon } from "@/services/couponService";
import { soundEngine } from "@/lib/soundEngine";

const MODAL_DRAFT_KEY = "axon_checkout_modal_draft_v2026";

const IRAN_PROVINCES_MAP: Record<string, string[]> = {
  "تهران": ["تهران", "شهریار", "اسلامشهر", "قدس", "ملارد", "پاکدشت", "ری", "ورامین", "پردیس", "دماوند"],
  "فارس": ["شیراز", "مرودشت", "جهرم", "فسا", "کازرون", "داراب", "لار", "آباده", "صدرا"],
  "اصفهان": ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "شاهین‌‌شهر", "شهرضا", "فولادشهر"],
  "خراسان رضوی": ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "کاشمر", "قوچان"],
  "آذربایجان شرقی": ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب"],
  "مازندران": ["ساری", "بابل", "آمل", "قائم‌شهر", "بهشهر", "چالوس", "بابلسر", "تنکابن", "رامسر"],
  "البرز": ["کرج", "فردیس", "کمال‌شهر", "نظرآباد", "محمدشهر", "ماهدشت", "هشتگرد"],
  "خوزستان": ["اهواز", "دزفول", "آبادان", "بندر ماهشهر", "خرمشهر", "اندیمشک", "بهبهان"],
  "گیلان": ["رشت", "بندر انزلی", "لاهیجان", "لنگرود", "تالش", "آستارا", "رودسر"],
  "کرمان": ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم", "زرند"],
  "آذربایجان غربی": ["ارومیه", "خوی", "بوکان", "مهاباد", "میاندوآب", "سلماس"],
  "هرمزگان": ["بندرعباس", "میناب", "قشم", "کیش", "بندر لنگه"],
  "مرکزی": ["اراک", "ساوه", "خمین", "محلات", "دلیجان"],
  "همدان": ["همدان", "ملایر", "نهاوند", "اسدآباد", "تویسرکان"],
  "یزد": ["یزد", "میبد", "اردکان", "بافق", "مهریز"],
  "کرمانشاه": ["کرمانشاه", "اسلام‌آباد غرب", "جوانرود", "کنگاور", "سرپل ذهاب"],
  "قزوین": ["قزوین", "الوند", "تاکستان", "بوئین‌زهرا", "آبیک"],
  "سیستان و بلوچستان": ["زاهدان", "زابل", "ایرانشهر", "چابهار", "سراوان"],
  "قم": ["قم", "قنوات", "جعفریه", "کهک"],
  "گلستان": ["گرگان", "گنبد کاووس", "بندر ترکمن", "علی‌آباد کتول"],
  "کردستان": ["سنندج", "سقز", "مریوان", "بانه", "قروه"],
  "لرستان": ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "الیگودرز"],
  "بوشهر": ["بوشهر", "برازجان", "بندر گناوه", "بندر کنگان", "عسلویه"],
  "زنجان": ["زنجان", "ابهر", "خرمدره", "قیدار"],
  "اردبیل": ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال"],
  "سمنان": ["سمنان", "شاهرود", "دامغان", "گرمسار"],
  "چهارمحال و بختیاری": ["شهرکرد", "بروجن", "فرخ‌شهر", "فارسان"],
  "ایلام": ["ایلام", "دهلران", "ایوان", "آبدانان"],
  "کهگیلویه و بویراحمد": ["یاسوج", "دوگنبدان", "دهدشت"],
  "خراسان شمالی": ["بجنورد", "شیروان", "اسفراین"],
  "خراسان جنوبی": ["بیرجند", "قائن", "فردوس", "طبس"],
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const { cartItems, totalPrice } = useCart() as any;

  const items = cartItems || [];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("تهران");
  const [city, setCity] = useState("تهران");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // بازیابی از حافظه ضد رفرش
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(MODAL_DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.firstName) setFirstName(d.firstName);
        if (d.lastName) setLastName(d.lastName);
        if (d.phone) setPhone(d.phone);
        if (d.province && IRAN_PROVINCES_MAP[d.province]) {
          setProvince(d.province);
          if (d.city) setCity(d.city);
        }
        if (d.postalCode) setPostalCode(d.postalCode);
        if (d.address) setAddress(d.address);
        if (d.notes) setNotes(d.notes);
      }
      const userRaw = localStorage.getItem("axon_user_session");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u && u.phone) {
          const clean = String(u.phone).replace(/\D/g, "");
          setPhone((prev) => prev || clean);
          setVerifiedPhone(clean);
          setIsPhoneVerified(true);
        }
      }
    } catch {}
  }, []);

  // ذخیره آنی در حافظه ضد رفرش
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        MODAL_DRAFT_KEY,
        JSON.stringify({ firstName, lastName, phone, province, city, postalCode, address, notes })
      );
    } catch {}
  }, [firstName, lastName, phone, province, city, postalCode, address, notes]);

  if (!isOpen) return null;

  const provincesList = Object.keys(IRAN_PROVINCES_MAP);
  const citiesList = IRAN_PROVINCES_MAP[province] || ["تهران"];

  const basePrice =
    typeof totalPrice === "number"
      ? totalPrice
      : items.reduce(
          (sum: number, item: any) =>
            sum + Number(item.price || 0) * Number(item.quantity || 1),
          0
        );

  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage({ type: "error", text: "لطفاً کد تخفیف را وارد کنید." });
      return;
    }

    soundEngine.playClick();
    setCouponLoading(true);
    setCouponMessage(null);

    try {
      const res = await couponService.validateCoupon(couponCode, basePrice);
      if (res.valid && res.coupon) {
        soundEngine.playSuccess();
        setDiscountAmount(res.discount);
        setAppliedCoupon(res.coupon);
        setCouponMessage({ type: "success", text: res.message });
      } else {
        setCouponMessage({ type: "error", text: res.message });
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch {
      setCouponMessage({ type: "error", text: "خطا در بررسی کد تخفیف." });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    soundEngine.playClick();
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
    setCouponMessage(null);
  };

  const finalizeModalOrder = async (cleanPhone: string, cleanPostal: string) => {
    setSubmitting(true);
    const fullName = (firstName.trim() + " " + lastName.trim()).trim() || "خریدار محترم";

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            fullName,
            phone: cleanPhone,
            province,
            city,
            address: address.trim(),
            postalCode: cleanPostal,
            notes: notes.trim(),
          },
          items,
          subtotal: basePrice,
          discountAmount,
          shippingCost: 0,
          finalAmount: finalPrice,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.order) {
        soundEngine.playSuccess();
        onClose();
        router.push(
          "/checkout/payment?orderId=" +
            encodeURIComponent(json.order.id) +
            "&trackingCode=" +
            encodeURIComponent(json.order.tracking_code || json.order.id) +
            "&amount=" +
            finalPrice +
            "&phone=" +
            encodeURIComponent(cleanPhone)
        );
      } else {
        setFormError(json.message || "خطا در ثبت اطلاعات سفارش.");
      }
    } catch {
      setFormError("خطا در ثبت اطلاعات سفارش در سیستم.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setFormError("");

    const cleanPhone = phone
      .trim()
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/\D/g, "");
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      setFormError("شماره همراه باید ۱۱ رقم و با ۰۹ شروع شود.");
      return;
    }

    const cleanPostal = postalCode.trim().replace(/\D/g, "");
    if (cleanPostal && cleanPostal.length !== 10) {
      setFormError("کد پستی ۱۰ رقمی ایران باید دقیقاً ۱۰ رقم عددی باشد.");
      return;
    }

    if (!address.trim() || address.trim().length < 8) {
      setFormError("لطفاً نشانی پستی دقیق خود را وارد نمایید.");
      return;
    }

    if (isPhoneVerified && verifiedPhone === cleanPhone) {
      await finalizeModalOrder(cleanPhone, cleanPostal);
      return;
    }

    if (!otpStep) {
      setSubmitting(true);
      try {
        const otpRes = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone, action: "send" }),
        });
        const otpJson = await otpRes.json();
        if (otpRes.ok && otpJson.success !== false) {
          setOtpStep(true);
        } else {
          setFormError(otpJson.message || "خطا در ارسال کد تایید پیامکی.");
        }
      } catch {
        setFormError("خطا در ارتباط با سامانه پیامک.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // تایید کد OTP و انتقال به درگاه پرداخت
    setSubmitting(true);
    try {
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
      if (vRes.ok && (vJson.verified || vJson.success)) {
        setIsPhoneVerified(true);
        setVerifiedPhone(cleanPhone);
        await finalizeModalOrder(cleanPhone, cleanPostal);
      } else {
        setFormError(vJson.message || "کد تایید وارد شده نادرست است.");
        setSubmitting(false);
      }
    } catch {
      setFormError("خطا در بررسی کد تایید.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-5 sm:p-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-5 border-b border-[var(--card-border)] pb-4 text-right">
          <span className="text-xl">🛡️</span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
              تکمیل مشخصات تحویل و انتقال به درگاه پرداخت
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">
              دارای حافظه هوشمند فرم (اطلاعات با رفرش شدن پاک نمی‌شود)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] mb-5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)] font-bold">
              اقلام سفارش ({items.length} قلم):
            </span>
            <span className="font-mono font-bold">
              {Number(basePrice).toLocaleString("fa-IR")} تومان
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold border-t border-[var(--card-border)] pt-2">
              <span>تخفیف اعمال شده:</span>
              <span className="font-mono">
                - {Number(discountAmount).toLocaleString("fa-IR")} تومان
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-black text-[var(--accent-blue)] border-t border-[var(--card-border)] pt-2">
            <span>مبلغ نهایی قابل پرداخت:</span>
            <span className="font-mono text-base">
              {Number(finalPrice).toLocaleString("fa-IR")} تومان
            </span>
          </div>
        </div>

        <div className="mb-5 p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--modal-bg)] space-y-2 text-xs">
          <label className="block font-bold text-[var(--text-secondary)] text-right">
            کد تخفیف دارید؟
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="کد تخفیف..."
              value={couponCode}
              disabled={!!appliedCoupon}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] transition disabled:opacity-60 text-right uppercase"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="px-4 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold hover:bg-rose-500/25 transition cursor-pointer"
              >
                حذف
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {couponLoading ? "بررسی..." : "اعمال تخفیف"}
              </button>
            )}
          </div>

          {couponMessage && (
            <div
              className={
                "p-2.5 rounded-xl text-[11px] font-bold text-right " +
                (couponMessage.type === "success"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30")
              }
            >
              {couponMessage.text}
            </div>
          )}
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-right">
            ⚠️ {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-right">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام گیرنده *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: پوریا"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)] transition text-right"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام خانوادگی *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: رحیمی"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)] transition text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">انتخاب استان *</label>
              <select
                value={province}
                onChange={(e) => {
                  const nextP = e.target.value;
                  setProvince(nextP);
                  setCity((IRAN_PROVINCES_MAP[nextP] || [])[0] || "");
                }}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold cursor-pointer"
              >
                {provincesList.map((prov) => (
                  <option key={prov} value={prov}>
                    📍 استان {prov}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">انتخاب شهر *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold cursor-pointer"
              >
                {citiesList.map((c) => (
                  <option key={c} value={c}>
                    🏙️ {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                شماره تلفن همراه (۱۱ رقم) *
              </label>
              <input
                type="tel"
                required
                maxLength={11}
                placeholder="09123456789"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setOtpStep(false);
                }}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold focus:border-[var(--accent-blue)] transition text-center"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                کد پستی ۱۰ رقمی ایران (اختیاری)
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="کد ۱۰ رقمی بدون خط تیره"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold focus:border-[var(--accent-blue)] transition text-center"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">
              نشانی دقیق پستی تحویل *
            </label>
            <textarea
              rows={2}
              required
              placeholder="خیابان، کوچه، پلاک، واحد..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium leading-relaxed focus:border-[var(--accent-blue)] transition text-right"
            />
          </div>

          {otpStep && (
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-2 animate-fadeIn">
              <label className="block font-black text-sky-400">
                📲 کد تایید پیامک‌شده به شماره {phone} را وارد کنید:
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                dir="ltr"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="کد تایید پیامکی"
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-sky-500 font-mono font-black text-lg text-center tracking-widest outline-none"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs transition cursor-pointer shadow-xl shadow-blue-500/25 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting
                ? "در حال پردازش..."
                : otpStep
                ? "✓ تایید کد پیامکی و ورود به درگاه پرداخت 💳"
                : "تایید نهایی و پرداخت آنلاین 💳"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

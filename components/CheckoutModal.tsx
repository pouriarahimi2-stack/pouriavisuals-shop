// File Path: components/CheckoutModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { couponService, Coupon } from "@/services/couponService";
import { soundEngine } from "@/lib/soundEngine";

const MODAL_DRAFT_KEY = "axon_checkout_draft_v2026";

const IRAN_PROVINCES_CITIES: Record<string, string[]> = {
  "تهران": ["تهران", "شهریار", "اسلامشهر", "قدس", "ملارد", "پاکدشت", "ری", "ورامین", "پردیس", "دماوند"],
  "فارس": ["شیراز", "مرودشت", "جهرم", "فسا", "کازرون", "داراب", "لار", "آباده", "صدرا"],
  "اصفهان": ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "شاهین‌‌شهر", "شهرضا", "فولادشهر"],
  "خراسان رضوی": ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "کاشمر", "قوچان"],
  "آذربایجان شرقی": ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "سهند"],
  "مازندران": ["ساری", "بابل", "آمل", "قائم‌شهر", "بهشهر", "چالوس", "بابلسر", "رامسر"],
  "البرز": ["کرج", "فردیس", "کمال‌شهر", "نظرآباد", "محمدشهر", "مهرشهر"],
  "خوزستان": ["اهواز", "دزفول", "آبادان", "بندر ماهشهر", "خرمشهر", "اندیمشک"],
  "گیلان": ["رشت", "بندر انزلی", "لاهیجان", "لنگرود", "تالش", "آستارا"],
  "کرمان": ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم", "زرند"],
  "آذربایجان غربی": ["ارومیه", "خوی", "بوکان", "مهاباد", "میاندوآب", "سلماس"],
  "هرمزگان": ["بندرعباس", "میناب", "قشم", "کیش", "بندر لنگه"],
  "مرکزی": ["اراک", "ساوه", "خمین", "محلات", "دلیجان"],
  "همدان": ["همدان", "ملایر", "نهاوند", "اسدآباد", "تویسرکان"],
  "یزد": ["یزد", "میبد", "اردکان", "بافق", "مهریز"],
  "کرمانشاه": ["کرمانشاه", "اسلام‌آباد غرب", "جوانرود", "کنگاور"],
  "قزوین": ["قزوین", "الوند", "تاکستان", "آبیک"],
  "سیستان و بلوچستان": ["زاهدان", "زابل", "ایرانشهر", "چابهار"],
  "قم": ["قم", "قنوات", "جعفریه"],
  "گلستان": ["گرگان", "گنبد کاووس", "بندر ترکمن", "علی‌آباد کتول"],
  "کردستان": ["سنندج", "سقز", "مریوان", "بانه", "قروه"],
  "لرستان": ["خرم‌آباد", "بروجرد", "دورود", "الیگودرز"],
  "بوشهر": ["بوشهر", "برازجان", "بندر گناوه", "عسلویه"],
  "زنجان": ["زنجان", "ابهر", "خرمدره", "قیدار"],
  "اردبیل": ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال"],
  "سمنان": ["سمنان", "شاهرود", "دامغان", "گرمسار"],
  "چهارمحال و بختیاری": ["شهرکرد", "بروجن", "فرخ‌شهر", "لردگان"],
  "ایلام": ["ایلام", "دهلران", "ایوان"],
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
  const { cartItems, totalPrice, clearCart } = useCart() as any;

  const items = cartItems || [];

  const [fullName, setFullName] = useState("");
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

  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const provincesList = Object.keys(IRAN_PROVINCES_CITIES);
  const citiesList = IRAN_PROVINCES_CITIES[province] || ["تهران"];

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawDraft = localStorage.getItem(MODAL_DRAFT_KEY);
      if (rawDraft) {
        const d = JSON.parse(rawDraft);
        if (d.fullName) setFullName(d.fullName);
        if (d.phone) setPhone(d.phone);
        if (d.province && IRAN_PROVINCES_CITIES[d.province]) {
          setProvince(d.province);
          if (d.city) setCity(d.city);
        }
        if (d.address) setAddress(d.address);
        if (d.postalCode) setPostalCode(d.postalCode);
        if (d.notes) setNotes(d.notes);
      }
      const rawUser = localStorage.getItem("axon_user_session");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u && u.phone) {
          const clean = String(u.phone).replace(/\D/g, "");
          setPhone((prev) => prev || clean);
          setVerifiedPhone(clean);
          setIsPhoneVerified(true);
        }
      }
    } catch {}
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined" || !isOpen) return;
    try {
      localStorage.setItem(
        MODAL_DRAFT_KEY,
        JSON.stringify({ fullName, phone, province, city, address, postalCode, notes })
      );
    } catch {}
  }, [fullName, phone, province, city, address, postalCode, notes, isOpen]);

  if (!isOpen) return null;

  const basePrice =
    typeof totalPrice === "number"
      ? totalPrice
      : items.reduce(
          (sum: number, item: any) =>
            sum + Number(item.discount_price || item.price || 0) * Number(item.quantity || 1),
          0
        );

  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
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

  const finalizeOrderToGateway = async (cleanPhone: string) => {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            fullName: fullName.trim() || "خریدار محترم",
            phone: cleanPhone,
            province,
            city,
            address: address.trim(),
            postalCode: postalCode.trim(),
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
        const userSession = {
          phone: cleanPhone,
          name: fullName.trim(),
          full_name: fullName.trim(),
          token: "VERIFIED-BUYER-" + Date.now(),
        };
        localStorage.setItem("axon_user_session", JSON.stringify(userSession));
        window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: userSession }));

        if (typeof clearCart === "function") clearCart();
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
        setFormError(json.message || "خطا در ثبت سفارش.");
      }
    } catch {
      setFormError("خطا در ارتباط با سرور ثبت سفارش.");
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

    if (!address.trim() || address.trim().length < 8) {
      setFormError("لطفاً نشانی پستی دقیق خود را وارد نمایید.");
      return;
    }

    if (isPhoneVerified && verifiedPhone === cleanPhone) {
      await finalizeOrderToGateway(cleanPhone);
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
      if (otpRes.ok && (otpJson.success || otpJson.sent !== false)) {
        setOtpStep(true);
        setOtpCode("");
      } else {
        setFormError(otpJson.message || "خطا در ارسال کد تایید پیامکی.");
      }
    } catch {
      setFormError("خطا در ارتباط با سرویس پیامک.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!otpCode.trim()) return;
    soundEngine.playClick();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: otpCode.trim(), action: "verify" }),
      });
      const json = await res.json();
      if (res.ok && (json.verified || json.success)) {
        setIsPhoneVerified(true);
        setVerifiedPhone(cleanPhone);
        setOtpStep(false);
        await finalizeOrderToGateway(cleanPhone);
      } else {
        setFormError(json.message || "کد تایید وارد شده نادرست است.");
        setSubmitting(false);
      }
    } catch {
      setFormError("خطا در اعتبارسنجی کد.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn font-sans select-none text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-5 sm:p-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-5 border-b border-[var(--card-border)] pb-4 text-right">
          <span className="text-xl">🛡️</span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
              تکمیل مشخصات گیرنده و انتقال به درگاه پرداخت
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">
              مجهز به حافظه فرم ضد رفرش و انتخابگر استاندارد استان و شهر
            </p>
          </div>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold text-right">
            ⚠️ {formError}
          </div>
        )}

        {otpStep ? (
          <form onSubmit={handleVerifyOtpModal} className="space-y-4 text-xs py-4">
            <p className="text-[var(--text-secondary)] leading-relaxed">
              کد تایید پیامکی به شماره <strong className="font-mono text-[var(--text-primary)]">{phone}</strong> ارسال شد. جهت ورود خودکار به حساب و انتقال به درگاه پرداخت، کد را وارد کنید:
            </p>
            <input
              type="text"
              inputMode="numeric"
              required
              dir="ltr"
              maxLength={8}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="کد تایید پیامکی"
              className="w-full p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-xl text-center tracking-widest outline-none focus:border-[var(--accent-blue)]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOtpStep(false)}
                className="px-4 py-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
              >
                ویرایش شماره
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer disabled:opacity-50"
              >
                {submitting ? "در حال انتقال به درگاه..." : "✓ تایید کد و پرداخت آنلاین"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-right">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  نام و نام خانوادگی گیرنده *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: پوریا رحیمی"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  شماره تلفن همراه (۱۱ رقم) *
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  maxLength={11}
                  placeholder="09123456789"
                  value={phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setPhone(v);
                    if (v !== verifiedPhone) setIsPhoneVerified(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">استان *</label>
                <select
                  value={province}
                  onChange={(e) => {
                    const nextP = e.target.value;
                    setProvince(nextP);
                    setCity((IRAN_PROVINCES_CITIES[nextP] || [])[0] || "");
                  }}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                >
                  {provincesList.map((p) => (
                    <option key={p} value={p}>
                      📍 استان {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">شهر *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                >
                  {citiesList.map((c) => (
                    <option key={c} value={c}>
                      🏙️ {c}
                    </option>
                  ))}
                </select>
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
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium leading-relaxed focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  کد پستی ۱۰ رقمی (اختیاری)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={10}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">کد تخفیف:</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    dir="ltr"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="VIP20"
                    className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold uppercase outline-none"
                  />
                  <button
                    type="button"
                    disabled={couponLoading}
                    onClick={handleApplyCoupon}
                    className="px-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold cursor-pointer"
                  >
                    اعمال
                  </button>
                </div>
              </div>
            </div>

            {couponMessage && (
              <div
                className={
                  "p-2.5 rounded-xl text-[11px] font-bold " +
                  (couponMessage.type === "success" ? "text-emerald-500" : "text-rose-500")
                }
              >
                {couponMessage.text}
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex justify-between items-center text-sm font-black text-[var(--accent-blue)]">
              <span>مبلغ نهایی قابل پرداخت:</span>
              <span className="font-mono">{Number(finalPrice).toLocaleString("fa-IR")} تومان</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs transition cursor-pointer shadow-xl hover:opacity-90 disabled:opacity-50"
            >
              {submitting
                ? "در حال پردازش..."
                : isPhoneVerified && verifiedPhone === phone
                ? "تایید نهایی و انتقال به درگاه پرداخت 💳"
                : "تایید شماره همراه و پرداخت آنلاین 💳"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

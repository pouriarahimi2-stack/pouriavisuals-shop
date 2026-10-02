// File Path: app/checkout/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as CartContextModule from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

const CHECKOUT_DRAFT_KEY = "axon_checkout_draft_v2026";

const IRAN_PROVINCES_CITIES: Record<string, string[]> = {
  "تهران": ["تهران", "شهریار", "اسلامشهر", "قدس", "ملارد", "پاکدشت", "ری", "ورامین", "پردیس", "دماوند", "رباط‌کریم", "شمیرانات"],
  "فارس": ["شیراز", "مرودشت", "جهرم", "فسا", "کازرون", "داراب", "لار", "آباده", "نورآباد", "اقلید", "صدرا"],
  "اصفهان": ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "شاهین‌شهر", "شهرضا", "فولادشهر", "بهارستان", "مبارکه", "زرین‌شهر"],
  "خراسان رضوی": ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "کاشمر", "قوچان", "تربت جام", "تایباد", "چناران", "گلبهار"],
  "آذربایجان شرقی": ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "سراب", "آذرشهر", "سهند", "شبستر"],
  "مازندران": ["ساری", "بابل", "آمل", "قائم‌شهر", "بهشهر", "چالوس", "نکا", "بابلسر", "تنکابن", "رامسر", "نوشهر"],
  "البرز": ["کرج", "فردیس", "کمال‌شهر", "نظرآباد", "محمدشهر", "ماهدشت", "هشتگرد", "طالقان"],
  "خوزستان": ["اهواز", "دزفول", "آبادان", "بندر ماهشهر", "خرمشهر", "اندیمشک", "ایذه", "بهبهان", "شوشتر", "امیدیه"],
  "گیلان": ["رشت", "بندر انزلی", "لاهیجان", "لنگرود", "تالش", "آستارا", "صومعه‌سرا", "آستانه اشرفیه", "رودسر", "فومن"],
  "کرمان": ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم", "زرند", "کهنوج", "شهربابک", "بافت"],
  "آذربایجان غربی": ["ارومیه", "خوی", "بوکان", "مهاباد", "میاندوآب", "سلماس", "پیرانشهر", "نقده", "ماکو"],
  "هرمزگان": ["بندرعباس", "میناب", "قشم", "کیش", "بندر لنگه", "رودان", "حاجی‌آباد", "جاسک"],
  "مرکزی": ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "شازند", "تفرش"],
  "همدان": ["همدان", "ملایر", "نهاوند", "اسدآباد", "تویسرکان", "بهار", "کبودرآهنگ"],
  "یزد": ["یزد", "میبد", "اردکان", "بافق", "مهریز", "ابرکوه", "طبس"],
  "کرمانشاه": ["کرمانشاه", "اسلام‌آباد غرب", "جوانرود", "کنگاور", "سرپل ذهاب", "سنقر", "هرسین"],
  "قزوین": ["قزوین", "الوند", "تاکستان", "بوئین‌زهرا", "آبیک", "محمدیه"],
  "سیستان و بلوچستان": ["زاهدان", "زابل", "ایرانشهر", "چابهار", "سراوان", "خاش", "کنارک"],
  "قم": ["قم", "قنوات", "جعفریه", "کهک", "دستجرد"],
  "گلستان": ["گرگان", "گنبد کاووس", "بندر ترکمن", "علی‌آباد کتول", "آق‌قلا", "کردکوی", "کلاله"],
  "کردستان": ["سنندج", "سقز", "مریوان", "بانه", "قروه", "کامیاران", "بیجار"],
  "لرستان": ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "الیگودرز", "نورآباد", "ازنا"],
  "بوشهر": ["بوشهر", "برازجان", "بندر گناوه", "بندر کنگان", "عسلویه", "خورموج", "جم"],
  "زنجان": ["زنجان", "ابهر", "خرمدره", "قیدار", "ماه‌نشان"],
  "اردبیل": ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال", "گرمی"],
  "سمنان": ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر"],
  "چهارمحال و بختیاری": ["شهرکرد", "بروجن", "فرخ‌شهر", "فارسان", "لردگان"],
  "ایلام": ["ایلام", "دهلران", "ایوان", "آبدانان", "دره‌شهر"],
  "کهگیلویه و بویراحمد": ["یاسوج", "دوگنبدان", "دهدشت", "سی‌سخت"],
  "خراسان شمالی": ["بجنورد", "شیروان", "اسفراین", "آشخانه"],
  "خراسان جنوبی": ["بیرجند", "قائن", "فردوس", "نهبندان", "طبس"],
};

export default function CheckoutPage() {
  const router = useRouter();
  const useCartHook = (CartContextModule as any).useCart;
  const cartCtx = typeof useCartHook === "function" ? useCartHook() : null;

  const [fallbackItems, setFallbackItems] = useState<any[]>([]);
  const cartItems: any[] =
    (cartCtx && (cartCtx.items || cartCtx.cartItems || cartCtx.cart)) || fallbackItems;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("تهران");
  const [city, setCity] = useState("تهران");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // وضعیت تایید پیامکی یکپارچه با دکمه پرداخت
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhoneValue, setVerifiedPhoneValue] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const provincesList = Object.keys(IRAN_PROVINCES_CITIES);
  const citiesList = IRAN_PROVINCES_CITIES[province] || ["مرکز استان"];

  // ۱. بازیابی اطلاعات فرم و وضعیت لاگین از حافظه ضد رفرش
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedCart = localStorage.getItem("axon_cart") || localStorage.getItem("cart");
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) setFallbackItems(parsedCart);
      }
    } catch {}

    try {
      const rawDraft = localStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft.fullName) setFullName(draft.fullName);
        if (draft.phone) setPhone(draft.phone);
        if (draft.province && IRAN_PROVINCES_CITIES[draft.province]) {
          setProvince(draft.province);
          if (draft.city) setCity(draft.city);
        }
        if (draft.address) setAddress(draft.address);
        if (draft.postalCode) setPostalCode(draft.postalCode);
        if (draft.notes) setNotes(draft.notes);
        if (draft.couponCode) setCouponCode(draft.couponCode);
        if (draft.discountAmount) setDiscountAmount(Number(draft.discountAmount) || 0);
      }
    } catch {}

    try {
      const rawUser = localStorage.getItem("axon_user_session");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user && user.phone) {
          const clean = String(user.phone).replace(/\D/g, "");
          setPhone((prev) => prev || clean);
          setVerifiedPhoneValue(clean);
          setIsPhoneVerified(true);
          if (user.name || user.full_name) {
            setFullName((prev) => prev || user.name || user.full_name);
          }
        }
      }
    } catch {}
  }, []);

  // ۲. ذخیره لحظه‌ای تمام فیلدها در حافظه مرورگر (ضد رفرش و ضد قطعی اینترنت)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload = {
        fullName,
        phone,
        province,
        city,
        address,
        postalCode,
        notes,
        couponCode,
        discountAmount,
      };
      localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(payload));
    } catch {}
  }, [fullName, phone, province, city, address, postalCode, notes, couponCode, discountAmount]);

  const handleProvinceChange = (newProv: string) => {
    soundEngine.playClick();
    setProvince(newProv);
    const availableCities = IRAN_PROVINCES_CITIES[newProv] || [];
    setCity(availableCities[0] || "");
  };

  const rawSubtotal = cartItems.reduce(
    (sum: number, item: any) =>
      sum + Number(item.discount_price || item.discountPrice || item.price || 0) * Number(item.quantity || 1),
    0
  );
  const shippingCost = rawSubtotal > 5000000 || rawSubtotal === 0 ? 0 : 65000;
  const finalPayable = Math.max(0, rawSubtotal - discountAmount + shippingCost);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    soundEngine.playClick();
    setValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), cartTotal: rawSubtotal }),
      });
      const json = await res.json();
      if (res.ok && json.valid && json.coupon) {
        soundEngine.playSuccess();
        setDiscountAmount(Number(json.coupon.discount_amount || 0));
        setCouponMessage({ type: "success", text: json.message || "کد تخفیف اعمال شد." });
      } else {
        setDiscountAmount(0);
        setCouponMessage({ type: "error", text: json.message || "کد تخفیف معتبر نیست." });
      }
    } catch {
      setCouponMessage({ type: "error", text: "خطا در بررسی کد تخفیف." });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const finalizeOrderAndRedirectToGateway = async (cleanPhone: string) => {
    setSubmittingOrder(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          subtotal: rawSubtotal,
          discountAmount,
          shippingCost,
          finalAmount: finalPayable,
          couponCode: couponCode.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.order) {
        soundEngine.playSuccess();
        // لاگین خودکار مشتری در حساب کاربری
        const userSession = {
          phone: cleanPhone,
          name: fullName.trim(),
          full_name: fullName.trim(),
          token: "VERIFIED-BUYER-" + Date.now(),
        };
        localStorage.setItem("axon_user_session", JSON.stringify(userSession));
        window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: userSession }));

        // هدایت به درگاه پرداخت
        const orderId = encodeURIComponent(json.order.id);
        const trackingCode = encodeURIComponent(json.order.tracking_code || json.order.id);
        router.push(
          "/checkout/payment?orderId=" +
            orderId +
            "&trackingCode=" +
            trackingCode +
            "&amount=" +
            finalPayable +
            "&phone=" +
            encodeURIComponent(cleanPhone)
        );
      } else {
        setErrorMsg(json.message || "خطا در ثبت سفارش. لطفاً مجدداً تلاش کنید.");
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با سرور ثبت سفارش.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // ۳. دکمه یکپارچه «تایید نهایی و پرداخت» (اول تایید شماره موبایل، سپس انتقال به درگاه)
  const handleUnifiedSubmitAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMsg(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMsg("لطفاً نام و نام خانوادگی گیرنده را به صورت کامل وارد کنید.");
      return;
    }
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      setErrorMsg("شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود.");
      return;
    }
    if (!province || !city) {
      setErrorMsg("لطفاً استان و شهر مقصد را از لیست انتخاب کنید.");
      return;
    }
    if (!address.trim() || address.trim().length < 8) {
      setErrorMsg("لطفاً نشانی دقیق پستی را وارد فرمایید.");
      return;
    }

    // اگر شماره قبلاً تایید شده است، مستقیماً سفارش ثبت و به درگاه هدایت شود
    if (isPhoneVerified && verifiedPhoneValue === cleanPhone) {
      await finalizeOrderAndRedirectToGateway(cleanPhone);
      return;
    }

    // ارسال کد تایید پیامکی و باز کردن مودال تایید شماره قبل از درگاه پرداخت
    setSendingOtp(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, action: "send" }),
      });
      const json = await res.json();
      if (res.ok && (json.success || json.sent !== false)) {
        setOtpInput("");
        setShowOtpModal(true);
      } else {
        setErrorMsg(json.message || json.error || "خطا در ارسال کد تایید پیامکی.");
      }
    } catch {
      setErrorMsg("خطا در ارتباط با سامانه پیامکی.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!otpInput.trim() || otpInput.trim().length < 4) return;

    soundEngine.playClick();
    setSubmittingOrder(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          code: otpInput.trim(),
          action: "verify",
        }),
      });
      const json = await res.json();
      if (res.ok && (json.verified === true || json.success === true)) {
        setIsPhoneVerified(true);
        setVerifiedPhoneValue(cleanPhone);
        setShowOtpModal(false);
        await finalizeOrderAndRedirectToGateway(cleanPhone);
      } else {
        setErrorMsg(json.message || json.error || "کد تایید وارد شده اشتباه یا منقضی شده است.");
        setSubmittingOrder(false);
      }
    } catch {
      setErrorMsg("خطا در اعتبارسنجی کد پیامکی.");
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
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
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleUnifiedSubmitAndPay} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* ستون راست: فرم مشخصات و آدرس با انتخابگر استاندارد استان و شهر */}
        <div className="lg:col-span-7 p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 h-fit">
          <h2 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            ۱. مشخصات خریدار و نشانی دقیق تحویل مرسوله
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                نام و نام خانوادگی گیرنده *
              </label>
              <input
                type="text"
                name="checkout_full_name"
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
              <div className="relative">
                <input
                  type="tel"
                  name="checkout_phone"
                  required
                  dir="ltr"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPhone(val);
                    if (val !== verifiedPhoneValue) setIsPhoneVerified(false);
                  }}
                  placeholder="09123456789"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
                />
                {isPhoneVerified && verifiedPhoneValue === phone && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-500 text-[10px] font-black">
                    تایید شده ✓
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                انتخاب استان *
              </label>
              <select
                name="checkout_province"
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer focus:border-[var(--accent-blue)]"
              >
                {provincesList.map((prov) => (
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
                name="checkout_city"
                value={city}
                onChange={(e) => {
                  soundEngine.playClick();
                  setCity(e.target.value);
                }}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer focus:border-[var(--accent-blue)]"
              >
                {citiesList.map((c) => (
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
                name="checkout_address"
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="نشانی دقیق جهت ارسال با پست پیشتاز..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] leading-relaxed"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                کد پستی ۱۰ رقمی
              </label>
              <input
                type="text"
                name="checkout_postal_code"
                dir="ltr"
                maxLength={10}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                placeholder="1234567890"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                توضیحات سفارش (اختیاری)
              </label>
              <input
                type="text"
                name="checkout_notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ساعت تحویل یا نکته خاص..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>
        </div>

        {/* ستون چپ: خلاصه فاکتور، کد تخفیف و دکمه یکپارچه تایید شماره و پرداخت */}
        <div className="lg:col-span-5 p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 h-fit">
          <h2 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            ۲. صورت‌حساب و تایید نهایی پرداخت
          </h2>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] text-center text-slate-400 font-bold">
                سبد خرید شما خالی است یا در حال بارگذاری می‌باشد.
              </div>
            ) : (
              cartItems.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2"
                >
                  <div className="overflow-hidden">
                    <h4 className="font-bold truncate">{item.title || item.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      تعداد: {item.quantity || 1} عدد
                    </span>
                  </div>
                  <span className="font-mono font-black text-emerald-500 shrink-0">
                    {(
                      Number(item.discount_price || item.discountPrice || item.price || 0) *
                      Number(item.quantity || 1)
                    ).toLocaleString("fa-IR")}{" "}
                    تومان
                  </span>
                </div>
              ))
            )}
          </div>

          {/* کد تخفیف */}
          <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
            <label className="block font-bold text-[var(--text-secondary)]">کد تخفیف دارید؟</label>
            <div className="flex gap-2">
              <input
                type="text"
                dir="ltr"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="VIP20"
                className="flex-1 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold uppercase outline-none focus:border-[var(--accent-blue)]"
              />
              <button
                type="button"
                disabled={validatingCoupon}
                onClick={handleApplyCoupon}
                className="px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black cursor-pointer"
              >
                {validatingCoupon ? "..." : "اعمال کد"}
              </button>
            </div>
            {couponMessage && (
              <p
                className={
                  "text-[11px] font-bold " +
                  (couponMessage.type === "success" ? "text-emerald-500" : "text-rose-500")
                }
              >
                {couponMessage.text}
              </p>
            )}
          </div>

          {/* جمع کل */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">مجموع اقلام:</span>
              <span className="font-mono font-bold">{rawSubtotal.toLocaleString("fa-IR")} تومان</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-500 font-bold">
                <span>کسر کد تخفیف:</span>
                <span className="font-mono">-{discountAmount.toLocaleString("fa-IR")} تومان</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">هزینه ارسال پستی:</span>
              <span className="font-mono font-bold">
                {shippingCost === 0 ? "رایگان ✓" : shippingCost.toLocaleString("fa-IR") + " تومان"}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--card-border)] text-sm font-black">
              <span>مبلغ قابل پرداخت:</span>
              <span className="font-mono text-[var(--accent-blue)]">
                {finalPayable.toLocaleString("fa-IR")} تومان
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingOrder || sendingOtp}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>🔒</span>
            <span>
              {sendingOtp
                ? "در حال ارسال کد تایید پیامکی..."
                : submittingOrder
                ? "در حال ثبت سفارش و انتقال به درگاه..."
                : isPhoneVerified && verifiedPhoneValue === phone
                ? "تایید نهایی و انتقال به درگاه پرداخت ←"
                : "تایید شماره همراه و پرداخت آنلاین ←"}
            </span>
          </button>
        </div>
      </form>

      {/* مودال تایید پیامکی یکپارچه با دکمه پرداخت */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--accent-blue)]">
                📲 تایید شماره موبایل جهت ورود به درگاه پرداخت
              </h3>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[var(--text-secondary)] leading-relaxed">
              کد تایید پیامکی به شماره <strong className="font-mono text-[var(--text-primary)]">{phone}</strong> ارسال گردید. پس از وارد کردن کد، به صورت خودکار وارد حساب خود شده و به درگاه بانک منتقل می‌شوید:
            </p>

            <form onSubmit={handleVerifyOtpAndProceed} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                required
                dir="ltr"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="کد تایید را وارد کنید"
                className="w-full p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-xl text-center tracking-widest outline-none focus:border-[var(--accent-blue)]"
              />

              <button
                type="submit"
                disabled={submittingOrder}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg cursor-pointer disabled:opacity-50"
              >
                {submittingOrder ? "در حال تایید و انتقال به درگاه..." : "✓ تایید کد و ورود به درگاه پرداخت"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

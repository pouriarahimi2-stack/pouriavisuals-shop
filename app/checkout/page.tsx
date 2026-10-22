"use client";
import SecurityCaptchaBox from "@/components/SecurityCaptchaBox";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { IRAN_PROVINCES_CITIES } from "@/lib/iranProvinces";
import { formatPrice } from "@/lib/formatters";
import { supabase } from "@/lib/supabase";

const CHECKOUT_DRAFT_KEY = "axon_checkout_form_draft_v2027";

interface StoreFinancialRules {
  postShippingCost: number;
  tipaxShippingCost: number;
  freeShippingThreshold: number;
  vatPercent: number;
  allowGuestCheckout: boolean;
  autoSendOrderSms: boolean;
}

function parseExactNumber(val: any, fallback: number): number {
  if (val === undefined || val === null || val === "") return fallback;
  const converted = String(val).replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632)).replace(/,/g, "").trim();
  if (converted === "") return fallback;
  const num = Number(converted);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

function extractFinancialRulesFromPayload(raw: any): StoreFinancialRules | null {
  if (!raw || typeof raw !== "object") return null;

  const candidates = [
    raw.settings, raw.system_settings, raw.store_settings,
    raw.homepage_layout_config?.system_settings, raw.homepage_layout_config?.settings,
    raw.siteInfo?.homepage_layout_config?.system_settings, raw.siteInfo, raw.data, raw,
  ].filter((c) => c && typeof c === "object");

  let foundPost: number | undefined;
  let foundTipax: number | undefined;
  let foundVat: number | undefined;

  for (const obj of candidates) {
    if (foundPost === undefined && obj.postShippingCost !== undefined) foundPost = parseExactNumber(obj.postShippingCost, 120000);
    if (foundTipax === undefined && obj.tipaxShippingCost !== undefined) foundTipax = parseExactNumber(obj.tipaxShippingCost, 150000);
    if (foundVat === undefined && obj.vatPercent !== undefined) foundVat = parseExactNumber(obj.vatPercent, 10);
  }

  return {
    postShippingCost: foundPost !== undefined ? foundPost : 120000,
    tipaxShippingCost: foundTipax !== undefined ? foundTipax : 150000,
    freeShippingThreshold: 0,
    vatPercent: foundVat !== undefined ? foundVat : 10,
    allowGuestCheckout: true,
    autoSendOrderSms: true,
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, totalPrice, discountAmount, finalPayable, appliedCoupon, applyCoupon, removeCoupon } = useCart();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("فارس");
  const [city, setCity] = useState("شیراز");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"post" | "tipax" | null>(null);

  // ─────────────────────────────────────────────────────────────────
  // allowedShipping: بر اساس shipping_type آیتم‌های سبد خرید
  // اگر محصول "tipax" باشه → فقط تیپاکس / اگر "post" باشه → فقط پست
  // ─────────────────────────────────────────────────────────────────
  const allowedShipping = React.useMemo(() => {
    const items = (cartItems || []) as any[];
    // shipping_type ممکنه مستقیم یا nested باشه
    const getShippingType = (item: any): string => {
      return String(
        item.shipping_type ||
        item.product?.shipping_type ||
        item.shippingType ||
        ""
      ).toLowerCase().trim();
    };
    const hasTipaxOnly = items.some((item: any) => getShippingType(item) === "tipax");
    const hasPostOnly  = items.some((item: any) => getShippingType(item) === "post");
    if (hasTipaxOnly && !hasPostOnly) return "tipax_only" as const;
    if (hasPostOnly  && !hasTipaxOnly) return "post_only"  as const;
    return "both" as const;
  }, [cartItems]);

  // اعمال خودکار روش ارسال اجباری
  React.useEffect(() => {
    if (allowedShipping === "tipax_only" && shippingMethod !== "tipax") {
      setShippingMethod("tipax");
    } else if (allowedShipping === "post_only" && shippingMethod !== "post") {
      setShippingMethod("post");
    }
  }, [allowedShipping]); // eslint-disable-line react-hooks/exhaustive-deps

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [financialRules, setFinancialRules] = useState<StoreFinancialRules>({
    postShippingCost: 120000,
    tipaxShippingCost: 150000,
    freeShippingThreshold: 0,
    vatPercent: 10,
    allowGuestCheckout: true,
    autoSendOrderSms: true,
  });

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifiedToken, setVerifiedToken] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLiveStoreRules = useCallback(async () => {
    try {
      const [settingsRes, siteInfoRes] = await Promise.allSettled([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/site-info", { cache: "no-store" }),
      ]);
      if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
        const sJson = await settingsRes.value.json();
        const extracted = extractFinancialRulesFromPayload(sJson);
        if (extracted) { setFinancialRules(extracted); return; }
      }
      if (siteInfoRes.status === "fulfilled" && siteInfoRes.value.ok) {
        const infoJson = await siteInfoRes.value.json();
        const extracted = extractFinancialRulesFromPayload(infoJson);
        if (extracted) setFinancialRules(extracted);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchLiveStoreRules();
    const channel = supabase.channel("realtime-checkout-store-settings").on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, (payload) => {
      if (payload?.new) {
        const updated = extractFinancialRulesFromPayload(payload.new);
        if (updated) setFinancialRules(updated);
      }
      fetchLiveStoreRules();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLiveStoreRules]);

  // ── فیلتر هوشمند روش ارسال بر اساس نوع محصولات سبد ─────────
  const cartShipTypes = cartItems.map((i: any) => (i.shipping_type || "both") as string);
  const allowPost  = cartShipTypes.every(t => t === "post"  || t === "both");
  const allowTipax = cartShipTypes.every(t => t === "tipax" || t === "both");
  // اگر همه محصولات یه نوع خاص دارن، auto-select کن
  const forcedShipping: "post"|"tipax"|null =
    (allowPost && !allowTipax) ? "post" :
    (!allowPost && allowTipax) ? "tipax" : null;

  // اگر نوع ارسال محدود شده و انتخاب کنونی اشتباهه، ریست کن
  React.useEffect(() => {
    if (forcedShipping && shippingMethod !== forcedShipping) {
      setShippingMethod(forcedShipping);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedShipping]);

  // تیپاکس = پس‌کرایه: هزینه ارسال هنگام تحویل گرفته میشه
  let shippingCost = 0;
  if (finalPayable > 0) {
    if (shippingMethod === "post") shippingCost = financialRules.postShippingCost;
    else if (shippingMethod === "tipax") shippingCost = 0; // پس‌کرایه
  }

  const vatAmount = finalPayable > 0 && financialRules.vatPercent > 0 ? Math.round((finalPayable * financialRules.vatPercent) / 100) : 0;
  const grandTotal = Math.max(0, finalPayable + vatAmount + shippingCost);

  // لیست شهرهای استان انتخاب‌شده
  const provinceList = Object.keys(IRAN_PROVINCES_CITIES).sort();
  const cityList: string[] = (IRAN_PROVINCES_CITIES as Record<string, string[]>)[province] || [];

  // وقتی استان عوض میشه، شهر رو reset کن
  const handleProvinceChange = (val: string) => {
    setProvince(val);
    const cities: string[] = (IRAN_PROVINCES_CITIES as Record<string, string[]>)[val] || [];
    if (cities.length > 0) setCity(cities[0]);
    else setCity("");
  };

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        // سازگاری با نسخه قدیم
        if (!parsed.firstName && parsed.fullName) {
          const parts = String(parsed.fullName).trim().split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.province && (IRAN_PROVINCES_CITIES as Record<string,string[]>)[parsed.province]) setProvince(parsed.province);
        if (parsed.city) setCity(parsed.city);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.postalCode) setPostalCode(parsed.postalCode);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.shippingMethod) setShippingMethod(parsed.shippingMethod);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ firstName, lastName, phone, province, city, address, postalCode, notes, shippingMethod })); } catch {}
  }, [firstName, lastName, phone, province, city, address, postalCode, notes, shippingMethod]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    soundEngine.playClick();
    const res = await applyCoupon(couponInput.trim());
    setCouponMsg({ type: res.success ? "ok" : "err", text: res.message });
  };

  const finalizeOrderWithVerifiedToken = async (tokenToUse: string) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const cleanPhone = phone.replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/\D/g, "");
      const fullName = (firstName.trim() + " " + lastName.trim()).trim();
      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otpVerificationToken: tokenToUse,
          customer: {
            fullName,
            phone: cleanPhone,
            province,
            city,
            address: address.trim() + " [ارسال با " + (shippingMethod === "post" ? "پست" : "تیپاکس") + "]",
            postalCode: postalCode.trim(),
            notes: notes.trim(),
          },
          items: cartItems,
          subtotal: totalPrice,
          discountAmount,
          vatPercent: financialRules.vatPercent,
          vatAmount,
          shippingCost,
          finalAmount: grandTotal,
          couponCode: appliedCoupon?.code || null,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) throw new Error(orderData.message || "خطا در ثبت سفارش");

      const orderId = orderData.order?.id || orderData.order?.order_number;
      soundEngine.playSuccess();
      router.push("/checkout/payment?orderId=" + encodeURIComponent(String(orderId)) + "&amount=" + encodeURIComponent(String(grandTotal)) + "&phone=" + encodeURIComponent(cleanPhone));
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ثبت نهایی سفارش.");
      setSubmitting(false);
    }
  };

  const handlePrimaryCheckoutClick = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMsg(null);

    const cleanPhone = phone.replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/\D/g, "");

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("لطفاً نام و نام خانوادگی گیرنده را به صورت جداگانه وارد نمایید."); return;
    }
    if (cleanPhone.length !== 11) {
      setErrorMsg("شماره موبایل باید ۱۱ رقم باشد."); return;
    }
    if (!address.trim()) {
      setErrorMsg("لطفاً نشانی دقیق پستی را وارد نمایید."); return;
    }
    if (!postalCode.trim() || postalCode.replace(/\D/g, "").length < 10) {
      setErrorMsg("لطفاً کد پستی ۱۰ رقمی را وارد نمایید."); return;
    }
    if (!shippingMethod) {
      setErrorMsg("لطفاً نوع روش ارسال (پست پیشتاز یا تیپاکس) را انتخاب نمایید."); return;
    }
    if (!captchaVerified) {
      setErrorMsg("لطفاً ابتدا کد امنیتی ضد ربات (کادر تصویر امنیتی) را به درستی وارد نمایید."); return;
    }
    if (cartItems.length === 0) { setErrorMsg("سبد خرید شما خالی است."); return; }

    if (verifiedToken) { await finalizeOrderWithVerifiedToken(verifiedToken); return; }

    setSubmitting(true);
    try {
      const otpRes = await fetch("/api/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, action: "send" }),
      });
      const otpJson = await otpRes.json();
      if (otpRes.ok && otpJson.success) {
        setOtpModalOpen(true); setSubmitting(false);
      } else {
        setErrorMsg(otpJson.message || "خطا در ارسال پیامک تایید."); setSubmitting(false);
      }
    } catch {
      setErrorMsg("خطا در ارتباط با سرویس پیامک."); setSubmitting(false);
    }
  };

  const handleVerifyOtpAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const cleanPhone = phone.replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/\D/g, "");
      const vRes = await fetch("/api/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: otpCode.trim(), action: "verify" }),
      });
      const vJson = await vRes.json();

      if (vRes.ok && vJson.verified && vJson.otpVerificationToken) {
        setVerifiedToken(vJson.otpVerificationToken);
        setOtpModalOpen(false);
        await finalizeOrderWithVerifiedToken(vJson.otpVerificationToken);
      } else {
        setErrorMsg(vJson.message || "کد تایید صحیح نیست."); setSubmitting(false);
      }
    } catch {
      setErrorMsg("خطا در اعتبارسنجی."); setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 font-sans select-text text-[var(--text-primary)] space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--accent-blue)]">🛡️ تکمیل مشخصات گیرنده و پرداخت امن</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">مجهز به حافظه هوشمند فرم (اطلاعات شما پاک نمی‌شود)</p>
        </div>
      </div>

      {errorMsg && <div className="p-4 rounded-2xl bg-rose-500/15 text-rose-500 text-xs font-bold animate-fadeIn">⚠️ {errorMsg}</div>}

      <form onSubmit={handlePrimaryCheckoutClick} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          {/* بخش ۱: مشخصات گیرنده */}
          <div className="p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
            <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">۱. مشخصات خریدار و نشانی دقیق تحویل مرسوله</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* نام */}
              <div>
                <label className="block mb-1.5 font-bold">نام گیرنده *</label>
                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="نام" className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
              </div>
              {/* نام خانوادگی */}
              <div>
                <label className="block mb-1.5 font-bold">نام خانوادگی گیرنده *</label>
                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="نام خانوادگی" className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
              </div>
              {/* موبایل */}
              <div>
                <label className="block mb-1.5 font-bold">شماره تلفن همراه *</label>
                <input type="tel" required dir="ltr" maxLength={11} value={phone} onChange={(e) => { setPhone(e.target.value); setVerifiedToken(""); }} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-center outline-none focus:border-[var(--accent-blue)]" />
              </div>
              {/* کد پستی */}
              <div>
                <label className="block mb-1.5 font-bold">کد پستی ۱۰ رقمی *</label>
                <input type="text" required dir="ltr" maxLength={10} value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))} placeholder="0000000000" className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-center outline-none focus:border-[var(--accent-blue)]" />
              </div>
              {/* استان */}
              <div>
                <label className="block mb-1.5 font-bold">استان *</label>
                <select value={province} onChange={(e) => handleProvinceChange(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] cursor-pointer">
                  {provinceList.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              {/* شهر */}
              <div>
                <label className="block mb-1.5 font-bold">شهر *</label>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] cursor-pointer">
                  {cityList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* آدرس کامل */}
              <div className="sm:col-span-2">
                <label className="block mb-1.5 font-bold">نشانی کامل پستی (خیابان، کوچه، پلاک، واحد) *</label>
                <textarea rows={3} required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="مثال: خیابان امیرکبیر، کوچه بهار، پلاک ۱۲، واحد ۳" className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] leading-relaxed" />
              </div>
              {/* توضیحات اختیاری */}
              <div className="sm:col-span-2">
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">توضیحات سفارش (اختیاری)</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="هر توضیح خاصی برای سفارش..." className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]" />
              </div>
            </div>
          </div>

          {/* بخش ۲: روش ارسال */}
          {/* smart_shipping_section */}
          <div className="p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
            <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              ۲. انتخاب روش ارسال کالا (اجباری)
            </h2>
            {allowedShipping !== "both" && (
              <div className="text-[11px] px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold">
                ⚠️ {allowedShipping === "tipax_only"
                  ? "این سفارش فقط از طریق تیپاکس (پس‌کرایه) ارسال می‌شود."
                  : "این سفارش فقط از طریق پست پیشتاز ارسال می‌شود."}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {allowedShipping !== "tipax_only" && (
                <label className={"p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col gap-2 " + (shippingMethod === "post" ? "border-emerald-500 bg-emerald-500/10" : "border-[var(--card-border)] bg-[var(--input-bg)]")}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="post"
                      checked={shippingMethod === "post"}
                      onChange={() => setShippingMethod("post")}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <span className="font-black text-sm">📦 پست پیشتاز</span>
                  </div>
                  <div className="pr-7 font-bold text-emerald-600 text-xs">
                    هزینه ثابت + تحویل درب منزل
                  </div>
                </label>
              )}
              {allowedShipping !== "post_only" && (
                <label className={"p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col gap-2 " + (shippingMethod === "tipax" ? "border-amber-500 bg-amber-500/10" : "border-[var(--card-border)] bg-[var(--input-bg)]")}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="tipax"
                      checked={shippingMethod === "tipax"}
                      onChange={() => setShippingMethod("tipax")}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span className="font-black text-sm">🚀 ارسال با تیپاکس</span>
                  </div>
                  <div className="pr-7 font-bold text-amber-600 text-xs">
                    پس‌کرایه — بدون افزایش مبلغ فاکتور
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* ستون راست: صورتحساب */}
        <div className="lg:col-span-5 p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs h-fit">
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">۳. صورتحساب و تایید نهایی</h2>
          {/* خلاصه محصولات سبد */}
          {cartItems.length > 0 && (
            <div className="space-y-2 text-[11px]">
              {cartItems.map((item: any, idx: number) => (
                <div key={item.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  {(item.image || item.image_url) && (
                    <img src={item.image || item.image_url} alt={item.title||""} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" onError={(e)=>{(e.target as HTMLImageElement).style.display="none"}} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[12px] truncate">{item.title || item.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[var(--text-secondary)]">
                      <span>تعداد: <span className="font-mono font-bold">{item.quantity || 1}</span></span>
                      {item.selectedColor && <span>رنگ: <span className="font-bold">{item.selectedColor}</span></span>}
                    </div>
                  </div>
                  <div className="font-mono font-black text-[var(--accent-blue)] whitespace-nowrap text-[11px]">
                    {typeof formatPrice === "function" ? formatPrice((item.discount_price||item.price||0)*(item.quantity||1)) : ((item.discount_price||item.price||0)*(item.quantity||1)).toLocaleString("fa-IR")} ت
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
            <div className="flex justify-between">
              <span>مجموع اقلام:</span>
              <span className="font-mono">{formatPrice(totalPrice)} تومان</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>تخفیف کوپن:</span>
                <span className="font-mono">- {formatPrice(discountAmount)} تومان</span>
              </div>
            )}
            {vatAmount > 0 && (
              <div className="flex justify-between text-orange-500">
                <span>مالیات بر ارزش افزوده ({financialRules.vatPercent}٪):</span>
                <span className="font-mono">+ {formatPrice(vatAmount)} تومان</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>هزینه ارسال ({shippingMethod === "post" ? "پست" : shippingMethod === "tipax" ? "تیپاکس" : "انتخاب نشده"}):</span>
              <span className={`font-mono ${shippingMethod==="tipax"?"text-amber-500":"text-emerald-500"}`}>
                {!shippingMethod ? "---" : shippingMethod === "tipax" ? "پس‌کرایه 🚚" : formatPrice(shippingCost) + " تومان"}
              </span>
            </div>
            <div className="pt-2.5 border-t border-[var(--card-border)] flex justify-between items-center text-sm">
              <span className="font-black">مبلغ قابل پرداخت:</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">{formatPrice(grandTotal)} تومان</span>
            </div>
          </div>
          <SecurityCaptchaBox onVerifyChange={setCaptchaVerified} />
          <button type="submit" disabled={submitting || !captchaVerified} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-xl cursor-pointer transition disabled:opacity-50">
            {submitting ? "در حال پردازش..." : verifiedToken ? "💳 ورود به درگاه زرین‌پال ←" : "🔒 تایید شماره و پرداخت آنلاین ←"}
          </button>
        </div>
      </form>

      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn" onClick={() => setOtpModalOpen(false)}>
          <form onSubmit={handleVerifyOtpAndPay} onClick={(e) => e.stopPropagation()} className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-5 text-center text-xs">
            <p className="font-bold text-sm">کد تایید ارسال‌شده به {phone} را وارد کنید</p>
            <input type="text" inputMode="numeric" required dir="ltr" maxLength={8} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="کد تایید را وارد کنید" className="w-full p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-lg text-center outline-none focus:border-[var(--accent-blue)]" />
            <button type="submit" disabled={submitting} className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-xl cursor-pointer">
              {submitting ? "در حال انتقال..." : "✓ تایید کد و پرداخت"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

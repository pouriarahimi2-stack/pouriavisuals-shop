// File Path: app/checkout/page.tsx
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
const PENDING_GATEWAY_ORDER_KEY = "axon_pending_gateway_order_v1";

interface StoreFinancialRules {
  postShippingCost: number;
  tipaxShippingCost: number;
  defaultShippingCost: number;
  freeShippingThreshold: number;
  vatPercent: number;
  allowGuestCheckout: boolean;
  autoSendOrderSms: boolean;
  codEnabled: boolean;
  supportCardNumber: string;
  supportCardHolder: string;
  currencyLabel: string;
}

function parseExactNumber(val: any, fallback: number): number {
  if (val === undefined || val === null || val === "") return fallback;
  const converted = String(val)
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/,/g, "")
    .trim();
  if (converted === "") return fallback;
  const num = Number(converted);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

function extractFinancialRulesFromPayload(raw: any): StoreFinancialRules | null {
  if (!raw || typeof raw !== "object") return null;

  const candidates = [
    raw.settings,
    raw.system_settings,
    raw.store_settings,
    raw.homepage_layout_config?.system_settings,
    raw.homepage_layout_config?.settings,
    raw.siteInfo?.homepage_layout_config?.system_settings,
    raw.siteInfo,
    raw.data,
    raw,
  ].filter((c) => c && typeof c === "object");

  let foundPost: number | undefined;
  let foundTipax: number | undefined;
  let foundDefaultShip: number | undefined;
  let foundFreeThreshold: number | undefined;
  let foundVat: number | undefined;
  let foundGuest: boolean | undefined;
  let foundSms: boolean | undefined;
  let foundCod: boolean | undefined;
  let foundCardNum: string | undefined;
  let foundCardHolder: string | undefined;
  let foundCurrency: string | undefined;

  for (const obj of candidates) {
    if (foundPost === undefined && obj.postShippingCost !== undefined)
      foundPost = parseExactNumber(obj.postShippingCost, 120000);
    if (foundTipax === undefined && obj.tipaxShippingCost !== undefined)
      foundTipax = parseExactNumber(obj.tipaxShippingCost, 150000);
    if (foundDefaultShip === undefined && obj.defaultShippingCost !== undefined)
      foundDefaultShip = parseExactNumber(obj.defaultShippingCost, 0);
    if (
      foundFreeThreshold === undefined &&
      (obj.freeShippingThreshold !== undefined ||
        obj.free_shipping_threshold !== undefined)
    ) {
      foundFreeThreshold = parseExactNumber(
        obj.freeShippingThreshold ?? obj.free_shipping_threshold,
        0
      );
    }
    if (foundVat === undefined && obj.vatPercent !== undefined)
      foundVat = parseExactNumber(obj.vatPercent, 10);
    if (
      foundGuest === undefined &&
      typeof obj.allowGuestCheckout === "boolean"
    )
      foundGuest = obj.allowGuestCheckout;
    if (foundSms === undefined && typeof obj.autoSendOrderSms === "boolean")
      foundSms = obj.autoSendOrderSms;
    if (foundCod === undefined && typeof obj.codEnabled === "boolean")
      foundCod = obj.codEnabled;
    if (foundCardNum === undefined && obj.supportCardNumber !== undefined)
      foundCardNum = String(obj.supportCardNumber || "").trim();
    if (foundCardHolder === undefined && obj.supportCardHolder !== undefined)
      foundCardHolder = String(obj.supportCardHolder || "").trim();
    if (foundCurrency === undefined && obj.currencyLabel !== undefined)
      foundCurrency = String(obj.currencyLabel || "تومان").trim();
  }

  return {
    postShippingCost: foundPost !== undefined ? foundPost : 120000,
    tipaxShippingCost: foundTipax !== undefined ? foundTipax : 150000,
    defaultShippingCost: foundDefaultShip !== undefined ? foundDefaultShip : 0,
    freeShippingThreshold:
      foundFreeThreshold !== undefined ? foundFreeThreshold : 0,
    vatPercent: foundVat !== undefined ? foundVat : 10,
    allowGuestCheckout: foundGuest !== undefined ? foundGuest : true,
    autoSendOrderSms: foundSms !== undefined ? foundSms : true,
    codEnabled: foundCod !== undefined ? foundCod : false,
    supportCardNumber: foundCardNum || "",
    supportCardHolder: foundCardHolder || "",
    currencyLabel: foundCurrency || "تومان",
  };
}

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
    clearCart,
  } = useCart() as any;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("فارس");
  const [city, setCity] = useState("شیراز");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"post" | "tipax" | null>(
    null
  );
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(true);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWallet, setUseWallet] = useState<boolean>(false);

  const allowedShipping = React.useMemo(() => {
    const items = (cartItems || []) as any[];
    const getShippingType = (item: any): string => {
      return String(
        item.shipping_type ||
          item.product?.shipping_type ||
          item.shippingType ||
          ""
      )
        .toLowerCase()
        .trim();
    };
    const hasTipaxOnly = items.some(
      (item: any) => getShippingType(item) === "tipax"
    );
    const hasPostOnly = items.some(
      (item: any) => getShippingType(item) === "post"
    );
    if (hasTipaxOnly && !hasPostOnly) return "tipax_only" as const;
    if (hasPostOnly && !hasTipaxOnly) return "post_only" as const;
    return "both" as const;
  }, [cartItems]);

  React.useEffect(() => {
    if (allowedShipping === "tipax_only" && shippingMethod !== "tipax") {
      setShippingMethod("tipax");
    } else if (allowedShipping === "post_only" && shippingMethod !== "post") {
      setShippingMethod("post");
    }
  }, [allowedShipping, shippingMethod]);

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [financialRules, setFinancialRules] = useState<StoreFinancialRules>({
    postShippingCost: 120000,
    tipaxShippingCost: 150000,
    defaultShippingCost: 0,
    freeShippingThreshold: 0,
    vatPercent: 10,
    allowGuestCheckout: true,
    autoSendOrderSms: true,
    codEnabled: false,
    supportCardNumber: "",
    supportCardHolder: "",
    currencyLabel: "تومان",
  });

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifiedToken, setVerifiedToken] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [isOtpRequestLocked, setIsOtpRequestLocked] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [releasedInfoMsg, setReleasedInfoMsg] = useState<string | null>(null);

  const fetchWalletForPhone = useCallback(async (rawPhoneVal: string) => {
    const clean = String(rawPhoneVal || "")
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/\D/g, "");
    if (!/^09\d{9}$/.test(clean)) {
      setWalletBalance(0);
      setUseWallet(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/user/wallet?phone=${encodeURIComponent(clean)}&t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = await res.json();
        const bal = Math.max(0, Number(json.balance || 0));
        setWalletBalance(bal);
        if (bal <= 0) setUseWallet(false);
      }
    } catch {}
  }, []);

  // آزادسازی فوری سفارش ناتمام در صورت زدن دکمه Back مرورگر از درگاه بانک
  useEffect(() => {
    try {
      const pendingRaw = sessionStorage.getItem(PENDING_GATEWAY_ORDER_KEY);
      if (pendingRaw) {
        sessionStorage.removeItem(PENDING_GATEWAY_ORDER_KEY);
        const parsed = JSON.parse(pendingRaw);
        if (parsed?.orderId && parsed?.phone) {
          fetch(
            `/api/orders/track?id=${encodeURIComponent(
              String(parsed.orderId)
            )}&phone=${encodeURIComponent(String(parsed.phone))}`,
            { method: "DELETE" }
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
              if (json?.success) {
                setReleasedInfoMsg(
                  "✓ سفارش ناتمام قبلی لغو شد و موجودی کالا (و در صورت استفاده، اعتبار کیف پول) به حالت قبل بازگشت."
                );
                fetchWalletForPhone(String(parsed.phone));
                setTimeout(() => setReleasedInfoMsg(null), 6000);
              }
            })
            .catch(() => {});
        }
      }
    } catch {}
  }, [fetchWalletForPhone]);

  useEffect(() => {
    fetchWalletForPhone(phone);
  }, [phone, fetchWalletForPhone]);

  const fetchLiveStoreRules = useCallback(async () => {
    try {
      const [settingsRes, siteInfoRes] = await Promise.allSettled([
        fetch("/api/admin/settings?t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/site-info?t=" + Date.now(), { cache: "no-store" }),
      ]);
      if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
        const sJson = await settingsRes.value.json();
        const extracted = extractFinancialRulesFromPayload(sJson);
        if (extracted) {
          setFinancialRules(extracted);
          return;
        }
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
    try {
      const userSess = localStorage.getItem("axon_user_session");
      setIsUserLoggedIn(Boolean(userSess));
      if (userSess) {
        const parsed = JSON.parse(userSess);
        if (parsed?.phone) {
          setPhone((prev) => prev || String(parsed.phone));
          fetchWalletForPhone(String(parsed.phone));
        }
      }
    } catch {
      setIsUserLoggedIn(false);
    }

    const channel = supabase
      .channel("realtime-checkout-store-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        (payload) => {
          if (payload?.new) {
            const updated = extractFinancialRulesFromPayload(payload.new);
            if (updated) setFinancialRules(updated);
          }
          fetchLiveStoreRules();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLiveStoreRules, fetchWalletForPhone]);

  const qualifiesForFreeShipping =
    financialRules.freeShippingThreshold > 0 &&
    finalPayable >= financialRules.freeShippingThreshold;

  let shippingCost = 0;
  if (finalPayable > 0 && !qualifiesForFreeShipping) {
    if (shippingMethod === "post")
      shippingCost = financialRules.postShippingCost;
    else if (shippingMethod === "tipax") shippingCost = 0;
  }

  const vatAmount =
    finalPayable > 0 && financialRules.vatPercent > 0
      ? Math.round((finalPayable * financialRules.vatPercent) / 100)
      : 0;

  const grandTotalBeforeWallet = Math.max(
    0,
    finalPayable + vatAmount + shippingCost
  );

  let walletDeduction =
    useWallet && walletBalance > 0
      ? Math.min(walletBalance, grandTotalBeforeWallet)
      : 0;
  let grandTotal = Math.max(0, grandTotalBeforeWallet - walletDeduction);
  if (grandTotal > 0 && grandTotal < 1000 && grandTotalBeforeWallet >= 1000) {
    grandTotal = 1000;
    walletDeduction = Math.max(0, grandTotalBeforeWallet - 1000);
  }

  const currency = financialRules.currencyLabel || "تومان";

  const provinceList = Object.keys(IRAN_PROVINCES_CITIES).sort();
  const cityList: string[] =
    (IRAN_PROVINCES_CITIES as Record<string, string[]>)[province] || [];

  const handleProvinceChange = (val: string) => {
    setProvince(val);
    const cities: string[] =
      (IRAN_PROVINCES_CITIES as Record<string, string[]>)[val] || [];
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
        if (!parsed.firstName && parsed.fullName) {
          const parts = String(parsed.fullName).trim().split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
        if (parsed.phone) setPhone(parsed.phone);
        if (
          parsed.province &&
          (IRAN_PROVINCES_CITIES as Record<string, string[]>)[parsed.province]
        )
          setProvince(parsed.province);
        if (parsed.city) setCity(parsed.city);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.postalCode) setPostalCode(parsed.postalCode);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.shippingMethod) setShippingMethod(parsed.shippingMethod);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        CHECKOUT_DRAFT_KEY,
        JSON.stringify({
          firstName,
          lastName,
          phone,
          province,
          city,
          address,
          postalCode,
          notes,
          shippingMethod,
        })
      );
    } catch {}
  }, [
    firstName,
    lastName,
    phone,
    province,
    city,
    address,
    postalCode,
    notes,
    shippingMethod,
  ]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    soundEngine.playClick();
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const cleanPhone = phone
        .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/\D/g, "");

      const res = await applyCoupon(
        couponInput.trim().toUpperCase(),
        cleanPhone
      );
      if (res?.success) {
        soundEngine.playSuccess();
        setCouponMsg({
          type: "ok",
          text: res.message || "کد تخفیف با موفقیت اعمال شد.",
        });
        setCouponInput("");
      } else {
        setCouponMsg({
          type: "err",
          text: res?.message || "کد تخفیف معتبر نیست یا منقضی شده است.",
        });
      }
    } catch {
      setCouponMsg({
        type: "err",
        text: "خطا در برقراری ارتباط و بررسی کد تخفیف.",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    soundEngine.playClick();
    removeCoupon();
    setCouponMsg(null);
  };

  const finalizeOrderWithVerifiedToken = async (tokenToUse: string) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const cleanPhone = phone
        .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/\D/g, "");
      const fullName = (firstName.trim() + " " + lastName.trim()).trim();
      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otpVerificationToken: tokenToUse,
          useWallet: Boolean(useWallet && walletBalance > 0),
          shippingMethod,
          customer: {
            fullName,
            phone: cleanPhone,
            province,
            city,
            address:
              address.trim() +
              " [ارسال با " +
              (shippingMethod === "post" ? "پست" : "تیپاکس") +
              "]",
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
      if (!orderRes.ok || !orderData.success)
        throw new Error(orderData.message || "خطا در ثبت سفارش");

      const orderId = orderData.order?.id || orderData.order?.order_number;
      const serverPayable = Number(
        orderData.order?.final_amount ?? grandTotal
      );
      soundEngine.playSuccess();

      if (orderData.paidByWallet || serverPayable === 0) {
        if (typeof clearCart === "function") clearCart();
        router.push(
          "/checkout/payment?orderId=" +
            encodeURIComponent(String(orderId)) +
            "&walletPaid=1&trackingCode=" +
            encodeURIComponent(
              String(orderData.order?.tracking_code || orderId)
            )
        );
        return;
      }

      try {
        sessionStorage.setItem(
          PENDING_GATEWAY_ORDER_KEY,
          JSON.stringify({
            orderId: String(orderId),
            phone: cleanPhone,
            createdAt: Date.now(),
          })
        );
      } catch {}

      router.push(
        "/checkout/payment?orderId=" +
          encodeURIComponent(String(orderId)) +
          "&amount=" +
          encodeURIComponent(String(serverPayable)) +
          "&phone=" +
          encodeURIComponent(cleanPhone)
      );
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ثبت نهایی سفارش.");
      setSubmitting(false);
    }
  };

  const handlePrimaryCheckoutClick = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOtpRequestLocked || submitting) return;

    soundEngine.playClick();
    setErrorMsg(null);

    if (!financialRules.allowGuestCheckout && !isUserLoggedIn) {
      setErrorMsg(
        "طبق قوانین فروشگاه، برای ثبت سفارش ابتدا باید وارد حساب کاربری خود شوید."
      );
      return;
    }

    const cleanPhone = phone
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/\D/g, "");

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg(
        "لطفاً نام و نام خانوادگی گیرنده را به صورت جداگانه وارد نمایید."
      );
      return;
    }
    if (cleanPhone.length !== 11) {
      setErrorMsg("شماره موبایل باید ۱۱ رقم باشد.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("لطفاً نشانی دقیق پستی را وارد نمایید.");
      return;
    }
    if (!postalCode.trim() || postalCode.replace(/\D/g, "").length < 10) {
      setErrorMsg("لطفاً کد پستی ۱۰ رقمی را وارد نمایید.");
      return;
    }
    if (!shippingMethod) {
      setErrorMsg(
        "لطفاً نوع روش ارسال (پست پیشتاز یا تیپاکس) را انتخاب نمایید."
      );
      return;
    }
    if (!captchaVerified) {
      setErrorMsg(
        "لطفاً ابتدا کد امنیتی ضد ربات (کادر تصویر امنیتی) را به درستی وارد نمایید."
      );
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
    setIsOtpRequestLocked(true);

    try {
      const otpRes = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, action: "send" }),
      });
      const otpJson = await otpRes.json();

      if (otpRes.ok && otpJson.success) {
        setOtpModalOpen(true);
      } else {
        setErrorMsg(otpJson.message || "خطا در ارسال پیامک تایید.");
      }
    } catch {
      setErrorMsg("خطا در ارتباط با سرویس پیامک.");
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setIsOtpRequestLocked(false);
      }, 5000);
    }
  };

  const handleVerifyOtpAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (submitting) return;

    soundEngine.playClick();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const cleanPhone = phone
        .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776))
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
        setErrorMsg(vJson.message || "کد تایید صحیح نیست.");
        setSubmitting(false);
      }
    } catch {
      setErrorMsg("خطا در اعتبارسنجی.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 font-sans select-text text-[var(--text-primary)] space-y-6"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-4 border-b border-[var(--card-border)] pb-4">
        <div>
          <h1 className="text-sm md:text-xl sm:text-2xl font-black text-[var(--accent-blue)]">
            🛡️ تکمیل مشخصات گیرنده و پرداخت امن
          </h1>
        </div>
        {financialRules.freeShippingThreshold > 0 && (
          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-black">
            {qualifiesForFreeShipping
              ? "🎉 تبریک! سفارش شما مشمول ارسال رایگان شد"
              : `🚚 ارسال رایگان برای سفارش‌های بالای ${formatPrice(
                  financialRules.freeShippingThreshold
                )} ${currency}`}
          </div>
        )}
      </div>

      {releasedInfoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-fadeIn">
          {releasedInfoMsg}
        </div>
      )}

      {!financialRules.allowGuestCheckout && !isUserLoggedIn && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold flex flex-wrap items-center justify-between gap-2">
          <span>
            ⚠️ ثبت سفارش مهمان غیرفعال است. لطفاً ابتدا وارد حساب کاربری خود شوید:
          </span>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black"
          >
            ورود به حساب کاربری ←
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 text-rose-500 text-xs font-bold animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}

      <form
        onSubmit={handlePrimaryCheckoutClick}
        className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
      >
        <div className="space-y-5">
          <div className="p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
            <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              ۱. مشخصات خریدار و نشانی دقیق تحویل مرسوله
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block mb-1.5 font-bold">نام گیرنده *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="نام"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold">
                  نام خانوادگی گیرنده *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="نام خانوادگی"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold">
                  شماره تلفن همراه *
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
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-center outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold">
                  کد پستی ۱۰ رقمی *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  maxLength={10}
                  value={postalCode}
                  onChange={(e) =>
                    setPostalCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0000000000"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-center outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold">استان *</label>
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] cursor-pointer"
                >
                  {provinceList.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 font-bold">شهر *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] cursor-pointer"
                >
                  {cityList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1.5 font-bold">
                  نشانی کامل پستی (خیابان، کوچه، پلاک، واحد) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: خیابان امیرکبیر، کوچه بهار، پلاک ۱۲، واحد ۳"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] leading-relaxed"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  توضیحات سفارش (اختیاری)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="هر توضیح خاصی برای سفارش..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
            <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              ۲. انتخاب روش ارسال کالا (اجباری)
            </h2>
            {allowedShipping !== "both" && (
              <div className="text-[11px] px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold">
                ⚠️{" "}
                {allowedShipping === "tipax_only"
                  ? "این سفارش فقط از طریق تیپاکس (پس‌کرایه) ارسال می‌شود."
                  : "این سفارش فقط از طریق پست پیشتاز ارسال می‌شود."}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-1">
              {allowedShipping !== "tipax_only" && (
                <label
                  className={
                    "p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col gap-2 " +
                    (shippingMethod === "post"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-[var(--card-border)] bg-[var(--input-bg)]")
                  }
                >
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
                    {qualifiesForFreeShipping
                      ? "رایگان (شامل طرح ارسال رایگان)"
                      : `${formatPrice(
                          financialRules.postShippingCost
                        )} ${currency} — تحویل درب منزل`}
                  </div>
                </label>
              )}
              {allowedShipping !== "post_only" && (
                <label
                  className={
                    "p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col gap-2 " +
                    (shippingMethod === "tipax"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-[var(--card-border)] bg-[var(--input-bg)]")
                  }
                >
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

            {financialRules.codEnabled && financialRules.supportCardNumber && (
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-bold space-y-1">
                <div>💳 اطلاعات کارت رسمی جهت هماهنگی کارت‌به‌کارت:</div>
                <div className="font-mono text-xs" dir="ltr">
                  {financialRules.supportCardNumber}{" "}
                  {financialRules.supportCardHolder
                    ? `(${financialRules.supportCardHolder})`
                    : ""}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs h-fit">
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            ۳. صورتحساب و تایید نهایی
          </h2>

          {cartItems.length > 0 && (
            <div className="space-y-2 text-[11px]">
              {cartItems.map((item: any, idx: number) => (
                <div
                  key={item.cartKey || item.id || idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]"
                >
                  {(item.image || item.image_url) && (
                    <img
                      src={item.image || item.image_url}
                      alt={item.title || ""}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[12px] truncate">
                      {item.title || item.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[var(--text-secondary)]">
                      <span>
                        تعداد:{" "}
                        <span className="font-mono font-bold">
                          {item.quantity || 1}
                        </span>
                      </span>
                      {item.selectedColor && (
                        <span>
                          رنگ:{" "}
                          <span className="font-bold">{item.selectedColor}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-mono font-black text-[var(--accent-blue)] whitespace-nowrap text-[11px]">
                    {formatPrice(
                      (item.discount_price || item.price || 0) *
                        (item.quantity || 1)
                    )}{" "}
                    ت
                  </div>
                </div>
              ))}
            </div>
          )}

          {walletBalance > 0 && (
            <label
              className={
                "p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between gap-3 " +
                (useWallet
                  ? "border-emerald-500 bg-emerald-500/15"
                  : "border-emerald-500/35 bg-emerald-500/5 hover:border-emerald-500/60")
              }
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => {
                    soundEngine.playClick();
                    setUseWallet(e.target.checked);
                  }}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <div>
                  <span className="font-black text-xs text-emerald-500 block">
                    👛 پرداخت با اعتبار کیف پول شما
                  </span>
                  <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                    موجودی قابل استفاده:{" "}
                    <strong className="font-mono text-emerald-400">
                      {formatPrice(walletBalance)} {currency}
                    </strong>
                  </span>
                </div>
              </div>
              {useWallet && walletDeduction > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-mono font-black text-[10px] shrink-0">
                  -{formatPrice(walletDeduction)} ت
                </span>
              )}
            </label>
          )}

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-[var(--text-primary)]">
                🏷️ کد تخفیف دارید؟
              </span>
              {appliedCoupon && (
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-500 font-bold">
                  اعمال‌شده ✓
                </span>
              )}
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 overflow-hidden">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="font-mono font-black text-emerald-500 tracking-wider truncate shrink-0 max-w-[40%]">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-emerald-600 font-bold truncate min-w-0">
                    ({formatPrice(discountAmount)} ت کسر شد)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="ml-1 px-2 py-1 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white font-bold text-[10px] transition cursor-pointer shrink-0"
                >
                  حذف کوپن
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
                      )
                    }
                    placeholder="کد تخفیف..."
                    className="flex-1 min-w-[80px] px-3.5 py-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-black uppercase outline-none focus:border-[var(--accent-blue)] text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] hover:opacity-90 disabled:opacity-50 text-white font-black text-xs transition cursor-pointer"
                  >
                    {couponLoading ? "بررسی..." : "اعمال"}
                  </button>
                </div>
                {couponMsg && (
                  <div
                    className={
                      "text-[11px] font-bold p-2 rounded-xl " +
                      (couponMsg.type === "ok"
                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-500 border border-rose-500/30")
                    }
                  >
                    {couponMsg.text}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
            <div className="flex justify-between">
              <span>مجموع اقلام:</span>
              <span className="font-mono">
                {formatPrice(totalPrice)} {currency}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-500 font-bold">
                <span>تخفیف کوپن:</span>
                <span className="font-mono">
                  - {formatPrice(discountAmount)} {currency}
                </span>
              </div>
            )}
            {vatAmount > 0 && (
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>
                  مالیات بر ارزش افزوده ({financialRules.vatPercent}٪):
                </span>
                <span className="font-mono">
                  + {formatPrice(vatAmount)} {currency}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>
                هزینه ارسال (
                {shippingMethod === "post"
                  ? "پست"
                  : shippingMethod === "tipax"
                  ? "تیپاکس"
                  : "انتخاب نشده"}
                ):
              </span>
              <span
                className={`font-mono ${
                  shippingMethod === "tipax"
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`}
              >
                {!shippingMethod
                  ? "---"
                  : shippingMethod === "tipax"
                  ? "پس‌کرایه 🚚"
                  : qualifiesForFreeShipping
                  ? "رایگان 🎉"
                  : formatPrice(shippingCost) + " " + currency}
              </span>
            </div>
            {walletDeduction > 0 && (
              <div className="flex justify-between text-emerald-500 font-black">
                <span>👛 کسر از اعتبار کیف پول:</span>
                <span className="font-mono">
                  - {formatPrice(walletDeduction)} {currency}
                </span>
              </div>
            )}
            <div className="pt-2.5 border-t border-[var(--card-border)] flex justify-between items-center text-sm">
              <span className="font-black">
                {grandTotal === 0
                  ? "مبلغ قابل پرداخت در درگاه:"
                  : "مبلغ قابل پرداخت:"}
              </span>
              <span className="font-mono font-black text-[var(--accent-blue)]">
                {grandTotal === 0
                  ? "۰ تومان (تسویه با کیف پول)"
                  : `${formatPrice(grandTotal)} ${currency}`}
              </span>
            </div>
          </div>

          <SecurityCaptchaBox onVerifyChange={setCaptchaVerified} />

          <button
            type="submit"
            disabled={submitting || !captchaVerified || isOtpRequestLocked}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-xl cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting || isOtpRequestLocked
              ? "در حال پردازش امن..."
              : grandTotal === 0 && walletDeduction > 0
              ? verifiedToken
                ? "👛 ثبت نهایی و تسویه با کیف پول ←"
                : "🔒 تایید شماره و تسویه با کیف پول ←"
              : verifiedToken
              ? "💳 ورود به درگاه زرین‌پال ←"
              : "🔒 تایید شماره و پرداخت آنلاین ←"}
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
            <p className="font-bold text-sm">
              کد تایید ارسال‌شده به {phone} را وارد کنید
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              required
              dir="ltr"
              maxLength={8}
              name="code"
              id="code"
              autoComplete="one-time-code"
              autoFocus={true}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="کد تایید را وارد کنید"
              className="w-full p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-lg text-center outline-none focus:border-[var(--accent-blue)]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-xl cursor-pointer disabled:opacity-50"
            >
              {submitting ? "در حال انتقال..." : "✓ تایید کد و ادامه"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
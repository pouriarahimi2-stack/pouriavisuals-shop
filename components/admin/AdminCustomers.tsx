// File Path: components/admin/AdminCustomers.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export interface CrmCustomer {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  province?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  lifecycle_stage: "lead" | "prospect" | "active" | "vip" | "at_risk";
  tags: string[];
  total_spent: number;
  order_count: number;
  pending_orders_count?: number;
  pending_amount?: number;
  last_order_date?: string;
  internal_notes?: string;
  created_at?: string;
  updated_at?: string;
}

function cleanDigitsInput(val: string): string {
  return String(val || "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");

  const [editingCustomer, setEditingCustomer] = useState<Partial<CrmCustomer> | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [activeSmsCustomer, setActiveSmsCustomer] = useState<CrmCustomer | null>(null);

  // استیت‌های مدیریت دقیق کوپن پاداش در مودال پیامک
  const [rewardCouponCode, setRewardCouponCode] = useState("");
  const [rewardDiscountType, setRewardDiscountType] = useState<"percent" | "fixed">("percent");
  const [rewardDiscountValue, setRewardDiscountValue] = useState<number | "">(15);
  const [rewardExpireDays, setRewardExpireDays] = useState<number>(7);
  const [rewardMinPurchase, setRewardMinPurchase] = useState<number>(0);
  const [smsText, setSmsText] = useState("");

  const [sendingSms, setSendingSms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setActionFeedback({ type, text });
    setTimeout(() => setActionFeedback(null), 4500);
  };

  const fetchCrmData = useCallback(async () => {
    try {
      const res = await fetch("/api/crm?t=" + Date.now(), { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.customers)) {
        setCustomers(json.customers);
      }
    } catch (e) {
      console.error("CRM fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrmData();

    const crmCh = supabase
      .channel("realtime-crm")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_customers" }, () =>
        fetchCrmData()
      )
      .subscribe();

    const ordersCh = supabase
      .channel("realtime-crm-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        fetchCrmData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(crmCh);
      supabase.removeChannel(ordersCh);
    };
  }, [fetchCrmData]);

  const handleOpenNewCustomer = () => {
    soundEngine.playClick();
    setEditingCustomer({
      full_name: "",
      phone: "",
      email: "",
      province: "تهران",
      city: "تهران",
      address: "",
      postal_code: "",
      lifecycle_stage: "lead",
      tags: ["ثبت دستی"],
      internal_notes: "",
    });
    setTagsInput("ثبت دستی");
    setIsModalOpen(true);
  };

  const handleOpenEditCustomer = (c: CrmCustomer) => {
    soundEngine.playClick();
    setEditingCustomer({ ...c });
    setTagsInput(Array.isArray(c.tags) ? c.tags.join("، ") : "");
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.phone || !editingCustomer.full_name) return;

    const cleanPhone = cleanDigitsInput(editingCustomer.phone);
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      showFeedback("❌ شماره موبایل باید ۱۱ رقم و با پیش‌شماره 09 باشد.", "error");
      return;
    }

    const parsedTags = tagsInput
      .split(/[,،]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    soundEngine.playClick();
    setSubmitting(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingCustomer,
          phone: cleanPhone,
          tags: parsedTags.length > 0 ? parsedTags : ["مشتری فروشگاه"],
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        showFeedback(json.message, "success");
        setIsModalOpen(false);
        fetchCrmData();
      } else {
        showFeedback(json.message || "خطا در ذخیره اطلاعات.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (c: CrmCustomer) => {
    const confirmMsg =
      "آیا از حذف پرونده «" + c.full_name + "» از سامانه CRM اطمینان دارید؟";
    if (!confirm(confirmMsg)) return;
    soundEngine.playClick();
    try {
      const url =
        "/api/crm?id=" +
        encodeURIComponent(c.id) +
        "&phone=" +
        encodeURIComponent(c.phone);
      const res = await fetch(url, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        showFeedback("✓ پرونده با موفقیت از CRM حذف شد.", "success");
        fetchCrmData();
      } else {
        showFeedback(json.message || "خطا در حذف پرونده.", "error");
      }
    } catch {
      showFeedback("خطا در حذف پرونده.", "error");
    }
  };

  // تنظیمات اولیه هنگام باز کردن مودال پیامک پاداش (تولید کد عددی سازگار با پترن پیامکی)
  const handleOpenRewardModal = (c: CrmCustomer) => {
    soundEngine.playClick();
    setActiveSmsCustomer(c);
    const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
    const initialCode = "VIP-" + randomFiveDigits;
    setRewardCouponCode(initialCode);
    setRewardDiscountType("percent");
    setRewardDiscountValue(15);
    setRewardExpireDays(7);
    setRewardMinPurchase(0);
    setSmsText(
      `${c.full_name} عزیز، به پاس همراهی ارزشمند شما با آکسون کور، کد تخفیف اختصاصی ${initialCode} (۱۵٪ تخفیف ویژه) با اعتبار ۷ روزه تقدیم شما می‌گردد. axoncore.ir`
    );
    setIsSmsModalOpen(true);
  };

  // به‌روزرسانی زنده متن پیامک با تغییر تنظیمات تخفیف
  useEffect(() => {
    if (!activeSmsCustomer || !isSmsModalOpen) return;
    const valText =
      rewardDiscountType === "percent"
        ? `${rewardDiscountValue || 0}٪ تخفیف ویژه`
        : `${Number(rewardDiscountValue || 0).toLocaleString("fa-IR")} تومان تخفیف`;

    const days = Math.max(1, Number(rewardExpireDays || 7));
    setSmsText(
      `${activeSmsCustomer.full_name} عزیز، به پاس همراهی ارزشمند شما با آکسون کور، کد تخفیف اختصاصی ${rewardCouponCode} (${valText}) با اعتبار ${days} روزه تقدیم شما می‌گردد. axoncore.ir`
    );
  }, [
    rewardCouponCode,
    rewardDiscountType,
    rewardDiscountValue,
    rewardExpireDays,
    activeSmsCustomer,
    isSmsModalOpen,
  ]);

  const handleSendSmsAndCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !activeSmsCustomer ||
      !smsText.trim() ||
      !rewardCouponCode.trim() ||
      !rewardDiscountValue
    )
      return;

    soundEngine.playClick();
    setSendingSms(true);

    try {
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + Math.max(1, Number(rewardExpireDays || 7)));

      const numericVal = Number(rewardDiscountValue);
      const cleanCoupon = rewardCouponCode.trim().toUpperCase();

      // ۱. ثبت کوپن در دیتابیس با متد استاندارد ساخت کوپن
      const couponPayload = {
        code: cleanCoupon,
        discount_type: rewardDiscountType,
        type: rewardDiscountType,
        value: numericVal,
        discount_value: numericVal,
        discount_percent: rewardDiscountType === "percent" ? numericVal : null,
        discount_amount: rewardDiscountType === "fixed" ? numericVal : null,
        min_purchase: Math.max(0, Number(rewardMinPurchase || 0)),
        min_order_amount: Math.max(0, Number(rewardMinPurchase || 0)),
        max_discount: 0,
        max_discount_amount: 0,
        usage_limit: 1,
        target_type: "all",
        target_id: null,
        starts_at: new Date().toISOString(),
        expires_at: expiresDate.toISOString(),
        description: `هدیه اختصاصی CRM برای ${activeSmsCustomer.full_name} (${activeSmsCustomer.phone})`,
        is_active: true,
        publish_to_header: false,
      };

      const couponRes = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponPayload),
      });

      if (!couponRes.ok) {
        const errJson = await couponRes.json().catch(() => ({}));
        throw new Error(errJson.message || "خطا در ثبت کوپن در پایگاه داده.");
      }

      // ۲. ارسال پیامک به مشتری همراه با کد کوپن
      const smsRes = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: activeSmsCustomer.phone,
          message: smsText.trim(),
          couponCode: cleanCoupon,
        }),
      });

      const smsJson = await smsRes.json().catch(() => ({}));
      if (smsRes.ok && smsJson.success) {
        soundEngine.playSuccess();
        showFeedback(
          `✓ کوپن «${cleanCoupon}» در دیتابیس ثبت شد و پیامک با موفقیت به ${activeSmsCustomer.phone} ارسال گردید.`,
          "success"
        );
        setIsSmsModalOpen(false);
      } else {
        showFeedback(
          `✓ کوپن «${cleanCoupon}» در دیتابیس ثبت و فعال شد، اما ارسال پیامک با خطا مواجه شد: ${
            smsJson.message || ""
          }`,
          "error"
        );
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("coupons_updated"));
      }
    } catch (err: any) {
      showFeedback(err.message || "خطا در عملیات ثبت و ارسال.", "error");
    } finally {
      setSendingSms(false);
    }
  };

  const getStageBadge = (stage: CrmCustomer["lifecycle_stage"]) => {
    switch (stage) {
      case "vip":
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-black text-[10px] whitespace-nowrap">
            💎 VIP الماس
          </span>
        );
      case "active":
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[10px] whitespace-nowrap">
            🟢 خریدار فعال
          </span>
        );
      case "prospect":
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-[10px] whitespace-nowrap">
            🟡 در حال مذاکره / انتظار پرداخت
          </span>
        );
      case "at_risk":
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black text-[10px] whitespace-nowrap">
            🔴 ریسک ریزش
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-300 font-black text-[10px] whitespace-nowrap">
            ⚪ سرنخ (Lead)
          </span>
        );
    }
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(cleanDigitsInput(search) || search) ||
      (c.city || "").toLowerCase().includes(q) ||
      (c.province || "").toLowerCase().includes(q);
    const matchStage = selectedStage === "all" || c.lifecycle_stage === selectedStage;
    return matchSearch && matchStage;
  });

  const totalConfirmedLtv = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
  const totalVipCount = customers.filter((c) => c.lifecycle_stage === "vip").length;
  const totalActiveCount = customers.filter((c) => c.lifecycle_stage === "active").length;

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      {actionFeedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " +
            (actionFeedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {actionFeedback.text}
        </div>
      )}

      <div className="bg-[var(--modal-bg)] p-4 sm:p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>👥</span> سامانه هوشمند مدیریت ارتباط با مشتریان (Enterprise CRM)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پایش چرخه عمر مشتریان، ارزش مادام‌العمر قطعی (LTV)، ثبت دستی و ارسال پیامک بازاریابی هدفمند
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleOpenNewCustomer}
            className="flex-1 md:flex-initial justify-center px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>افزودن دستی مخاطب</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              fetchCrmData();
            }}
            className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer"
            title="همگام‌سازی بلادرنگ"
          >
            🔄
          </button>
        </div>
      </div>

      {/* کارت‌های خلاصه وضعیت باشگاه مشتریان */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">کل مخاطبان باشگاه:</span>
          <span className="text-lg font-black font-mono text-[var(--accent-blue)] block">
            {customers.length} نفر
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">مشتریان VIP الماس:</span>
          <span className="text-lg font-black font-mono text-blue-400 block">
            {totalVipCount} نفر
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">خریداران فعال:</span>
          <span className="text-lg font-black font-mono text-emerald-500 block">
            {totalActiveCount} نفر
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm space-y-1">
          <span className="text-[var(--text-secondary)] font-bold">مجموع خرید قطعی (LTV):</span>
          <span className="text-lg font-black font-mono text-emerald-500 block">
            {totalConfirmedLtv.toLocaleString("fa-IR")} ت
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 md:gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-1 text-xs scrollbar-none">
          {[
            { id: "all", label: "همه مخاطبان", count: customers.length },
            { id: "vip", label: "💎 VIP الماس", count: totalVipCount },
            { id: "active", label: "🟢 خریداران فعال", count: totalActiveCount },
            {
              id: "prospect",
              label: "🟡 در حال مذاکره",
              count: customers.filter((c) => c.lifecycle_stage === "prospect").length,
            },
            {
              id: "lead",
              label: "⚪ سرنخ‌ها",
              count: customers.filter((c) => c.lifecycle_stage === "lead").length,
            },
            {
              id: "at_risk",
              label: "🔴 ریسک ریزش",
              count: customers.filter((c) => c.lifecycle_stage === "at_risk").length,
            },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSelectedStage(st.id);
              }}
              className={
                "px-3.5 py-2 rounded-2xl font-bold transition whitespace-nowrap cursor-pointer " +
                (selectedStage === st.id
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
              }
            >
              {st.label} ({st.count})
            </button>
          ))}
        </div>

        <div className="w-full lg:w-72">
          <input
            type="text"
            placeholder="🔍 جستجو در نام، موبایل، شهر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      <div className="bg-[var(--modal-bg)] p-4 sm:p-6 rounded-3xl border border-[var(--card-border)] shadow-xl overflow-x-auto">
        <table className="w-full text-right text-xs border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black pb-3">
              <th className="p-3.5">نام و نام خانوادگی</th>
              <th className="p-3.5">شماره تماس</th>
              <th className="p-3.5 text-center">مرحله چرخه عمر</th>
              <th className="p-3.5 text-center">تعداد فاکتور</th>
              <th className="p-3.5">حجم کل خرید قطعی (LTV)</th>
              <th className="p-3.5">موقعیت و شهر</th>
              <th className="p-3.5 text-center">عملیات CRM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)] font-medium">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                  در حال بارگذاری پایگاه داده مخاطبان CRM...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                  مخاطبی در این دسته‌بندی یافت نشد.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--input-bg)]/60 transition">
                  <td className="p-3.5">
                    <div className="font-black text-[var(--text-primary)]">{c.full_name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(c.tags || []).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[var(--input-bg)] border border-[var(--card-border)] text-[9px] text-[var(--text-secondary)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td
                    className="p-3.5 font-mono text-[var(--accent-blue)] font-bold"
                    dir="ltr"
                  >
                    {c.phone}
                  </td>
                  <td className="p-3.5 text-center">{getStageBadge(c.lifecycle_stage)}</td>
                  <td className="p-3.5 font-mono text-center">
                    <div className="font-black text-[var(--text-primary)]">
                      {c.order_count || 0} فاکتور موفق
                    </div>
                    {Number(c.pending_orders_count || 0) > 0 && (
                      <div className="text-[10px] text-amber-500 font-bold mt-0.5">
                        ({c.pending_orders_count} در انتظار پرداخت)
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="font-black text-emerald-600 dark:text-emerald-400">
                      {(c.total_spent || 0).toLocaleString("fa-IR")} تومان
                    </div>
                    {Number(c.pending_amount || 0) > 0 && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        سبد معلق: {Number(c.pending_amount).toLocaleString("fa-IR")} ت
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 text-[var(--text-secondary)] font-medium">
                    {c.province || "تهران"}، {c.city || "تهران"}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenRewardModal(c)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
                        title="ارسال پیامک و کد تخفیف"
                      >
                        🎁 پیامک / کوپن
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditCustomer(c)}
                        className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
                        title="ویرایش پرونده"
                      >
                        ✏️ پرونده
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(c)}
                        className="p-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 text-[11px] transition cursor-pointer"
                        title="حذف از CRM"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* مودال ثبت و ویرایش کامل پرونده مشتری */}
      {isModalOpen && editingCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setIsModalOpen(false);
          }}
        >
          <div className="max-w-xl w-full p-5 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 text-xs text-[var(--text-primary)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-[var(--accent-blue)]">
                {editingCustomer.id ? "✏️ ویرایش پرونده مشتری در CRM" : "➕ ثبت پرونده مشتری جدید"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.full_name || ""}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, full_name: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    شماره تلفن همراه (۱۱ رقم) *
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    maxLength={11}
                    placeholder="0912..."
                    value={editingCustomer.phone || ""}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        phone: cleanDigitsInput(e.target.value),
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    پست الکترونیک (ایمیل)
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={editingCustomer.email || ""}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, email: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    مرحله چرخه عمر مخاطب
                  </label>
                  <select
                    value={editingCustomer.lifecycle_stage || "lead"}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        lifecycle_stage: e.target.value as any,
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    <option value="lead">⚪ سرنخ اولیه (Lead)</option>
                    <option value="prospect">🟡 در حال مشاوره و مذاکره (Prospect)</option>
                    <option value="active">🟢 خریدار عادی و فعال (Active)</option>
                    <option value="vip">💎 مشتری ویژه الماس (VIP)</option>
                    <option value="at_risk">🔴 در معرض ریزش (At Risk)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    استان
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.province || "تهران"}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, province: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    شهرستان / شهر
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.city || "تهران"}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, city: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    کد پستی (۱۰ رقم)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={10}
                    value={editingCustomer.postal_code || ""}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        postal_code: cleanDigitsInput(e.target.value),
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    برچسب‌ها (با ویرگول جدا کنید)
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: خریدار وفادار، همکار، شیراز"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    نشانی دقیق پستی
                  </label>
                  <textarea
                    rows={2}
                    value={editingCustomer.address || ""}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, address: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    یادداشت‌های محرمانه داخلی کارشناس فروش:
                  </label>
                  <textarea
                    rows={3}
                    value={editingCustomer.internal_notes || ""}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        internal_notes: e.target.value,
                      })
                    }
                    placeholder="شرح تماس، نیازمندی‌ها، کالاهای مورد علاقه مشتری..."
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-xl cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? "در حال ذخیره‌سازی در پایگاه داده..."
                  : "💾 ذخیره پرونده در دیتابیس CRM"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* مودال ساخت کوپن اختصاصی و ارسال پیامک به مشتری */}
      {isSmsModalOpen && activeSmsCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !sendingSms) setIsSmsModalOpen(false);
          }}
        >
          <div className="max-w-md w-full p-5 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 text-xs text-[var(--text-primary)] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="font-black text-sm text-[var(--accent-blue)]">
                  🎁 پاداش و کد تخفیف اختصاصی: {activeSmsCustomer.full_name}
                </h3>
                <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                  گیرنده: {activeSmsCustomer.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSmsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendSmsAndCreateCoupon} className="space-y-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  کد تخفیف اختصاصی تولیدشده:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  required
                  value={rewardCouponCode}
                  onChange={(e) =>
                    setRewardCouponCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
                    )
                  }
                  className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 font-mono font-black text-amber-500 outline-none focus:border-amber-500 text-center text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    نوع تخفیف:
                  </label>
                  <select
                    value={rewardDiscountType}
                    onChange={(e) =>
                      setRewardDiscountType(e.target.value as "percent" | "fixed")
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    <option value="percent">درصدی (%)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    مقدار تخفیف:
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={rewardDiscountValue}
                    onChange={(e) =>
                      setRewardDiscountValue(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    مدت اعتبار (روز):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={rewardExpireDays}
                    onChange={(e) => setRewardExpireDays(Math.max(1, Number(e.target.value)))}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                    حداقل خرید (تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={rewardMinPurchase}
                    onChange={(e) =>
                      setRewardMinPurchase(Math.max(0, Number(e.target.value)))
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  متن پیامک ارسالی:
                </label>
                <textarea
                  rows={4}
                  required
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={sendingSms}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs hover:opacity-90 shadow-xl cursor-pointer disabled:opacity-50"
              >
                {sendingSms
                  ? "در حال ثبت کوپن و ارسال پیامک..."
                  : "ثبت کوپن در دیتابیس و ارسال پیامک 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
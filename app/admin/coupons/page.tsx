"use client";
// File Path: app/admin/coupons/page.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  type?: "percent" | "fixed";
  discount_percent?: number | null;
  discount_amount?: number | null;
  value?: number | null;
  discount_value?: number | null;
  min_purchase?: number | null;
  min_order_amount?: number | null;
  max_discount?: number | null;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  times_used?: number;
  used_count?: number;
  target_type?: "all" | "product" | "category";
  target_id?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  description?: string | null;
  is_active: boolean;
  publish_to_header?: boolean;
  created_at?: string;
}

function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (let i = 0; i < 13; i++) {
    if (days < sal_a[i]) {
      gm = i;
      break;
    }
    days -= sal_a[i];
  }
  const gd = days + 1;
  return [gy, gm, gd];
}

function isJalaliLeapYear(jy: number): boolean {
  const r = ((jy - 474) % 2820) + 474;
  return ((r * 682) % 2816) < 682;
}

function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const PERSIAN_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function toFaDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}

function PersianDateTimePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ و ساعت...",
  allowClear = false,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = value ? new Date(value) : new Date();
  const [initJy, initJm, initJd] = gregorianToJalali(
    initialDate.getFullYear(),
    initialDate.getMonth() + 1,
    initialDate.getDate()
  );

  const [currentYear, setCurrentYear] = useState(initJy);
  const [currentMonth, setCurrentMonth] = useState(initJm);
  const [selectedDay, setSelectedDay] = useState(value ? initJd : 0);
  const [hour, setHour] = useState(value ? initialDate.getHours() : 12);
  const [minute, setMinute] = useState(value ? initialDate.getMinutes() : 0);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        setCurrentYear(jy);
        setCurrentMonth(jm);
        setSelectedDay(jd);
        setHour(d.getHours());
        setMinute(d.getMinutes());
      }
    } else {
      setSelectedDay(0);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const [firstGy, firstGm, firstGd] = jalaliToGregorian(currentYear, currentMonth, 1);
  const firstDayOfWeek = (new Date(firstGy, firstGm - 1, firstGd).getDay() + 1) % 7;
  const daysInMonth = getDaysInJalaliMonth(currentYear, currentMonth);

  const emitDateTime = (day: number, h: number, m: number) => {
    if (day <= 0) return;
    const [gy, gm, gd] = jalaliToGregorian(currentYear, currentMonth, day);
    const targetDate = new Date(gy, gm - 1, gd, h, m, 0, 0);
    onChange(targetDate.toISOString());
  };

  const handleDayClick = (day: number) => {
    soundEngine.playClick();
    setSelectedDay(day);
    emitDateTime(day, hour, minute);
  };

  const handlePrevMonth = () => {
    soundEngine.playClick();
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    soundEngine.playClick();
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectNow = () => {
    soundEngine.playClick();
    const now = new Date();
    onChange(now.toISOString());
    setIsOpen(false);
  };

  const handleClear = () => {
    soundEngine.playClick();
    onChange("");
    setIsOpen(false);
  };

  const formattedDisplay = value
    ? (() => {
        try {
          const d = new Date(value);
          const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
          const hStr = String(d.getHours()).padStart(2, "0");
          const mStr = String(d.getMinutes()).padStart(2, "0");
          return `${toFaDigits(jd)} ${PERSIAN_MONTHS[jm - 1]} ${toFaDigits(jy)} — ساعت ${toFaDigits(hStr)}:${toFaDigits(mStr)}`;
        } catch {
          return placeholder;
        }
      })()
    : "";

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex items-center justify-between text-xs select-none"
      >
        <span className={formattedDisplay ? "font-bold text-[var(--text-primary)]" : "text-slate-400 font-medium"}>
          {formattedDisplay || placeholder}
        </span>
        <span className="text-base text-[var(--accent-blue)]">📅</span>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 w-72 sm:w-80 p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center font-bold text-xs"
            >
              ‹
            </button>
            <div className="flex items-center gap-1.5 font-black text-xs text-[var(--accent-blue)]">
              <span>{PERSIAN_MONTHS[currentMonth - 1]}</span>
              <span>{toFaDigits(currentYear)}</span>
            </div>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center font-bold text-xs"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-[var(--text-secondary)]">
            {PERSIAN_DAYS.map((wd, i) => (
              <span key={wd} className={i === 6 ? "text-rose-400" : ""}>{wd}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={"empty-" + i} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDay === dayNum;
              const isFriday = (firstDayOfWeek + i) % 7 === 6;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleDayClick(dayNum)}
                  className={`h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? "bg-[var(--accent-blue)] text-white shadow-md font-black"
                      : isFriday
                      ? "text-rose-400 hover:bg-rose-500/10"
                      : "hover:bg-[var(--input-bg)] text-[var(--text-primary)]"
                  }`}
                >
                  {toFaDigits(dayNum)}
                </button>
              );
            })}
          </div>

          <div className="pt-2.5 border-t border-[var(--card-border)] flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-secondary)]">⏰ ساعت و دقیقه:</span>
            <div className="flex items-center gap-1.5" dir="ltr">
              <select
                value={hour}
                onChange={(e) => {
                  const h = Number(e.target.value);
                  setHour(h);
                  emitDateTime(selectedDay, h, minute);
                }}
                className="p-1 px-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs outline-none cursor-pointer"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={"h-" + i} value={i}>{String(i).padStart(2, "0")}</option>
                ))}
              </select>
              <span className="font-bold">:</span>
              <select
                value={minute}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setMinute(m);
                  emitDateTime(selectedDay, hour, m);
                }}
                className="p-1 px-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const m = i * 5;
                  return <option key={"m-" + m} value={m}>{String(m).padStart(2, "0")}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-xs font-bold">
            <button type="button" onClick={handleSelectNow} className="text-[var(--accent-blue)] hover:underline cursor-pointer">هم‌اکنون</button>
            <div className="flex gap-2">
              {allowClear && (
                <button type="button" onClick={handleClear} className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 cursor-pointer">بدون انقضا</button>
              )}
              <button type="button" onClick={() => setIsOpen(false)} className="px-3 py-1 rounded-lg bg-[var(--accent-blue)] text-white cursor-pointer">تایید</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; title: string }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [crmPhones, setCrmPhones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);

  // استیت‌های مربوط به مودال هوشمند پیامکی CRM
  const [smsModal, setSmsModal] = useState<{ isOpen: boolean; coupon: Coupon | null }>({ isOpen: false, coupon: null });
  const [smsFilter, setSmsFilter] = useState<"all" | "mci" | "irancell" | "rightel" | "custom">("all");
  const [customPhones, setCustomPhones] = useState<string>("");

  const [form, setForm] = useState<{
    id?: string;
    code: string;
    discount_type: "percent" | "fixed";
    discount_percent: number | "";
    discount_amount: number | "";
    min_purchase: number | "";
    max_discount: number | "";
    usage_limit: number | "";
    target_type: "all" | "product" | "category";
    target_id: string;
    starts_at: string;
    expires_at: string;
    description: string;
    is_active: boolean;
    publishToHeaderBar: boolean;
  }>({
    code: "",
    discount_type: "percent",
    discount_percent: 15,
    discount_amount: "",
    min_purchase: 500000,
    max_discount: 300000,
    usage_limit: 50,
    target_type: "all",
    target_id: "",
    starts_at: "",
    expires_at: "",
    description: "جشنواره فروش ویژه آکسون کور",
    is_active: true,
    publishToHeaderBar: true,
  });

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchCouponsAndCatalog = useCallback(async () => {
    try {
      const timestamp = new Date().getTime();
      const [cRes, pRes, catRes, crmRes] = await Promise.all([
        fetch(`/api/admin/coupons?t=${timestamp}`, { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }).catch(() => null),
        fetch("/api/categories", { cache: "no-store" }).catch(() => null),
        fetch("/api/crm", { cache: "no-store" }).catch(() => null),
      ]);
      const cJson = await cRes.json();
      if (cRes.ok && cJson.success) {
        setCoupons(cJson.coupons || []);
      }
      const catSet = new Set<string>();
      if (pRes && pRes.ok) {
        const pJson = await pRes.json();
        const pList = pJson.data || pJson.products || [];
        setProducts(
          (Array.isArray(pList) ? pList : []).map((p: any) => {
            if (p.category) catSet.add(p.category);
            return {
              id: String(p.id),
              title: p.title || p.name || "کالای دیجیتال",
            };
          })
        );
      }
      if (catRes && catRes.ok) {
        const catJson = await catRes.json();
        (catJson.categories || catJson.data || []).forEach((c: any) => {
          if (c.name) catSet.add(c.name);
        });
      }
      if (crmRes && crmRes.ok) {
        const crmJson = await crmRes.json();
        const phones = (crmJson.customers || [])
          .map((x: any) => String(x.phone || "").replace(/\D/g, ""))
          .filter((ph: string) => ph.length === 11);
        setCrmPhones(Array.from(new Set(phones)));
      }
      setCategories(Array.from(catSet));
    } catch {
      console.error("خطا در واکشی کدهای تخفیف.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCouponsAndCatalog();
    const channel = supabase
      .channel("realtime-admin-coupons-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => {
        fetchCouponsAndCatalog();
        window.dispatchEvent(new CustomEvent("coupons_updated"));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCouponsAndCatalog]);

  const generateRandomCouponCode = () => {
    soundEngine.playClick();
    const prefixes = ["AXON", "VIP", "TECH", "FEST", "OFF", "GIFT"];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    setForm((prev) => ({ ...prev, code: p + "-" + rand }));
  };

  const applyDurationPreset = (hours: number) => {
    soundEngine.playClick();
    const now = new Date();
    const end = new Date(now.getTime() + hours * 3600 * 1000);
    setForm((prev) => ({
      ...prev,
      starts_at: now.toISOString(),
      expires_at: end.toISOString(),
    }));
  };

  const handleOpenCreate = () => {
    soundEngine.playClick();
    setEditingCoupon(null);
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setForm({
      code: "AXON-" + randSuffix,
      discount_type: "percent",
      discount_percent: 15,
      discount_amount: "",
      min_purchase: 500000,
      max_discount: 300000,
      usage_limit: 50,
      target_type: "all",
      target_id: products[0]?.id || "",
      starts_at: new Date().toISOString(),
      expires_at: "",
      description: "جشنواره فروش ویژه آکسون کور",
      is_active: true,
      publishToHeaderBar: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    soundEngine.playClick();
    setEditingCoupon(c);
    const dType = (c.discount_type || c.type || "percent") === "fixed" ? "fixed" : "percent";
    const dPercent = dType === "percent" ? (c.discount_percent ?? c.value ?? c.discount_value ?? "") : "";
    const dAmount = dType === "fixed" ? (c.discount_amount ?? c.value ?? c.discount_value ?? "") : "";
    
    setForm({
      id: c.id,
      code: c.code,
      discount_type: dType,
      discount_percent: dPercent,
      discount_amount: dAmount,
      min_purchase: c.min_purchase ?? c.min_order_amount ?? "",
      max_discount: c.max_discount ?? c.max_discount_amount ?? "",
      usage_limit: c.usage_limit ?? "",
      target_type:
        c.target_type === "product"
          ? "product"
          : c.target_type === "category"
          ? "category"
          : "all",
      target_id: c.target_id || products[0]?.id || "",
      starts_at: c.starts_at || "",
      expires_at: c.expires_at || "",
      description: c.description || "جشنواره فروش ویژه آکسون کور",
      is_active: Boolean(c.is_active),
      publishToHeaderBar: c.publish_to_header !== false,
    });
    setIsModalOpen(true);
  };

  const handleTogglePublishHeader = async (c: Coupon) => {
    soundEngine.playClick();
    const newPublish = c.publish_to_header === false ? true : false; 
    
    setCoupons(prev => prev.map(coupon => coupon.id === c.id ? { ...coupon, publish_to_header: newPublish } : coupon));

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, publish_to_header: newPublish }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        notify(
          newPublish
            ? `✓ کد «${c.code}» به نوار اعلان سایت اضافه شد.`
            : `✓ کد «${c.code}» از نوار اعلان سایت حذف شد.`
        );
        fetchCouponsAndCatalog();
        window.dispatchEvent(new CustomEvent("coupons_updated"));
      } else {
        setCoupons(prev => prev.map(coupon => coupon.id === c.id ? { ...coupon, publish_to_header: !newPublish } : coupon));
      }
    } catch {
        setCoupons(prev => prev.map(coupon => coupon.id === c.id ? { ...coupon, publish_to_header: !newPublish } : coupon));
    }
  };

  // دریافت لیست فیلتر شده بر اساس انتخاب مدیر
  const getFilteredPhones = () => {
    if (smsFilter === "custom") {
      return customPhones
        .split("\n")
        .map((p) => p.trim().replace(/\D/g, ""))
        .filter((p) => p.length === 11 && p.startsWith("09"));
    }
    return crmPhones.filter((phone) => {
      if (smsFilter === "mci") return /^09(1[0-9]|9[0-4])[0-9]{7}$/.test(phone);
      if (smsFilter === "irancell") return /^09(3[0-9]|0[1-5])[0-9]{7}$/.test(phone);
      if (smsFilter === "rightel") return /^09(2[0-2])[0-9]{7}$/.test(phone);
      return true; // "all"
    });
  };

  const handleSendCampaignSmsFinal = async () => {
    const c = smsModal.coupon;
    if (!c) return;

    soundEngine.playClick();
    const targetPhones = getFilteredPhones();

    if (targetPhones.length === 0) {
      alert("هیچ شماره موبایلی برای ارسال یافت نشد. لطفاً فیلتر را تغییر دهید.");
      return;
    }

    if (
      !confirm(
        `آیا مایلید کد تخفیف «${c.code}» به صورت کمپین پیامکی به ${targetPhones.length} شماره ارسال شود؟`
      )
    ) {
      return;
    }

    setSendingSmsId(c.id);
    setSmsModal({ isOpen: false, coupon: null });
    
    try {
      const res = await fetch("/api/admin/send-discount-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phones: targetPhones, code: c.code }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message || `✓ پیامک کمپین تخفیف به ${targetPhones.length} نفر ارسال شد.`);
      } else {
        notify(json.message || "خطا در ارسال پیامک کمپین.");
      }
    } catch {
       notify("خطا در ارتباط با سرور هنگام ارسال پیامک.");
    } finally {
      setSendingSmsId(null);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    soundEngine.playClick();
    const newActiveState = !c.is_active;

    setCoupons(prev => prev.map(coupon => coupon.id === c.id ? { ...coupon, is_active: newActiveState } : coupon));

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, is_active: newActiveState }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        notify(newActiveState ? "✓ کوپن فعال شد." : "✓ کوپن غیرفعال شد.");
        fetchCouponsAndCatalog();
        window.dispatchEvent(new CustomEvent("coupons_updated"));
      } else {
         setCoupons(prev => prev.map(coupon => coupon.id === c.id ? { ...coupon, is_active: !newActiveState } : coupon));
      }
    } catch {
       setCoupons(prev => prev.map(coupon => coupon.id === c.id ? { ...coupon, is_active: !newActiveState } : coupon));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این کد تخفیف اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/admin/coupons?id=" + encodeURIComponent(id), {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify("کد تخفیف با موفقیت حذف گردید و اعلان هدر پاکسازی شد.");
        fetchCouponsAndCatalog();
        window.dispatchEvent(new CustomEvent("coupons_updated"));
      }
    } catch {}
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    const numericVal =
      form.discount_type === "percent"
        ? Number(form.discount_percent)
        : Number(form.discount_amount);

    if (!form.code.trim() || isNaN(numericVal) || numericVal <= 0) {
      alert("لطفاً کد تخفیف و مقدار معتبر وارد نمایید.");
      return;
    }

    const payload = {
      id: form.id,
      code: form.code,
      discount_type: form.discount_type,
      type: form.discount_type,
      value: numericVal,
      discount_value: numericVal,
      discount_percent: form.discount_type === "percent" ? Number(form.discount_percent) : null,
      discount_amount: form.discount_type === "fixed" ? Number(form.discount_amount) : null,
      min_purchase: form.min_purchase ? Number(form.min_purchase) : 0,
      min_order_amount: form.min_purchase ? Number(form.min_purchase) : 0,
      max_discount: form.max_discount ? Number(form.max_discount) : 0,
      max_discount_amount: form.max_discount ? Number(form.max_discount) : 0,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : 100,
      target_type: form.target_type,
      target_id: form.target_type !== "all" ? form.target_id : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      description: form.description ? String(form.description).trim() : null,
      is_active: form.is_active,
      publish_to_header: form.publishToHeaderBar,
    };

    try {
      const method = editingCoupon ? "PUT" : "POST";
      const res = await fetch("/api/admin/coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(editingCoupon ? "✓ کوپن تخفیف ویرایش شد." : "✓ کوپن تخفیف با موفقیت ثبت شد.");
        setIsModalOpen(false);
        fetchCouponsAndCatalog();
        window.dispatchEvent(new CustomEvent("coupons_updated"));
      } else {
        alert(json.message || "خطا در ذخیره‌سازی کوپن.");
      }
    } catch {
      alert("خطا در ارتباط با سرور.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] select-text" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-4">
        <div>
          <h1 className="text-lg sm:text-sm md:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏷️</span> مدیریت پیشرفته کوپن‌های زمان‌دار، هدفمند و کمپین‌های پیامکی CRM
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تولید کد تخفیف روی کل سبد، دسته‌بندی یا کالای خاص + اسلایدر چرخشی هوشمند هدر سایت
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span> ایجاد کوپن زمان‌دار جدید
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-black animate-fadeIn">
          {feedback}
        </div>
      )}

      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">در حال واکشی کدهای تخفیف...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            هیچ کد تخفیفی ثبت نشده است. روی «ایجاد کوپن زمان‌دار جدید» کلیک کنید.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-full lg:min-w-[920px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                  <th className="pb-3 px-3">کد تخفیف (کپی سریع)</th>
                  <th className="pb-3 px-3">مقدار تخفیف</th>
                  <th className="pb-3 px-3">دامنه هدف</th>
                  <th className="pb-3 px-3">زمان شروع و انقضا</th>
                  <th className="pb-3 px-3">میزان مصرف</th>
                  <th className="pb-3 px-3">وضعیت</th>
                  <th className="pb-3 px-3 text-left">عملیات و هدر سایت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {coupons.map((c) => {
                  const isPct = (c.discount_type || c.type || "percent") === "percent";
                  const valNum = Number(
                    isPct
                      ? c.discount_percent ?? c.value ?? c.discount_value ?? 0
                      : c.discount_amount ?? c.value ?? c.discount_value ?? 0
                  );
                  const used = Number(c.times_used ?? c.used_count ?? 0);
                  const targetProd =
                    c.target_type === "product" && c.target_id
                      ? products.find((p) => p.id === String(c.target_id))
                      : null;

                  return (
                    <tr key={c.id} className="hover:bg-[var(--input-bg)]/40 transition">
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(c.code);
                            soundEngine.playSuccess();
                            setCopiedId(c.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="font-mono font-black text-[13px] px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--accent-blue)] tracking-wider cursor-pointer"
                        >
                          {copiedId === c.id ? "✓ کپی شد" : "📋 " + c.code}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-black text-emerald-500">
                        {isPct ? valNum + "% تخفیف" : valNum.toLocaleString("fa-IR") + " تومان"}
                      </td>
                      <td className="py-3.5 px-3">
                        {c.target_type === "product" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 font-bold text-[11px]">
                            📦 کالا: {targetProd ? targetProd.title : c.target_id}
                          </span>
                        ) : c.target_type === "category" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-400 font-bold text-[11px]">
                            📁 دسته: {c.target_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">🌟 همه محصولات سایت</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400 space-y-0.5">
                        {c.starts_at && <div>شروع: {new Date(c.starts_at).toLocaleString("fa-IR")}</div>}
                        <div>
                          انقضا: {c.expires_at ? new Date(c.expires_at).toLocaleString("fa-IR") : "بدون انقضا"}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold">
                        {used} / {c.usage_limit || "∞"}
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={
                            "px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer transition " +
                            (c.is_active
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                              : "bg-rose-500/15 border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white")
                          }
                        >
                          {c.is_active ? "فعال ✓" : "غیرفعال"}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePublishHeader(c)}
                            className={
                              "px-2.5 py-1.5 rounded-xl border font-bold text-[11px] cursor-pointer transition " +
                              (c.publish_to_header !== false
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500 hover:text-white"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500 hover:text-white")
                            }
                            title="خاموش / روشن کردن نمایش در نوار بالای سایت"
                          >
                            {c.publish_to_header !== false ? "❌ حذف از هدر" : "📢 نمایش در هدر"}
                          </button>
                          <button
                            type="button"
                            disabled={sendingSmsId === c.id}
                            onClick={() => {
                              soundEngine.playClick();
                              setSmsModal({ isOpen: true, coupon: c });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold text-[11px] cursor-pointer hover:bg-amber-500 hover:text-slate-950 transition"
                          >
                            {sendingSmsId === c.id ? "در حال ارسال..." : "📲 پیامک CRM"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer hover:bg-slate-700 transition"
                          >
                            ✏️ ویرایش
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {smsModal.isOpen && smsModal.coupon && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--accent-blue)]">
                📲 ارسال هوشمند پیامک کمپین
              </h3>
              <button
                type="button"
                onClick={() => setSmsModal({ isOpen: false, coupon: null })}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            
            <p className="font-medium text-[var(--text-secondary)]">
              کد تخفیف <strong className="text-[var(--text-primary)] font-mono">{smsModal.coupon.code}</strong> را برای کدام دسته از مشتریان (باشگاه مشتریان) ارسال می‌کنید؟
            </p>

            <div className="space-y-2.5">
              {[
                { id: "all", label: "🌟 تمامی مشتریان CRM" },
                { id: "mci", label: "🔵 فقط مشترکین همراه اول" },
                { id: "irancell", label: "🟡 فقط مشترکین ایرانسل" },
                { id: "rightel", label: "🟣 فقط مشترکین رایتل" },
                { id: "custom", label: "✍️ وارد کردن دستی شماره‌ها" }
              ].map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition">
                  <input 
                    type="radio" 
                    name="smsTarget" 
                    value={opt.id} 
                    checked={smsFilter === opt.id}
                    onChange={(e) => setSmsFilter(e.target.value as any)}
                    className="accent-[var(--accent-blue)] w-4 h-4"
                  />
                  <span className="font-bold">{opt.label}</span>
                </label>
              ))}
            </div>

            {smsFilter === "custom" && (
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  لیست شماره‌ها (هر خط یک شماره):
                </label>
                <textarea
                  dir="ltr"
                  rows={4}
                  placeholder="09123456789&#10;09376110200"
                  value={customPhones}
                  onChange={(e) => setCustomPhones(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)] text-xs"
                />
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-[var(--card-border)]">
              <span className="font-bold text-[var(--text-secondary)]">
                تعداد گیرندگان: <strong className="text-emerald-500 font-mono text-sm">{getFilteredPhones().length}</strong> نفر
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSendCampaignSmsFinal}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-lg hover:opacity-90 transition cursor-pointer"
                >
                  🚀 ارسال کمپین
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--accent-blue)]">
                {editingCoupon ? "✏️ ویرایش کامل کد تخفیف" : "➕ تعریف کوپن تخفیف زمان‌دار و هوشمند"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
                  کد تخفیف (لاتین) *:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                      })
                    }
                    placeholder="AXON-VIP"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black uppercase outline-none focus:border-[var(--accent-blue)] text-xs"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCouponCode}
                    className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black text-[var(--accent-blue)] cursor-pointer shrink-0 transition flex items-center gap-1.5 text-xs"
                  >
                    <span>🎲</span>
                    <span>تولید کد رندوم</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">نوع تخفیف:</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer text-xs"
                  >
                    <option value="percent">درصدی (%)</option>
                    <option value="fixed">مبلغ ثابت نقدی (تومان)</option>
                  </select>
                </div>

                {form.discount_type === "percent" ? (
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">
                      درصد تخفیف (۱ تا ۱۰۰) *:
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={form.discount_percent}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          discount_percent: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">
                      مبلغ تخفیف (تومان) *:
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={form.discount_amount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          discount_amount: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">
                    حداقل خرید (تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.min_purchase}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        min_purchase: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="0 = بدون محدودیت"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">
                    سقف مبلغ تخفیف (تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.max_discount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        max_discount: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="اختیاری"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">
                    ظرفیت کل مجاز استفاده:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.usage_limit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        usage_limit: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">
                  توضیحات و مناسبت جشنواره:
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="مثال: جشنواره فروش ویژه عیدانه، تخفیف روز مهندس..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none text-xs"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
                <label className="block font-black text-[var(--accent-blue)]">
                  🎯 دامنه هدف‌گذاری کد تخفیف:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "all", label: "🌟 کل محصولات" },
                    { id: "category", label: "📁 دسته‌بندی خاص" },
                    { id: "product", label: "📦 یک محصول خاص" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          target_type: t.id as any,
                          target_id:
                            t.id === "product"
                              ? products[0]?.id || ""
                              : t.id === "category"
                              ? categories[0] || ""
                              : "",
                        })
                      }
                      className={
                        "py-2 rounded-xl font-bold cursor-pointer transition " +
                        (form.target_type === t.id
                          ? "bg-[var(--accent-blue)] text-white shadow"
                          : "bg-[var(--modal-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]")
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {form.target_type === "product" && (
                  <select
                    value={form.target_id}
                    onChange={(e) => setForm({ ...form, target_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        📦 {p.title}
                      </option>
                    ))}
                  </select>
                )}

                {form.target_type === "category" && (
                  <select
                    value={form.target_id}
                    onChange={(e) => setForm({ ...form, target_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        📁 {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-[var(--accent-blue)]">⏱ زمان‌بندی سریع اعتبار:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(24)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-[10px] cursor-pointer"
                    >
                      ۲۴ ساعته
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(48)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-[10px] cursor-pointer"
                    >
                      ۴۸ ساعته
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(24 * 7)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-[10px] cursor-pointer"
                    >
                      ۷ روزه
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(24 * 30)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-[10px] cursor-pointer"
                    >
                      ۱ ماهه
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">
                      🕒 تاریخ و ساعت شروع:
                    </label>
                    <PersianDateTimePicker
                      value={form.starts_at}
                      onChange={(iso) => setForm({ ...form, starts_at: iso })}
                      placeholder="انتخاب تاریخ و ساعت شروع..."
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">
                      ⏳ تاریخ و ساعت انقضا:
                    </label>
                    <PersianDateTimePicker
                      value={form.expires_at}
                      onChange={(iso) => setForm({ ...form, expires_at: iso })}
                      placeholder="بدون انقضا (نامحدود)"
                      allowClear={true}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded accent-[var(--accent-blue)] w-4 h-4 cursor-pointer"
                  />
                  <span>کوپن فعال و قابل استفاده در سبد خرید باشد</span>
                </label>

                <label className="flex items-center gap-2 font-black text-sky-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.publishToHeaderBar}
                    onChange={(e) => setForm({ ...form, publishToHeaderBar: e.target.checked })}
                    className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
                  />
                  <span>📢 هم‌زمان این کد تخفیف در «نوار اعلان بالای سایت» هم اعلام شود</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer hover:bg-slate-700 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-lg hover:opacity-90 transition cursor-pointer"
                >
                  💾 ذخیره و انتشار کوپن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// File Path: components/admin/DiscountManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import { couponService, Coupon } from "@/services/couponService";

export default function DiscountManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<number | "">(10);
  const [minOrder, setMinOrder] = useState<number | "">("");
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [usageLimit, setUsageLimit] = useState<number | "">(100);
  const [expiresAt, setExpiresAt] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCoupons = async () => {
    try {
      const data = await couponService.getAll();
      setCoupons(data || []);
    } catch (e) {
      console.error("Error loading coupons in DiscountManager:", e);
    }
  };

  useEffect(() => {
    fetchCoupons();

    const handleCouponsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setCoupons(e.detail);
      else fetchCoupons();
    };

    window.addEventListener("coupons_updated", handleCouponsUpdate);
    return () => {
      window.removeEventListener("coupons_updated", handleCouponsUpdate);
    };
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || value === "" || Number(value) <= 0) {
      setStatusMessage({ type: "error", text: "کد کوپن و مقدار تخفیف الزامی هستند." });
      return;
    }

    soundEngine.playClick();
    setSaving(true);

    const payload: Partial<Coupon> = {
      code: code.trim().toUpperCase(),
      type,
      discount_type: type,
      value: Number(value),
      discount_value: Number(value),
      min_order_amount: minOrder ? Number(minOrder) : undefined,
      max_discount: maxDiscount ? Number(maxDiscount) : undefined,
      max_discount_amount: maxDiscount ? Number(maxDiscount) : undefined,
      usage_limit: usageLimit ? Number(usageLimit) : 100,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      is_active: true,
    };

    try {
      const created = await couponService.create(payload);
      if (created) {
        soundEngine.playSuccess();
        setStatusMessage({ type: "success", text: `⚡ کد تخفیف «${created.code}» با موفقیت در دیتابیس ثبت و فعال شد.` });
        setCode("");
        setValue(10);
        setMinOrder("");
        setMaxDiscount("");
        setUsageLimit(100);
        setExpiresAt("");
        fetchCoupons();
      } else {
        throw new Error("خطا در ایجاد کد تخفیف");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "خطا در ثبت کد تخفیف." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const toggleStatus = async (id: string | number, current: boolean) => {
    soundEngine.playClick();
    await couponService.update(id, { is_active: !current });
    setCoupons(coupons.map((c) => (String(c.id) === String(id) ? { ...c, is_active: !current } : c)));
  };

  const deleteCoupon = async (id: string | number) => {
    if (!confirm("آیا از حذف این کد تخفیف اطمینان دارید؟")) return;
    soundEngine.playClick();
    await couponService.delete(id);
    setCoupons(coupons.filter((c) => String(c.id) !== String(id)));
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏷️</span> مدیریت کدهای تخفیف، جشنواره‌ها و کمپین‌ها
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">ایجاد و مدیریت کوپن‌های درصدی یا نقدی با فعال‌سازی بلادرنگ</p>
        </div>
        <span className="px-4 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-black">
          {coupons.length} کوپن ثبت‌شده
        </span>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleCreateCoupon} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-xl h-fit text-xs">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            + ایجاد کوپن تخفیف جدید
          </h3>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">کد لاتین تخفیف *</label>
            <input
              type="text"
              placeholder="مثلاً: AXON2026"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-black uppercase text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">نوع محاسبه تخفیف</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="percent">درصدی (%)</option>
                <option value="fixed">مبلغ ثابت (تومان)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">مقدار تخفیف *</label>
              <input
                type="number"
                min="1"
                placeholder={type === "percent" ? "مثلا: 20" : "مثلا: 100000"}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">سقف تخفیف (تومان)</label>
              <input
                type="number"
                placeholder="۵۰۰,۰۰۰"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : "")}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">حداقل خرید (تومان)</label>
              <input
                type="number"
                placeholder="۱,۰۰۰,۰۰۰"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value ? Number(e.target.value) : "")}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">تاریخ انقضا (اختیاری)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال ثبت..." : "💾 ثبت و فعال‌سازی فوری کوپن"}
          </button>
        </form>

        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-xl text-xs">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📋 لیست کدهای تخفیف فعال و آرشیو ({coupons.length})
          </h3>

          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {coupons.length === 0 ? (
              <p className="text-xs text-center py-12 text-[var(--text-secondary)] font-bold">هیچ کد تخفیفی ثبت نشده است.</p>
            ) : (
              coupons.map((c) => {
                const isPercent = c.type === "percent" || c.discount_type === "percent";
                const discountVal = Number(c.value ?? c.discount_value ?? 0);
                const isItemActive = c.is_active !== false;

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[var(--accent-blue)] tracking-wider">{c.code}</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          {isPercent ? `${discountVal}٪ تخفیف` : `${discountVal.toLocaleString("fa-IR")} تومان تخفیف`}
                        </span>
                      </div>
                      {c.max_discount && (
                        <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                          سقف تخفیف: {Number(c.max_discount).toLocaleString("fa-IR")} تومان
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => toggleStatus(c.id!, isItemActive)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                          isItemActive
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-500/15 text-slate-500 border border-slate-500/30"
                        }`}
                      >
                        {isItemActive ? "فعال ✓" : "غیرفعال"}
                      </button>
                      <button
                        onClick={() => deleteCoupon(c.id!)}
                        className="p-2 px-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
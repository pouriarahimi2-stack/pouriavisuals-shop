"use client";

import React, { useState, useEffect } from "react";
import { couponService, Coupon } from "@/services/couponService";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // فرم ساخت کد تخفیف جدید
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const list = await couponService.getAll();
      setCoupons(list || []);
    } catch (err) {
      console.error("Error loading coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    setSubmitting(true);
    const newCoupon: Coupon = {
      id: `cpn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: code.trim().toUpperCase(),
      type: discountType,
      discount_type: discountType,
      value: Number(discountValue),
      percent: discountType === "percent" ? Number(discountValue) : undefined,
      amount: discountType === "fixed" ? Number(discountValue) : undefined,
      max_discount: maxDiscount ? Number(maxDiscount) : null,
      min_order_amount: minOrder ? Number(minOrder) : null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    try {
      await couponService.createCoupon(newCoupon);
      await loadCoupons();

      setCode("");
      setDiscountValue("");
      setMaxDiscount("");
      setMinOrder("");
      alert("✅ کد تخفیف با موفقیت در دیتابیس ذخیره و فعال گردید.");
    } catch (err) {
      console.error(err);
      alert("خطا در ایجاد کد تخفیف");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await couponService.updateStatus(id, !currentStatus);
    await loadCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف دائمی این کد تخفیف از پایگاه داده اطمینان دارید؟")) return;
    await couponService.deleteCoupon(id);
    await loadCoupons();
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]">
      <div className="flex justify-between items-center bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏷️</span> مدیریت کدهای تخفیف (Database Live)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تمام تغییرات و کدهای حذف‌شده مستقیماً در پایگاه داده ذخیره می‌شوند و بعد از رفرش بازنمی‌گردند.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleCreateCoupon}
          className="lg:col-span-4 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 shadow-xl text-xs"
        >
          <h3 className="font-black text-sm text-[var(--text-primary)]">
            ➕ ایجاد کد تخفیف جدید:
          </h3>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد تخفیف (لاتین):</label>
            <input
              type="text"
              required
              placeholder="مثال: TECH2026 یا OFF30"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نوع تخفیف:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`flex-1 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                  discountType === "percent"
                    ? "bg-[var(--accent-blue)] text-white shadow-md"
                    : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
                }`}
              >
                درصدی (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`flex-1 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                  discountType === "fixed"
                    ? "bg-[var(--accent-blue)] text-white shadow-md"
                    : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
                }`}
              >
                مبلغ ثابت (تومان)
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
              {discountType === "percent" ? "درصد تخفیف (مثال: ۲۰):" : "مبلغ تخفیف به تومان (مثال: ۵۰۰۰۰):"}
            </label>
            <input
              type="number"
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percent" ? "مثلاً 20" : "مثلاً 50000"}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center focus:border-[var(--accent-blue)]"
            />
          </div>

          {discountType === "percent" && (
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">حداکثر سقف تخفیف به تومان (اختیاری):</label>
              <input
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="مثلاً 200000"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-center focus:border-[var(--accent-blue)]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {submitting ? "در حال ثبت در دیتابیس..." : "ذخیره و فعال‌سازی در دیتابیس 🚀"}
          </button>
        </form>

        <div className="lg:col-span-8 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-5 shadow-xl space-y-4">
          <h3 className="font-black text-sm text-[var(--text-primary)]">
            📋 کدهای تخفیف موجود در سیستم ({coupons.length})
          </h3>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-secondary)] font-bold">
              هیچ کد تخفیفی در پایگاه داده وجود ندارد.
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon, idx) => {
                const uniqueKey = coupon.id || `cpn-${coupon.code || idx}`;
                return (
                  <div
                    key={uniqueKey}
                    className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[var(--accent-blue)] px-2.5 py-0.5 rounded-lg bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20">
                          {coupon.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            coupon.is_active !== false
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-rose-500/15 text-rose-600"
                          }`}
                        >
                          {coupon.is_active !== false ? "فعال" : "غیرفعال"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                        میزان تخفیف:{" "}
                        <strong>
                          {coupon.type === "percent" || coupon.percent
                            ? `%${coupon.percent || coupon.value}`
                            : `${Number(coupon.amount || coupon.value).toLocaleString("fa-IR")} تومان`}
                        </strong>
                        {coupon.max_discount && ` (حداکثر: ${Number(coupon.max_discount).toLocaleString("fa-IR")} تومان)`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(coupon.id, coupon.is_active !== false)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-[11px] hover:border-[var(--accent-blue)] transition cursor-pointer"
                      >
                        {coupon.is_active !== false ? "غیرفعال‌سازی" : "فعال‌سازی"}
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 font-bold text-[11px] hover:bg-rose-500/25 transition cursor-pointer"
                      >
                        حذف دائمی 🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
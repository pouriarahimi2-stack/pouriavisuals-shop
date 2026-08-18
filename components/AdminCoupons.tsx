"use client";

import React, { useState, useEffect } from "react";
import { couponService, Coupon } from "@/services/couponService";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // استیت فرم ساخت کوپن جدید
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(50);
  const [expiresAt, setExpiresAt] = useState<string>("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await couponService.getAll();
      setCoupons(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();

    const handleUpdate = (e: any) => {
      if (e.detail) setCoupons(e.detail);
      else loadCoupons();
    };
    window.addEventListener("coupons_updated", handleUpdate);

    return () => window.removeEventListener("coupons_updated", handleUpdate);
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || value <= 0) return;

    setSubmitting(true);
    try {
      const created = await couponService.create({
        code: code.toUpperCase().trim(),
        type,
        value: Number(value),
        min_order_amount: Number(minOrder) || undefined,
        max_discount_amount: Number(maxDiscount) || undefined,
        usage_limit: Number(usageLimit) || undefined,
        is_active: true,
        expires_at: expiresAt || undefined,
      });

      if (created) {
        showToast(`🎉 کد تخفیف "${created.code}" با موفقیت ذخیره و فعال گردید.`);
        setCode("");
        setValue(10);
        setMinOrder(0);
        setMaxDiscount(0);
        setUsageLimit(50);
        setExpiresAt("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await couponService.update(id, { is_active: !currentStatus });
    showToast("وضعیت کد تخفیف به‌روزرسانی شد.");
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (confirm(`آیا از حذف کد تخفیف "${couponCode}" اطمینان دارید؟`)) {
      await couponService.delete(id);
      showToast("کد تخفیف حذف گردید.");
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* هدر بخش تخفیف‌ها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>🏷️</span> مدیریت کدهای تخفیف و جشنواره‌ها
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ایجاد کوپن‌های درصدی یا نقدی با قابلیت تعیین حداقل خرید، سقف تخفیف و محدودیت استفاده
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 font-black text-xs">
          {coupons.length} کد تخفیف ثبت‌شده
        </span>
      </div>

      {/* فرم ایجاد کوپن جدید */}
      <form onSubmit={handleCreateCoupon} className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <h4 className="font-black text-xs text-[var(--text-primary)]">➕ ایجاد کد تخفیف جدید</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد لاتین تخفیف (Code) *</label>
            <input
              type="text"
              required
              placeholder="مثال: OFF50 یا YALDA"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-black uppercase text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نوع محاسبه تخفیف *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer"
            >
              <option value="percent">درصدی (%)</option>
              <option value="fixed">مبلغ ثابت (تومان)</option>
            </select>
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
              مقدار تخفیف ({type === "percent" ? "درصد" : "تومان"}) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تعداد دفعات مجاز استفاده</label>
            <input
              type="number"
              min={1}
              value={usageLimit}
              onChange={(e) => setUsageLimit(Number(e.target.value))}
              placeholder="مثال: ۱۰۰"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">حداقل مبلغ سفارش (تومان)</label>
            <input
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(Number(e.target.value))}
              placeholder="۰ یعنی بدون شرط"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">حداکثر سقف تخفیف (تومان)</label>
            <input
              type="number"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(Number(e.target.value))}
              placeholder="ویژه تخفیف‌های درصدی"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تاریخ انقضا</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-sans font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
            >
              {submitting ? "در حال ثبت..." : "ایجاد و انتشار کد تخفیف 🚀"}
            </button>
          </div>
        </div>
      </form>

      {/* لیست کدهای تخفیف موجود */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری کدهای تخفیف...</div>
        ) : coupons.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">هیچ کد تخفیفی ایجاد نشده است.</div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                <th className="pb-3 px-2">کد کوپن</th>
                <th className="pb-3 px-2">نوع و مقدار</th>
                <th className="pb-3 px-2">شرایط و سقف</th>
                <th className="pb-3 px-2">دفعات استفاده</th>
                <th className="pb-3 px-2">وضعیت</th>
                <th className="pb-3 px-2 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <td className="py-3 px-2 font-mono font-black text-sm text-[var(--accent-blue)] tracking-wider">
                    {c.code}
                  </td>
                  <td className="py-3 px-2 font-mono font-black">
                    {c.type === "percent" ? `${c.value}% تخفیف` : `${c.value.toLocaleString("fa-IR")} تومان`}
                  </td>
                  <td className="py-3 px-2 text-[11px] text-[var(--text-secondary)]">
                    {c.min_order_amount ? `حداقل خرید: ${c.min_order_amount.toLocaleString("fa-IR")} ت` : "بدون حداقل خرید"}
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-[var(--text-secondary)]">
                    {c.used_count || 0} / {c.usage_limit || "نامحدود"}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => handleToggleStatus(c.id, c.is_active)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                        c.is_active
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-gray-500/15 text-gray-500 border border-gray-500/30"
                      }`}
                    >
                      {c.is_active ? "فعال و معتبر" : "غیرفعال"}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      className="px-3 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                    >
                      🗑️ حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
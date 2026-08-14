"use client";

import { useState } from "react";

// ساختار کدهای تخفیف
export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  amount: number; // درصد یا مبلغ ثابت به تومان
  maxDiscount?: number; // حداکثر سقف تخفیف بر حسب تومان (برای نوع درصدی)
  minPurchase: number; // حداقل مبلغ خرید
  usageLimit: number; // سقف تعداد استفاده
  usedCount: number; // تعداد استفاده شده تاکنون
  active: boolean;
}

// ساختار پیشنهادهای شگفت‌انگیز زمان‌دار
export interface FlashSale {
  id: string;
  productTitle: string;
  discountPercent: number;
  originalPrice: number;
  salePrice: number;
  endTime: string; // تاریخ و زمان پایان فروش شگفت‌انگیز
  active: boolean;
}

export default function DiscountManager() {
  // ۱. لیست کدهای تخفیف
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: "c1",
      code: "APPLE2026",
      type: "percent",
      amount: 15,
      maxDiscount: 500000,
      minPurchase: 2000000,
      usageLimit: 50,
      usedCount: 12,
      active: true,
    },
    {
      id: "c2",
      code: "WELCOME100",
      type: "fixed",
      amount: 100000,
      minPurchase: 500000,
      usageLimit: 100,
      usedCount: 84,
      active: true,
    },
  ]);

  // ۲. لیست پیشنهادهای شگفت‌انگیز
  const [flashSales, setFlashSales] = useState<FlashSale[]>([
    {
      id: "fs1",
      productTitle: "آیفون ۱۵ پرو مکس ۲۵۶ گیگابایت",
      discountPercent: 8,
      originalPrice: 65000000,
      salePrice: 59800000,
      endTime: "2026-08-31T23:59",
      active: true,
    },
  ]);

  // فرم افزودن کد تخفیف جدید
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    amount: "",
    maxDiscount: "",
    minPurchase: "",
    usageLimit: "",
  });

  // فرم افزودن فروش شگفت‌انگیز جدید
  const [newFlash, setNewFlash] = useState({
    productTitle: "",
    originalPrice: "",
    discountPercent: "",
    endTime: "",
  });

  // تابع ساخت کد تخفیف رندوم
  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "OFF-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCoupon({ ...newCoupon, code: result });
  };

  // ایجاد کد تخفیف جدید
  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.amount) return;

    const couponToAdd: Coupon = {
      id: Date.now().toString(),
      code: newCoupon.code.toUpperCase(),
      type: newCoupon.type,
      amount: Number(newCoupon.amount),
      maxDiscount: newCoupon.maxDiscount ? Number(newCoupon.maxDiscount) : undefined,
      minPurchase: newCoupon.minPurchase ? Number(newCoupon.minPurchase) : 0,
      usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : 100,
      usedCount: 0,
      active: true,
    };

    setCoupons([couponToAdd, ...coupons]);
    setNewCoupon({ code: "", type: "percent", amount: "", maxDiscount: "", minPurchase: "", usageLimit: "" });
    alert("کد تخفیف جدید ایجاد شد!");
  };

  // ایجاد فروش شگفت‌انگیز جدید
  const handleAddFlashSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlash.productTitle || !newFlash.originalPrice || !newFlash.discountPercent) return;

    const origPrice = Number(newFlash.originalPrice);
    const discPercent = Number(newFlash.discountPercent);
    const calculatedSalePrice = origPrice - (origPrice * discPercent) / 100;

    const flashToAdd: FlashSale = {
      id: Date.now().toString(),
      productTitle: newFlash.productTitle,
      discountPercent: discPercent,
      originalPrice: origPrice,
      salePrice: calculatedSalePrice,
      endTime: newFlash.endTime || "2026-12-31T23:59",
      active: true,
    };

    setFlashSales([flashToAdd, ...flashSales]);
    setNewFlash({ productTitle: "", originalPrice: "", discountPercent: "", endTime: "" });
    alert("پیشنهاد شگفت‌انگیز زمان‌دار ثبت شد!");
  };

  // حذف کد تخفیف
  const handleDeleteCoupon = (id: string) => {
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  // فعال / غیرفعال کردن کد تخفیف
  const handleToggleCoupon = (id: string) => {
    setCoupons(coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  // حذف پیشنهاد شگفت‌انگیز
  const handleDeleteFlash = (id: string) => {
    setFlashSales(flashSales.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-8 dir-rtl">
      {/* ================= ۱. مدیریت کدهای تخفیف چندلایه ================= */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-[var(--glass-border)] pb-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">🏷️ ساخت و مدیریت کدهای تخفیف (Coupon Codes)</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">تعریف تخفیف‌های درصدی یا مبلغ ثابت با شرط حداقل خرید و محدودیت تعداد</p>
        </div>

        {/* فرم ثبت کد تخفیف */}
        <form onSubmit={handleAddCoupon} className="p-4 rounded-2xl border border-[var(--glass-border)] bg-white/5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">کد تخفیف *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  suppressHydrationWarning
                  placeholder="مثال: NOROOZ1405"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none"
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  title="تولید کد رندوم"
                  className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-xs transition"
                >
                  🎲
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">نوع تخفیف</label>
              <select
                value={newCoupon.type}
                onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as "percent" | "fixed" })}
                className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
              >
                <option value="percent">درصدی (%)</option>
                <option value="fixed">مبلغ ثابت (تومان)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {newCoupon.type === "percent" ? "درصد تخفیف (مثلاً ۱۵)" : "مبلغ تخفیف (تومان) *"}
              </label>
              <input
                type="number"
                required
                suppressHydrationWarning
                placeholder={newCoupon.type === "percent" ? "15" : "100000"}
                value={newCoupon.amount}
                onChange={(e) => setNewCoupon({ ...newCoupon, amount: e.target.value })}
                className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">حداکثر سقف تخفیف (تومان)</label>
              <input
                type="number"
                suppressHydrationWarning
                placeholder="مثلاً ۵۰۰,۰۰۰"
                value={newCoupon.maxDiscount}
                onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value })}
                className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">حداقل مبلغ خرید (تومان)</label>
              <input
                type="number"
                suppressHydrationWarning
                placeholder="مثلاً ۲,۰۰۰,۰۰۰"
                value={newCoupon.minPurchase}
                onChange={(e) => setNewCoupon({ ...newCoupon, minPurchase: e.target.value })}
                className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">سقف تعداد استفاده</label>
              <input
                type="number"
                suppressHydrationWarning
                placeholder="مثلاً ۱۰۰ نفر"
                value={newCoupon.usageLimit}
                onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--accent-blue)] text-white py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition shadow-md"
          >
            ایجاد و فعال‌سازی کد تخفیف
          </button>
        </form>

        {/* جدول لیست کدهای تخفیف موجود */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)]">
                <th className="pb-3 px-2">کد</th>
                <th className="pb-3 px-2">مقدار تخفیف</th>
                <th className="pb-3 px-2">شرایط خرید</th>
                <th className="pb-3 px-2">تعداد استفاده</th>
                <th className="pb-3 px-2">وضعیت</th>
                <th className="pb-3 px-2 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition">
                  <td className="py-3.5 px-2 font-mono font-bold text-[var(--accent-blue)]">{c.code}</td>
                  <td className="py-3.5 px-2 font-bold">
                    {c.type === "percent" ? `${c.amount}%` : `${c.amount.toLocaleString("fa-IR")} تومان`}
                    {c.maxDiscount ? <div className="text-[10px] text-[var(--text-secondary)] font-normal">تا سقف {c.maxDiscount.toLocaleString("fa-IR")} تومان</div> : null}
                  </td>
                  <td className="py-3.5 px-2 text-[var(--text-secondary)]">
                    {c.minPurchase > 0 ? `خرید بالای ${c.minPurchase.toLocaleString("fa-IR")} تومان` : "بدون حداقل"}
                  </td>
                  <td className="py-3.5 px-2 font-mono">
                    {c.usedCount} از {c.usageLimit}
                  </td>
                  <td className="py-3.5 px-2">
                    <button
                      onClick={() => handleToggleCoupon(c.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        c.active
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      }`}
                    >
                      {c.active ? "فعال" : "غیرفعال"}
                    </button>
                  </td>
                  <td className="py-3.5 px-2 text-left">
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="text-red-500 hover:bg-red-500/10 px-2.5 py-1 rounded-xl font-bold transition border border-red-500/20"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ۲. مدیریت کمپین‌های فروش شگفت‌انگیز زمان‌دار ================= */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-[var(--glass-border)] pb-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">⚡ پیش نهادهای شگفت‌انگیز زمان‌دار (Flash Sales)</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">تنظیم تایمر معکوس شیشه‌ای روی کالاها با قیمت تخفیفی ویژه</p>
        </div>

        {/* فرم ثبت پیشنهاد شگفت‌انگیز */}
        <form onSubmit={handleAddFlashSale} className="p-4 rounded-2xl border border-[var(--glass-border)] bg-white/5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">عنوان محصول *</label>
              <input
                type="text"
                required
                suppressHydrationWarning
                placeholder="مثال: مک‌بوک پرو M3"
                value={newFlash.productTitle}
                onChange={(e) => setNewFlash({ ...newFlash, productTitle: e.target.value })}
                className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">قیمت اصلی قبل تخفیف (تومان) *</label>
              <input
                type="number"
                required
                suppressHydrationWarning
                placeholder="65000000"
                value={newFlash.originalPrice}
                onChange={(e) => setNewFlash({ ...newFlash, originalPrice: e.target.value })}
                className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">درصد تخفیف شگفت‌انگیز (%) *</label>
              <input
                type="number"
                required
                suppressHydrationWarning
                placeholder="مثلاً ۱۰"
                value={newFlash.discountPercent}
                onChange={(e) => setNewFlash({ ...newFlash, discountPercent: e.target.value })}
                className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">تاریخ و زمان پایان تایمر</label>
              <input
                type="datetime-local"
                suppressHydrationWarning
                value={newFlash.endTime}
                onChange={(e) => setNewFlash({ ...newFlash, endTime: e.target.value })}
                className="w-full bg-white/10 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--accent-blue)] text-white py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition shadow-md"
          >
            شروع کمپین شگفت‌انگیز با تایمر معکوس
          </button>
        </form>

        {/* لیست کمپین‌های شگفت‌انگیز زنده */}
        <div className="space-y-3">
          {flashSales.map((f) => (
            <div key={f.id} className="flex justify-between items-center p-4 rounded-2xl border border-[var(--glass-border)] bg-white/5 text-xs">
              <div>
                <div className="font-extrabold text-[var(--text-primary)] text-sm">{f.productTitle}</div>
                <div className="flex gap-3 text-[11px] mt-1 font-mono">
                  <span className="line-through text-[var(--text-secondary)]">{f.originalPrice.toLocaleString("fa-IR")} تومان</span>
                  <span className="text-[var(--accent-blue)] font-bold">{f.salePrice.toLocaleString("fa-IR")} تومان</span>
                  <span className="bg-red-500/10 text-red-500 px-2 rounded-md font-bold">-{f.discountPercent}%</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-white/10 px-3 py-1.5 rounded-xl">
                  ⌛ پایان: {f.endTime.replace("T", " ")}
                </span>
                <button
                  onClick={() => handleDeleteFlash(f.id)}
                  className="text-red-500 hover:bg-red-500/10 px-2.5 py-1.5 rounded-xl font-bold transition border border-red-500/20"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
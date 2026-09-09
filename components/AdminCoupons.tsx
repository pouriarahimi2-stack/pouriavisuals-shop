"use client";

import React, { useState, useEffect } from "react";
import { couponService, Coupon } from "@/services/couponService";
import { categoryService, Category } from "@/services/categoryService";
import { productService, Product } from "@/services/productService";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // فرم ایجاد کوپن
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<number>(15);
  const [minOrder, setMinOrder] = useState<number | "">("");
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [usageLimit, setUsageLimit] = useState<number>(50);

  // هدف‌گذاری و زمان‌بندی
  const [targetType, setTargetType] = useState<"all" | "category" | "product">("all");
  const [targetId, setTargetId] = useState<string>("");
  const [startsAt, setStartsAt] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      const [cpns, cats, prods] = await Promise.all([
        couponService.getAll(),
        categoryService.getAll(),
        productService.getAll(),
      ]);
      setCoupons(cpns || []);
      setCategories(cats || []);
      setProducts(prods || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // وب‌سوکت بلادرنگ جدول coupons برای همگام‌سازی لحظه‌ای بدون رفرش
    const channel = supabase
      .channel("realtime-admin-coupons")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // دکمه تولید رندوم کد تخفیف جذاب و استاندارد
  const handleGenerateRandomCode = () => {
    soundEngine.playClick();
    const prefixes = ["AXON", "STUDIO", "VIP", "SPECIAL", "GIFT", "OFF"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCode(`${randomPrefix}-${randomSuffix}`);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || Number(value) <= 0) {
      showToast("کد تخفیف و مقدار تخفیف الزامی هستند.");
      return;
    }

    soundEngine.playClick();
    setSubmitting(true);

    const payload: Partial<Coupon> = {
      code: code.trim().toUpperCase(),
      type,
      discount_type: type,
      value: Number(value),
      discount_value: Number(value),
      min_order_amount: minOrder !== "" ? Number(minOrder) : 0,
      max_discount_amount: maxDiscount !== "" ? Number(maxDiscount) : undefined,
      usage_limit: usageLimit ? Number(usageLimit) : 100,
      target_type: targetType,
      target_id: targetType !== "all" ? targetId : null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      is_active: true,
    };

    try {
      const created = await couponService.create(payload);
      if (created) {
        soundEngine.playSuccess();
        showToast(`✓ کد تخفیف «${created.code}» با موفقیت در دیتابیس ثبت و منتشر شد.`);
        setCode("");
        setValue(15);
        setMinOrder("");
        setMaxDiscount("");
        setUsageLimit(50);
        setTargetType("all");
        setTargetId("");
        setStartsAt("");
        setExpiresAt("");
        loadData();
      } else {
        showToast("خطا در ایجاد کد تخفیف یا کد تکراری است.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (c: Coupon) => {
    soundEngine.playClick();
    const ok = await couponService.update(c.id, { is_active: !c.is_active });
    if (ok) {
      showToast("وضعیت کد تخفیف تغییر یافت.");
      loadData();
    }
  };

  const handleDeleteCoupon = async (c: Coupon) => {
    if (!confirm(`آیا از حذف کامل کد تخفیف «${c.code}» اطمینان دارید؟`)) return;
    soundEngine.playClick();
    const ok = await couponService.delete(c.id);
    if (ok) {
      soundEngine.playSuccess();
      showToast("کد تخفیف با موفقیت از سیستم حذف شد.");
      loadData();
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 shadow-xl animate-fadeIn">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* هدر ماژول کدهای تخفیف */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>🏷️</span> سیستم هوشمند کدهای تخفیف، جشنواره‌ها و کمپین‌ها
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تولید رندوم کدهای اختصاصی، هدف‌گذاری روی دسته یا کالای خاص، بازه زمانی و سقف مصرف
          </p>
        </div>

        <span className="px-4 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 font-black text-xs">
          {coupons.length} کوپن ثبت‌شده
        </span>
      </div>

      {/* فرم ثبت کوپن با تولید رندوم و انتخاب دسته/کالا */}
      <form onSubmit={handleCreateCoupon} className="p-6 md:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
        <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
          <h4 className="font-black text-xs text-[var(--text-primary)]">➕ تعریف و انتشار کوپن جدید</h4>
          <button
            type="button"
            onClick={handleGenerateRandomCode}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-[var(--accent-blue)]"
          >
            <span>🎲</span>
            <span>تولید کد رندوم</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد تخفیف (لاتین) *</label>
            <input
              type="text"
              required
              placeholder="مثال: AXON-50"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-black uppercase text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نوع تخفیف *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] cursor-pointer"
            >
              <option value="percent">درصدی (%)</option>
              <option value="fixed">مبلغ نقدی ثابت (تومان)</option>
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
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">ظرفیت استفاده (تعداد مجاز)</label>
            <input
              type="number"
              min={1}
              value={usageLimit}
              onChange={(e) => setUsageLimit(Number(e.target.value))}
              placeholder="مثال: ۱۰۰"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)]"
            />
          </div>

          {/* هدف‌گذاری تخفیف روی دسته یا کالا */}
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">دامنه اعمال تخفیف</label>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as any);
                setTargetId("");
              }}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] cursor-pointer"
            >
              <option value="all">🌟 روی تمام محصولات فروشگاه</option>
              <option value="category">📂 فقط روی یک دسته‌بندی خاص</option>
              <option value="product">📦 فقط روی یک کالای مشخص</option>
            </select>
          </div>

          {/* انتخاب دسته یا محصول وابسته */}
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
              {targetType === "category" ? "انتخاب دسته‌بندی هدف:" : targetType === "product" ? "انتخاب محصول هدف:" : "هدف‌گذاری عمومی"}
            </label>
            {targetType === "category" ? (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] cursor-pointer"
              >
                <option value="">-- انتخاب دسته‌بندی --</option>
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            ) : targetType === "product" ? (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] cursor-pointer"
              >
                <option value="">-- انتخاب کالا --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title || p.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                disabled
                value="اعمال روی کل سبد خرید"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-slate-400 opacity-60"
              />
            )}
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">حداقل خرید فاکتور (تومان)</label>
            <input
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value ? Number(e.target.value) : "")}
              placeholder="اختیاری"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">سقف تخفیف (تومان)</label>
            <input
              type="number"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : "")}
              placeholder="ویژه تخفیف درصدی"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تاریخ شروع اعتبار</label>
            <input
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-sans font-bold cursor-pointer"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تاریخ پایان اعتبار (انقضا)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-sans font-bold cursor-pointer"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
            >
              {submitting ? "در حال ثبت و انتشار در دیتابیس..." : "💾 ایجاد و انتشار فوری کد تخفیف"}
            </button>
          </div>
        </div>
      </form>

      {/* جدول نمایش کوپن‌ها با قابلیت حذف و تغییر وضعیت لحظه‌ای */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری کدهای تخفیف...</div>
        ) : coupons.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">هیچ کد تخفیفی در دیتابیس تعریف نشده است.</div>
        ) : (
          <table className="w-full text-right text-xs min-w-[750px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black text-[11px] pb-3">
                <th className="p-3">کد تخفیف</th>
                <th className="p-3">میزان تخفیف</th>
                <th className="p-3">دامنه هدف</th>
                <th className="p-3 text-center">مصرف / سقف</th>
                <th className="p-3">بازه زمانی اعتبار</th>
                <th className="p-3 text-center">وضعیت</th>
                <th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)] font-medium">
              {coupons.map((c) => {
                const isPercent = c.type === "percent" || c.discount_type === "percent";
                const val = Number(c.value ?? c.discount_value ?? 0);
                const isActive = c.is_active !== false;

                return (
                  <tr key={c.id} className="hover:bg-[var(--input-bg)]/60 transition">
                    <td className="p-3 font-mono font-black text-sm text-[var(--accent-blue)] tracking-wider">
                      {c.code}
                    </td>
                    <td className="p-3 font-mono font-black">
                      {isPercent ? `${val}٪ تخفیف` : `${val.toLocaleString("fa-IR")} ت`}
                      {c.max_discount_amount && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          سقف: {Number(c.max_discount_amount).toLocaleString("fa-IR")} ت
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[11px]">
                      {c.target_type === "category" ? (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-500 font-bold">
                          📂 {c.target_id || "دسته‌بندی"}
                        </span>
                      ) : c.target_type === "product" ? (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-500 font-bold">
                          📦 کالای مشخص
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">سراسری (همه کالاها)</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-400">
                      {c.used_count || 0} / {c.usage_limit || "نامحدود"}
                    </td>
                    <td className="p-3 text-[11px] font-mono text-slate-400">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString("fa-IR") : "بدون انقضا"}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={"px-3 py-1 rounded-xl text-[10px] font-black transition cursor-pointer " + (
                          isActive ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-slate-500/15 text-slate-500 border border-slate-500/30"
                        )}
                      >
                        {isActive ? "فعال ✓" : "غیرفعال"}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteCoupon(c)}
                        className="p-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 text-xs font-bold transition cursor-pointer"
                        title="حذف از دیتابیس"
                      >
                        🗑️ حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// File Path: app/admin/coupons/page.tsx
"use client";

import React, { useEffect, useState } from "react";
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
  expires_at?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [form, setForm] = useState<{
    id?: string;
    code: string;
    discount_type: "percent" | "fixed";
    discount_percent: number | "";
    discount_amount: number | "";
    min_purchase: number | "";
    max_discount: number | "";
    usage_limit: number | "";
    expires_at: string;
    description: string;
    is_active: boolean;
  }>({
    code: "",
    discount_type: "percent",
    discount_percent: "",
    discount_amount: "",
    min_purchase: "",
    max_discount: "",
    usage_limit: 100,
    expires_at: "",
    description: "",
    is_active: true,
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success) {
        setCoupons(json.coupons || []);
      }
    } catch {
      console.error("خطا در واکشی کدهای تخفیف.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();

    const channel = supabase
      .channel("realtime-admin-coupons-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => {
        fetchCoupons();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenCreate = () => {
    soundEngine.playClick();
    setEditingCoupon(null);
    setForm({
      code: "",
      discount_type: "percent",
      discount_percent: 10,
      discount_amount: "",
      min_purchase: 500000,
      max_discount: 200000,
      usage_limit: 50,
      expires_at: "",
      description: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    soundEngine.playClick();
    setEditingCoupon(c);
    const dType = (c.discount_type || c.type || "percent") === "fixed" ? "fixed" : "percent";
    const dPercent =
      dType === "percent" ? (c.discount_percent ?? c.value ?? c.discount_value ?? "") : "";
    const dAmount =
      dType === "fixed" ? (c.discount_amount ?? c.value ?? c.discount_value ?? "") : "";

    setForm({
      id: c.id,
      code: c.code,
      discount_type: dType,
      discount_percent: dPercent,
      discount_amount: dAmount,
      min_purchase: c.min_purchase ?? c.min_order_amount ?? "",
      max_discount: c.max_discount ?? c.max_discount_amount ?? "",
      usage_limit: c.usage_limit ?? "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
      description: c.description || "",
      is_active: c.is_active !== false,
    });
    setIsModalOpen(true);
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
        fetchCoupons();
      } else {
        alert(json.message || "خطا در حذف کد تخفیف.");
      }
    } catch {
      alert("ارتباط با سرور برقرار نشد.");
    }
  };

  const handleCodeChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    setForm((prev) => ({ ...prev, code: clean }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (form.discount_type === "percent") {
      const p = Number(form.discount_percent);
      if (isNaN(p) || p <= 0 || p > 100) {
        alert("درصد تخفیف باید عددی بین ۱ تا ۱۰۰ باشد.");
        return;
      }
    } else {
      const a = Number(form.discount_amount);
      if (isNaN(a) || a <= 0) {
        alert("مبلغ تخفیف ثابت نامعتبر است.");
        return;
      }
    }

    const numericVal =
      form.discount_type === "percent"
        ? Number(form.discount_percent)
        : Number(form.discount_amount);

    const payload = {
      ...form,
      type: form.discount_type,
      value: numericVal,
      discount_value: numericVal,
      discount_percent: form.discount_type === "percent" ? Number(form.discount_percent) : null,
      discount_amount: form.discount_type === "fixed" ? Number(form.discount_amount) : null,
      min_purchase: form.min_purchase ? Number(form.min_purchase) : null,
      min_order_amount: form.min_purchase ? Number(form.min_purchase) : 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      max_discount_amount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
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
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        alert(json.message || "خطا در ذخیره‌سازی کوپن.");
      }
    } catch {
      alert("خطا در ارتباط با سرور.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏷️</span> مدیریت کوپن‌ها و کدهای تخفیف
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تعریف کمپین‌های تخفیفی درصدی و ریالی، کنترل محدودیت استفاده و انقضا (همگام‌سازی زنده وب‌سوکت)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span> ایجاد کوپن جدید
        </button>
      </div>

      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">در حال واکشی کدهای تخفیف...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">هیچ کد تخفیفی یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[680px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                  <th className="pb-3 px-3">کد تخفیف</th>
                  <th className="pb-3 px-3">نوع تخفیف</th>
                  <th className="pb-3 px-3">مقدار</th>
                  <th className="pb-3 px-3">حداقل خرید</th>
                  <th className="pb-3 px-3">دفعات مصرف</th>
                  <th className="pb-3 px-3">تاریخ انقضا</th>
                  <th className="pb-3 px-3">وضعیت</th>
                  <th className="pb-3 px-3 text-left">عملیات</th>
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
                  const minBuy = Number(c.min_purchase ?? c.min_order_amount ?? 0);
                  const used = Number(c.times_used ?? c.used_count ?? 0);

                  return (
                    <tr key={c.id} className="hover:bg-[var(--input-bg)]/40 transition">
                      <td className="py-3 px-3">
                        <span className="font-mono font-black text-[13px] px-2.5 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--accent-blue)] tracking-wider">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {isPct ? "درصدی" : "مبلغ ثابت"}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {isPct ? valNum + "%" : valNum.toLocaleString("fa-IR") + " ت"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {minBuy > 0 ? minBuy.toLocaleString("fa-IR") + " ت" : "بدون محدودیت"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {used} / {c.usage_limit || "نامحدود"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString("fa-IR") : "همیشگی"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={
                            "px-2 py-0.5 rounded-lg text-[10px] font-bold border " +
                            (c.is_active
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              : "bg-rose-500/15 border-rose-500/30 text-rose-400")
                          }
                        >
                          {c.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-left space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-border)] transition cursor-pointer"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--text-primary)]">
                {editingCoupon ? "✏️ ویرایش کد تخفیف" : "➕ ایجاد کد تخفیف جدید"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    کد تخفیف (لاتین):
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="SPRING1405"
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono uppercase focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">نوع تخفیف:</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="percent">درصدی (%)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.discount_type === "percent" ? (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      درصد تخفیف (۱ تا ۱۰۰):
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
                      className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      مبلغ تخفیف (تومان):
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
                      className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    حداقل مبلغ خرید (تومان):
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
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    حداکثر سقف تخفیف (تومان):
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
                    placeholder="اختیاری برای درصدی"
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    سقف مجاز تعداد مصرف:
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
                    className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  تاریخ انقضا:
                </label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  توضیحات کوپن:
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="مثال: ویژه اولین خرید کاربران جدید"
                  className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded accent-[var(--accent-blue)]"
                />
                کوپن فعال و قابل استفاده در سبد خرید باشد
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md hover:opacity-90 transition cursor-pointer"
                >
                  ذخیره کوپن 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

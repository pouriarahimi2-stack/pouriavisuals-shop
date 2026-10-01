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
  target_type?: "all" | "product";
  target_id?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
}

interface SimpleProduct {
  id: string;
  title: string;
}

function toLocalDateTimeInput(isoStr?: string | null): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
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
    target_type: "all" | "product";
    target_id: string;
    starts_at: string;
    expires_at: string;
    description: string;
    is_active: boolean;
  }>({
    code: "",
    discount_type: "percent",
    discount_percent: 10,
    discount_amount: "",
    min_purchase: "",
    max_discount: "",
    usage_limit: 100,
    target_type: "all",
    target_id: "",
    starts_at: "",
    expires_at: "",
    description: "",
    is_active: true,
  });

  const fetchCouponsAndProducts = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/admin/coupons", { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }).catch(() => null),
      ]);
      const cJson = await cRes.json();
      if (cRes.ok && cJson.success) {
        setCoupons(cJson.coupons || []);
      }
      if (pRes && pRes.ok) {
        const pJson = await pRes.json();
        const pList = pJson.data || pJson.products || [];
        setProducts(
          (Array.isArray(pList) ? pList : []).map((p: any) => ({
            id: String(p.id),
            title: p.title || p.name || "کالای دیجیتال",
          }))
        );
      }
    } catch {
      console.error("خطا در واکشی کدهای تخفیف.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouponsAndProducts();

    const channel = supabase
      .channel("realtime-admin-coupons-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => {
        fetchCouponsAndProducts();
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
      target_type: "all",
      target_id: products[0]?.id || "",
      starts_at: "",
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
      target_type: c.target_type === "product" ? "product" : "all",
      target_id: c.target_id || products[0]?.id || "",
      starts_at: toLocalDateTimeInput(c.starts_at),
      expires_at: toLocalDateTimeInput(c.expires_at),
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
        fetchCouponsAndProducts();
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
      target_type: form.target_type,
      target_id: form.target_type === "product" ? form.target_id : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
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
        fetchCouponsAndProducts();
      } else {
        alert(json.message || "خطا در ذخیره‌سازی کوپن.");
      }
    } catch {
      alert("خطا در ارتباط با سرور.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] select-none" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏷️</span> مدیریت هوشمند کوپن‌ها (ویژه محصول خاص، روز خاص و ساعت دقیق)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تعریف کمپین‌های تخفیفی زمان‌دار (بر اساس روز و ساعت) و امکان اختصاص کد تخفیف به یک کالای مشخص
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span> ایجاد کوپن زمان‌دار جدید
        </button>
      </div>

      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">در حال واکشی کدهای تخفیف...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">هیچ کد تخفیفی یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[780px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                  <th className="pb-3 px-3">کد تخفیف</th>
                  <th className="pb-3 px-3">مقدار</th>
                  <th className="pb-3 px-3">محدوده اعمال</th>
                  <th className="pb-3 px-3">زمان شروع و انقضا (روز و ساعت)</th>
                  <th className="pb-3 px-3">مصرف</th>
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
                  const used = Number(c.times_used ?? c.used_count ?? 0);
                  const targetProd =
                    c.target_type === "product" && c.target_id
                      ? products.find((p) => p.id === String(c.target_id))
                      : null;

                  return (
                    <tr key={c.id} className="hover:bg-[var(--input-bg)]/40 transition">
                      <td className="py-3 px-3">
                        <span className="font-mono font-black text-[13px] px-2.5 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--accent-blue)] tracking-wider">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {isPct ? valNum + "%" : valNum.toLocaleString("fa-IR") + " ت"}
                      </td>
                      <td className="py-3 px-3">
                        {c.target_type === "product" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 font-bold text-[11px]">
                            📦 محصول: {targetProd ? targetProd.title : c.target_id}
                          </span>
                        ) : (
                          <span className="text-slate-400">همه محصولات سایت</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-300 space-y-0.5">
                        {c.starts_at && (
                          <div>شروع: {new Date(c.starts_at).toLocaleString("fa-IR")}</div>
                        )}
                        <div>
                          انقضا:{" "}
                          {c.expires_at ? new Date(c.expires_at).toLocaleString("fa-IR") : "همیشگی"}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {used} / {c.usage_limit || "∞"}
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
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--text-primary)]">
                {editingCoupon ? "✏️ ویرایش کد تخفیف هدفمند" : "➕ ایجاد کد تخفیف جدید"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">
                    کد تخفیف (لاتین):
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="AXONVIP"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono uppercase outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">نوع تخفیف:</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  >
                    <option value="percent">درصدی (%)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </select>
                </div>

                {form.discount_type === "percent" ? (
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                    />
                  </div>
                )}

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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>
              </div>

              {/* انتخابگر اعمال روی همه محصولات یا محصول خاص */}
              <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
                <label className="block font-black text-[var(--accent-blue)]">
                  🎯 محدوده اعمال کد تخفیف:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, target_type: "all" })}
                    className={
                      "py-2 rounded-xl font-bold cursor-pointer transition " +
                      (form.target_type === "all"
                        ? "bg-[var(--accent-blue)] text-white"
                        : "bg-[var(--modal-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]")
                    }
                  >
                    همه محصولات سایت
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, target_type: "product" })}
                    className={
                      "py-2 rounded-xl font-bold cursor-pointer transition " +
                      (form.target_type === "product"
                        ? "bg-[var(--accent-blue)] text-white"
                        : "bg-[var(--modal-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]")
                    }
                  >
                    📦 یک محصول خاص
                  </button>
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
              </div>

              {/* زمان‌بندی دقیق بر اساس روز خاص و ساعت خاص */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">
                    🕒 تاریخ و ساعت دقیق شروع:
                  </label>
                  <input
                    type="datetime-local"
                    dir="ltr"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">
                    ⏳ تاریخ و ساعت دقیق انقضا:
                  </label>
                  <input
                    type="datetime-local"
                    dir="ltr"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">
                  توضیحات کوپن:
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="مثال: جشنواره فروش ویژه آخر هفته"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                />
              </div>

              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded accent-[var(--accent-blue)]"
                />
                <span>کوپن فعال و قابل استفاده در سبد خرید باشد</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold shadow-md hover:opacity-90 transition cursor-pointer"
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

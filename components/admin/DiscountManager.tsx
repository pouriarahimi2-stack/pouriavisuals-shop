// components/admin/DiscountManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export interface Coupon {
  id?: string;
  code: string;
  discount_percent: number;
  max_discount?: number;
  expires_at?: string;
  usage_limit?: number;
  used_count?: number;
  is_active?: boolean;
}

export default function DiscountManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [usageLimit, setUsageLimit] = useState<number | "">(100);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons((data as Coupon[]) || []);
    } catch (e) {
      console.error("Error loading coupons:", e);
    }
  };

  useEffect(() => {
    fetchCoupons();

    const channel = supabase
      .channel("coupons-realtime-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => {
        fetchCoupons();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || discountPercent === "") {
      setStatusMessage({ type: "error", text: "کد کوپن و درصد تخفیف الزامی هستند." });
      return;
    }

    soundEngine.playClick();
    setSaving(true);
    const payload = {
      code: code.trim().toUpperCase(),
      discount_percent: Number(discountPercent),
      max_discount: maxDiscount ? Number(maxDiscount) : null,
      usage_limit: usageLimit ? Number(usageLimit) : 100,
      is_active: true,
    };

    try {
      const { error } = await supabase.from("coupons").insert([payload]);
      if (error) throw error;

      soundEngine.playSuccess();
      setStatusMessage({ type: "success", text: "⚡ کد تخفیف با موفقیت در دیتابیس ثبت و فعال شد." });
      setCode("");
      setDiscountPercent("");
      setMaxDiscount("");
      fetchCoupons();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "خطا در ثبت کد تخفیف." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    soundEngine.playClick();
    await supabase.from("coupons").update({ is_active: !current }).eq("id", id);
    setCoupons(coupons.map((c) => (c.id === id ? { ...c, is_active: !current } : c)));
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("آیا از حذف این کد تخفیف اطمینان دارید؟")) return;
    soundEngine.playClick();
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">🏷️ مدیریت کدهای تخفیف و جشنواره‌ها</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">ایجاد و مدیریت کمپین‌های تخفیف با فعال‌سازی بلادرنگ</p>
        </div>
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
        <form onSubmit={handleCreateCoupon} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm h-fit">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            + ایجاد کوپن تخفیف جدید
          </h3>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">کد تخفیف (لاتین) *</label>
            <input
              type="text"
              placeholder="مثلاً: AXON20"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold uppercase text-[var(--text-primary)] outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">درصد تخفیف *</label>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="20"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">سقف تخفیف (تومان)</label>
              <input
                type="number"
                placeholder="مثلاً: 500000"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : "")}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition shadow-md cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال ثبت..." : "💾 ثبت و فعال‌سازی فوری"}
          </button>
        </form>

        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📋 لیست کدهای تخفیف فعال و آرشیو ({coupons.length})
          </h3>

          <div className="space-y-3 max-h-[450px] overflow-y-auto">
            {coupons.length === 0 ? (
              <p className="text-xs text-center py-8 text-[var(--text-secondary)] font-bold">هیچ کد تخفیفی ثبت نشده است.</p>
            ) : (
              coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[var(--accent-blue)] tracking-wider">{c.code}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-500 text-[10px] font-bold">
                        {c.discount_percent}٪ تخفیف
                      </span>
                    </div>
                    {c.max_discount && (
                      <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                        سقف تخفیف: {Number(c.max_discount).toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(c.id!, c.is_active !== false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                        c.is_active !== false
                          ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                          : "bg-slate-500/15 text-slate-500 border border-slate-500/30"
                      }`}
                    >
                      {c.is_active !== false ? "فعال ✓" : "غیرفعال"}
                    </button>
                    <button
                      onClick={() => deleteCoupon(c.id!)}
                      className="p-1.5 px-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
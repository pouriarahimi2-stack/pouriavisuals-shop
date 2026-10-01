// File Path: components/admin/DiscountManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import { couponService, Coupon } from "@/services/couponService";

export default function DiscountManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; title: string }>>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<number | "">(10);
  const [minOrder, setMinOrder] = useState<number | "">("");
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [usageLimit, setUsageLimit] = useState<number | "">(100);
  const [targetType, setTargetType] = useState<"all" | "product">("all");
  const [targetId, setTargetId] = useState<string>("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCouponsAndProducts = async () => {
    try {
      const [data, prodRes] = await Promise.all([
        couponService.getAll(),
        fetch("/api/products", { cache: "no-store" }).catch(() => null),
      ]);
      setCoupons(data || []);
      if (prodRes && prodRes.ok) {
        const pJson = await prodRes.json();
        const pList = pJson.data || pJson.products || [];
        const mapped = (Array.isArray(pList) ? pList : []).map((p: any) => ({
          id: String(p.id),
          title: p.title || p.name || "کالا",
        }));
        setProducts(mapped);
        if (!targetId && mapped.length > 0) setTargetId(mapped[0].id);
      }
    } catch (e) {
      console.error("Error loading coupons in DiscountManager:", e);
    }
  };

  useEffect(() => {
    fetchCouponsAndProducts();

    const channel = supabase
      .channel("realtime-discount-manager")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => {
        fetchCouponsAndProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

    const payload: Record<string, any> = {
      code: code.trim().toUpperCase(),
      type,
      discount_type: type,
      value: Number(value),
      discount_value: Number(value),
      min_order_amount: minOrder ? Number(minOrder) : 0,
      max_discount: maxDiscount ? Number(maxDiscount) : undefined,
      max_discount_amount: maxDiscount ? Number(maxDiscount) : undefined,
      usage_limit: usageLimit ? Number(usageLimit) : 100,
      target_type: targetType,
      target_id: targetType === "product" ? targetId : null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      is_active: true,
    };

    try {
      const created = await couponService.create(payload);
      if (created) {
        soundEngine.playSuccess();
        setStatusMessage({
          type: "success",
          text: "⚡ کد تخفیف هدفمند «" + created.code + "» با موفقیت در دیتابیس ثبت و فعال شد.",
        });
        setCode("");
        setValue(10);
        setStartsAt("");
        setExpiresAt("");
        fetchCouponsAndProducts();
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
      {statusMessage && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " +
            (statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <form
          onSubmit={handleCreateCoupon}
          className="bg-[var(--modal-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--card-border)] space-y-3.5 shadow-xl h-fit"
        >
          <h3 className="font-black border-b border-[var(--card-border)] pb-3">
            + ایجاد کوپن تخفیف زمان‌دار و هدفمند
          </h3>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
              کد لاتین تخفیف *
            </label>
            <input
              type="text"
              placeholder="AXON2026"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black uppercase outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">نوع</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
              >
                <option value="percent">درصدی (%)</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">مقدار *</label>
              <input
                type="number"
                min="1"
                value={value}
                onChange={(e) => setValue(e.target.value ? Number(e.target.value) : "")}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
              محدوده اعمال (همه یا محصول خاص):
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none mb-2"
            >
              <option value="all">همه محصولات سایت</option>
              <option value="product">📦 فقط روی یک محصول خاص</option>
            </select>

            {targetType === "product" && (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--accent-blue)] font-bold outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    📦 {p.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
              🕒 روز و ساعت شروع تخفیف:
            </label>
            <input
              type="datetime-local"
              dir="ltr"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
              ⏳ روز و ساعت انقضای تخفیف:
            </label>
            <input
              type="datetime-local"
              dir="ltr"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال ثبت..." : "💾 ثبت و فعال‌سازی کوپن"}
          </button>
        </form>

        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-xl">
          <h3 className="font-black border-b border-[var(--card-border)] pb-3">
            📋 لیست کدهای تخفیف ثبت‌شده ({coupons.length})
          </h3>
          <div className="space-y-3 max-h-[520px] overflow-y-auto">
            {coupons.map((c: any) => {
              const isPercent = c.type === "percent" || c.discount_type === "percent";
              const discountVal = Number(c.value ?? c.discount_value ?? c.discount_percent ?? 0);
              const isItemActive = c.is_active !== false;
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[var(--accent-blue)]">
                        {c.code}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                        {isPercent
                          ? discountVal + "٪ تخفیف"
                          : discountVal.toLocaleString("fa-IR") + " تومان"}
                      </span>
                    </div>
                    {c.expires_at && (
                      <div className="text-[10px] font-mono text-slate-400">
                        انقضا: {new Date(c.expires_at).toLocaleString("fa-IR")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => toggleStatus(c.id!, isItemActive)}
                      className={
                        "px-3 py-1.5 rounded-xl font-bold cursor-pointer " +
                        (isItemActive
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-slate-500/15 text-slate-400")
                      }
                    >
                      {isItemActive ? "فعال ✓" : "غیرفعال"}
                    </button>
                    <button
                      onClick={() => deleteCoupon(c.id!)}
                      className="p-2 px-3 rounded-xl bg-rose-500/15 text-rose-400 font-bold cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

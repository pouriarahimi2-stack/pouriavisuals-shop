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
  target_type?: "all" | "product" | "category";
  target_id?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
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
  const [products, setProducts] = useState<Array<{ id: string; title: string }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [crmPhones, setCrmPhones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);

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
    min_purchase: "",
    max_discount: "",
    usage_limit: 100,
    target_type: "all",
    target_id: "",
    starts_at: "",
    expires_at: "",
    description: "",
    is_active: true,
    publishToHeaderBar: false,
  });

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchCouponsAndCatalog = async () => {
    try {
      const [cRes, pRes, catRes, crmRes] = await Promise.all([
        fetch("/api/admin/coupons", { cache: "no-store" }),
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
  };

  useEffect(() => {
    fetchCouponsAndCatalog();
    const channel = supabase
      .channel("realtime-admin-coupons-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => {
        fetchCouponsAndCatalog();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      starts_at: toLocalDateTimeInput(now.toISOString()),
      expires_at: toLocalDateTimeInput(end.toISOString()),
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
      starts_at: toLocalDateTimeInput(new Date().toISOString()),
      expires_at: "",
      description: "جشنواره فروش ویژه آکسون کور",
      is_active: true,
      publishToHeaderBar: false,
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
      target_type:
        c.target_type === "product"
          ? "product"
          : c.target_type === "category"
          ? "category"
          : "all",
      target_id: c.target_id || products[0]?.id || "",
      starts_at: toLocalDateTimeInput(c.starts_at),
      expires_at: toLocalDateTimeInput(c.expires_at),
      description: c.description || "",
      is_active: c.is_active !== false,
      publishToHeaderBar: false,
    });
    setIsModalOpen(true);
  };

  const handlePushCouponToHeaderBar = async (c: Coupon) => {
    soundEngine.playClick();
    const isPct = (c.discount_type || c.type || "percent") === "percent";
    const valNum = Number(
      isPct
        ? c.discount_percent ?? c.value ?? c.discount_value ?? 0
        : c.discount_amount ?? c.value ?? c.discount_value ?? 0
    );
    const bannerMsg =
      "🔥 جشنواره تخفیف ویژه! با وارد کردن کد «" +
      c.code +
      "» در سبد خرید، " +
      (isPct ? valNum + "٪ تخفیف" : valNum.toLocaleString("fa-IR") + " تومان هدیه") +
      " دریافت کنید!";

    try {
      const tbRes = await fetch("/api/theme-builder", { cache: "no-store" });
      const tbJson = await tbRes.json();
      const prevCfg = tbJson?.config || {};
      await fetch("/api/theme-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            ...prevCfg,
            globalHeader: {
              ...(prevCfg.globalHeader || {}),
              announcementText: bannerMsg,
              announcementEnabled: true,
            },
          },
        }),
      });
      soundEngine.playSuccess();
      notify("✓ کد تخفیف «" + c.code + "» در نوار اعلان بالای سایت منتشر و فعال شد!");
      window.dispatchEvent(new CustomEvent("theme_builder_updated"));
    } catch {}
  };

  const handleSendCampaignSmsToCrm = async (c: Coupon) => {
    soundEngine.playClick();
    const targetPhones = crmPhones.length > 0 ? crmPhones : ["09376110200"];
    if (
      !confirm(
        "آیا مایلید کد تخفیف «" +
          c.code +
          "» از طریق پیامک به " +
          targetPhones.length +
          " شماره ثبت‌شده در باشگاه مشتریان (CRM) ارسال شود؟"
      )
    ) {
      return;
    }
    setSendingSmsId(c.id);
    try {
      const res = await fetch("/api/admin/send-discount-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phones: targetPhones, code: c.code }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message || "✓ پیامک کمپین تخفیف با موفقیت برای مشتریان CRM ارسال شد.");
      } else {
        notify(json.message || "خطا در ارسال پیامک کمپین.");
      }
    } finally {
      setSendingSmsId(null);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    soundEngine.playClick();
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        fetchCouponsAndCatalog();
      }
    } catch {}
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
        notify("کد تخفیف با موفقیت حذف گردید.");
        fetchCouponsAndCatalog();
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
      target_id: form.target_type !== "all" ? form.target_id : null,
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
        if (form.publishToHeaderBar && json.coupon) {
          await handlePushCouponToHeaderBar(json.coupon);
        } else {
          soundEngine.playSuccess();
          notify("✓ کوپن تخفیف زمان‌دار با موفقیت در دیتابیس ذخیره و فعال شد.");
        }
        setIsModalOpen(false);
        fetchCouponsAndCatalog();
      } else {
        alert(json.message || "خطا در ذخیره‌سازی کوپن.");
      }
    } catch {
      alert("خطا در ارتباط با سرور.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] select-text" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏷️</span> استودیوی پیشرفته کوپن‌های زمان‌دار، هدفمند و کمپین‌های پیامکی CRM
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تولید کد تخفیف روی کل سبد، دسته‌بندی یا کالای خاص + اتصال ۱-کلیکی به هدر سایت و ارسال پیامک به مشتریان CRM
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
            <table className="w-full text-right text-xs min-w-[920px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                  <th className="pb-3 px-3">کد تخفیف (کپی سریع)</th>
                  <th className="pb-3 px-3">مقدار تخفیف</th>
                  <th className="pb-3 px-3">دامنه هدف</th>
                  <th className="pb-3 px-3">زمان شروع و انقضا</th>
                  <th className="pb-3 px-3">میزان مصرف</th>
                  <th className="pb-3 px-3">وضعیت</th>
                  <th className="pb-3 px-3 text-left">عملیات و کمپین</th>
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
                            "px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer " +
                            (c.is_active
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                              : "bg-rose-500/15 border-rose-500/30 text-rose-500")
                          }
                        >
                          {c.is_active ? "فعال ✓" : "غیرفعال"}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePushCouponToHeaderBar(c)}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold text-[11px] cursor-pointer hover:bg-sky-500 hover:text-white transition"
                          >
                            📢 نمایش در هدر
                          </button>
                          <button
                            type="button"
                            disabled={sendingSmsId === c.id}
                            onClick={() => handleSendCampaignSmsToCrm(c)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold text-[11px] cursor-pointer hover:bg-amber-500 hover:text-slate-950 transition"
                          >
                            {sendingSmsId === c.id ? "در حال ارسال..." : "📲 پیامک CRM"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
                          >
                            ✏️ ویرایش
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold cursor-pointer"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--accent-blue)]">
                {editingCoupon ? "✏️ ویرایش کامل کد تخفیف" : "➕ تعریف کوپن تخفیف زمان‌دار و هوشمند"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">
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
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black uppercase outline-none focus:border-[var(--accent-blue)]"
                    />
                    <button
                      type="button"
                      onClick={generateRandomCouponCode}
                      className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black text-[var(--accent-blue)] cursor-pointer shrink-0"
                    >
                      🎲 تولید کد رندوم
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">نوع تخفیف:</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none"
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
                    placeholder="0 = بدون محدودیت"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>
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
                  <span className="font-black text-[var(--accent-blue)]">⏱️️ زمان‌بندی سریع اعتبار:</span>
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
                    <input
                      type="datetime-local"
                      dir="ltr"
                      value={form.starts_at}
                      onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">
                      ⏳ تاریخ و ساعت انقضا:
                    </label>
                    <input
                      type="datetime-local"
                      dir="ltr"
                      value={form.expires_at}
                      onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
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
                    className="rounded accent-[var(--accent-blue)] w-4 h-4"
                  />
                  <span>کوپن فعال و قابل استفاده در سبد خرید باشد</span>
                </label>

                <label className="flex items-center gap-2 font-black text-sky-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.publishToHeaderBar}
                    onChange={(e) => setForm({ ...form, publishToHeaderBar: e.target.checked })}
                    className="rounded accent-sky-500 w-4 h-4"
                  />
                  <span>📢 هم‌زمان این کد تخفیف در «نوار اعلان بالای سایت» هم اعلام شود</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
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

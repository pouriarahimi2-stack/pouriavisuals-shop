"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

interface SystemSettingsState {
  defaultShippingCost: string;
  postShippingCost: string;
  tipaxShippingCost: string;
  freeShippingThreshold: string;
  vatPercent: string;
  allowGuestCheckout: boolean;
  autoSendOrderSms: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  noIndex: boolean;
  smartSliderEnabled: boolean;
}

export default function AdminGlobalSettingsPage() {
  const [form, setForm] = useState<SystemSettingsState>({
    defaultShippingCost: "0",
    postShippingCost: "120000",
    tipaxShippingCost: "150000",
    freeShippingThreshold: "0",
    vatPercent: "10",
    allowGuestCheckout: true,
    autoSendOrderSms: true,
    maintenanceMode: false,
    maintenanceMessage: "فروشگاه در حال بروزرسانی زیرساخت‌های فنی است.",
    noIndex: false,
    smartSliderEnabled: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const json = await res.json();
      const s = json.settings || json.system_settings || {};
      setForm({
        defaultShippingCost: String(s.defaultShippingCost ?? 0),
        postShippingCost: String(s.postShippingCost ?? 120000),
        tipaxShippingCost: String(s.tipaxShippingCost ?? 150000),
        freeShippingThreshold: String(s.freeShippingThreshold ?? 0),
        vatPercent: String(s.vatPercent ?? 10),
        allowGuestCheckout: Boolean(s.allowGuestCheckout ?? true),
        autoSendOrderSms: Boolean(s.autoSendOrderSms ?? true),
        maintenanceMode: Boolean(s.maintenanceMode ?? false),
        maintenanceMessage: String(s.maintenanceMessage ?? "فروشگاه در حال بروزرسانی زیرساخت‌های فنی است."),
        noIndex: Boolean(s.noIndex ?? false),
        smartSliderEnabled: Boolean(s.smartSliderEnabled ?? false),
      });
    } catch {
      setFeedback({ type: "err", text: "خطا در بارگذاری تنظیمات از سرور." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const persistSettings = async (nextState: SystemSettingsState) => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        defaultShippingCost: Number(String(nextState.defaultShippingCost).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/,/g, "").trim() || 0),
        postShippingCost: Number(String(nextState.postShippingCost).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/,/g, "").trim() || 0),
        tipaxShippingCost: Number(String(nextState.tipaxShippingCost).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/,/g, "").trim() || 0),
        freeShippingThreshold: Number(String(nextState.freeShippingThreshold).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/,/g, "").trim() || 0),
        vatPercent: Number(String(nextState.vatPercent).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/,/g, "").trim() || 0),
        allowGuestCheckout: nextState.allowGuestCheckout,
        autoSendOrderSms: nextState.autoSendOrderSms,
        maintenanceMode: nextState.maintenanceMode,
        maintenanceMessage: nextState.maintenanceMessage,
        noIndex: nextState.noIndex,
        smartSliderEnabled: nextState.smartSliderEnabled,
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedback({ type: "ok", text: "✓ تنظیمات سایت با موفقیت ذخیره شد." });
        setTimeout(() => setFeedback(null), 4500);
      }
    } catch (err: any) {
      setFeedback({ type: "err", text: err.message || "خطا در ارتباط با سرور" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    await persistSettings(form);
  };

  return (
    <form onSubmit={handleSaveSubmit} className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)]">⚙️ تنظیمات کلان سیستم و اتوماسیون</h1>
        </div>
        <button type="submit" disabled={saving || loading} className="w-full lg:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-black shadow-lg cursor-pointer">
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات 💾"}
        </button>
      </div>

      {feedback && <div className={"p-4 rounded-2xl text-xs font-bold " + (feedback.type === "ok" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400")}>{feedback.text}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">🚚 تنظیمات هزینه‌های ارسال</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">هزینه ارسال پست (تومان):</label>
              <input type="text" value={form.postShippingCost} onChange={(e) => setForm({ ...form, postShippingCost: e.target.value })} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none focus:border-[var(--accent-blue)]" />
            </div>
            <div>
              <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">هزینه ارسال تیپاکس (تومان):</label>
              <input type="text" value={form.tipaxShippingCost} onChange={(e) => setForm({ ...form, tipaxShippingCost: e.target.value })} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none focus:border-[var(--accent-blue)]" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h2 className="font-black text-sm text-indigo-500 border-b border-[var(--card-border)] pb-3">🤖 هوشمندسازی ظاهری سایت</h2>
          <label className="flex items-center justify-between gap-4 p-4 rounded-2xl border bg-[var(--input-bg)] border-[var(--card-border)] cursor-pointer hover:border-indigo-500 transition">
            <div className="space-y-1">
              <span className="font-black text-xs text-indigo-500">اسلایدر هوشمند روزانه (Smart Slider)</span>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">با فعال‌سازی این گزینه، سایت هر روز به صورت اتوماتیک ۵ محصول از دسته‌بندی‌های مختلف را انتخاب کرده و در اسلایدر اصلی سایت نمایش می‌دهد.</p>
            </div>
            <input type="checkbox" checked={form.smartSliderEnabled} onChange={(e) => setForm({ ...form, smartSliderEnabled: e.target.checked })} className="w-5 h-5 accent-indigo-500 shrink-0" />
          </label>
        </div>
      </div>
    </form>
  );
}

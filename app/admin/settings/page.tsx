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
        noIndex: Boolean(s.noIndex ?? s.disallowRobots ?? false),
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
        disallowRobots: nextState.noIndex,
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedback({ type: "ok", text: "✓ تنظیمات هزینه‌های ارسال ذخیره شد." });
        setTimeout(() => setFeedback(null), 4500);
      } else {
        throw new Error(json.message || "خطا در ذخیره تنظیمات");
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
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات کلان سیستم و هزینه‌های ارسال
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            مدیریت بلادرنگ پارامترهای مالی (پست/تیپاکس)
          </p>
        </div>
        <button type="submit" disabled={saving || loading} className="w-full lg:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-black shadow-lg cursor-pointer">
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات 💾"}
        </button>
      </div>

      {feedback && (
        <div className={"p-4 rounded-2xl text-xs font-bold border animate-fadeIn " + (feedback.type === "ok" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-rose-500/15 border-rose-500/30 text-rose-400")}>
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            <span>🚚</span> تنظیمات هزینه‌های ارسال
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">هزینه ارسال با پست (تومان):</label>
              <input type="text" value={form.postShippingCost} onChange={(e) => setForm({ ...form, postShippingCost: e.target.value })}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none focus:border-[var(--accent-blue)]" />
            </div>
            <div>
              <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">هزینه ارسال با تیپاکس (تومان):</label>
              <input type="text" value={form.tipaxShippingCost} onChange={(e) => setForm({ ...form, tipaxShippingCost: e.target.value })}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none focus:border-[var(--accent-blue)]" />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

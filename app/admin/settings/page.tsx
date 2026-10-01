// File Path: app/admin/settings/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface SystemSettingsState {
  maintenance_mode: boolean;
  maintenance_message: string;
  seo_noindex: boolean;
  allow_guest_checkout: boolean;
  sms_notifications_enabled: boolean;
  default_shipping_cost: number;
  free_shipping_threshold: number;
  vat_percent: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsState>({
    maintenance_mode: false,
    maintenance_message: "فروشگاه آکسون در حال بروزرسانی زیرساخت‌های فنی است. به زودی باز می‌گردیم.",
    seo_noindex: false,
    allow_guest_checkout: true,
    sms_notifications_enabled: true,
    default_shipping_cost: 65000,
    free_shipping_threshold: 5000000,
    vat_percent: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.settings) {
        setSettings(json.settings);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel("realtime-admin-system-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSave = async (e?: React.FormEvent, overrideSettings?: SystemSettingsState) => {
    if (e) e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setFeedback(null);

    const payload = overrideSettings || settings;

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setSettings(json.settings || payload);
        setFeedback({
          type: "success",
          text: json.message || "تنظیمات با موفقیت ذخیره و به صورت بلادرنگ اعمال شد.",
        });
      } else {
        setFeedback({ type: "error", text: json.message || "خطا در ذخیره تنظیمات." });
      }
    } catch {
      setFeedback({ type: "error", text: "خطا در ارتباط با سرور." });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const toggleQuickSwitch = (key: keyof SystemSettingsState) => {
    const next: SystemSettingsState = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(next);
    handleSave(undefined, next);
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات کلان سیستم، حالت تعمیرات و کنترل ایندکس گوگل
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            مدیریت بلادرنگ وضعیت فعال بودن سایت، دسترسی ربات‌های جستجوگر (Robots/NoIndex) و پارامترهای مالی سفارشات
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link
            href="/maintenance"
            target="_blank"
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-amber-500 text-xs font-bold flex items-center gap-1.5"
          >
            <span>🛠️ پیش‌نمایش صفحه تعمیرات</span>
          </Link>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال ثبت..." : "💾 ذخیره تنظیمات"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-bold">
          در حال بارگذاری تنظیمات کلان سیستم...
        </div>
      ) : (
        <form onSubmit={(e) => handleSave(e)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
            <h2 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              🛡️ وضعیت دسترس‌پذیری سایت و کنترل خزنده‌های گوگل
            </h2>

            {/* سوئیچ حالت در دست تعمیر */}
            <div
              className={
                "p-4 rounded-2xl border transition flex items-center justify-between gap-4 " +
                (settings.maintenance_mode
                  ? "bg-amber-500/15 border-amber-500/40"
                  : "bg-[var(--input-bg)] border-[var(--card-border)]")
              }
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚧</span>
                  <h3 className="font-black text-xs">حالت در دست تعمیر (Maintenance Mode)</h3>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  در صورت فعال‌سازی، بازدیدکنندگان به صفحه تعمیرات هدایت می‌شوند اما پنل ادمین کاملاً فعال می‌ماند.
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleQuickSwitch("maintenance_mode")}
                className={
                  "px-4 py-2 rounded-xl font-black text-xs cursor-pointer transition shrink-0 " +
                  (settings.maintenance_mode
                    ? "bg-amber-500 text-slate-950 shadow-lg"
                    : "bg-[var(--modal-bg)] text-slate-400 border border-[var(--card-border)]")
                }
              >
                {settings.maintenance_mode ? "فعال (در دست تعمیر)" : "غیرفعال (سایت باز)"}
              </button>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                پیام نمایشی به کاربران در زمان تعمیرات:
              </label>
              <textarea
                rows={2}
                value={settings.maintenance_message}
                onChange={(e) =>
                  setSettings({ ...settings, maintenance_message: e.target.value })
                }
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] leading-relaxed"
              />
            </div>

            {/* سوئیچ کنترل ایندکس گوگل */}
            <div
              className={
                "p-4 rounded-2xl border transition flex items-center justify-between gap-4 " +
                (settings.seo_noindex
                  ? "bg-rose-500/15 border-rose-500/40"
                  : "bg-emerald-500/10 border-emerald-500/30")
              }
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">🤖</span>
                  <h3 className="font-black text-xs">
                    جلوگیری از ایندکس شدن در گوگل (NoIndex / Disallow Robots)
                  </h3>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {settings.seo_noindex
                    ? "⚠️ هم‌اکنون ایندکس گوگل مسدود است (Disallow: / در فایل robots.txt)."
                    : "✓ ایندکس گوگل فعال و آزاد است و ربات‌های گوگل صفحات سایت را ایندکس می‌کنند."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleQuickSwitch("seo_noindex")}
                className={
                  "px-4 py-2 rounded-xl font-black text-xs cursor-pointer transition shrink-0 " +
                  (settings.seo_noindex
                    ? "bg-rose-600 text-white shadow-lg"
                    : "bg-emerald-600 text-white shadow-lg")
                }
              >
                {settings.seo_noindex ? "NoIndex فعال 🚫" : "ایندکس آزاد ✓"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
            <h2 className="text-sm font-black text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              💳 قوانین سبد خرید، مالیات، هزینه ارسال و پیامک‌ها
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  هزینه ارسال پیش‌فرض پستی (تومان):
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.default_shipping_cost}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      default_shipping_cost: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  سقف خرید برای ارسال رایگان (تومان):
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.free_shipping_threshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      free_shipping_threshold: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                  درصد مالیات بر ارزش افزوده (VAT %):
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={settings.vat_percent}
                  onChange={(e) =>
                    setSettings({ ...settings, vat_percent: Number(e.target.value) })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
                <span className="font-bold">امکان ثبت سفارش سریع مهمان (با تایید موبایل در تسویه‌حساب)</span>
                <input
                  type="checkbox"
                  checked={settings.allow_guest_checkout}
                  onChange={(e) =>
                    setSettings({ ...settings, allow_guest_checkout: e.target.checked })
                  }
                  className="rounded accent-[var(--accent-blue)] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer">
                <span className="font-bold">ارسال خودکار پیامک ثبت سفارش و تغییر وضعیت به خریدار</span>
                <input
                  type="checkbox"
                  checked={settings.sms_notifications_enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sms_notifications_enabled: e.target.checked,
                    })
                  }
                  className="rounded accent-[var(--accent-blue)] w-4 h-4"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-xl hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "در حال ذخیره در دیتابیس..." : "💾 ذخیره نهایی و انتشار بلادرنگ تنظیمات"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

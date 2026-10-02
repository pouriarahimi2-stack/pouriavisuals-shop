"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

interface SystemSettingsState {
  defaultShippingCost: string;
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
    freeShippingThreshold: "0",
    vatPercent: "10",
    allowGuestCheckout: true,
    autoSendOrderSms: true,
    maintenanceMode: false,
    maintenanceMessage:
      "فروشگاه آکسون در حال بروزرسانی زیرساخت‌های فنی است. به زودی باز می‌گردیم.",
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
        freeShippingThreshold: String(s.freeShippingThreshold ?? 0),
        vatPercent: String(s.vatPercent ?? 10),
        allowGuestCheckout: Boolean(s.allowGuestCheckout ?? true),
        autoSendOrderSms: Boolean(s.autoSendOrderSms ?? true),
        maintenanceMode: Boolean(s.maintenanceMode ?? false),
        maintenanceMessage: String(
          s.maintenanceMessage ??
            "فروشگاه آکسون در حال بروزرسانی زیرساخت‌های فنی است. به زودی باز می‌گردیم."
        ),
        noIndex: Boolean(s.noIndex ?? s.disallowRobots ?? false),
      });
    } catch {
      setFeedback({ type: "err", text: "خطا در بارگذاری تنظیمات از سرور." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const persistSettings = async (nextState: SystemSettingsState) => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        defaultShippingCost: Number(
          String(nextState.defaultShippingCost)
            .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
            .replace(/,/g, "")
            .trim() || 0
        ),
        freeShippingThreshold: Number(
          String(nextState.freeShippingThreshold)
            .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
            .replace(/,/g, "")
            .trim() || 0
        ),
        vatPercent: Number(
          String(nextState.vatPercent)
            .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
            .replace(/,/g, "")
            .trim() || 0
        ),
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
        setFeedback({
          type: "ok",
          text:
            json.message ||
            "✓ تنظیمات کلان ذخیره شد و به صورت زنده در صفحه تسویه‌حساب و کل سایت اعمال گردید.",
        });
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

  const handleQuickToggle = async (field: "maintenanceMode" | "noIndex") => {
    soundEngine.playClick();
    const updated = { ...form, [field]: !form[field] };
    setForm(updated);
    await persistSettings(updated);
  };

  return (
    <form
      onSubmit={handleSaveSubmit}
      className="space-y-6 font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      {/* هدر صفحه تنظیمات کلان */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات کلان سیستم، حالت تعمیرات و کنترل ایندکس گوگل
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            مدیریت بلادرنگ وضعیت فعال بودن سایت، دسترسی ربات‌های جستجوگر (Robots/NoIndex) و پارامترهای مالی سفارشات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Link
            href="/maintenance"
            target="_blank"
            className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition"
          >
            🛠️ پیش‌نمایش صفحه تعمیرات
          </Link>
          <button
            type="submit"
            disabled={saving || loading}
            className="flex-1 sm:flex-initial justify-center px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <span>💾</span>
            <span>{saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold border animate-fadeIn " +
            (feedback.type === "ok"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/15 border-rose-500/30 text-rose-400")
          }
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ستون وضعیت دسترس‌پذیری و ایندکس گوگل */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h2 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <span>🌐</span> وضعیت دسترس‌پذیری سایت و کنترل خزنده‌های گوگل
          </h2>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-black text-xs flex items-center gap-1.5">
                <span>🚧</span> حالت در دست تعمیر (Maintenance Mode)
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                در صورت فعال‌سازی، بازدیدکنندگان به صفحه تعمیرات هدایت می‌شوند اما پنل ادمین کاملاً فعال می‌‌ماند.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleQuickToggle("maintenanceMode")}
              className={
                "px-4 py-2 rounded-xl font-black text-xs cursor-pointer shrink-0 transition " +
                (form.maintenanceMode
                  ? "bg-amber-500 text-black shadow-lg"
                  : "bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
              }
            >
              {form.maintenanceMode ? "⚠️ فعال (سایت روی تعمیرات)" : "غیرفعال (سایت باز)"}
            </button>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-[var(--text-secondary)]">
              پیام نمایشی به کاربران در زمان تعمیرات:
            </label>
            <textarea
              rows={3}
              value={form.maintenanceMessage}
              onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] leading-relaxed"
            />
          </div>

          <div
            className={
              "p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition " +
              (form.noIndex
                ? "bg-rose-500/10 border-rose-500/30"
                : "bg-emerald-500/10 border-emerald-500/30")
            }
          >
            <div className="space-y-1">
              <div className="font-black text-xs flex items-center gap-1.5">
                <span>🤖</span> جلوگیری از ایندکس شدن در گوگل (NoIndex / Disallow Robots)
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {form.noIndex
                  ? "⚠️ هم‌اکنون ایندکس گوگل مسدود است (Disallow: / در فایل robots.txt)."
                  : "✓ ایندکس گوگل باز است و ربات‌های جستجوگر اجازه ثبت صفحات سایت را دارند."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleQuickToggle("noIndex")}
              className={
                "px-4 py-2 rounded-xl font-black text-xs cursor-pointer shrink-0 transition " +
                (form.noIndex
                  ? "bg-rose-600 text-white shadow-lg"
                  : "bg-emerald-600 text-white shadow-lg")
              }
            >
              {form.noIndex ? "⛔ NoIndex فعال" : "✓ ایندکس گوگل فعال"}
            </button>
          </div>
        </div>

        {/* ستون قوانین سبد خرید، مالیات، هزینه ارسال و پیامک‌ها */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h2 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <span>💳</span> قوانین سبد خرید، مالیات، هزینه ارسال و پیامک‌ها
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                هزینه ارسال پیش‌فرض پستی (تومان):
              </label>
              <input
                type="number"
                min={0}
                dir="ltr"
                value={form.defaultShippingCost}
                onChange={(e) => setForm({ ...form, defaultShippingCost: e.target.value })}
                placeholder="0"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-center outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                سقف خرید برای ارسال رایگان (تومان):
              </label>
              <input
                type="number"
                min={0}
                dir="ltr"
                value={form.freeShippingThreshold}
                onChange={(e) => setForm({ ...form, freeShippingThreshold: e.target.value })}
                placeholder="0"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-center outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                درصد مالیات بر ارزش افزوده (VAT %):
              </label>
              <input
                type="number"
                min={0}
                max={100}
                dir="ltr"
                value={form.vatPercent}
                onChange={(e) => setForm({ ...form, vatPercent: e.target.value })}
                placeholder="10"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-center outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <label className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 cursor-pointer">
              <span className="font-bold">
                امکان ثبت سفارش سریع مهمان (با تایید موبایل در تسویه‌حساب)
              </span>
              <input
                type="checkbox"
                checked={form.allowGuestCheckout}
                onChange={(e) => setForm({ ...form, allowGuestCheckout: e.target.checked })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </label>

            <label className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 cursor-pointer">
              <span className="font-bold">
                ارسال خودکار پیامک ثبت سفارش و تغییر وضعیت به خریدار
              </span>
              <input
                type="checkbox"
                checked={form.autoSendOrderSms}
                onChange={(e) => setForm({ ...form, autoSendOrderSms: e.target.checked })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-xl cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>💾</span>
            <span>
              {saving
                ? "در حال ذخیره و انتشار بلادرنگ..."
                : "ذخیره نهایی و انتشار بلادرنگ تنظیمات"}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}

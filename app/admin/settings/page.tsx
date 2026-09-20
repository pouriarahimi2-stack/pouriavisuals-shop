"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Save, ShieldAlert, Globe } from "lucide-react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("آکسون کور");
  const [phone, setPhone] = useState("09376110200");
  const [email, setEmail] = useState("Pouriarahimi@yahoo.com");
  const [address, setAddress] = useState("شیراز - ستارخان");
  const [workingHours, setWorkingHours] = useState("شنبه تا چهارشنبه ۹ الی ۱۸");
  const [allowGoogleIndex, setAllowGoogleIndex] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState<"none" | "timed" | "indefinite">("none");
  const [maintenanceMessage, setMaintenanceMessage] = useState("سایت در حال بروزرسانی و ارتقای فنی است. به زودی بازمی‌گردیم.");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          const s = d.settings;
          if (s.site_name) setSiteName(s.site_name);
          if (s.phone) setPhone(s.phone);
          if (s.email) setEmail(s.email);
          if (s.address) setAddress(s.address);
          if (s.working_hours) setWorkingHours(s.working_hours);
          if (s.allow_google_index !== undefined) setAllowGoogleIndex(s.allow_google_index);
          if (s.maintenance_mode) setMaintenanceMode(s.maintenance_mode);
          if (s.header_announcement) setMaintenanceMessage(s.header_announcement);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_name: siteName,
          phone,
          email,
          address,
          working_hours: workingHours,
          allow_google_index: allowGoogleIndex,
          maintenance_mode: maintenanceMode,
          maintenance_message: maintenanceMessage,
        }),
      });

      if (res.ok) {
        soundEngine.playSuccess();
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-10 dir-rtl font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--card-border)]">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-sm font-bold flex items-center gap-2">
              <ArrowRight size={18} />
              پیشخوان
            </Link>
            <h1 className="text-xl sm:text-2xl font-black">تنظیمات عمومی، سئو گوگل و حالت تعمیرات</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            کنترل ایندکس موتورهای جستجو، قطع دسترسی و حالت در دست تعمیر، و مشخصات رسمی فروشگاه
          </p>
        </div>
      </div>

      <div className="max-w-3xl mt-8">
        <form onSubmit={handleSave} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-6 text-xs">
          
          {/* حالت تعمیرات سایت */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-black">
                <ShieldAlert size={18} />
                <span>حالت در دست تعمیر (قطع دسترسی عموم به سایت):</span>
              </div>
              <select
                value={maintenanceMode}
                onChange={(e: any) => setMaintenanceMode(e.target.value)}
                className="p-2 rounded-xl bg-[var(--input-bg)] border border-amber-500 font-bold outline-none cursor-pointer"
              >
                <option value="none">سایت فعال و آنلاین است ✓</option>
                <option value="indefinite">حالت تعمیرات فعال (قطع دسترسی)</option>
              </select>
            </div>
            {maintenanceMode !== "none" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-400">متن پیام نمایش داده شده به بازدیدکنندگان:</label>
                <input
                  type="text"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-amber-500 font-bold"
                />
              </div>
            )}
          </div>

          {/* کلید ایندکس گوگل */}
          <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--accent-blue)] font-black">
                <Globe size={18} />
                <span>دسترسی خزنده‌های گوگل و موتورهای جستجو:</span>
              </div>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowGoogleIndex}
                  onChange={(e) => setAllowGoogleIndex(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                {allowGoogleIndex ? "ایندکس گوگل مجاز است" : "هاید کامل از گوگل (noindex)"}
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              در صورت غیرفعال کردن، متاتگ noindex, nofollow در کل صفحات درج می‌شود تا گوگل سایت را ایندکس نکند.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1.5">نام رسمی فروشگاه:</label>
              <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none" />
            </div>
            <div>
              <label className="block font-bold mb-1.5">تلفن پشتیبانی:</label>
              <input type="text" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none text-center" />
            </div>
            <div>
              <label className="block font-bold mb-1.5">ایمیل رسمی:</label>
              <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none text-center" />
            </div>
            <div>
              <label className="block font-bold mb-1.5">ساعات کاری:</label>
              <input type="text" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold mb-1.5">نشانی پستی دفتر و انبار مرکزی:</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none" />
            </div>
          </div>

          {saved && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-center">
              ✓ تنظیمات عمومی با موفقیت در دیتابیس ذخیره شد.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات در دیتابیس"}
          </button>
        </form>
      </div>
    </div>
  );
}

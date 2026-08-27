"use client";

import React, { useState, useEffect, useRef } from "react";
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminSiteInfo() {
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");

  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>("none");
  const [maintHours, setMaintHours] = useState<number>(1);
  const [maintMinutes, setMaintMinutes] = useState<number>(0);

  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [youtube, setYoutube] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(2000000);
  const [description, setDescription] = useState("");
  const [customCss, setCustomCss] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const headerLogoFileRef = useRef<HTMLInputElement>(null);
  const footerLogoFileRef = useRef<HTMLInputElement>(null);

  const populateForm = (data: SiteInfo) => {
    setSiteName(data.site_name || data.siteName || data.storeName || "");
    setTagline(data.tagline || "");
    setPhone(data.phone || "");
    setEmail(data.email || "");
    setAddress(data.address || "");
    setWorkingHours(data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
    setLogoUrl(data.logo_url || data.logoUrl || "");
    setFooterLogoUrl(data.footer_logo_url || data.footerLogoUrl || "");

    const mode = data.maintenance_mode || (data.allow_google_index === false ? "indefinite" : "none");
    setMaintenanceMode(mode);

    setInstagram(data.instagram || "");
    setTelegram(data.telegram || "");
    setWhatsapp(data.whatsapp || "");
    setYoutube(data.youtube || "");
    setAnnouncement(data.header_announcement || "");
    setFreeShippingThreshold(Number(data.free_shipping_threshold || 2000000));
    setDescription(data.description || data.footer_text || "");
    setCustomCss(data.custom_css || "");
  };

  useEffect(() => {
    const initialData = siteInfoService.getSiteInfoSync();
    if (initialData) populateForm(initialData);

    siteInfoService.getSiteInfo().then((data) => {
      if (data) populateForm(data);
    });

    const channel = supabase
      .channel("site-info-admin-realtime-master-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        siteInfoService.getSiteInfo().then((data) => {
          if (data) populateForm(data);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isFooter: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setStatusMessage({ type: "error", text: "حجم تصویر نباید بیشتر از ۴ مگابایت باشد." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          if (isFooter) {
            setFooterLogoUrl(reader.result);
          } else {
            setLogoUrl(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

    let untilISO: string | null = null;
    const totalMins = Number(maintHours) * 60 + Number(maintMinutes);
    if (maintenanceMode === "timed") {
      untilISO = new Date(Date.now() + totalMins * 60 * 1000).toISOString();
    }

    const payload: Partial<SiteInfo> = {
      site_name: siteName.trim(),
      siteName: siteName.trim(),
      storeName: siteName.trim(),
      tagline: tagline.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      working_hours: workingHours.trim(),
      logo_url: logoUrl.trim(),
      logoUrl: logoUrl.trim(),
      footer_logo_url: footerLogoUrl.trim(),
      footerLogoUrl: footerLogoUrl.trim(),
      allow_google_index: maintenanceMode === "none",
      allowGoogleIndex: maintenanceMode === "none",
      maintenance_mode: maintenanceMode,
      maintenance_until: untilISO || undefined,
      maintenance_duration_minutes: maintenanceMode === "timed" ? totalMins : undefined,
      instagram: instagram.trim(),
      telegram: telegram.trim(),
      whatsapp: whatsapp.trim(),
      youtube: youtube.trim(),
      header_announcement: announcement.trim(),
      free_shipping_threshold: Number(freeShippingThreshold),
      description: description.trim(),
      footer_text: description.trim(),
      custom_css: customCss,
    };

    try {
      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setStatusMessage({
          type: "success",
          text: "⚡ وضعیت سایت، تنظیمات برند و حالت تعمیرات با موفقیت در دیتابیس ذخیره و بلادرنگ اعمال شد.",
        });
      } else {
        throw new Error(json.message || "خطا در پاسخ سرور");
      }
    } catch (err: any) {
      console.error("Save site info error:", err);
      setStatusMessage({ type: "error", text: err?.message || "خطا در ذخیره‌سازی اطلاعات در دیتابیس." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات کلان سایت، سئو، هویت برند و درگاه‌ها
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پیکربندی هویت تجاری، لوگوهای هدر و فوتر، وضعیت تعمیرات زمان‌دار یا نامحدود و ایندکس گوگل
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="px-7 py-3 bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white rounded-2xl text-xs font-black transition shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار سراسری"}</span>
        </button>
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

      {/* بخش کنترل ۳ حالته وضعیت سایت و ایندکس گوگل */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${
              maintenanceMode === "none"
                ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] animate-pulse"
                : maintenanceMode === "timed"
                ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-ping"
                : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)]"
            }`}
          />
          <div>
            <h4 className="text-sm font-black text-[var(--text-primary)]">
              مدیریت وضعیت آنلاین بودن، حالت تعمیرات و دسترسی ربات‌های گوگل
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              یکی از ۳ حالت زیر را انتخاب نمایید و دکمه ذخیره را بزنید تا در لحظه روی کل سایت اعمال شود:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div
            onClick={() => setMaintenanceMode("none")}
            className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
              maintenanceMode === "none"
                ? "bg-emerald-500/10 border-emerald-500 text-[var(--text-primary)] ring-2 ring-emerald-500/20"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:border-slate-500"
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs">
              <input type="radio" checked={maintenanceMode === "none"} onChange={() => {}} />
              <span>۱. سایت آنلاین و فعال (Online)</span>
            </div>
            <p className="text-[11px] leading-relaxed">سایت برای تمام کاربران و گوگل فعال است.</p>
          </div>

          <div
            onClick={() => setMaintenanceMode("timed")}
            className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
              maintenanceMode === "timed"
                ? "bg-amber-500/10 border-amber-500 text-[var(--text-primary)] ring-2 ring-amber-500/20"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:border-slate-500"
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs">
              <input type="radio" checked={maintenanceMode === "timed"} onChange={() => {}} />
              <span>۲. تعمیرات زمان‌دار (با تایمر)</span>
            </div>
            <p className="text-[11px] leading-relaxed">سایت قفل شده و شمارنده معکوس نشان داده می‌شود.</p>

            {maintenanceMode === "timed" && (
              <div className="pt-2 border-t border-[var(--card-border)] flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={48}
                  value={maintHours}
                  onChange={(e) => setMaintHours(Number(e.target.value))}
                  className="w-16 p-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center text-xs"
                />
                <span className="text-[10px]">ساعت</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={maintMinutes}
                  onChange={(e) => setMaintMinutes(Number(e.target.value))}
                  className="w-16 p-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center text-xs"
                />
                <span className="text-[10px]">دقیقه</span>
              </div>
            )}
          </div>

          <div
            onClick={() => setMaintenanceMode("indefinite")}
            className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
              maintenanceMode === "indefinite"
                ? "bg-rose-500/10 border-rose-500 text-[var(--text-primary)] ring-2 ring-rose-500/20"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:border-slate-500"
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs">
              <input type="radio" checked={maintenanceMode === "indefinite"} onChange={() => {}} />
              <span>۳. تعمیرات نامحدود (قفل کامل)</span>
            </div>
            <p className="text-[11px] leading-relaxed">سایت تا زمان فعال‌سازی مجدد توسط ادمین مخفی می‌ماند.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-8 shadow-xl text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="file" ref={headerLogoFileRef} onChange={(e) => handleFileUpload(e, false)} accept="image/*" className="hidden" />
          <input type="file" ref={footerLogoFileRef} onChange={(e) => handleFileUpload(e, true)} accept="image/*" className="hidden" />

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">🖼️ لوگوی اصلی هدر بالای سایت</h3>
            <div className="flex items-center gap-4 p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)]">
              <div className="w-20 h-20 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? <img src={logoUrl} alt="Header Logo" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">🏢</span>}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex gap-2">
                  <button type="button" onClick={() => headerLogoFileRef.current?.click()} className="px-3.5 py-2 bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">
                    📁 آپلود از دستگاه
                  </button>
                  {logoUrl && (
                    <button type="button" onClick={() => setLogoUrl("")} className="px-3 py-2 bg-rose-500/15 text-rose-500 rounded-xl text-xs font-bold cursor-pointer">حذف ✕</button>
                  )}
                </div>
                <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="یا درج لینک تصویر لوگو..." className="w-full p-2.5 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">⚓ آیکون / لوگوی اختصاصی فوتر</h3>
            <div className="flex items-center gap-4 p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)]">
              <div className="w-20 h-20 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {footerLogoUrl ? <img src={footerLogoUrl} alt="Footer Logo" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">⚓</span>}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex gap-2">
                  <button type="button" onClick={() => footerLogoFileRef.current?.click()} className="px-3.5 py-2 bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">
                    📁 آپلود از دستگاه
                  </button>
                  {footerLogoUrl && (
                    <button type="button" onClick={() => setFooterLogoUrl("")} className="px-3 py-2 bg-rose-500/15 text-rose-500 rounded-xl text-xs font-bold cursor-pointer">حذف ✕</button>
                  )}
                </div>
                <input type="text" value={footerLogoUrl} onChange={(e) => setFooterLogoUrl(e.target.value)} placeholder="یا درج لینک تصویر فوتر..." className="w-full p-2.5 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--card-border)] pt-6">
          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">متن نوار اعلانات بالای سایت</label>
            <input type="text" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="متن اعلان..." className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]" />
          </div>
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">سقف ارسال رایگان (تومان)</label>
            <input type="number" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(Number(e.target.value))} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono font-bold text-[var(--text-primary)] outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--card-border)] pt-6">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نام رسمی برند / فروشگاه *</label>
            <input type="text" required value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-primary)] outline-none" />
          </div>
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شعار تبلیغاتی (Tagline)</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-primary)] outline-none" />
          </div>
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شماره تماس رسمی</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono font-bold text-[var(--text-primary)] outline-none" />
          </div>
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">ایمیل رسمی</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)] outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">ساعات کاری</label>
            <input type="text" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-primary)] outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نشانی پستی دفتر و انبار</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-primary)] outline-none" />
          </div>
        </div>

        <div className="space-y-4 border-t border-[var(--card-border)] pt-6">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">متن کامل معرفی در پاورقی (Footer)</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs leading-relaxed text-[var(--text-primary)] outline-none" />
          </div>
        </div>
      </form>
    </div>
  );
}
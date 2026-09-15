"use client";

import React, { useState, useEffect, useRef } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminSiteInfo() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const faviconInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const footerLogoInputRef = useRef<HTMLInputElement>(null);

  const fetchInfo = async () => {
    const data = await siteInfoService.getSiteInfo();
    if (data) {
      setSiteInfo(data);
      setSiteName(data.site_name || data.siteName || data.storeName || "Axon | آکسون");
      setTagline(data.tagline || "");
      setLogoUrl(data.logo_url || data.logoUrl || "");
      setFooterLogoUrl(data.footer_logo_url || data.footerLogoUrl || "");
      setFaviconUrl(data.favicon_url || "");
      setPhone(data.phone || "09376110200");
      setEmail(data.email || "Pouriarahimi@yahoo.com");
      setAddress(data.address || "شیراز - ستارخان");
      setWorkingHours(data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const handleFileUpload = (file: File, setter: (val: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setter(e.target.result as string);
        soundEngine.playSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

    try {
      const payload: Partial<SiteInfo> = {
        site_name: siteName.trim(),
        siteName: siteName.trim(),
        storeName: siteName.trim(),
        tagline: tagline.trim(),
        logo_url: logoUrl.trim(),
        logoUrl: logoUrl.trim(),
        footer_logo_url: footerLogoUrl.trim(),
        footerLogoUrl: footerLogoUrl.trim(),
        favicon_url: faviconUrl.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        working_hours: workingHours.trim(),
      };

      const updated = await siteInfoService.updateSiteInfo(payload);
      if (updated) {
        soundEngine.playSuccess();
        setStatusMessage({ type: "success", text: "⚡ لوگوها و مشخصات فروشگاه با موفقیت در دیتابیس ذخیره و فعال شدند." });

        if (faviconUrl) {
          let link = document.getElementById("axon-dynamic-favicon") as HTMLLinkElement;
          if (!link) {
            link = document.createElement("link");
            link.id = "axon-dynamic-favicon";
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = faviconUrl;
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "خطا در ثبت اطلاعات در دیتابیس." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* ورودی‌های مخفی فایل */}
      <input type="file" ref={faviconInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setFaviconUrl)} accept="image/*" className="hidden" />
      <input type="file" ref={logoInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setLogoUrl)} accept="image/*" className="hidden" />
      <input type="file" ref={footerLogoInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setFooterLogoUrl)} accept="image/*" className="hidden" />

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات هویت بصری، لوگوها و مشخصات رسمی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تغییر و آپلود مستقیم لوگوی هدر، لوگوی بزرگ فوتر و فاوآیکون تب مرورگر با ذخیره در دیتابیس
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار سراسری"}
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
          statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
        }`}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-6 shadow-xl text-xs">
        
        {/* بخش مدیریت ۳ لوگوی سایت */}
        <div className="space-y-4 border-b border-[var(--card-border)] pb-6">
          <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
            <span>🖼️</span> مدیریت لوگوها و آیکون مرورگر (آپلود مستقیم یا لینک URL)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* ۱. لوگوی هدر بالای سایت */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-[var(--text-primary)]">لوگوی بالای سایت (Header):</label>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-xl bg-blue-600 text-white text-[11px] font-bold cursor-pointer hover:bg-blue-500 transition"
                >
                  📁 انتخاب فایل
                </button>
              </div>
              <div className="w-full h-24 rounded-xl border border-[var(--card-border)] bg-black/10 dark:bg-white/5 flex items-center justify-center overflow-hidden p-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Header Logo" className="max-h-full object-contain" />
                ) : (
                  <span className="text-slate-400 font-bold text-[11px]">لوگو تنظیم نشده</span>
                )}
              </div>
              <input
                type="text"
                placeholder="یا آدرس اینترنتی عکس https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[11px] outline-none"
              />
            </div>

            {/* ۲. لوگوی بزرگ فوتر */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-[var(--text-primary)]">لوگوی بزرگ فوتر (Footer):</label>
                <button
                  type="button"
                  onClick={() => footerLogoInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-xl bg-blue-600 text-white text-[11px] font-bold cursor-pointer hover:bg-blue-500 transition"
                >
                  📁 انتخاب فایل
                </button>
              </div>
              <div className="w-full h-24 rounded-xl border border-[var(--card-border)] bg-black/10 dark:bg-white/5 flex items-center justify-center overflow-hidden p-2">
                {footerLogoUrl ? (
                  <img src={footerLogoUrl} alt="Footer Logo" className="max-h-full object-contain" />
                ) : (
                  <span className="text-slate-400 font-bold text-[11px]">لوگوی فوتر تنظیم نشده</span>
                )}
              </div>
              <input
                type="text"
                placeholder="یا آدرس اینترنتی عکس https://..."
                value={footerLogoUrl}
                onChange={(e) => setFooterLogoUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[11px] outline-none"
              />
            </div>

            {/* ۳. فاوآیکون تب مرورگر */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-[var(--text-primary)]">فاوآیکون مرورگر (Favicon):</label>
                <button
                  type="button"
                  onClick={() => faviconInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-xl bg-blue-600 text-white text-[11px] font-bold cursor-pointer hover:bg-blue-500 transition"
                >
                  📁 انتخاب فایل
                </button>
              </div>
              <div className="w-full h-24 rounded-xl border border-[var(--card-border)] bg-black/10 dark:bg-white/5 flex items-center justify-center overflow-hidden p-2">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="Favicon" className="w-12 h-12 object-contain" />
                ) : (
                  <span className="text-slate-400 font-bold text-[11px]">فاوآیکون تنظیم نشده</span>
                )}
              </div>
              <input
                type="text"
                placeholder="یا آدرس اینترنتی آیکون https://..."
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[11px] outline-none"
              />
            </div>

          </div>
        </div>

        {/* بخش اطلاعات هویتی و تماس */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نام رسمی فروشگاه (Brand Name):</label>
            <input
              type="text"
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شعار برند (Tagline):</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شماره تلفن مستقیم:</label>
            <input
              type="text"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">پست الکترونیک (Email):</label>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نشانی انبار و تحویل حضوری:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-medium outline-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-xl cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال ذخیره در دیتابیس..." : "💾 ذخیره تغییرات لوگوها و هویت سایت"}
          </button>
        </div>
      </form>
    </div>
  );
}

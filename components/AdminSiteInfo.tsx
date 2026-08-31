"use client";

import React, { useState, useEffect, useRef } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";
import { applyFaviconToDOM, applyTitleToDOM } from "@/lib/realtimeSync";

export default function AdminSiteInfo() {
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  
  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  const [announcement, setAnnouncement] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(2000000);
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const headerLogoRef = useRef<HTMLInputElement>(null);
  const footerLogoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const populateForm = (data: SiteInfo) => {
    if (!data) return;
    setSiteName(data.site_name || data.siteName || data.storeName || "آکسون | Axon");
    setTagline(data.tagline || "");
    setPhone(data.phone || "");
    setEmail(data.email || "");
    setAddress(data.address || "");
    setWorkingHours(data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
    setLogoUrl(data.logo_url || data.logoUrl || "");
    setFooterLogoUrl(data.footer_logo_url || data.footerLogoUrl || "");
    setFaviconUrl(data.favicon_url || data.faviconUrl || "");
    setAnnouncement(data.header_announcement || "");
    setFreeShippingThreshold(Number(data.free_shipping_threshold || 2000000));
    setDescription(data.description || data.footer_text || "");
  };

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && populateForm(d));
    const handleUpdate = (e: any) => { if (e.detail) populateForm(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "header" | "footer" | "favicon") => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEngine.playClick();

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultBase64 = event.target?.result as string;
      if (target === "header") {
        setLogoUrl(resultBase64);
      } else if (target === "footer") {
        setFooterLogoUrl(resultBase64);
      } else if (target === "favicon") {
        setFaviconUrl(resultBase64);
        applyFaviconToDOM(resultBase64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

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
      favicon_url: faviconUrl.trim(),
      faviconUrl: faviconUrl.trim(),
      header_announcement: announcement.trim(),
      free_shipping_threshold: Number(freeShippingThreshold),
      description: description.trim(),
      footer_text: description.trim(),
    };

    try {
      const saved = await siteInfoService.updateSiteInfo(payload);
      if (saved) {
        soundEngine.playSuccess();
        if (saved.favicon_url) applyFaviconToDOM(saved.favicon_url);
        if (saved.tagline || saved.site_name) applyTitleToDOM(saved.tagline, saved.site_name);
        setStatusMessage({ type: "success", text: "⚡ ۳ نشان متحرک، فاوآیکون تب و تنظیمات با موفقیت ذخیره و فوراً اعمال شدند." });
      } else {
        throw new Error("خطا در ثبت پایگاه داده");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "خطا در ذخیره‌سازی اطلاعات" });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <input type="file" ref={headerLogoRef} onChange={(e) => handleFileUpload(e, "header")} accept="image/*,.gif,.svg,.webp,.apng" className="hidden" />
      <input type="file" ref={footerLogoRef} onChange={(e) => handleFileUpload(e, "footer")} accept="image/*,.gif,.svg,.webp,.apng" className="hidden" />
      <input type="file" ref={faviconRef} onChange={(e) => handleFileUpload(e, "favicon")} accept="image/*,.gif,.svg,.ico,.webp,.apng" className="hidden" />

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات کلان سایت، هویت بصری و ۳ لوگوی متحرک (GIF / SVG / PNG)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">پیکربندی لوگوی هدر، لوگوی فوتر و فاوآیکون متحرک تب مرورگر با حفظ کامل فریم‌های انیمیشن</p>
        </div>
        <button type="button" onClick={() => handleSubmit()} disabled={saving} className="px-7 py-3 bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white rounded-2xl text-xs font-black transition shadow-xl cursor-pointer disabled:opacity-50">
          {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و اعمال سراسری"}
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${statusMessage.type === "success" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 border border-rose-500/30 text-rose-600"}`}>
          {statusMessage.text}
        </div>
      )}

      {/* بخش تفکیک‌شده ۳ لوگوی متحرک */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h3 className="text-sm font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">🖼️ مدیریت ۳ نشان و لوگوی مستقل و متحرک سایت</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ۱. لوگوی هدر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۱. لوگوی اصلی هدر بالای سایت (متحرک / ثابت)</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">نمایش زنده در کپسول ناوبری بالا</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-2xl">⚡</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => headerLogoRef.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود عکس / GIF</button>
              {logoUrl && <button type="button" onClick={() => setLogoUrl("")} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>

          {/* ۲. لوگوی فوتر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۲. لوگوی اختصاصی فوتر سایت (متحرک / ثابت)</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">نمایش در بخش پایین و پاورقی</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {footerLogoUrl ? <img src={footerLogoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-2xl">⚓</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => footerLogoRef.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود عکس / GIF</button>
              {footerLogoUrl && <button type="button" onClick={() => setFooterLogoUrl("")} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>

          {/* ۳. فاوآیکون متحرک تب مرورگر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۳. فاوآیکون تب مرورگر (Favicon متحرک / GIF)</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">پخش مستقیم انیمیشن در تب مرورگر</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {faviconUrl ? <img src={faviconUrl} alt="" className="w-10 h-10 object-contain" /> : <span className="text-2xl">🌐</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => faviconRef.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود GIF / آیکون</button>
              {faviconUrl && <button type="button" onClick={() => { setFaviconUrl(""); applyFaviconToDOM("/favicon.ico"); }} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نام رسمی برند / فروشگاه *</label>
            <input type="text" required value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-bold text-[var(--text-primary)] outline-none" />
          </div>
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شعار تبلیغاتی (Tagline)</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-bold text-[var(--text-primary)] outline-none" />
          </div>
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شماره تماس پشتیبانی</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-mono font-bold text-[var(--text-primary)] outline-none" />
          </div>
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">ایمیل رسمی</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-mono text-[var(--text-primary)] outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نشانی پستی انبار و دفتر</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-[var(--text-primary)] outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">متن اعلان بالای سایت</label>
            <input type="text" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-[var(--text-primary)] font-bold outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

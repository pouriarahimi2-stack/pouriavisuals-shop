"use client";

import React, { useState, useEffect, useRef } from "react";
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminSiteInfo() {
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  
  // ۳ فیلد کاملاً مستقل برای ۳ لوگو
  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>("none");
  const [maintHours, setMaintHours] = useState<number>(1);
  const [maintMinutes, setMaintMinutes] = useState<number>(0);
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
    setFaviconUrl(data.favicon_url || "");
    setMaintenanceMode(data.maintenance_mode || (data.allow_google_index === false ? "indefinite" : "none"));
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

  const compressImage = (file: File, maxDim = 800): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
          } else {
            if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/webp", 0.85));
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "header" | "footer" | "favicon") => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEngine.playClick();
    const maxDim = target === "favicon" ? 128 : 800;
    const optimized = await compressImage(file, maxDim);
    if (target === "header") setLogoUrl(optimized);
    else if (target === "footer") setFooterLogoUrl(optimized);
    else if (target === "favicon") setFaviconUrl(optimized);
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
      favicon_url: faviconUrl.trim(),
      allow_google_index: maintenanceMode === "none",
      allowGoogleIndex: maintenanceMode === "none",
      maintenance_mode: maintenanceMode,
      maintenance_until: untilISO || undefined,
      maintenance_duration_minutes: maintenanceMode === "timed" ? totalMins : undefined,
      header_announcement: announcement.trim(),
      free_shipping_threshold: Number(freeShippingThreshold),
      description: description.trim(),
      footer_text: description.trim(),
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
        setStatusMessage({ type: "success", text: "⚡ تنظیمات، ۳ لوگوی مجزا و وضعیت سایت با موفقیت در دیتابیس ذخیره و بلادرنگ اعمال شدند." });
      } else {
        throw new Error(json.message || "خطا در ثبت");
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
      <input type="file" ref={headerLogoRef} onChange={(e) => handleFileUpload(e, "header")} accept="image/*" className="hidden" />
      <input type="file" ref={footerLogoRef做到} onChange={(e) => handleFileUpload(e, "footer")} accept="image/*" className="hidden" />
      <input type="file" ref={faviconRef} onChange={(e) => handleFileUpload(e, "favicon")} accept="image/*" className="hidden" />

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات کلان سایت، هویت بصری و ۳ لوگوی مستقل
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">پیکربندی لوگوی هدر، لوگوی فوتر، فاوآیکون مرورگر و حالت تعمیرات ۳ حالته</p>
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

      {/* بخش تفکیک‌شده ۳ لوگو با استایل تمیز و بدون تداخل */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h3 className="text-sm font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">🖼️ مدیریت ۳ نشان و لوگوی مستقل سایت</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ۱. لوگوی هدر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۱. لوگوی اصلی هدر بالای سایت</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">نمایش در کپسول ناوبری بالا</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-2xl">⚡</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => headerLogoRef.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود عکس</button>
              {logoUrl && <button type="button" onClick={() => setLogoUrl("")} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>

          {/* ۲. لوگوی فوتر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۲. لوگوی اختصاصی فوتر سایت</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">نمایش در بخش پایین و پاورقی</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {footerLogoUrl ? <img src={footerLogoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-2xl">⚓</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => footerLogoRef做到.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود عکس</button>
              {footerLogoUrl && <button type="button" onClick={() => setFooterLogoUrl("")} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>

          {/* ۳. فاوآیکون تب مرورگر */}
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs block text-[var(--text-primary)] mb-1">۳. فاوآیکون تب مرورگر (Favicon)</span>
              <span className="text-[10px] text-[var(--text-secondary)] block mb-3">نمایش در تب کنار عنوان مرورگر</span>
            </div>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
              {faviconUrl ? <img src={faviconUrl} alt="" className="w-10 h-10 object-contain" /> : <span className="text-2xl">🌐</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => faviconRef.current?.click()} className="flex-1 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">📁 آپلود آیکون</button>
              {faviconUrl && <button type="button" onClick={() => setFaviconUrl("")} className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold cursor-pointer">حذف ✕</button>}
            </div>
          </div>
        </div>
      </div>

      {/* اطلاعات فروشگاه */}
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

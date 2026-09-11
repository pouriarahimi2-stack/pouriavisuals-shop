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
  const [description, setDescription] = useState("");

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
      setDescription(data.description || data.footer_text || "");
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
        description: description.trim(),
        footer_text: description.trim(),
      };

      const updated = await siteInfoService.updateSiteInfo(payload);
      if (updated) {
        soundEngine.playSuccess();
        setStatusMessage({ type: "success", text: "✓ تنظیمات عمومی، فاوآیکون و لوگوها با موفقیت در سراسر سایت ذخیره و فعال شدند." });
        
        // به‌روزرسانی آنی فاوآیکون در تب جاری مرورگر
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
      } else {
        throw new Error("خطا در ذخیره دیتابیس");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "خطا در ثبت اطلاعات." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <input type="file" ref={faviconInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setFaviconUrl)} accept=".ico,.png,.svg" className="hidden" />
      <input type="file" ref={logoInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setLogoUrl)} accept="image/*" className="hidden" />
      <input type="file" ref={footerLogoInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setFooterLogoUrl)} accept="image/*" className="hidden" />

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-sky-500 flex items-center gap-2">
            <span>⚙️</span> تنظیمات عمومی، مدیریت فاوآیکون مرورگر و هویت بصری
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تعیین آیکون نوار آدرس مرورگر (Favicon)، لوگوی اصلی هدر و فوتر و اطلاعات رسمی شرکت
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
          statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-600"
        }`}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 md:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
        
        {/* بخش ویژه فاوآیکون تب مرورگر */}
        <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                <span>🌐</span> لوگو و فاوآیکون نوار آدرس مرورگر (Browser Tab Favicon)
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                تصویری که در تب بالای مرورگر و بوک‌مارک‌ها کنار نام سایت نمایش داده می‌شود
              </p>
            </div>
            <button
              type="button"
              onClick={() => faviconInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs cursor-pointer shadow-md transition"
            >
              📁 انتخاب فایل فاوآیکون
            </button>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="w-12 h-12 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center p-2 shrink-0 shadow-inner">
              {faviconUrl ? (
                <img src={faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl">🌐</span>
              )}
            </div>
            <input
              type="text"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="آدرس تصویر فاوآیکون (یا بارگذاری با دکمه بالا)"
              className="flex-1 p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs font-bold text-[var(--text-primary)] outline-none"
            />
          </div>
        </div>

        {/* بخش ویژه لوگوی هدر و لوگوی فوتر */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-black text-[var(--text-primary)]">لوگوی اصلی هدر کپسولی:</span>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold cursor-pointer"
              >
                بارگذاری عکس
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-1 flex items-center justify-center">
                {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-contain" /> : "▲"}
              </div>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="URL لوگوی هدر"
                className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-black text-[var(--text-primary)]">لوگوی ستون فوتر:</span>
              <button
                type="button"
                onClick={() => footerLogoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] font-bold cursor-pointer"
              >
                بارگذاری عکس
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-1 flex items-center justify-center">
                {footerLogoUrl ? <img src={footerLogoUrl} alt="" className="w-full h-full object-contain" /> : "▲"}
              </div>
              <input
                type="text"
                value={footerLogoUrl}
                onChange={(e) => setFooterLogoUrl(e.target.value)}
                placeholder="URL لوگوی فوتر"
                className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* مشخصات عمومی و متنی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام رسمی فروشگاه و برند:</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">شعار تجاری (Tagline):</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-medium"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره تماس پشتیبانی:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">پست الکترونیک رسمی:</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">نشانی دفتر و انبار تحویل حضوری:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">متن معرفی، گارانتی و استانداردها:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs leading-relaxed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار سراسری تغییرات"}
        </button>
      </form>
    </div>
  );
}

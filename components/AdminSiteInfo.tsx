"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function AdminSiteInfo() {
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // مشخصات اصلی
  const [storeName, setStoreName] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [logo, setLogo] = useState("");

  // اطلاعات تماس و نشانی
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // شبکه‌های اجتماعی
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // تنظیمات سئو و نمایه
  const [allowGoogleIndex, setAllowGoogleIndex] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const info = await siteInfoService.getAll();
        if (info) {
          setStoreName(info.storeName || info.store_name || "");
          setSiteTitle(info.siteTitle || info.site_title || "");
          setAboutText(info.aboutText || info.aboutUs || info.about_text || "");
          setLogo(info.logo || info.logoUrl || info.logo_url || "");
          setPhone(info.phone || "");
          setEmail(info.email || "");
          setAddress(info.address || "");
          setInstagram(info.instagram || "");
          setTelegram(info.telegram || "");
          setWhatsapp(info.whatsapp || "");
          setAllowGoogleIndex(info.allowGoogleIndex !== false);
        }
      } catch (e) {
        console.error("Error loading site info:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveSection = async (section: string) => {
    setSavingSection(section);
    try {
      const payload: Partial<SiteInfo> = {
        storeName,
        siteTitle,
        aboutText,
        aboutUs: aboutText,
        logo,
        logoUrl: logo,
        phone,
        email,
        address,
        instagram,
        telegram,
        whatsapp,
        allowGoogleIndex,
      };

      const res = await siteInfoService.update(payload);
      if (res.success) {
        showToast("success", "✅ تغییرات با موفقیت در پایگاه داده ذخیره شد.");
      } else {
        showToast("error", "خطا در ذخیره‌سازی اطلاعات.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "خطا در برقراری ارتباط با سرور.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)] relative">
      
      {/* پیام اعلان وضعیت (Toast) */}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-50 px-5 py-3.5 rounded-2xl text-xs font-black shadow-2xl flex items-center gap-2 animate-fadeIn border ${
            toast.type === "success"
              ? "bg-emerald-500 text-white border-emerald-400"
              : "bg-rose-600 text-white border-rose-500"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* بخش ۱: مشخصات اصلی، نام برند و لوگو */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <h3 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏢</span> مشخصات اصلی، نام برند و لوگو
          </h3>
          <button
            type="button"
            disabled={savingSection === "brand"}
            onClick={() => handleSaveSection("brand")}
            className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white font-bold transition cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
          >
            {savingSection === "brand" ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <span>💾 ذخیره مشخصات و لوگو</span>
            )}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام اصلی فروشگاه * (اعمال سراسری در تمام صفحات، هدر و عنوان مرورگر):</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="مثال: فروشگاه تخصصی Tech"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">متن «درباره فروشگاه ما» (نمایش در صفحه اصلی، فوتر و متادیتا):</label>
            <textarea
              rows={3}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="توضیحات کوتاه و جامع درباره فعالیت فروشگاه..."
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium leading-relaxed text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">🖼️ لوگوی فروشگاه (آپلود مستقیم یا لینک اینترنتی):</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="آدرس اینترنتی لوگو (https://...)"
                className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-xs focus:border-[var(--accent-blue)]"
              />
              <label className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer hover:opacity-90 transition flex items-center gap-1.5 shadow-md">
                <span>📁 آپلود تصویر</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
            {logo && (
              <div className="mt-2 p-2 w-20 h-20 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden">
                <img src={logo} alt="Logo Preview" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* بخش ۲: اطلاعات تماس، نشانی و راه‌های ارتباطی */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <h3 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
            <span>📞</span> اطلاعات تماس و نشانی فروشگاه
          </h3>
          <button
            type="button"
            disabled={savingSection === "contact"}
            onClick={() => handleSaveSection("contact")}
            className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white font-bold transition cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
          >
            {savingSection === "contact" ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <span>💾 ذخیره اطلاعات تماس</span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره تلفن پشتیبانی:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="۰۲۱-۸۸۸۸۸۸۸۸"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">ایمیل پشتیبانی:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@techstore.com"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-center focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">آدرس حضوری فروشگاه:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="تهران، خیابان ولیعصر، برج فناوری"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>
      </div>

      {/* بخش ۳: شبکه‌های اجتماعی و پیام‌رسان‌ها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <h3 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
            <span>🌐</span> شبکه‌های اجتماعی و پیام‌رسان‌ها
          </h3>
          <button
            type="button"
            disabled={savingSection === "social"}
            onClick={() => handleSaveSection("social")}
            className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white font-bold transition cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
          >
            {savingSection === "social" ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <span>💾 ذخیره شبکه‌های اجتماعی</span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">آیدی اینستاگرام (Instagram):</label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@tech_store"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-center focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">آیدی تلگرام (Telegram):</label>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@tech_store"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-center focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">شماره واتس‌اپ (WhatsApp):</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="09120000000"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-center focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
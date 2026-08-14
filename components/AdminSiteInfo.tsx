"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, SiteInfo, CustomFont } from "@/services/siteInfoService";

export default function AdminSiteInfo() {
  const [info, setInfo] = useState<SiteInfo>({
    storeName: "",
    logoUrl: "",
    activeFontId: "vazir",
    customFonts: [],
    aboutText: "",
    phone: "",
    email: "",
    address: "",
    instagram: "",
    telegram: "",
    allowGoogleIndex: true, // 🔍 کنترل مستقیم ایندکس گوگل
  });

  const [fontName, setFontName] = useState("");
  const [fontUrl, setFontUrl] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const loadedInfo = siteInfoService.getSiteInfo();
    setInfo({
      ...loadedInfo,
      allowGoogleIndex: loadedInfo.allowGoogleIndex !== undefined ? loadedInfo.allowGoogleIndex : true,
    });
  }, []);

  // 📷 آپلود و فشرده‌سازی عکس لوگو
  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("⚠️ لطفاً یک فایل تصویری معتبر انتخاب کنید.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const scaleFactor = MAX_WIDTH / img.width;

        canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        canvas.height = img.width > MAX_WIDTH ? img.height * scaleFactor : img.height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/webp", 0.85);
        setInfo((prev) => ({ ...prev, logoUrl: compressedBase64 }));
        showToast("📷 تصویر لوگو فشرده‌سازی و بارگذاری شد.");
      };
    };
  };

  const handleFontFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFontUrl(e.target.result as string);
        showToast("🔤 فایل فونت آماده ثبت است.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomFont = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fontName.trim() || !fontUrl.trim()) {
      showToast("⚠️ لطفاً نام و فایل/لینک فونت را وارد کنید.");
      return;
    }

    const newFont: CustomFont = {
      id: "font-" + Date.now(),
      name: fontName.trim(),
      url: fontUrl.trim(),
    };

    const updatedFonts = [...(info.customFonts || []), newFont];
    const updatedInfo = { ...info, customFonts: updatedFonts, activeFontId: newFont.id };

    setInfo(updatedInfo);
    siteInfoService.saveSiteInfo(updatedInfo);
    setFontName("");
    setFontUrl("");
    showToast(`✨ فونت جدید "${newFont.name}" اضافه و روی سایت فعال شد!`);
  };

  const handleDeleteFont = (fontId: string, fontNameStr: string) => {
    setConfirmModal({
      isOpen: true,
      title: "حذف فونت اختصاصی",
      message: `آیا از حذف فونت "${fontNameStr}" اطمینان دارید؟`,
      onConfirm: () => {
        const updatedFonts = (info.customFonts || []).filter((f) => f.id !== fontId);
        const activeId = info.activeFontId === fontId ? "vazir" : info.activeFontId;
        const updatedInfo = { ...info, customFonts: updatedFonts, activeFontId: activeId };

        setInfo(updatedInfo);
        siteInfoService.saveSiteInfo(updatedInfo);
        showToast(`🗑️ فونت "${fontNameStr}" با موفقیت حذف شد.`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmModal({
      isOpen: true,
      title: "ذخیره تغییرات اطلاعات سایت",
      message: "آیا از اعمال و انتشار تمام تغییرات برندینگ، سئو و اطلاعات تماس اطمینان دارید؟",
      onConfirm: () => {
        siteInfoService.saveSiteInfo(info);
        showToast("✅ اطلاعات سایت و تنظیمات ایندکس گوگل با موفقیت بروزرسانی شد!");
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="space-y-6 select-none relative text-xs font-sans text-white">
      {/* پیام نوتیفیکیشن */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-2xl border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* مدال تأیید هشدارهای امنیتی */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="liquid-glass-card p-6 max-w-sm w-full space-y-4 border-white/20 shadow-2xl">
            <h4 className="font-bold text-base text-[var(--accent-blue)]">{confirmModal.title}</h4>
            <p className="opacity-80 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold hover:opacity-90 transition cursor-pointer"
              >
                بله، ذخیره بشه
              </button>
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="liquid-glass-card p-5 space-y-4">
        <h4 className="font-bold text-sm text-[var(--accent-blue)] flex items-center gap-2">
          <span>🔤</span> مدیریت و نصب فونت‌های سفارشی فروشگاه
        </h4>

        <form onSubmit={handleAddCustomFont} className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 opacity-70 font-bold">نام فونت *</label>
              <input
                type="text"
                placeholder="مثلاً: فونت ایران لاله زار"
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 opacity-70 font-bold">لینک اینترنتی یا مسیر فایل فونت *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://... / .woff2 / .ttf"
                  value={fontUrl}
                  onChange={(e) => setFontUrl(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono text-[11px]"
                />
                <label className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer hover:bg-[var(--accent-blue)]/90 transition shrink-0 flex items-center justify-center">
                  📁 فایل فونت
                  <input
                    type="file"
                    accept=".woff2,.woff,.ttf,.otf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFontFileUpload(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs cursor-pointer hover:opacity-90 transition shadow-md"
          >
            ➕ افزودن و فعال‌سازی فونت جدید
          </button>
        </form>

        <div className="pt-2">
          <label className="block mb-1 opacity-80 font-bold">انتخاب فونت اصلی فعال برای تمامی صفحات سایت:</label>
          <select
            value={info.activeFontId || "vazir"}
            onChange={(e) => {
              const updated = { ...info, activeFontId: e.target.value };
              setInfo(updated);
              siteInfoService.saveSiteInfo(updated);
              showToast("🔤 فونت اصلی فروشگاه بروزرسانی شد.");
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 outline-none cursor-pointer font-bold"
          >
            <option value="vazir">فونت سیستم: وزیرمتن (Vazirmatn)</option>
            <option value="yekan">فونت سیستم: ایران‌یکان (IRANYekan)</option>
            <option value="shabnam">فونت سیستم: شبنم (Shabnam)</option>
            {info.customFonts?.map((f) => (
              <option key={f.id} value={f.id}>
                🎨 فونت سفارشی: {f.name}
              </option>
            ))}
          </select>
        </div>

        {info.customFonts && info.customFonts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="font-bold opacity-70 block">فونت‌های سفارشی نصب‌شده:</span>
            <div className="flex flex-wrap gap-2">
              {info.customFonts.map((f) => (
                <div key={f.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/10 border border-white/10">
                  <span className="font-bold">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteFont(f.id, f.name)}
                    className="text-red-400 font-bold hover:text-red-600 transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* فرم ثبت مشخصات کامل فروشگاه */}
      <form onSubmit={handleSubmit} className="liquid-glass-card p-5 space-y-4">
        <h4 className="font-bold text-sm text-[var(--accent-blue)] flex items-center gap-2">
          <span>⚙️</span> مشخصات عمومی، لوگو و راه‌های ارتباطی
        </h4>

        <div>
          <label className="block mb-1 opacity-70 font-bold">نام اصلی فروشگاه * (نمایش در هدر و مرورگر)</label>
          <input
            type="text"
            required
            value={info.storeName}
            onChange={(e) => setInfo({ ...info, storeName: e.target.value })}
            className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-bold text-sm text-indigo-200"
          />
        </div>

        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="block font-bold text-[var(--accent-blue)]">🖼️ لوگوی فروشگاه (لینک عکس یا آپلود مستقیم)</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="آدرس اینترنتی لوگو (https://...)"
              value={info.logoUrl || ""}
              onChange={(e) => setInfo({ ...info, logoUrl: e.target.value })}
              className="flex-1 p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono text-[11px]"
            />
            <label className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer hover:bg-[var(--accent-blue)]/90 transition shrink-0 flex items-center justify-center shadow-md">
              📁 آپلود لوگو
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]);
                }}
              />
            </label>
          </div>

          {info.logoUrl && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/10 w-fit">
              <span className="text-[10px] opacity-70 font-bold">پیش‌نمایش لوگو:</span>
              <img src={info.logoUrl} alt="Logo Preview" className="h-8 object-contain" />
              <button
                type="button"
                onClick={() => setInfo({ ...info, logoUrl: "" })}
                className="text-red-400 font-bold hover:text-red-600 transition cursor-pointer"
              >
                ✕ حذف لوگو
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block mb-1 opacity-70 font-bold">متن «درباره فروشگاه ما» (نمایش در فوتر)</label>
          <textarea
            rows={3}
            value={info.aboutText}
            onChange={(e) => setInfo({ ...info, aboutText: e.target.value })}
            className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 opacity-70 font-bold">شماره تلفن پشتیبانی</label>
            <input
              type="text"
              value={info.phone}
              onChange={(e) => setInfo({ ...info, phone: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block mb-1 opacity-70 font-bold">ایمیل پشتیبانی</label>
            <input
              type="email"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 opacity-70 font-bold">آدرس حضوری فروشگاه</label>
          <input
            type="text"
            value={info.address}
            onChange={(e) => setInfo({ ...info, address: e.target.value })}
            className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 opacity-70 font-bold">لینک پیج اینستاگرام</label>
            <input
              type="text"
              value={info.instagram}
              onChange={(e) => setInfo({ ...info, instagram: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block mb-1 opacity-70 font-bold">لینک کانال تلگرام</label>
            <input
              type="text"
              value={info.telegram}
              onChange={(e) => setInfo({ ...info, telegram: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono"
            />
          </div>
        </div>

        {/* 🔘 کنترل‌کننده دستی وضعیت ایندکس در گوگل (Googlebot indexing Toggle) */}
        <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 max-w-md">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                <span>🤖</span> غیرفعال‌سازی ایندکس گوگل (No-Index Guard)
              </span>
              <p className="text-[10px] opacity-70 leading-relaxed">
                با خاموش کردن این گزینه، خزنده‌های گوگل سایت را ثبت نمی‌کنند (مناسب زمان توسعه یا ساخت مجدد).
              </p>
            </div>

            {/* کلید سوئیچ ایندکس گوگل */}
            <button
              type="button"
              onClick={() => {
                const newState = !info.allowGoogleIndex;
                setInfo({ ...info, allowGoogleIndex: newState });
                showToast(
                  newState
                    ? "🌐 ایندکس گوگل فعال شد (Index / Follow)."
                    : "🛑 ایندکس گوگل غیرفعال شد (No-Index / No-Follow)."
                );
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md ${
                info.allowGoogleIndex
                  ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600"
                  : "bg-rose-600/30 text-rose-200 border border-rose-500/40 hover:bg-rose-600"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${info.allowGoogleIndex ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
              <span>{info.allowGoogleIndex ? "✅ ایندکس گوگل: فعال (Index)" : "🛑 ایندکس گوگل: مسدود (No-Index)"}</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs cursor-pointer hover:opacity-90 transition shadow-md"
        >
          ذخیره و انتشار تغییرات برندینگ و سئو 💾
        </button>
      </form>
    </div>
  );
}
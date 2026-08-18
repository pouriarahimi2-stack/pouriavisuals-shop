"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function AdminSiteInfo() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({
    site_name: "",
    tagline: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    logo: "",
    allowGoogleIndex: true,
    socials: {
      instagram: "",
      telegram: "",
      whatsapp: "",
      youtube: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await siteInfoService.getAll();
        if (data) {
          setSiteInfo({
            ...data,
            socials: data.socials || {
              instagram: "",
              telegram: "",
              whatsapp: "",
              youtube: "",
            },
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (field: keyof SiteInfo, value: any) => {
    setSiteInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (network: string, value: string) => {
    setSiteInfo((prev) => ({
      ...prev,
      socials: {
        ...(prev.socials || {}),
        [network]: value,
      },
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange("logo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const success = await siteInfoService.update(siteInfo);
      if (success) {
        showToast("✨ مشخصات و تنظیمات فروشگاه با موفقیت ذخیره و در سراسر سایت اعمال شد.");
      } else {
        showToast("خطا در ذخیره‌سازی اطلاعات.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs font-bold text-[var(--text-secondary)] font-sans">
        در حال بارگذاری اطلاعات برندینگ...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* هدر بخش تنظیمات */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>⚙️</span> تنظیمات عمومی، هویت برند و سئو سایت
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تغییر نام برند، شعار تبلیغاتی، اطلاعات تماس رسمی، شبکه‌های اجتماعی و وضعیت ایندکس موتورهای جستجو
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>💾</span>
          <span>{saving ? "در حال ذخیره‌سازی..." : "ذخیره و انتشار تغییرات"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ستون راست: مشخصات برند و لوگو */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h4 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            🏢 هویت فروشگاه و برند
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام رسمی فروشگاه *</label>
              <input
                type="text"
                required
                value={siteInfo.site_name}
                onChange={(e) => handleChange("site_name", e.target.value)}
                placeholder="مثال: پوریا ویژوالز"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شعار و معرفی کوتاه</label>
              <input
                type="text"
                value={siteInfo.tagline || ""}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder="مثال: مرجع تخصصی تجهیزات دیجیتال"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">توضیحات معرفی فروشگاه (نمایش در فوتر)</label>
              <textarea
                rows={3}
                value={siteInfo.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="توضیحات کوتاه درباره حوزه فعالیت و زمینه کاری فروشگاه..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] leading-relaxed focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          <h4 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3 pt-3">
            📞 راه‌های ارتباطی و پشتیبانی
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تلفن پشتیبانی و فروش *</label>
              <input
                type="text"
                required
                value={siteInfo.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="۰۲۱-۸۸۸۸۸۸۸۸"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">ایمیل رسمی *</label>
              <input
                type="email"
                required
                value={siteInfo.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="info@pouriavisuals.ir"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نشانی دفتر مرکزی / فروشگاه *</label>
              <input
                type="text"
                required
                value={siteInfo.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="تهران، خیابان ولیعصر..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>
        </div>

        {/* ستون چپ: لوگو، شبکه‌های اجتماعی و تنظیمات سئو */}
        <div className="space-y-6">
          
          {/* آپلود لوگو */}
          <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
            <h4 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
              🖼️ لوگوی فروشگاه
            </h4>

            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[var(--card-border)] rounded-2xl bg-[var(--input-bg)] text-center space-y-3">
              {siteInfo.logo ? (
                <div className="relative">
                  <img src={siteInfo.logo} alt="Logo" className="w-20 h-20 object-contain rounded-xl" />
                  <button
                    type="button"
                    onClick={() => handleChange("logo", "")}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center cursor-pointer shadow-md"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="text-[var(--text-secondary)] space-y-1">
                  <span className="text-3xl block">⚡</span>
                  <p className="font-bold">لوگو انتخاب نشده است</p>
                </div>
              )}

              <label className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer hover:opacity-90 transition text-xs shadow-md">
                انتخاب تصویر لوگو
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* شبکه‌های اجتماعی */}
          <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3 text-xs">
            <h4 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
              🌐 شبکه‌های اجتماعی
            </h4>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">اینستاگرام:</label>
              <input
                type="text"
                value={siteInfo.socials?.instagram || ""}
                onChange={(e) => handleSocialChange("instagram", e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-[11px] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">کانال تلگرام:</label>
              <input
                type="text"
                value={siteInfo.socials?.telegram || ""}
                onChange={(e) => handleSocialChange("telegram", e.target.value)}
                placeholder="https://t.me/..."
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-[11px] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">واتس‌اپ پشتیبانی:</label>
              <input
                type="text"
                value={siteInfo.socials?.whatsapp || ""}
                onChange={(e) => handleSocialChange("whatsapp", e.target.value)}
                placeholder="https://wa.me/..."
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-[11px] focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          {/* ایندکس گوگل و سئو */}
          <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3 text-xs">
            <h4 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
              🔍 وضعیت ایندکس سئو (Google SEO)
            </h4>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <div>
                <span className="font-bold block text-[var(--text-primary)]">اجازه ایندکس به ربات‌های گوگل</span>
                <span className="text-[10px] text-[var(--text-secondary)]">تگ index / noindex</span>
              </div>
              <input
                type="checkbox"
                checked={siteInfo.allowGoogleIndex !== false}
                onChange={(e) => handleChange("allowGoogleIndex", e.target.checked)}
                className="w-5 h-5 accent-[var(--accent-blue)] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
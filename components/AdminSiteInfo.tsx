'use client';

import React, { useState, useEffect, useRef } from 'react';
import { siteInfoService, SiteInfo } from '@/services/siteInfoService';
import { supabase } from '@/lib/supabase';

export default function AdminSiteInfo() {
  const [siteName, setSiteName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [footerLogoUrl, setFooterLogoUrl] = useState('');
  const [allowGoogleIndex, setAllowGoogleIndex] = useState(true);
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [youtube, setYoutube] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(2000000);
  const [description, setDescription] = useState('');
  const [customCss, setCustomCss] = useState('');

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const headerLogoFileRef = useRef<HTMLInputElement>(null);
  const footerLogoFileRef = useRef<HTMLInputElement>(null);

  const populateForm = (data: SiteInfo) => {
    setSiteName(data.site_name || data.siteName || data.storeName || '');
    setTagline(data.tagline || '');
    setPhone(data.phone || '');
    setEmail(data.email || '');
    setAddress(data.address || '');
    setWorkingHours(data.working_hours || 'شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰');
    setLogoUrl(data.logo_url || data.logoUrl || '');
    setFooterLogoUrl(data.footer_logo_url || data.footerLogoUrl || '');
    setAllowGoogleIndex(data.allow_google_index !== false && data.allowGoogleIndex !== false);
    setInstagram(data.instagram || '');
    setTelegram(data.telegram || '');
    setWhatsapp(data.whatsapp || '');
    setYoutube(data.youtube || '');
    setAnnouncement(data.header_announcement || '');
    setFreeShippingThreshold(Number(data.free_shipping_threshold || 2000000));
    setDescription(data.description || data.footer_text || '');
    setCustomCss(data.custom_css || '');
  };

  useEffect(() => {
    const initialData = siteInfoService.getSiteInfoSync();
    if (initialData) populateForm(initialData);

    siteInfoService.getSiteInfo().then((data) => {
      if (data) populateForm(data);
    });

    const channel = supabase
      .channel("site-info-admin-realtime-master-v4")
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
        setStatusMessage({ type: 'error', text: 'حجم تصویر نباید بیشتر از ۴ مگابایت باشد.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
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
    setSaving(true);

    const payload: SiteInfo = {
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
      allow_google_index: allowGoogleIndex,
      allowGoogleIndex: allowGoogleIndex,
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

    const res = await siteInfoService.updateSiteInfo(payload);
    setSaving(false);

    if (res) {
      setStatusMessage({
        type: 'success',
        text: '⚡ مشخصات برند، لوگوها و وضعیت ایندکس گوگل با موفقیت در دیتابیس ذخیره و بلادرنگ در سراسر سایت اعمال گردید.',
      });
    } else {
      setStatusMessage({ type: 'error', text: 'خطا در ذخیره‌سازی اطلاعات در دیتابیس.' });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات کلان سایت، سئو، هویت برند و درگاه‌ها
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پیکربندی هویت تجاری، لوگوهای هدر و فوتر، نوار اعلانات زنده، شبکه‌های اجتماعی و کلید وضعیت ایندکس گوگل
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="px-7 py-3 bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white rounded-2xl text-xs font-black transition shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{saving ? 'در حال ذخیره‌سازی...' : '💾 ذخیره و انتشار سراسری'}</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <span
            className={`w-4 h-4 rounded-full transition-all duration-500 ${
              allowGoogleIndex
                ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] animate-pulse"
                : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)]"
            }`}
          />
          <div>
            <h4 className="text-sm font-black text-[var(--text-primary)]">
              وضعیت ایندکس، دسترسی ربات‌های گوگل و موتورهای جستجو (Google Indexing)
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              {allowGoogleIndex
                ? "سایت به صورت زنده برای موتورهای جستجو ایندکس و در نتایج گوگل قرار دارد (نشانگر سبز)."
                : "سایت در حالت تعمیرات قرار دارد و با ارسال هدرهای No-Index و تنظیم فایل robots.ts از دید گوگل مخفی است (نشانگر قرمز)."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAllowGoogleIndex(!allowGoogleIndex)}
          className={`px-6 py-3 rounded-2xl font-black text-xs transition cursor-pointer border ${
            allowGoogleIndex
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
              : "bg-rose-500/15 text-rose-600 border-rose-500/30 hover:bg-rose-500 hover:text-white"
          }`}
        >
          {allowGoogleIndex ? "ایندکس گوگل: فعال (Online) ✓" : "مخفی از گوگل (No-Index) ✕"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-8 shadow-xl text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input
            type="file"
            ref={headerLogoFileRef}
            onChange={(e) => handleFileUpload(e, false)}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={footerLogoFileRef}
            onChange={(e) => handleFileUpload(e, true)}
            accept="image/*"
            className="hidden"
          />

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">🖼️ لوگوی اصلی هدر بالای سایت</h3>
            <div className="flex items-center gap-4 p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)]">
              <div className="w-20 h-20 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? <img src={logoUrl} alt="Header Logo" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">🏢</span>}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => headerLogoFileRef.current?.click()}
                    className="px-3.5 py-2 bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer"
                  >
                    📁 آپلود از دستگاه
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="px-3 py-2 bg-rose-500/15 text-rose-500 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      حذف ✕
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="یا درج لینک تصویر لوگو (https://...)..."
                  className="w-full p-2.5 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">⚓ آیکون / لوگوی اختصاصی فوتر (پاورقی)</h3>
            <div className="flex items-center gap-4 p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)]">
              <div className="w-20 h-20 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {footerLogoUrl ? <img src={footerLogoUrl} alt="Footer Logo" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">⚓</span>}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => footerLogoFileRef.current?.click()}
                    className="px-3.5 py-2 bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer"
                  >
                    📁 آپلود از دستگاه
                  </button>
                  {footerLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setFooterLogoUrl('')}
                      className="px-3 py-2 bg-rose-500/15 text-rose-500 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      حذف ✕
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={footerLogoUrl}
                  onChange={(e) => setFooterLogoUrl(e.target.value)}
                  placeholder="یا درج لینک تصویر فوتر..."
                  className="w-full p-2.5 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--card-border)] pt-6">
          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
              متن نوار اعلانات بالای سایت (Header Live Announcement Bar)
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="مثال: جشنواره فروش ویژه نوروز | ارسال رایگان خریدهای بالای ۲ میلیون تومان..."
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">
              سقف حداقل خرید برای ارسال رایگان (تومان)
            </label>
            <input
              type="number"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
              placeholder="2000000"
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--card-border)] pt-6">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نام رسمی برند / فروشگاه *</label>
            <input
              type="text"
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-primary)] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شعار تبلیغاتی و تجاری (Tagline)</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="مرجع تخصصی تجهیزات دیجیتال..."
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-primary)] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">شماره تماس رسمی و پشتیبانی</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="۰۲۱-۸۸۸۸۸۸۸۸"
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">ایمیل رسمی شرکت</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="support@yoursite.ir"
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)] outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">ساعات کاری و پاسخ‌گویی پشتیبانی</label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰ | پنجشنبه‌ها ۹:۰۰ الی ۱۴:۰۰"
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-primary)] outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">نشانی پستی دفتر مرکزی و انبار</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-primary)] outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--card-border)] pt-6">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">لینک صفحه اینستاگرام</label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">لینک کانال تلگرام</label>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="https://t.me/..."
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">لینک واتساپ پشتیبانی</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="https://wa.me/..."
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)] outline-none"
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-[var(--card-border)] pt-6">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">متن کامل معرفی برند در پاورقی سایت (Footer)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات کوتاه درباره تاریخچه، اصالت محصولات و خدمات..."
              className="w-full p-4 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs leading-relaxed text-[var(--text-primary)] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1.5">کدهای سفارشی استایل (Custom CSS):</label>
            <textarea
              rows={3}
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              placeholder="/* کدهای CSS اختصاصی خود را وارد کنید */"
              className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)] outline-none"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
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
  const [logoUrl, setLogoUrl] = useState('');
  const [footerLogoUrl, setFooterLogoUrl] = useState('');
  const [allowGoogleIndex, setAllowGoogleIndex] = useState(true);
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [description, setDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  const populateForm = (data: SiteInfo) => {
    setSiteName(data.site_name || data.siteName || '');
    setTagline(data.tagline || '');
    setPhone(data.phone || '');
    setEmail(data.email || '');
    setAddress(data.address || '');
    setLogoUrl(data.logo_url || data.logoUrl || '');
    setFooterLogoUrl((data as any).footer_logo_url || (data as any).footerLogoUrl || '');
    setAllowGoogleIndex((data as any).allow_google_index !== false && data.allowGoogleIndex !== false);
    setInstagram(data.instagram || '');
    setTelegram(data.telegram || '');
    setWhatsapp(data.whatsapp || '');
    setAnnouncement(data.header_announcement || data.headerAnnouncement || '');
    setDescription(data.description || data.footer_text || data.footerText || '');
  };

  useEffect(() => {
    const initialData = siteInfoService.getSiteInfoSync();
    if (initialData) populateForm(initialData);

    siteInfoService.getSiteInfo().then((data) => {
      if (data) populateForm(data);
    });
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isFooter: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'حجم تصویر نباید بیشتر از ۲ مگابایت باشد.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isFooter) {
          setFooterLogoUrl(reader.result as string);
        } else {
          setLogoUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    const payload: any = {
      site_name: siteName,
      siteName: siteName,
      tagline: tagline,
      phone: phone,
      email: email,
      address: address,
      logo_url: logoUrl,
      logoUrl: logoUrl,
      footer_logo_url: footerLogoUrl,
      footerLogoUrl: footerLogoUrl,
      allow_google_index: allowGoogleIndex,
      allowGoogleIndex: allowGoogleIndex,
      instagram: instagram,
      telegram: telegram,
      whatsapp: whatsapp,
      header_announcement: announcement,
      description: description,
      footer_text: description,
    };

    const res = await siteInfoService.updateSiteInfo(payload);
    
    // به‌روزرسانی مستقیم ستون ایندکس گوگل در جدول پایگاه داده
    await supabase.from("site_info").update({ allow_google_index: allowGoogleIndex }).neq("id", "00000000-0000-0000-0000-000000000000");

    setSaving(false);

    if (res) {
      setStatusMessage({ type: 'success', text: '⚡ تنظیمات و وضعیت ایندکس گوگل با موفقیت در دیتابیس ذخیره و منتشر شد.' });
    } else {
      setStatusMessage({ type: 'error', text: 'خطا در ذخیره‌سازی اطلاعات در دیتابیس.' });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">⚙️ تنظیمات عمومی، سئو و هویت برند</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">کنترل وضعیت ایندکس گوگل، لوگوهای هدر و فوتر و اطلاعات تماس</p>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="px-6 py-2.5 bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white rounded-2xl text-xs font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? 'در حال ذخیره‌سازی...' : '💾 ذخیره و انتشار سراسری'}
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

      {/* بخش وضعیت ایندکس گوگل و نشانگر نئون */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
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
              وضعیت ایندکس و ربات‌های گوگل (Google Indexing)
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              {allowGoogleIndex
                ? "سایت برای موتورهای جستجو باز و ایندکس فعال است (نشانگر سبز)."
                : "سایت در حالت تعمیر قرار دارد و از دید گوگل مخفی است (نشانگر قرمز)."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAllowGoogleIndex(!allowGoogleIndex)}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition cursor-pointer border ${
            allowGoogleIndex
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
              : "bg-rose-500/15 text-rose-600 border-rose-500/30 hover:bg-rose-500 hover:text-white"
          }`}
        >
          {allowGoogleIndex ? "ایندکس گوگل: فعال (Online)" : "مخفی از گوگل (No-Index)"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-8 shadow-sm">
        {/* لوگوها */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* لوگوی هدر */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">🖼️ لوگو اصلی هدر سایت</h3>
            <div className="flex items-center gap-4 p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)]">
              <div className="w-20 h-20 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? <img src={logoUrl} alt="Header Logo" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">🏢</span>}
              </div>
              <div className="space-y-2 flex-1">
                <input type="file" ref={fileInputRef} onChange={(e) => handleLogoUpload(e, false)} accept="image/*" className="hidden" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">بارگذاری 📤</button>
                  {logoUrl && <button type="button" onClick={() => setLogoUrl('')} className="px-3 py-1.5 bg-rose-500/15 text-rose-500 rounded-xl text-xs font-bold cursor-pointer">حذف ✕</button>}
                </div>
                <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="آدرس اینترنتی لوگو..." className="w-full p-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl text-xs font-mono text-[var(--text-primary)]" />
              </div>
            </div>
          </div>

          {/* لوگوی فوتر */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">⚓ آیکون اختصاصی فوتر (پاورقی)</h3>
            <div className="flex items-center gap-4 p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)]">
              <div className="w-20 h-20 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {footerLogoUrl ? <img src={footerLogoUrl} alt="Footer Logo" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">⚓</span>}
              </div>
              <div className="space-y-2 flex-1">
                <input type="file" ref={footerFileInputRef} onChange={(e) => handleLogoUpload(e, true)} accept="image/*" className="hidden" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => footerFileInputRef.current?.click()} className="px-3 py-1.5 bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">بارگذاری 📤</button>
                  {footerLogoUrl && <button type="button" onClick={() => setFooterLogoUrl('')} className="px-3 py-1.5 bg-rose-500/15 text-rose-500 rounded-xl text-xs font-bold cursor-pointer">حذف ✕</button>}
                </div>
                <input type="text" value={footerLogoUrl} onChange={(e) => setFooterLogoUrl(e.target.value)} placeholder="آدرس اینترنتی آیکون فوتر..." className="w-full p-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl text-xs font-mono text-[var(--text-primary)]" />
              </div>
            </div>
          </div>
        </div>

        {/* مشخصات اصلی */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--card-border)] pt-6">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">نام رسمی فروشگاه *</label>
            <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-primary)]" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">شعار تبلیغاتی</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">تلفن پشتیبانی</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">ایمیل رسمی</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)]" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">آدرس فروشگاه</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-primary)]" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">متن معرفی در فوتر</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs leading-relaxed text-[var(--text-primary)]" />
          </div>
        </div>
      </form>
    </div>
  );
}
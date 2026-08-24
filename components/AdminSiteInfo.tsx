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

    const channel = supabase
      .channel("site-info-admin-realtime-master")
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isFooter: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'حجم تصویر نباید بیشتر از ۳ مگابایت باشد.' });
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
      site_name: siteName.trim(),
      siteName: siteName.trim(),
      tagline: tagline.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      logo_url: logoUrl.trim(),
      logoUrl: logoUrl.trim(),
      footer_logo_url: footerLogoUrl.trim(),
      footerLogoUrl: footerLogoUrl.trim(),
      allow_google_index: allowGoogleIndex,
      allowGoogleIndex: allowGoogleIndex,
      instagram: instagram.trim(),
      telegram: telegram.trim(),
      whatsapp: whatsapp.trim(),
      header_announcement: announcement.trim(),
      description: description.trim(),
      footer_text: description.trim(),
    };

    const res = await siteInfoService.updateSiteInfo(payload);
    setSaving(false);

    if (res) {
      setStatusMessage({ type: 'success', text: '⚡ مشخصات برند و وضعیت ایندکس گوگل با موفقیت در دیتابیس ذخیره و منتشر شد.' });
    } else {
      setStatusMessage({ type: 'error', text: 'خطا در ذخیره‌سازی اطلاعات در دیتابیس.' });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات عمومی، سئو، هویت برند و لوگوها
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">کنترل وضعیت ایندکس گوگل، لوگوهای هدر و فوتر، شبکه‌های اجتماعی و اطلاعات تماس</p>
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
              وضعیت ایندکس و دسترسی ربات‌های گوگل (Google Search Indexing)
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              {allowGoogleIndex
                ? "سایت برای موتورهای جستجو فعال و صفحات ایندکس می‌شوند (نشانگر سبز)."
                : "سایت در حالت تعمیر و بازسازی قرار دارد و از دید گوگل مخفی است (نشانگر قرمز)."}
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

      <form onSubmit={handleSubmit} className="bg-[var(--modal-bg)] p-6 md:p-8 rounded-3xl border border-[var(--card-border)] space-y-8 shadow-sm text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">🖼️ لوگوی اصلی هدر سایت</h3>
            <div className="flex items-center gap-4 p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)]">
              <div className="w-20 h-20 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? <img src={logoUrl} alt="Header Logo" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">🏢</span>}
              </div>
              <div className="space-y-2 flex-1">
                <input type="file" ref={fileInputRef} onChange={(e) => handleLogoUpload(e, false)} accept="image/*" className="hidden" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">بارگذاری تصویر 📤</button>
                  {logoUrl && <button type="button" onClick={() => setLogoUrl('')} className="px-3 py-1.5 bg-rose-500/15 text-rose-500 rounded-xl text-xs font-bold cursor-pointer">حذف ✕</button>}
                </div>
                <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="یا درج لینک عکس لوگو..." className="w-full p-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl text-xs font-mono text-[var(--text-primary)]" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">⚓ آیکون اختصاصی فوتر (پاورقی)</h3>
            <div className="flex items-center gap-4 p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--card-border)]">
              <div className="w-20 h-20 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {footerLogoUrl ? <img src={footerLogoUrl} alt="Footer Logo" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">⚓</span>}
              </div>
              <div className="space-y-2 flex-1">
                <input type="file" ref={footerFileInputRef} onChange={(e) => handleLogoUpload(e, true)} accept="image/*" className="hidden" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => footerFileInputRef.current?.click()} className="px-3 py-1.5 bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer">بارگذاری تصویر 📤</button>
                  {footerLogoUrl && <button type="button" onClick={() => setFooterLogoUrl('')} className="px-3 py-1.5 bg-rose-500/15 text-rose-500 rounded-xl text-xs font-bold cursor-pointer">حذف ✕</button>}
                </div>
                <input type="text" value={footerLogoUrl} onChange={(e) => setFooterLogoUrl(e.target.value)} placeholder="یا درج لینک آیکون فوتر..." className="w-full p-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl text-xs font-mono text-[var(--text-primary)]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--card-border)] pt-6">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">نام رسمی برند / فروشگاه *</label>
            <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-primary)]" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">شعار تبلیغاتی</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">تلفن پشتیبانی و مشاوره</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">ایمیل رسمی</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">لینک اینستاگرام</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">لینک تلگرام</label>
            <input type="text" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/..." className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs font-mono text-[var(--text-primary)]" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">نشانی پستی فروشگاه و دفتر مرکزی</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-primary)]" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">متن معرفی در فوتر سایت</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl text-xs leading-relaxed text-[var(--text-primary)]" />
          </div>
        </div>
      </form>
    </div>
  );
}
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { siteInfoService, SiteInfo } from '@/services/siteInfoService';

export default function AdminSiteInfo() {
  const [siteName, setSiteName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [description, setDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // خواندن فوری از کش بدون لودینگ اولیه
    const initialData = siteInfoService.getSiteInfoSync();
    populateForm(initialData);

    // دریافت داده‌های تکمیلی
    siteInfoService.getSiteInfo().then((data) => {
      if (data) populateForm(data);
    });
  }, []);

  const populateForm = (data: SiteInfo) => {
    setSiteName(data.site_name || data.siteName || '');
    setTagline(data.tagline || '');
    setPhone(data.phone || '');
    setEmail(data.email || '');
    setAddress(data.address || '');
    setLogoUrl(data.logo_url || data.logoUrl || '');
    setInstagram(data.instagram || '');
    setTelegram(data.telegram || '');
    setWhatsapp(data.whatsapp || '');
    setAnnouncement(data.header_announcement || data.headerAnnouncement || '');
    setDescription(data.description || data.footer_text || data.footerText || '');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'حجم تصویر لوگو نباید بیشتر از ۲ مگابایت باشد.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ذخیره‌سازی آنی در ۰ میلی‌ثانیه بدون هیچ معطلی
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    const payload: SiteInfo = {
      id: 'default_info',
      site_name: siteName,
      siteName: siteName,
      tagline: tagline,
      phone: phone,
      email: email,
      address: address,
      logo_url: logoUrl,
      logoUrl: logoUrl,
      instagram: instagram,
      telegram: telegram,
      whatsapp: whatsapp,
      header_announcement: announcement,
      description: description,
      footer_text: description,
    };

    // اعمال آنی
    await siteInfoService.updateSiteInfo(payload);

    setSaving(false);
    setStatusMessage({ type: 'success', text: '⚡ تغییرات در لحظه ذخیره و اعمال شد.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">⚙️ تنظیمات عمومی، هویت برند و سئو سایت</h2>
            <p className="text-xs text-gray-500 mt-1">تغییر نام برند، لوگو رسمی، شعار تبلیغاتی، اطلاعات تماس و شبکه‌های اجتماعی</p>
          </div>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? 'در حال اعمال...' : '💾 ذخیره و انتشار تغییرات'}
          </button>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm font-medium transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* لوگو */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🖼️ لوگو و نشان رسمی فروشگاه
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="لوگو فروشگاه"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-2xl text-gray-400">🏢</span>
                )}
              </div>
              <div className="space-y-3 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition cursor-pointer"
                  >
                    بارگذاری لوگوی جدید 📤
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="px-4 py-2 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-200 active:scale-95 transition cursor-pointer"
                    >
                      حذف لوگو ✕
                    </button>
                  )}
                </div>
                <div className="w-full">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="یا آدرس مستقیم اینترنتی لوگو (URL)..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* مشخصات اصلی */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">🏢 مشخصات اصلی و هویت فروشگاه</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  نام رسمی فروشگاه *
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  placeholder="مثال: آکسون | Axon"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  شعار تبلیغاتی و معرفی کوتاه
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  placeholder="مثال: نماد مسیر انتقال فوق‌سریع داده‌ها"
                />
              </div>
            </div>
          </div>

          {/* تماس */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">📞 اطلاعات تماس و آدرس</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  تلفن تماس پشتیبانی
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  placeholder="021-88888888"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">ایمیل رسمی</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  placeholder="info@axon.ir"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">آدرس فروشگاه</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  placeholder="تهران، خیابان ولیعصر..."
                />
              </div>
            </div>
          </div>

          {/* شبکه‌های اجتماعی */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">🌐 شبکه‌های اجتماعی</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">اینستاگرام</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none text-gray-900 dark:text-white"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">تلگرام</label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none text-gray-900 dark:text-white"
                  placeholder="https://t.me/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">واتساپ</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none text-gray-900 dark:text-white"
                  placeholder="https://wa.me/..."
                />
              </div>
            </div>
          </div>

          {/* اعلانات و فوتر */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">📢 اعلانات و متن فوتر</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">نوار اعلان بالای سایت</label>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none text-gray-900 dark:text-white"
                  placeholder="مثال: ارسال رایگان به سراسر کشور..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">توضیحات معرفی و فوتر</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none text-gray-900 dark:text-white"
                  placeholder="توضیحات کامل جهت معرفی در فوتر سایت..."
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { siteInfoService, SiteInfo } from '@/services/siteInfoService';

export default function AdminSiteInfo() {
  const [formData, setFormData] = useState<SiteInfo>({
    site_name: '',
    tagline: '',
    description: '',
    logo_url: '',
    phone: '',
    email: '',
    address: '',
    instagram: '',
    telegram: '',
    whatsapp: '',
    header_announcement: '',
    footer_text: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await siteInfoService.getSiteInfo();
    setFormData(data);
    setLoading(false);
  };

  // مدیریت آپلود فایل لوگو با تبدیل به DataURL و فشرده‌سازی برای ذخیره مطمئن
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'حجم تصویر لوگو نباید بیشتر از ۲ مگابایت باشد.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo_url: reader.result as string, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const result = await siteInfoService.updateSiteInfo(formData);

    if (result.success) {
      setStatusMessage({ type: 'success', text: 'اطلاعات با موفقیت در دیتابیس ذخیره و منتشر شد.' });
      if (result.data) setFormData(result.data);
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'خطا در ثبت اطلاعات در دیتابیس.' });
    }

    setSaving(false);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">در حال دریافت تنظیمات جامع فروشگاه...</div>;
  }

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
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? 'در حال ذخیره...' : '💾 ذخیره و انتشار تغییرات'}
          </button>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* بخش ۱: لوگو و هویت بصری با آپلود مستقیم */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🖼️ لوگو و نشان رسمی فروشگاه
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {formData.logo_url || formData.logoUrl ? (
                  <img
                    src={formData.logo_url || formData.logoUrl}
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
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:opacity-90 transition cursor-pointer"
                  >
                    بارگذاری لوگوی جدید 📤
                  </button>
                  {(formData.logo_url || formData.logoUrl) && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo_url: '', logoUrl: '' })}
                      className="px-4 py-2 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-200 transition cursor-pointer"
                    >
                      حذف لوگو ✕
                    </button>
                  )}
                </div>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.logo_url || formData.logoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value, logoUrl: e.target.value })}
                    placeholder="یا آدرس مستقیم اینترنتی لوگو (URL)..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* بخش ۲: اطلاعات اصلی برند */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">🏢 مشخصات اصلی و هویت فروشگاه</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  نام رسمی فروشگاه *
                </label>
                <input
                  type="text"
                  value={formData.site_name || formData.siteName || ''}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value, siteName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="مثال: پوریا ویژوالز | Pouria Visuals"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  شعار تبلیغاتی و معرفی کوتاه
                </label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="مثال: مرجع تخصصی مانیتور و تجهیزات بصری تدوین و رنگ"
                />
              </div>
            </div>
          </div>

          {/* بخش ۳: اطلاعات تماس و پشتیبانی */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">📞 اطلاعات تماس و آدرس فیزیکی</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  تلفن تماس پشتیبانی
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="021-88888888"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">ایمیل رسمی</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="info@pouriavisuals.ir"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">آدرس فروشگاه / دفتر مرکزی</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="تهران، خیابان ولیعصر..."
                />
              </div>
            </div>
          </div>

          {/* بخش ۴: شبکه‌های اجتماعی */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">🌐 شبکه‌های اجتماعی و پیام‌رسان‌ها</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">اینستاگرام</label>
                <input
                  type="text"
                  value={formData.instagram || ''}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">تلگرام</label>
                <input
                  type="text"
                  value={formData.telegram || ''}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none"
                  placeholder="https://t.me/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">واتساپ</label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none"
                  placeholder="https://wa.me/..."
                />
              </div>
            </div>
          </div>

          {/* بخش ۵: توضیحات فوتر و اعلان هدر */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">📢 اعلانات و متن فوتر</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">نوار اعلان بالای سایت (Header Announcement)</label>
                <input
                  type="text"
                  value={formData.header_announcement || formData.headerAnnouncement || ''}
                  onChange={(e) => setFormData({ ...formData, header_announcement: e.target.value, headerAnnouncement: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none"
                  placeholder="مثال: ارسال رایگان به سراسر کشور برای خریدهای بالای ۲ میلیون تومان"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">توضیحات معرفی و درباره فروشگاه (فوتر)</label>
                <textarea
                  rows={4}
                  value={formData.description || formData.footer_text || formData.footerText || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value, footer_text: e.target.value, footerText: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none"
                  placeholder="توضیحات کامل جهت آشنایی مخاطبان در انتهای سایت..."
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
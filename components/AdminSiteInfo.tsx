'use client';

import React, { useState, useEffect } from 'react';
import { siteInfoService, SiteInfo } from '@/services/siteInfoService';

export default function AdminSiteInfo() {
  const [formData, setFormData] = useState<SiteInfo>({
    site_name: '',
    tagline: '',
    phone: '',
    logo_url: '',
    description: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await siteInfoService.getSiteInfo();
    setFormData(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const result = await siteInfoService.updateSiteInfo(formData);

    if (result.success) {
      setStatusMessage({ type: 'success', text: 'اطلاعات با موفقیت در دیتابیس ذخیره شد.' });
      if (result.data) setFormData(result.data);
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'خطا در ثبت اطلاعات.' });
    }

    setSaving(false);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">در حال دریافت مشخصات فروشگاه...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">⚙️ تنظیمات عمومی، هویت برند و سئو سایت</h2>
          <p className="text-xs text-gray-500 mt-1">تغییر نام برند، شعار تبلیغاتی، اطلاعات تماس و توضیحات سایت</p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {saving ? 'در حال ذخیره...' : '💾 ذخیره و انتشار تغییرات'}
        </button>
      </div>

      {statusMessage && (
        <div
          className={`mt-4 p-3 rounded-xl text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
              placeholder="مثال: آکسون | Axon"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              شعار و معرفی کوتاه
            </label>
            <input
              type="text"
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              placeholder="مثال: نماد مسیر انتقال فوق‌سریع داده‌ها"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              شماره تماس پشتیبانی
            </label>
            <input
              type="text"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              placeholder="مثال: 021-88888888"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              آدرس لوگو (URL)
            </label>
            <input
              type="text"
              value={formData.logo_url || formData.logoUrl || ''}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value, logoUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
            توضیحات معرفی فروشگاه (نمایش در فوتر)
          </label>
          <textarea
            rows={3}
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            placeholder="متن توضیحات و معرفی سایت..."
          />
        </div>
      </form>
    </div>
  );
}
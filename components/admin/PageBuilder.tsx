'use client';

import React, { useState, useEffect } from 'react';
import { pageService, SitePageData, PageSection } from '@/services/pageService';

export default function PageBuilder() {
  const [selectedSlug, setSelectedSlug] = useState('home');
  const [pageTitle, setPageTitle] = useState('صفحه اصلی');
  const [sections, setSections] = useState<PageSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPage(selectedSlug);
  }, [selectedSlug]);

  const loadPage = async (slug: string) => {
    const data = await pageService.getPage(slug);
    if (data && data.sections) {
      setPageTitle(data.title);
      setSections(data.sections);
    } else {
      // سکشن‌های پیش‌فرض
      setSections([
        { id: 'sec-hero', type: 'hero', title: 'عنوان اصلی صفحه', subtitle: 'توضیحات معرفی و شعار برند', visible: true },
        { id: 'sec-features', type: 'features', title: 'مزایای خرید و خدمات', visible: true },
        { id: 'sec-prods', type: 'products', title: 'محصولات ویژه و کاتالوگ', visible: true },
        { id: 'sec-blogs', type: 'blogs', title: 'مجله تخصصی و مقالات', visible: true },
      ]);
    }
  };

  const addSection = (type: PageSection['type']) => {
    const newSec: PageSection = {
      id: `sec-${Date.now()}`,
      type,
      title: type === 'text' ? 'بخش متنی جدید' : 'سکشن جدید',
      subtitle: 'توضیحات تکمیلی...',
      visible: true,
    };
    setSections([...sections, newSec]);
  };

  const updateSection = (id: string, updated: Partial<PageSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload: SitePageData = {
      id: selectedSlug,
      slug: selectedSlug,
      title: pageTitle,
      sections,
      is_published: true,
    };

    const res = await pageService.savePage(payload);
    setSaving(false);
    if (res.success) {
      setStatusMsg({ type: 'success', text: '⚡ ساختار و محتوای صفحه در لحظه ذخیره و منتشر شد.' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-6 select-none font-sans" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span>🏗️</span> صفحه‌ساز زنده و معماری صفحات سایت
          </h2>
          <p className="text-xs text-gray-500 mt-1">ویرایش ۱۰۰٪ بلوک‌ها، تغییر عناوین و افزودن سکشن‌های دلخواه با ذخیره بلادرنگ</p>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold border border-gray-200 dark:border-gray-700 outline-none text-gray-900 dark:text-white cursor-pointer"
          >
            <option value="home">صفحه اصلی (Home)</option>
            <option value="about">درباره ما (About)</option>
            <option value="contact">تماس با ما (Contact)</option>
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs font-extrabold transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? 'در حال اعمال...' : '💾 ذخیره و انتشار بلادرنگ'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500'}`}>
          {statusMsg.text}
        </div>
      )}

      {/* نوار افزودن بلوک جدید */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-black text-gray-700 dark:text-gray-300">➕ افزودن بلوک محتوایی جدید:</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => addSection('hero')} className="px-3 py-1.5 bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-600/30 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition cursor-pointer">
            هدر و معرفی (Hero)
          </button>
          <button onClick={() => addSection('text')} className="px-3 py-1.5 bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-600/30 rounded-xl text-xs font-bold hover:bg-purple-600 hover:text-white transition cursor-pointer">
            باکس متنی دلخواه
          </button>
          <button onClick={() => addSection('features')} className="px-3 py-1.5 bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-600/30 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition cursor-pointer">
            مزایا و ویژگی‌ها
          </button>
          <button onClick={() => addSection('products')} className="px-3 py-1.5 bg-amber-600/15 text-amber-600 dark:text-amber-400 border border-amber-600/30 rounded-xl text-xs font-bold hover:bg-amber-600 hover:text-white transition cursor-pointer">
            ویترین کالاها
          </button>
        </div>
      </div>

      {/* لیست سکشن‌های قابل ویرایش */}
      <div className="space-y-4">
        {sections.map((sec, idx) => (
          <div key={sec.id} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                  نوع بلوک: {sec.type === 'hero' ? 'هدر اصلی' : sec.type === 'features' ? 'مزایای فروشگاه' : sec.type === 'products' ? 'ویترین محصولات' : sec.type === 'blogs' ? 'مقالات سئو' : 'متن سفارشی'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSection(sec.id, { visible: !sec.visible })}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition ${sec.visible ? 'bg-emerald-500/15 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}
                >
                  {sec.visible ? 'نمایش در سایت ✓' : 'مخفی ✕'}
                </button>
                <button
                  onClick={() => removeSection(sec.id)}
                  className="px-3 py-1 bg-rose-500/15 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">عنوان این بلوک:</label>
                <input
                  type="text"
                  value={sec.title || ''}
                  onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">توضیح یا زیرعنوان:</label>
                <input
                  type="text"
                  value={sec.subtitle || ''}
                  onChange={(e) => updateSection(sec.id, { subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
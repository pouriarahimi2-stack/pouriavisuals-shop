'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { siteInfoService, SiteInfo } from '@/services/siteInfoService';

export default function ContactPage() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // دریافت آنی اطلاعات
    const cached = siteInfoService.getSiteInfoSync();
    if (cached) setSiteInfo(cached);

    siteInfoService.getSiteInfo().then((data) => {
      if (data) setSiteInfo(data);
    });

    const handleUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };
    window.addEventListener('site_info_updated', handleUpdate);
    return () => window.removeEventListener('site_info_updated', handleUpdate);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          subject,
          message,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: data.message || 'پیام شما با موفقیت ثبت شد و به زودی پاسخ داده خواهد شد.' });
        setFullName('');
        setPhone('');
        setSubject('');
        setMessage('');
      } else {
        setFeedback({ type: 'error', text: data.message || 'خطا در ثبت پیام. مجدداً تلاش کنید.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'خطا در برقراری ارتباط با سرور.' });
    } finally {
      setLoading(false);
    }
  };

  const siteName = siteInfo?.site_name || siteInfo?.siteName || 'آکسون | Axon';
  const phoneVal = siteInfo?.phone || '';
  const emailVal = siteInfo?.email || '';
  const addressVal = siteInfo?.address || '';
  const workingHours = siteInfo?.extra_data?.working_hours || 'شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] py-12 px-4 select-none transition-colors duration-300" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black">تماس با پشتیبانی و مشاوره تخصصی</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
            پاسخگوی سوالات شما در خصوص تجهیزات، مانیتورهای تدوین و هماهنگی سفارشات هستیم
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* فرم ارسال پیام */}
          <div className="md:col-span-2 rounded-[2.5rem] liquid-glass-card p-6 sm:p-10 border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl space-y-6">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-4">
              <span className="text-lg">✉️</span>
              <h2 className="text-sm sm:text-base font-extrabold">ارسال پیام یا درخواست مشاوره</h2>
            </div>

            {feedback && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold transition-all ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-2 text-[var(--text-secondary)]">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: پوریا رسولی"
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2 text-[var(--text-secondary)]">
                    شماره موبایل جهت پاسخگویی *
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-[var(--text-secondary)]">
                  موضوع پیام
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: استعلام گارانتی مانیتور، همکاری سازمانی و..."
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-[var(--text-secondary)]">
                  متن پیام یا پرسش شما *
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="توضیحات خود را بنویسید..."
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs cursor-pointer hover:opacity-90 active:scale-95 transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'در حال ارسال...' : 'ارسال پیام به واحد پشتیبانی 🚀'}
              </button>
            </form>
          </div>

          {/* باکس مشخصات تماس (پویا از دیتابیس) */}
          <div className="rounded-[2.5rem] liquid-glass-card p-6 sm:p-8 border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl space-y-6">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-4">
              <span className="text-lg">🏢</span>
              <h3 className="text-xs sm:text-sm font-extrabold">اطلاعات رسمی {siteName}</h3>
            </div>

            <div className="space-y-5 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[var(--text-secondary)] font-bold">
                  <span>📞</span>
                  <span>شماره تماس پشتیبانی:</span>
                </div>
                <p className="font-mono font-black text-[var(--accent-blue)] text-sm pr-6" dir="ltr">
                  {phoneVal || 'در حال ثبت...'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[var(--text-secondary)] font-bold">
                  <span>✉️</span>
                  <span>ایمیل ارتباطی:</span>
                </div>
                <p className="font-mono font-medium text-[var(--text-primary)] text-xs pr-6" dir="ltr">
                  {emailVal || 'در حال ثبت...'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[var(--text-secondary)] font-bold">
                  <span>📍</span>
                  <span>نشانی حضوری:</span>
                </div>
                <p className="text-[var(--text-primary)] leading-relaxed font-medium pr-6">
                  {addressVal || 'در حال ثبت...'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[var(--text-secondary)] font-bold">
                  <span>⏰</span>
                  <span>ساعات کاری:</span>
                </div>
                <p className="text-[var(--text-primary)] font-medium pr-6">
                  {workingHours}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--card-border)]">
              <Link
                href="/track-order"
                className="w-full py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>🔍</span>
                <span>رهگیری مرسولات پستی ←</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
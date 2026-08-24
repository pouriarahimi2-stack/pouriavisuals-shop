'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { siteInfoService, SiteInfo } from '@/services/siteInfoService';
import { supabase } from '@/lib/supabase';

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(null);

  const fetchFooterData = async () => {
    try {
      const data = await siteInfoService.getSiteInfo();
      if (data) setInfo(data);
    } catch (e) {
      console.error("Footer fetch error:", e);
    }
  };

  useEffect(() => {
    setInfo(siteInfoService.getSiteInfoSync());
    fetchFooterData();

    const handleUpdate = (e: any) => {
      if (e.detail) setInfo(e.detail);
    };

    window.addEventListener('site_info_updated', handleUpdate);

    const footerChannel = supabase
      .channel('footer-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_info' }, () => {
        fetchFooterData();
      })
      .subscribe();

    return () => {
      window.removeEventListener('site_info_updated', handleUpdate);
      supabase.removeChannel(footerChannel);
    };
  }, []);

  const siteName = info?.site_name || info?.siteName || 'آکسون | Axon';
  const tagline = info?.tagline || 'مرجع تخصصی تجهیزات دیجیتال';
  const phone = info?.phone || '۰۲۱-۸۸۸۸۸۸۸۸';
  const email = info?.email || 'info@axoncore.ir';
  const address = info?.address || 'تهران، خیابان ولیعصر';
  const description = info?.footer_text || info?.footerText || info?.description || tagline;

  // استفاده از لوگوی اختصاصی فوتر یا در صورت عدم وجود، استفاده از لوگوی اصلی هدر
  const footerLogo = (info as any)?.footer_logo_url || (info as any)?.footerLogoUrl || info?.logo_url || info?.logoUrl;

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] transition-colors mt-auto shadow-2xl" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* ستون ۱: هویت و معرفی با لوگوی اختصاصی بزرگ فوتر */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3.5">
              {footerLogo ? (
                <img
                  src={footerLogo}
                  alt={siteName}
                  className="w-16 h-16 object-contain rounded-2xl shadow-md bg-white/5 p-1 border border-[var(--card-border)]"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[var(--accent-blue)] flex items-center justify-center text-white font-black text-xl shadow-md">
                  ⚡
                </div>
              )}
              <h4 className="font-black text-lg text-[var(--text-primary)] tracking-tight">{siteName}</h4>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {description}
            </p>
          </div>

          {/* ستون ۲: دسترسی سریع */}
          <div className="space-y-3">
            <h5 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">دسترسی سریع</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition font-bold">کاتالوگ تجهیزات و مانیتورها</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition font-bold">استعلام و پیگیری مرسوله پستی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition font-bold">مجله تخصصی و مقالات</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition font-bold">تماس با پشتیبانی و نشانی</Link></li>
            </ul>
          </div>

          {/* ستون ۳: اطلاعات ارتباطی */}
          <div className="space-y-3">
            <h5 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">اطلاعات ارتباطی</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <li className="flex items-center gap-2">
                <span className="font-bold">تلفن:</span>
                <span className="font-mono font-black text-[var(--accent-blue)]">{phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold">ایمیل:</span>
                <span className="font-mono">{email}</span>
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="font-bold shrink-0">نشانی:</span>
                <span>{address}</span>
              </li>
            </ul>

            <div className="flex gap-2.5 pt-3">
              {info?.instagram && <a href={info.instagram} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:text-white hover:bg-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-black transition shadow-sm">اینستاگرام</a>}
              {info?.telegram && <a href={info.telegram} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:text-white hover:bg-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-black transition shadow-sm">تلگرام</a>}
              {info?.whatsapp && <a href={info.whatsapp} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:text-white hover:bg-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-black transition shadow-sm">واتساپ</a>}
            </div>
          </div>

          {/* ستون ۴: ضمانت */}
          <div className="space-y-3">
            <h5 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">ضمانت و پشتیبانی</h5>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 text-xs shadow-inner">
              <div className="font-black text-emerald-500 flex items-center gap-1.5"><span>✓</span> ضمانت ۱۰۰٪ اصالت کالا</div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">تمامی بسته‌ها با پست پیشتاز بیمه‌شده و بسته‌بندی ضدضربه ارسال می‌گردند.</p>
            </div>
          </div>

        </div>

        <div className="mt-16 pt-6 border-t border-[var(--card-border)] text-center text-xs text-[var(--text-secondary)] font-bold">
          تمامی حقوق مادی و معنوی برای مجموعه <span className="text-[var(--accent-blue)]">{siteName}</span> محفوظ است © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
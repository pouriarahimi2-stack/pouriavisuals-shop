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

    // اتصال بلادرنگ وب‌سوکت برای فوتر
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

  const siteName = info?.site_name || info?.siteName || 'پوریا ویژوالز';
  const tagline = info?.tagline || 'مرجع تخصصی فروش، کالیبراسیون و مشاوره مانیتورهای حرفه‌ای تدوین، کالرگریدینگ و تجهیزات استودیویی در ایران.';
  const phone = info?.phone || '۰۲۱-۸۸۸۸۸۸۸۸';
  const email = info?.email || 'info@pouriavisuals.ir';
  const address = info?.address || 'تهران، خیابان ولیعصر';
  const description = info?.footer_text || info?.footerText || info?.description || tagline;

  // بررسی آیکون اختصاصی فوتر و در صورت نبود، استفاده از لوگوی اصلی سایت
  const footerLogo = (info as any)?.footer_logo_url || (info as any)?.footerLogoUrl || info?.logo_url || info?.logoUrl;

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] transition-colors mt-auto" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ستون ۱: هویت و معرفی با لوگوی اختصاصی فوتر */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              {footerLogo ? (
                <img
                  src={footerLogo}
                  alt={siteName}
                  className="w-12 h-12 object-contain rounded-2xl shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  ⚡
                </div>
              )}
              <h4 className="font-extrabold text-base text-[var(--text-primary)]">{siteName}[cite: 5, 6]</h4>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {description}[cite: 5, 6]
            </p>
          </div>

          {/* ستون ۲: دسترسی سریع */}
          <div className="space-y-3">
            <h5 className="font-black text-xs text-[var(--text-primary)]">دسترسی سریع</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ تجهیزات و مانیتورها</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">استعلام و پیگیری مرسوله پستی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله تخصصی و مقالات</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">تماس با پشتیبانی و نشانی</Link></li>
            </ul>
          </div>

          {/* ستون ۳: اطلاعات ارتباطی */}
          <div className="space-y-3">
            <h5 className="font-black text-xs text-[var(--text-primary)]">اطلاعات ارتباطی</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li className="flex items-center gap-1.5">
                <span className="font-bold">تلفن:</span>
                <span className="font-mono text-[var(--accent-blue)]">{phone}[cite: 5, 6]</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-bold">ایمیل:</span>
                <span className="font-mono">{email}[cite: 5, 6]</span>
              </li>
              <li className="flex items-start gap-1.5 leading-relaxed">
                <span className="font-bold shrink-0">نشانی:</span>
                <span>{address}[cite: 5, 6]</span>
              </li>
            </ul>

            <div className="flex gap-2 pt-2">
              {info?.instagram && <a href={info.instagram} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-[var(--input-bg)] hover:text-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition">اینستاگرام[cite: 5, 6]</a>}
              {info?.telegram && <a href={info.telegram} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-[var(--input-bg)] hover:text-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition">تلگرام[cite: 5, 6]</a>}
              {info?.whatsapp && <a href={info.whatsapp} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-[var(--input-bg)] hover:text-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition">واتساپ[cite: 5, 6]</a>}
            </div>
          </div>

          {/* ستون ۴: ضمانت */}
          <div className="space-y-3">
            <h5 className="font-black text-xs text-[var(--text-primary)]">ضمانت و پشتیبانی</h5>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 text-xs">
              <div className="font-bold text-emerald-500">✓ ضمانت اصالت کالا</div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">تمامی بسته‌ها با پست پیشتاز بیمه‌شده ارسال می‌گردند.[cite: 5, 6]</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--card-border)] text-center text-[11px] text-[var(--text-muted)] font-medium">
          تمامی حقوق مادی و معنوی برای مجموعه {siteName} محفوظ است © {new Date().getFullYear()}[cite: 5, 6]
        </div>
      </div>
    </footer>
  );
}
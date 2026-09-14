// File Path: components/Footer.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Footer() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((data) => {
      if (data) setSiteInfo(data);
    });
    const handleUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const storeName = siteInfo?.siteName || siteInfo?.site_name || "Axon | آکسون";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;
  const phone = siteInfo?.phone || "09376110200";
  const email = siteInfo?.email || "Pouriarahimi@yahoo.com";
  const address = siteInfo?.address || "شیراز - ستارخان";

  return (
    <footer className="w-full bg-[var(--modal-bg)] border-t border-[var(--card-border)] text-[var(--text-primary)] font-sans select-none transition-colors pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* ۳ کارت کوچک منتقل شده از بالای صفحه به داخل فوتر */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-10 border-b border-[var(--card-border)]">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-lg shrink-0">📦</div>
            <div>
              <h5 className="font-black text-xs text-[var(--text-primary)]">ارسال فوق‌سریع و ایمن</h5>
              <p className="text-[11px] text-[var(--text-secondary)]">بسته‌بندی اختصاصی ضدضربه سراسری</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center text-lg shrink-0">⚡</div>
            <div>
              <h5 className="font-black text-xs text-[var(--text-primary)]">کالیبراسیون سخت‌افزاری</h5>
              <p className="text-[11px] text-[var(--text-secondary)]">پوشش دقیق فضاهای رنگی DCI-P3</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center text-lg shrink-0">🛡️</div>
            <div>
              <h5 className="font-black text-xs text-[var(--text-primary)]">۱۸ ماه گارانتی اصالت طلایی</h5>
              <p className="text-[11px] text-[var(--text-secondary)]">تضمین سلامت سخت‌افزاری پنل</p>
            </div>
          </div>
        </div>

        {/* ۴ ستون اصلی فوتر (اطلاعات تماس، خدمات مشتریان، دسترسی سریع، معرفی برند) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[var(--card-border)]">
          
          {/* ستون اطلاعات تماس و دفاتر */}
          <div className="space-y-3">
            <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">اطلاعات تماس و دفاتر</h4>
            <div className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <p>📞 تلفن پشتیبانی: <span className="font-mono font-bold text-[var(--text-primary)]" dir="ltr">{phone}</span></p>
              <p>✉️ ایمیل: <span className="font-mono text-[var(--text-primary)]" dir="ltr">{email}</span></p>
              <p>📍 نشانی تحویل و انبار: {address}</p>
            </div>
          </div>

          {/* ستون خدمات مشتریان */}
          <div className="space-y-3">
            <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">خدمات مشتریان</h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">ثبت تیکت مشاوره</Link></li>
              <li><Link href="/about" className="hover:text-[var(--accent-blue)] transition">شرایط گارانتی و اصالت</Link></li>
              <li><Link href="/track" className="hover:text-[var(--accent-blue)] transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">راهنمای تخصصی</Link></li>
            </ul>
          </div>

          {/* ستون دسترسی سریع */}
          <div className="space-y-3">
            <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">دسترسی سریع</h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track" className="hover:text-[var(--accent-blue)] transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">مجله مقالات تخصصی</Link></li>
            </ul>
          </div>

          {/* ستون معرفی برند */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-md">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl text-[var(--accent-blue)] font-black">⚡</span>
                )}
              </div>
              <div>
                <span className="font-black text-sm text-[var(--text-primary)] block tracking-tight">{storeName}</span>
                <span className="text-[10px] text-[var(--accent-blue)] font-bold block">مرجع تخصصی دیجیتال و تکنولوژی</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              تأمین و عرضه پیشرفته‌ترین تجهیزات دیجیتال، گجت‌ها و سخت‌افزارهای رده‌بالا با تضمین اصالت و ارسال سریع به سراسر کشور.
            </p>
          </div>

        </div>

        {/* کپی‌رایت نهایی */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)] pt-2">
          <p>تمامی حقوق مادی و معنوی برای {storeName} محفوظ است © ۲۰۲۶</p>
          <p className="font-mono text-[11px]">کد رهگیری نماد / پشتیبانی فعال: ۲۷۴۲۴۵۳۴</p>
        </div>

      </div>
    </footer>
  );
}

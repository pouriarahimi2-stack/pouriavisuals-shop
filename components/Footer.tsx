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
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* ۳ کارت بزرگ گارانتی منتقل شده از بالا به پایین صفحه */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-[2rem] bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col items-center text-center space-y-2 shadow-sm">
            <span className="text-3xl">🛡️</span>
            <h5 className="font-black text-xs text-[var(--text-primary)]">۱۸ ماه گارانتی اصالت طلایی</h5>
            <p className="text-[11px] text-[var(--text-secondary)]">تضمین سلامت سخت‌افزاری پنل بدون پیکسل سوخته</p>
          </div>

          <div className="p-6 rounded-[2rem] bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col items-center text-center space-y-2 shadow-sm">
            <span className="text-3xl">⚡</span>
            <h5 className="font-black text-xs text-[var(--text-primary)]">کالیبراسیون سخت‌افزاری</h5>
            <p className="text-[11px] text-[var(--text-secondary)]">پوشش دقیق فضاهای رنگی DCI-P3 و Rec.709</p>
          </div>

          <div className="p-6 rounded-[2rem] bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col items-center text-center space-y-2 shadow-sm">
            <span className="text-3xl">📦</span>
            <h5 className="font-black text-xs text-[var(--text-primary)]">ارسال فوق‌سریع و ایمن</h5>
            <p className="text-[11px] text-[var(--text-secondary)]">بسته‌بندی اختصاصی ضدضربه به سراسر کشور</p>
          </div>
        </div>

        {/* بخش اصلی فوتر شامل ستون‌ها و کارت‌های سفید اطلاعات تماس */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6 border-t border-[var(--card-border)]">
          
          {/* ستون راست: کارت‌های سفید اطلاعات تماس */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-black text-[var(--text-secondary)] block mb-2">اطلاعات تماس و دفاتر</span>
            
            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between text-xs shadow-sm">
              <span className="text-[var(--text-secondary)]">تلفن پشتیبانی:</span>
              <span className="font-mono font-black text-[var(--text-primary)]" dir="ltr">{phone}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between text-xs shadow-sm">
              <span className="text-[var(--text-secondary)]">پست الکترونیک:</span>
              <span className="font-mono text-[var(--text-primary)]" dir="ltr">{email}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between text-xs shadow-sm">
              <span className="text-[var(--text-secondary)]">نشانی تحویل و انبار:</span>
              <span className="font-medium text-[var(--text-primary)]">{address}</span>
            </div>
          </div>

          {/* ستون وسط: خدمات مشتریان */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">خدمات مشتریان</h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">ثبت تیکت مشاوره</Link></li>
              <li><Link href="/about" className="hover:text-[var(--accent-blue)] transition">شرایط گارانتی و اصالت</Link></li>
              <li><Link href="/track" className="hover:text-[var(--accent-blue)] transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">راهنمای تخصصی</Link></li>
            </ul>
          </div>

          {/* ستون وسط-چپ: دسترسی سریع */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">دسترسی سریع</h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track" className="hover:text-[var(--accent-blue)] transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">مجله مقالات تخصصی</Link></li>
            </ul>
          </div>

          {/* ستون چپ: معرفی برند */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] p-1.5 flex items-center justify-center overflow-hidden shadow-sm">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl text-[var(--accent-blue)] font-black">⚡</span>
                )}
              </div>
              <div>
                <span className="font-black text-xs text-[var(--text-primary)] block tracking-tight">{storeName}</span>
                <span className="text-[10px] text-[var(--accent-blue)] font-bold block">مرجع تخصصی دیجیتال و تکنولوژی</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
              تأمین و عرضه پیشرفته‌ترین تجهیزات دیجیتال، گجت‌ها و سخت‌افزارهای رده‌بالا با تضمین اصالت و ارسال سریع به سراسر کشور.
            </p>
          </div>

        </div>

        {/* کپی‌رایت نهایی */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)] pt-4 border-t border-[var(--card-border)]">
          <p>تمامی حقوق مادی و معنوی برای {storeName} محفوظ است © ۲۰۲۶</p>
          <p className="font-mono text-[11px]">کد رهگیری نماد / پشتیبانی فعال: ۲۷۴۲۴۵۳۴</p>
        </div>

      </div>
    </footer>
  );
}

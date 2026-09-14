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
  const phone = siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
  const email = siteInfo?.email || "info@axoncore.ir";
  const address = siteInfo?.address || "تهران، خیابان ولیعصر";

  return (
    <footer className="w-full bg-[var(--modal-bg)] border-t border-[var(--card-border)] text-[var(--text-primary)] font-sans select-none transition-colors pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[var(--card-border)]">
        
        {/* ستون اول: لوگوی بزرگ و معرفی جامع تکنولوژی */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-md">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl text-[var(--accent-blue)] font-black">⚡</span>
              )}
            </div>
            <div>
              <span className="font-black text-base text-[var(--text-primary)] block tracking-tight">{storeName}</span>
              <span className="text-[10px] text-[var(--accent-blue)] font-bold block uppercase">مرجع تخصصی دیجیتال و تکنولوژی</span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
            تأمین و عرضه پیشرفته‌ترین تجهیزات دیجیتال، گجت‌ها و سخت‌افزارهای رده‌بالا با تضمین اصالت و ارسال سریع به سراسر کشور.
          </p>
        </div>

        {/* ستون دوم: دسترسی سریع */}
        <div className="space-y-3">
          <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">دسترسی سریع</h4>
          <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
            <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ محصولات</Link></li>
            <li><Link href="/track" className="hover:text-[var(--accent-blue)] transition">سامانه رهگیری مرسولات</Link></li>
            <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">اخبار فناوری و گجت‌ها</Link></li>
            <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">تماس با پشتیبانی</Link></li>
          </ul>
        </div>

        {/* ستون سوم: خدمات مشتریان */}
        <div className="space-y-3">
          <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">خدمات مشتریان</h4>
          <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
            <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">ثبت تیکت مشاوره</Link></li>
            <li><Link href="/about" className="hover:text-[var(--accent-blue)] transition">شرایط گارانتی و اصالت</Link></li>
            <li><Link href="/track" className="hover:text-[var(--accent-blue)] transition">ضمانت بازگشت وجه</Link></li>
          </ul>
        </div>

        {/* ستون چهارم: اطلاعات تماس و دفاتر */}
        <div className="space-y-3">
          <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">اطلاعات تماس و دفاتر</h4>
          <div className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
            <p>📞 تلفن پشتیبانی: <span className="font-mono font-bold text-[var(--text-primary)]" dir="ltr">{phone}</span></p>
            <p>✉️ ایمیل: <span className="font-mono text-[var(--text-primary)]" dir="ltr">{email}</span></p>
            <p>📍 نشانی: {address}</p>
          </div>
        </div>

      </div>

      {/* نوار پایانی و کپی‌رایت */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
        <p>تمامی حقوق مادی و معنوی برای {storeName} محفوظ است © ۲۰۲۶</p>
        <p className="font-mono text-[11px]">کد رهگیری نماد / پشتیبانی: ۲۷۴۲۴۵۳۴</p>
      </div>
    </footer>
  );
}

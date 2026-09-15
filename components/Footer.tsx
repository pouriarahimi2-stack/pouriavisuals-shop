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

  const storeName = siteInfo?.site_name || siteInfo?.siteName || siteInfo?.storeName || "Axon | آکسون";
  const footerLogo = siteInfo?.footer_logo_url || siteInfo?.footerLogoUrl || siteInfo?.logo_url || siteInfo?.logoUrl;
  const phone = siteInfo?.phone || "09376110200";
  const email = siteInfo?.email || "Pouriarahimi@yahoo.com";
  const address = siteInfo?.address || "شیراز - ستارخان";

  return (
    <footer className="w-full bg-[var(--modal-bg)] border-t border-[var(--card-border)] text-[var(--text-primary)] font-sans select-none transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* ستون اول (سمت راست): برند بزرگ آکسون و مشخصات */}
          <div className="md:col-span-5 space-y-6 pt-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-2xl shadow-xl overflow-hidden shrink-0 border border-[var(--card-border)]">
                {footerLogo ? (
                  <img src={footerLogo} alt={storeName} className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-xl">⚡</span>
                )}
              </div>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                {storeName}
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-[var(--text-secondary)] font-medium pt-2">
              <p className="flex items-center gap-2">
                <span>📍</span>
                <span>نشانی: {address}</span>
              </p>
              <p className="flex items-center gap-2">
                <span>📞</span>
                <span>تلفن تماس:</span>
                <a href={`tel:${phone}`} className="font-mono font-bold hover:text-blue-500 transition" dir="ltr">
                  {phone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span>✉️</span>
                <span>ایمیل:</span>
                <span className="font-mono">{email}</span>
              </p>
            </div>
          </div>

          {/* ستون دوم: دسترسی سریع */}
          <div className="md:col-span-2 space-y-3 text-xs pt-3">
            <h4 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2 w-fit">
              دسترسی سریع
            </h4>
            <ul className="space-y-2.5 text-[var(--text-secondary)] font-medium">
              <li><Link href="/products" className="hover:text-blue-500 transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track-order" className="hover:text-blue-500 transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-blue-500 transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-blue-500 transition">مجله مقالات تخصصی</Link></li>
            </ul>
          </div>

          {/* ستون سوم: خدمات مشتریان */}
          <div className="md:col-span-2 space-y-3 text-xs pt-3">
            <h4 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2 w-fit">
              خدمات مشتریان
            </h4>
            <ul className="space-y-2.5 text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-blue-500 transition">ثبت تیکت مشاوره</Link></li>
              <li><Link href="/about" className="hover:text-blue-500 transition">شرایط گارانتی طلایی</Link></li>
              <li><Link href="/about" className="hover:text-blue-500 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/products" className="hover:text-blue-500 transition">راهنمای تخصصی کالاها</Link></li>
            </ul>
          </div>

          {/* ستون چهارم (منتهی‌الیه سمت چپ): نشان رسمی و تاییدشده اینماد */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center pt-2">
            <a
              target="_blank"
              rel="noreferrer"
              href="https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[var(--card-border)] shadow-xl hover:border-emerald-500/50 transition flex flex-col items-center gap-2 group cursor-pointer"
            >
              {/* نشان گرافیکی برداری رسمی اینماد */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center relative">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md group-hover:scale-105 transition duration-300">
                  <circle cx="50" cy="50" r="46" fill="#0284c7" fillOpacity="0.08" stroke="#0284c7" strokeWidth="2.5" />
                  <path d="M50 15 L78 30 L78 65 L50 85 L22 65 L22 30 Z" fill="#ffffff" stroke="#0369a1" strokeWidth="2" />
                  <path d="M40 50 L47 57 L63 41" fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="50" y="74" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold" fontFamily="sans-serif">ENAMAD</text>
                  <text x="50" y="27" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="black" fontFamily="sans-serif">★ ★</text>
                </svg>
              </div>
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 group-hover:text-emerald-500 transition">
                نماد اعتماد الکترونیکی رسمی
              </span>
              <span className="text-[9px] font-mono text-slate-400">کد اختصاصی: 7434404</span>
            </a>
          </div>

        </div>

        {/* کپی‌رایت پایین */}
        <div className="mt-12 pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
          <p>© ۲۰۲۶ تمامی حقوق مادی و معنوی برای {storeName} محفوظ است.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/about" className="hover:underline">درباره ما</Link>
            <Link href="/contact" className="hover:underline">تماس با ما</Link>
            <Link href="/track-order" className="hover:underline">رهگیری سفارش</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

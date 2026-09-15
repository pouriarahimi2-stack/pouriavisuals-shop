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

  const footerLogo = siteInfo?.footer_logo_url || siteInfo?.footerLogoUrl;
  const storeName = siteInfo?.site_name || siteInfo?.siteName || siteInfo?.storeName;
  const phone = siteInfo?.phone || "09376110200";
  const email = siteInfo?.email || "Pouriarahimi@yahoo.com";
  const address = siteInfo?.address || "شیراز - ستارخان";

  return (
    <footer className="w-full bg-[var(--modal-bg)] border-t border-[var(--card-border)] text-[var(--text-primary)] font-sans select-none transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* ستون اول: نمایش برند و لوگو منحصراً در صورت تنظیم در ادمین */}
          <div className="md:col-span-5 space-y-6 pt-2">
            {(footerLogo || storeName) && (
              <div className="flex items-center gap-4">
                {footerLogo && (
                  <div className="w-16 h-16 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xl overflow-hidden shrink-0 border border-[var(--card-border)]">
                    <img src={footerLogo} alt={storeName || ""} className="w-full h-full object-contain p-2" />
                  </div>
                )}
                {storeName && (
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                    {storeName}
                  </span>
                )}
              </div>
            )}

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

          {/* ستون چهارم: باکس اینماد رسمی */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center pt-2">
            <div className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-[var(--card-border)] shadow-xl hover:border-emerald-500/50 transition flex items-center justify-center min-w-[130px] min-h-[130px]">
              <a
                referrerPolicy="origin"
                target="_blank"
                rel="noreferrer"
                href="https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
                className="block"
              >
                <img
                  referrerPolicy="origin"
                  src="https://trustseal.enamad.ir/logo.aspx?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
                  alt="نماد اعتماد الکترونیکی آکسون"
                  className="w-28 h-28 object-contain cursor-pointer"
                  {...({ code: "RqxtofLwJnKsvqQACWz1mvYVVKykOrtD" } as any)}
                />
              </a>
            </div>
            <span className="text-[10px] text-[var(--text-secondary)] font-bold mt-2 text-center md:text-left">
              نماد اعتماد الکترونیکی رسمی
            </span>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
          <p>© ۲۰۲۶ تمامی حقوق محفوظ است.</p>
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

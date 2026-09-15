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
  const logoUrl = siteInfo?.footer_logo_url || siteInfo?.footerLogoUrl || siteInfo?.logo_url || siteInfo?.logoUrl;
  const phone = siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
  const email = siteInfo?.email || "info@axoncore.ir";
  const address = siteInfo?.address || "تهران، خیابان ولیعصر، تقاطع میرداماد";
  const description =
    siteInfo?.description ||
    siteInfo?.footer_text ||
    "تأمین و عرضه پیشرفته‌ترین تجهیزات دیجیتال، گجت‌ها و سخت‌افزارهای مدرن با تضمین اصالت و ارسال سریع به سراسر کشور.";

  return (
    <footer className="w-full bg-[var(--modal-bg)] border-t border-[var(--card-border)] text-[var(--text-primary)] font-sans select-none transition-colors duration-300" dir="rtl">
      {/* بخش ۳ کارت مزایا - موقتاً طبق درخواست مخفی شده است */}
      <div className="hidden max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-2">
            <span className="text-3xl block">🛡️</span>
            <strong className="text-sm font-black block">۱۸ ماه گارانتی اصالت طلایی</strong>
            <p className="text-xs text-[var(--text-secondary)]">تضمین سلامت سخت‌افزاری پنل بدون پیکسل سوخته</p>
          </div>
          <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-2">
            <span className="text-3xl block">⚡</span>
            <strong className="text-sm font-black block">کالیبراسیون سخت‌افزاری</strong>
            <p className="text-xs text-[var(--text-secondary)]">پوشش دقیق فضاهای رنگی DCI-P3 و Rec.709</p>
          </div>
          <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-2">
            <span className="text-3xl block">📦</span>
            <strong className="text-sm font-black block">ارسال فوق‌سریع و ایمن</strong>
            <p className="text-xs text-[var(--text-secondary)]">بسته‌بندی اختصاصی ضدضربه جهت ارسال به سراسر کشور</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* ستون اول: معرفی و شبکه‌های ارتباطی */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-xl shadow-md">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="w-7 h-7 object-contain" />
                ) : (
                  "A"
                )}
              </div>
              <span className="text-lg font-black tracking-tight">{storeName}</span>
            </div>

            <p className="text-xs leading-relaxed text-[var(--text-secondary)] max-w-md font-medium text-justify">
              {description}
            </p>

            <div className="space-y-1 text-xs text-[var(--text-secondary)] font-medium pt-2">
              <p>📍 نشانی: {address}</p>
              <p>📞 تلفن تماس: <span className="font-mono font-bold" dir="ltr">{phone}</span></p>
              <p>✉️ ایمیل: <span className="font-mono">{email}</span></p>
            </div>
          </div>

          {/* ستون دوم: دسترسی سریع */}
          <div className="space-y-3 text-xs">
            <h4 className="font-black text-sm text-[var(--text-primary)]">دسترسی سریع</h4>
            <ul className="space-y-2 text-[var(--text-secondary)] font-medium">
              <li><Link href="/products" className="hover:text-blue-500 transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track-order" className="hover:text-blue-500 transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-blue-500 transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-blue-500 transition">مجله مقالات تخصصی</Link></li>
            </ul>
          </div>

          {/* ستون سوم: خدمات مشتریان و اینماد */}
          <div className="space-y-3 text-xs">
            <h4 className="font-black text-sm text-[var(--text-primary)]">خدمات مشتریان</h4>
            <ul className="space-y-2 text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-blue-500 transition">ثبت تیکت مشاوره</Link></li>
              <li><Link href="/about" className="hover:text-blue-500 transition">شرایط گارانتی طلایی</Link></li>
              <li><Link href="/about" className="hover:text-blue-500 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/products" className="hover:text-blue-500 transition">راهنمای تخصصی کالاها</Link></li>
            </ul>

            {/* لوگوی رسمی و فعال اینماد */}
            <div className="pt-2">
              <a
                referrerPolicy="origin"
                target="_blank"
                rel="noreferrer"
                href="https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
                className="inline-block p-2 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--card-border)] hover:border-emerald-500 transition shadow-sm"
              >
                <img
                  referrerPolicy="origin"
                  src="https://trustseal.enamad.ir/logo.aspx?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
                  alt="نماد اعتماد الکترونیکی آکسون"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain cursor-pointer transition hover:scale-105"
                  {...({ code: "RqxtofLwJnKsvqQACWz1mvYVVKykOrtD" } as any)}
                />
              </a>
            </div>
          </div>

        </div>

        {/* کپی‌رایت انتهای صفحه */}
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

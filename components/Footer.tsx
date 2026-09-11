"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Footer() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    const cached = siteInfoService.getSiteInfoSync();
    if (cached) setSiteInfo(cached);

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
  const phone = siteInfo?.phone || "09376110200";
  const email = siteInfo?.email || "Pouriarahimi@yahoo.com";
  const address = siteInfo?.address || "شیراز - ستارخان";
  const workingHours = siteInfo?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";
  const enamadCode = "27424534";
  const bioDesc = siteInfo?.description || siteInfo?.footer_text || "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.";
  const footerLogo = siteInfo?.footer_logo_url || siteInfo?.footerLogoUrl;

  return (
    <footer className="w-full bg-[var(--modal-bg,#ffffff)] dark:bg-[#07090e] border-t border-slate-200 dark:border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none mt-16 text-[var(--text-primary)]" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-md p-1 shrink-0">
                  {footerLogo ? (
                    <img src={footerLogo} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                      ▲
                    </div>
                  )}
                </div>
                <h3 className="font-black text-2xl text-slate-900 dark:text-white">{storeName}</h3>
              </div>
              <p className="text-xs font-bold text-sky-500">مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">{bioDesc}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black">
                ✓ گارانتی اصالت ۱۰۰٪ فیزیکی
              </span>
              <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-black">
                🚀 ارسال پیشتاز سراسری
              </span>
            </div>

            <div className="pt-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">شبکه‌های ارتباطی استودیو:</span>
              <div className="p-3 rounded-3xl bg-slate-900 text-white flex items-center justify-center gap-2 shadow-2xl" dir="ltr">
                {["C", "O", "N", "T", "A", "C", "T"].map((k, i) => (
                  <div key={i} className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-black text-xs shadow-inner">
                    {k}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white">دسترسی سریع</h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <li><Link href="/products" className="hover:text-sky-500 transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track-order" className="hover:text-sky-500 transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-sky-500 transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-sky-500 transition">مجله مقالات تخصصی</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white">خدمات مشتریان</h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <li><Link href="/contact" className="hover:text-sky-500 transition">ثبت تیکت مشاوره</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">شرایط گارانتی طلایی</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/blog" className="hover:text-sky-500 transition">راهنمای کالیبراسیون ۵K</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white">اطلاعات تماس و دفتر</h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">تلفن پشتیبانی:</span>
                  <span className="font-mono font-black text-slate-800 dark:text-slate-200">{phone}</span>
                </div>
                <span>📞</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">پست الکترونیک:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{email}</span>
                </div>
                <span>✉️</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">نشانی تحویل و انبار:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{address}</span>
                </div>
                <span>📍</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">نماد اعتماد الکترونیکی</span>
                  <span className="text-[10px] text-slate-400 block">کد: {enamadCode}</span>
                </div>
                <span>🛡️</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex justify-between text-xs font-bold text-slate-500">
          <span>نماد اعتماد الکترونیکی فعال ({enamadCode})</span>
          <p>تمامی حقوق مادی و معنوی برای {storeName} محفوظ است © 2026</p>
        </div>
      </div>
    </footer>
  );
}

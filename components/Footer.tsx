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

  return (
    <footer className="w-full bg-[var(--modal-bg,#ffffff)] dark:bg-[#07090e] border-t border-slate-200 dark:border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none mt-16" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* گرید ۴ ستونه دقیقاً مشابه تصویر شما */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          
          {/* ستون ۱ (راست): معرفی برند، نشان‌ها و داک تعاملی CONTACT */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
                  ▲
                </div>
                <h3 className="font-black text-2xl text-slate-900 dark:text-white">{storeName}</h3>
              </div>
              <p className="text-xs font-bold text-sky-500">مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">{bioDesc}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black flex items-center gap-1.5">
                <span>✓</span> گارانتی اصالت ۱۰۰٪ فیزیکی
              </span>
              <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-black flex items-center gap-1.5">
                <span>🚀</span> ارسال پیشتاز سراسری
              </span>
            </div>

            {/* کلیدهای ۳D تعاملی CONTACT */}
            <div className="pt-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> شبکه‌های ارتباطی و اجتماعی استودیو:
              </span>
              <div className="p-3 rounded-3xl bg-slate-900 text-white flex items-center justify-center gap-2 shadow-2xl" dir="ltr">
                {["C", "O", "N", "T", "A", "C", "T"].map((k, i) => (
                  <div key={i} className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-black text-xs shadow-inner hover:scale-110 hover:border-sky-400 transition cursor-pointer">
                    {k}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-center text-slate-400">برای مشاهده امکانات، ماوس را روی کلیدها ببرید یا کلیک کنید</p>
            </div>
          </div>

          {/* ستون ۲: دسترسی سریع */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> دسترسی سریع
            </h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <li><Link href="/products" className="hover:text-sky-500 transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track-order" className="hover:text-sky-500 transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-sky-500 transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-sky-500 transition">مجله مقالات تخصصی</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">درباره آکسون</Link></li>
            </ul>
          </div>

          {/* ستون ۳: خدمات مشتریان */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> خدمات مشتریان
            </h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <li><Link href="/contact" className="hover:text-sky-500 transition">ثبت تیکت مشاوره</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">شرایط گارانتی طلایی</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/blog" className="hover:text-sky-500 transition">راهنمای کالیبراسیون ۵K</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">روش‌های پرداخت امن شاپرک</Link></li>
            </ul>
          </div>

          {/* ستون ۴: اطلاعات تماس و نماد اینماد */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> اطلاعات تماس و دفتر
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">تلفن پشتیبانی:</span>
                  <span className="font-mono font-black text-slate-800 dark:text-slate-200">{phone}</span>
                </div>
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 text-sm">📞</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">پست الکترونیک:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">{email}</span>
                </div>
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-500 text-sm">✉️</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">نشانی تحویل حضوری و انبار:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{address}</span>
                </div>
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 text-sm">📍</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">ساعات پاسخگویی:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{workingHours}</span>
                </div>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 text-sm">⏰</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">نماد اعتماد الکترونیکی</span>
                  <span className="text-[10px] text-slate-400 block">کد رسمی: <strong className="font-mono text-sky-500">{enamadCode}</strong></span>
                </div>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm">🛡️</span>
              </div>
            </div>
          </div>

        </div>

        {/* خط کپی‌رایت انتهای فوتر */}
        <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>نماد اعتماد الکترونیکی فعال ({enamadCode})</span>
            <span className="text-slate-400">•</span>
            <span>طراحی و معماری مهندسی پایدار</span>
          </div>
          <p className="text-center sm:text-left text-[11px]">
            تمامی حقوق مادی و معنوی برای {storeName} محفوظ است © 2026
          </p>
        </div>

      </div>
    </footer>
  );
}

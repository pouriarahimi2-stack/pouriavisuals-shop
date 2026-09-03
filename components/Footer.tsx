"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo, DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import ContactDock from "@/components/ContactDock";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const layoutCfg = info?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  const footerCfg = layoutCfg.footer;
  const contactDockCfg = layoutCfg.contactDock;

  const siteName = info?.site_name || info?.siteName || "آکسون | Axon";
  const phone = info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
  const email = info?.email || "info@axoncore.ir";
  const address = info?.address || "تهران، تقاطع میرداماد و ولیعصر، مجتمع پایتخت";

  const paddingClasses =
    footerCfg.paddingMode === "relaxed"
      ? "py-10 sm:py-14 space-y-10"
      : footerCfg.paddingMode === "normal"
      ? "py-8 sm:py-10 space-y-8"
      : "py-6 sm:py-8 space-y-6";

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-8 sm:mt-10 select-none transition-colors duration-300" dir="rtl">
      <div className={`max-w-[1440px] mx-auto px-4 sm:px-8 ${paddingClasses}`}>
        
        {/* ردیف اصلی ستون‌های فوتر */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-10 pb-6 border-b border-[var(--card-border)]">
          
          {/* ستون ۱ و ۲: معرفی برند، نشان‌های گارانتی و کلیدهای شبکه‌های اجتماعی */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {siteName}
            </h3>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-md">
              مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر، مانیتورهای ۵K رتینا، لپ‌تاپ‌های ورک‌استیشن و گجت‌های هوشمند در ایران با ۱۸ ماه گارانتی اصالت طلایی.
            </p>

            {footerCfg.showBadges && (
              <div className="flex flex-wrap items-center gap-2 pt-1 animate-fadeIn">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                  {footerCfg.badge1Text || "✓ گارانتی اصالت ۱۰۰٪ فیزیکی"}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-500/20">
                  {footerCfg.badge2Text || "🚀 ارسال پیشتاز سراسری"}
                </span>
              </div>
            )}

            {/* کلیدهای مکانیکی کیبورد CONTACT با قابلیت فعال/غیرفعال‌سازی در استودیو */}
            {contactDockCfg.show && (
              <div className="pt-2 animate-fadeIn">
                <ContactDock />
              </div>
            )}
          </div>

          {/* ستون ۳: دسترسی سریع */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)]">دسترسی سریع</h4>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله مقالات تخصصی</Link></li>
              <li><Link href="/about" className="hover:text-[var(--accent-blue)] transition">درباره آکسون</Link></li>
            </ul>
          </div>

          {/* ستون ۴: خدمات و پشتیبانی */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)]">خدمات مشتریان</h4>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">ثبت تیکت مشاوره</Link></li>
              <li><span className="cursor-default">شرایط گارانتی طلایی</span></li>
              <li><span className="cursor-default">ضمانت بازگشت وجه ۷ روزه</span></li>
              <li><span className="cursor-default">راهنمای کالیبراسیون ۵K</span></li>
              <li><span className="cursor-default">روش‌های پرداخت امن شاپرک</span></li>
            </ul>
          </div>

          {/* ستون ۵: ارتباط مستقیم */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)]">اطلاعات تماس</h4>
            <div className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <div>
                <span className="block text-[10px] opacity-70">تلفن پشتیبانی:</span>
                <span className="font-mono font-bold text-[var(--text-primary)] text-sm">{phone}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70">پست الکترونیک:</span>
                <span className="font-mono text-xs">{email}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70">نشانی تحویل:</span>
                <span className="leading-snug block">{address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* نوار پایانی فوتر با فاصله کم و استاندارد */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-secondary)] font-medium">
          <p>
            تمامی حقوق مادی و معنوی برای <strong className="text-[var(--text-primary)]">{siteName}</strong> محفوظ است © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <span>طراحی و معماری مهندسی پایدار</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">نماد اعتماد الکترونیکی فعال</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

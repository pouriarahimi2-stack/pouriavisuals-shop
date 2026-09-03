"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo, DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import ContactDock from "@/components/ContactDock";
import AnimatedLogo from "@/components/AnimatedLogo";
import { soundEngine } from "@/lib/soundEngine";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => {
      if (e.detail) setInfo(e.detail);
    };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const layoutCfg = info?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  const footerCfg = layoutCfg.footer;
  const contactDockCfg = layoutCfg.contactDock;

  const siteName = info?.site_name || info?.siteName || info?.storeName || "آکسون | Axon";
  const phone = info?.phone || "09376110200";
  const email = info?.email || "Pouriarahimi@yahoo.com";
  const address = info?.address || "شیراز - ستارخان";
  const workingHours = info?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";
  const logoUrl = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url || info?.logoUrl;

  const paddingClasses =
    footerCfg.paddingMode === "relaxed"
      ? "py-10 sm:py-14 space-y-8"
      : footerCfg.paddingMode === "normal"
      ? "py-8 sm:py-10 space-y-7"
      : "py-6 sm:py-8 space-y-6";

  return (
    <footer
      className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-10 select-none transition-colors duration-300 font-sans"
      dir="rtl"
    >
      <div className={`max-w-[1440px] mx-auto px-4 sm:px-8 ${paddingClasses}`}>
        
        {/* ردیف اصلی: گرید ۱۲ ستونی فوق‌العاده بالانس و مدرن اپل/استودیو */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-[var(--card-border)] items-start">
          
          {/* ستون ۱ (راست): مشخصات برند، توضیحات، نشان‌های گارانتی و داک کلیدها (۵ ستون) */}
          <div className="lg:col-span-5 space-y-4 text-right">
            
            {/* هدر برند با لوگوی متحرک */}
            <div className="flex items-center gap-3">
              <AnimatedLogo customLogoUrl={logoUrl} size={36} />
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                  {siteName}
                </h3>
                <span className="text-[10px] text-[var(--accent-blue)] font-bold block">
                  مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو
                </span>
              </div>
            </div>

            {/* شرح فعالیت با تایپوگرافی چشم‌نواز */}
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-lg text-justify">
              {info?.footer_text ||
                info?.description ||
                "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر، مانیتورهای ۵K رتینا، لپ‌تاپ‌های ورک‌استیشن و گجت‌های هوشمند در ایران با ۱۸ ماه گارانتی اصالت طلایی."}
            </p>

            {/* نشان‌های تاییدیه فیزیکی و ارسال پیشتاز */}
            {footerCfg.showBadges && (
              <div className="flex flex-wrap items-center gap-2 pt-1 animate-fadeIn">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20 shadow-sm flex items-center gap-1.5">
                  <span className="text-emerald-500 text-xs">✓</span>
                  <span>{footerCfg.badge1Text || "گارانتی اصالت ۱۰۰٪ فیزیکی"}</span>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-500/20 shadow-sm flex items-center gap-1.5">
                  <span className="text-xs">🚀</span>
                  <span>{footerCfg.badge2Text || "ارسال پیشتاز سراسری"}</span>
                </span>
              </div>
            )}

            {/* داک کلیدهای کیبورد CONTACT تراز شده دقیقاً زیر متون سمت راست (رفع ایراد خط قرمز) */}
            {contactDockCfg.show && (
              <div className="pt-2 border-t border-[var(--card-border)]/60">
                <ContactDock />
              </div>
            )}
          </div>

          {/* ستون ۲: پیوندهای دسترسی سریع (۲ ستون) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">دسترسی سریع</h4>
            </div>

            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-bold">
              <li>
                <Link
                  href="/#products"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>کاتالوگ کالاها</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/track-order"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>سامانه رهگیری مرسولات</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/news"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>جدیدترین اخبار تکنولوژی</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>مجله مقالات تخصصی</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>درباره {siteName}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* ستون ۳: خدمات مشتریان و پشتیبانی (۲ ستون) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">خدمات مشتریان</h4>
            </div>

            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-bold">
              <li>
                <Link
                  href="/contact"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>ثبت تیکت مشاوره</span>
                </Link>
              </li>
              <li>
                <span className="cursor-default flex items-center gap-1.5 py-1 text-[var(--text-secondary)]">
                  <span className="text-[10px] opacity-60">›</span>
                  <span>شرایط گارانتی طلایی</span>
                </span>
              </li>
              <li>
                <span className="cursor-default flex items-center gap-1.5 py-1 text-[var(--text-secondary)]">
                  <span className="text-[10px] opacity-60">›</span>
                  <span>ضمانت بازگشت وجه ۷ روزه</span>
                </span>
              </li>
              <li>
                <span className="cursor-default flex items-center gap-1.5 py-1 text-[var(--text-secondary)]">
                  <span className="text-[10px] opacity-60">›</span>
                  <span>راهنمای کالیبراسیون ۵K</span>
                </span>
              </li>
              <li>
                <span className="cursor-default flex items-center gap-1.5 py-1 text-[var(--text-secondary)]">
                  <span className="text-[10px] opacity-60">›</span>
                  <span>روش‌های پرداخت امن شاپرک</span>
                </span>
              </li>
            </ul>
          </div>

          {/* ستون ۴ (چپ): میکروکارت‌های اطلاعات رسمی و ارتباط مستقیم (۳ ستون) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">اطلاعات تماس و دفتر</h4>
            </div>

            <div className="space-y-2.5 text-xs">
              
              {/* کارت تلفن با لینک مستقیم */}
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                onClick={() => soundEngine.playClick()}
                className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-blue-500/15 text-[var(--accent-blue)] flex items-center justify-center text-sm font-bold shadow-inner">
                    📞
                  </span>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] block font-bold">تلفن پشتیبانی:</span>
                    <span className="font-mono font-black text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors" dir="ltr">
                      {phone}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-[var(--accent-blue)] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  تماس ↗
                </span>
              </a>

              {/* کارت ایمیل */}
              <a
                href={`mailto:${email}`}
                onClick={() => soundEngine.playClick()}
                className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-sm font-bold shadow-inner">
                    ✉️
                  </span>
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-[var(--text-secondary)] block font-bold">پست الکترونیک:</span>
                    <span className="font-mono font-bold text-xs text-[var(--text-primary)] truncate block group-hover:text-[var(--accent-blue)] transition-colors" dir="ltr">
                      {email}
                    </span>
                  </div>
                </div>
              </a>

              {/* کارت نشانی */}
              <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-2.5 shadow-sm">
                <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center text-sm font-bold shrink-0 shadow-inner">
                  📍
                </span>
                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block font-bold">نشانی تحویل حضوری و انبار:</span>
                  <span className="font-bold text-xs text-[var(--text-primary)] leading-snug block">
                    {address}
                  </span>
                </div>
              </div>

              {/* کارت ساعات کاری */}
              <div className="p-2.5 px-3 rounded-xl bg-[var(--input-bg)]/60 border border-[var(--card-border)] flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                <span>⏰ ساعات پاسخگویی:</span>
                <span className="text-[var(--text-primary)] font-mono">{workingHours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* نوار پایین فوتر: کپی‌رایت، اینماد و طراحی مهندسی */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)] font-medium pt-2">
          <p className="text-center sm:text-right">
            تمامی حقوق مادی و معنوی برای <strong className="text-[var(--text-primary)] font-black">{siteName}</strong> محفوظ است © {new Date().getFullYear()}
          </p>

          <div className="flex items-center gap-4 text-[11px] font-bold">
            <span className="text-[var(--text-secondary)]">طراحی و معماری مهندسی پایدار</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>نماد اعتماد الکترونیکی فعال (۲۷۴۲۴۵۳۴)</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

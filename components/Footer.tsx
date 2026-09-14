// File Path: components/Footer.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

interface ContactItem {
  char: string;
  label: string;
  value: string;
  href: string;
  icon: string;
}

export default function Footer() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

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

  const contactItems: ContactItem[] = [
    { char: "C", label: "تماس تلفنی", value: phone, href: `tel:${phone}`, icon: "📞" },
    { char: "O", label: "پیگیری سفارش", value: "سامانه رهگیری ۲۴ ساعته", href: "/track", icon: "📦" },
    { char: "N", label: "نشانی انبار", value: address, href: "/contact", icon: "📍" },
    { char: "T", label: "تیکت پشتیبانی", value: "مشاوره آنلاین کارشناسان", href: "/contact", icon: "✉️" },
    { char: "A", label: "درباره ما", value: "تضمین اصالت تجهیزات", href: "/about", icon: "🛡️" },
    { char: "C", label: "کانال تلگرام", value: "@AxonCore_Support", href: "https://t.me", icon: "✈️" },
    { char: "T", label: "پست الکترونیک", value: email, href: `mailto:${email}`, icon: "📧" },
  ];

  return (
    <footer className="w-full bg-[var(--modal-bg)] border-t border-[var(--card-border)] text-[var(--text-primary)] font-sans select-none transition-colors pt-10 pb-8 px-4 sm:px-6 lg:px-8 mt-12" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* ستون‌های اطلاعات فوتر */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* ستون راست: معرفی برند */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] p-2 flex items-center justify-center overflow-hidden shadow-sm">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl text-[var(--accent-blue)] font-black">⚡</span>
                )}
              </div>
              <div>
                <span className="font-black text-base text-[var(--text-primary)] block tracking-tight">{storeName}</span>
                <span className="text-[10px] text-[var(--accent-blue)] font-bold block">مرجع تخصصی دیجیتال و تکنولوژی</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              تأمین و عرضه پیشرفته‌ترین تجهیزات دیجیتال، گجت‌ها و سخت‌افزارهای مدرن با تضمین اصالت و ارسال سریع به سراسر کشور.
            </p>
          </div>

          {/* ستون وسط: دسترسی سریع */}
          <div className="space-y-3 md:text-center">
            <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">دسترسی سریع</h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track" className="hover:text-[var(--accent-blue)] transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">مجله مقالات تخصصی</Link></li>
            </ul>
          </div>

          {/* ستون چپ: خدمات مشتریان */}
          <div className="space-y-3 md:text-left">
            <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">خدمات مشتریان</h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">ثبت تیکت مشاوره</Link></li>
              <li><Link href="/about" className="hover:text-[var(--accent-blue)] transition">شرایط گارانتی طلایی</Link></li>
              <li><Link href="/track" className="hover:text-[var(--accent-blue)] transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">راهنمای کالیبراسیون</Link></li>
            </ul>
          </div>

        </div>

        {/* کپسول تعاملی C-O-N-T-A-C-T */}
        <div className="pt-6 border-t border-[var(--card-border)] flex flex-col items-center justify-center gap-4">
          <span className="text-xs font-bold text-[var(--text-secondary)]">شبکه‌های ارتباطی و اطلاعات تماس:</span>
          
          <div className="relative flex items-center gap-2 p-2.5 px-4 rounded-full bg-[#0b0f19] border border-slate-800/80 shadow-2xl" dir="ltr">
            {contactItems.map((item, idx) => (
              <div
                key={idx}
                className="relative flex flex-col items-center"
                onMouseEnter={() => setActiveTooltip(idx)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <Link
                  href={item.href}
                  className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono font-black text-slate-300 hover:text-white hover:bg-[var(--accent-blue)] hover:border-[var(--accent-blue)] transition-all duration-300 shadow-md hover:scale-110"
                >
                  {item.char}
                </Link>

                {activeTooltip === idx && (
                  <div className="absolute bottom-12 z-50 flex flex-col items-center animate-fadeIn pointer-events-none" dir="rtl">
                    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white rounded-2xl p-3 shadow-2xl whitespace-nowrap text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[var(--accent-blue)]">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className="block font-mono text-xs font-bold text-slate-200" dir="ltr">
                        {item.value}
                      </span>
                    </div>
                    <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* کپی‌رایت نهایی */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)] pt-4 border-t border-[var(--card-border)]">
          <p>تمامی حقوق مادی و معنوی برای {storeName} محفوظ است © ۲۰۲۶</p>
          <p className="font-mono text-[11px]">نماد اعتماد الکترونیکی فعال (۲۷۴۲۴۵۳۴)</p>
        </div>

      </div>
    </footer>
  );
}

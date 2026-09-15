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
  const footerLogo = siteInfo?.footer_logo_url || siteInfo?.footerLogoUrl || siteInfo?.logo_url || siteInfo?.logoUrl;
  const phone = siteInfo?.phone || "09376110200";
  const email = siteInfo?.email || "Pouriarahimi@yahoo.com";
  const address = siteInfo?.address || "شیراز - ستارخان";

  const contactItems: ContactItem[] = [
    { char: "C", label: "تماس تلفنی", value: phone, href: `tel:${phone}`, icon: "📞" },
    { char: "O", label: "پیگیری سفارش", value: "سامانه رهگیری مرسولات", href: "/track", icon: "📦" },
    { char: "N", label: "نشانی تحویل", value: address, href: "/contact", icon: "📍" },
    { char: "T", label: "تیکت پشتیبانی", value: "مشاوره آنلاین", href: "/contact", icon: "✉️" },
    { char: "A", label: "درباره ما", value: "تضمین اصالت کالا", href: "/about", icon: "🛡️" },
    { char: "C", label: "کانال تلگرام", value: "@AxonCore_Support", href: "https://t.me", icon: "✈️" },
    { char: "T", label: "پست الکترونیک", value: email, href: `mailto:${email}`, icon: "📧" },
  ];

  return (
    <footer className="w-full bg-[var(--modal-bg)] text-[var(--text-primary)] font-sans select-none pt-8 pb-6 px-4 sm:px-6 lg:px-8 mt-12" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ۳ ستون اصلی بدون خط جداکننده و با چیدمان فشرده و مینیمال */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* ستون راست: لوگو داینامیک از ادمین + متن معرفی + کپسول C O N T A C T مستقیم در زیر آن */}
          <div className="md:col-span-6 space-y-3">
            {footerLogo ? (
              <div className="h-10 flex items-center">
                <img src={footerLogo} alt={storeName} className="h-9 object-contain" />
              </div>
            ) : null}

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-md">
              تأمین و عرضه پیشرفته‌ترین تجهیزات دیجیتال، گجت‌ها و سخت‌افزارهای مدرن با تضمین اصالت و ارسال سریع به سراسر کشور.
            </p>

            {/* نوار کپسولی مشکی انیمیشنی C O N T A C T در زیر متن ستون راست */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] block mb-2">شبکه‌های ارتباطی و اطلاعات تماس:</span>
              <div className="relative inline-flex items-center gap-1.5 p-1.5 px-3 rounded-full bg-[#0b0f19] border border-slate-800 shadow-xl" dir="ltr">
                {contactItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative flex flex-col items-center"
                    onMouseEnter={() => setActiveTooltip(idx)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <Link
                      href={item.href}
                      className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[11px] font-mono font-black text-slate-300 hover:text-white hover:bg-[var(--accent-blue)] hover:border-[var(--accent-blue)] transition-all duration-200 hover:scale-110 shadow"
                    >
                      {item.char}
                    </Link>

                    {activeTooltip === idx && (
                      <div className="absolute bottom-11 z-50 flex flex-col items-center animate-fadeIn pointer-events-none" dir="rtl">
                        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white rounded-2xl p-2.5 shadow-2xl whitespace-nowrap text-center space-y-1">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[var(--accent-blue)]">
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
          </div>

          {/* ستون وسط: دسترسی سریع */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">دسترسی سریع</h4>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track" className="hover:text-[var(--accent-blue)] transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">مجله مقالات تخصصی</Link></li>
            </ul>
          </div>

          {/* ستون چپ: خدمات مشتریان */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)] tracking-wide">خدمات مشتریان</h4>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">ثبت تیکت مشاوره</Link></li>
              <li><Link href="/about" className="hover:text-[var(--accent-blue)] transition">شرایط گارانتی طلایی</Link></li>
              <li><Link href="/track" className="hover:text-[var(--accent-blue)] transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/products" className="hover:text-[var(--accent-blue)] transition">راهنمای تخصصی کالاها</Link></li>
            </ul>
          </div>

        </div>

        {/* نوار پایانی کپی‌رایت مینیمال (بدون حاشیه و خطوط اضافه) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)] pt-4">
          <p>تمامی حقوق مادی و معنوی برای {storeName} محفوظ است © ۲۰۲۶</p>
          <p className="font-mono">نماد اعتماد الکترونیکی فعال (۲۷۴۲۴۵۳۴)</p>
        </div>

      </div>
      <div className="hidden">

            {/* لوگوی رسمی اینماد */}
            <div className="p-3 rounded-2xl bg-white/5 border border-[var(--card-border)] hover:border-emerald-500/40 transition flex items-center justify-center backdrop-blur-md shadow-sm">
              <a
                referrerPolicy="origin"
                target="_blank"
                rel="noreferrer"
                href="https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
                className="inline-block"
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
</footer>
  );
}

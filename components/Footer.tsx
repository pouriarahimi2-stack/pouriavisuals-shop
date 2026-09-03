"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const siteName = info?.site_name || info?.siteName || "AXON";
  const footerLogo = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url;

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-auto select-none transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-morphism p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              {footerLogo ? (
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={footerLogo} alt={siteName} className="w-full h-full object-contain" />
                </div>
              ) : null}
              <div className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">{siteName}</div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">مرجع تخصصی خرید جدیدترین گجت‌های نوین، سخت‌افزار و ابزارهای تکنولوژی با گارانتی اصالت طلایی.</p>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-[var(--accent-blue)]">دسترسی سریع</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ محصولات</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">پیگیری سفارش</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله سئو</Link></li>
            </ul>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-[var(--accent-blue)]">اطلاعات تماس</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li>تلفن: {info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸"}</li>
              <li>ایمیل: {info?.email || "info@axoncore.ir"}</li>
              <li>ساعات کاری: {info?.working_hours || "۹:۰۰ الی ۱۸:۰۰"}</li>
            </ul>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">ضمانت رسمی</h5>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">۱۰۰٪ اصالت فیزیکی کالا، مهلت تست ۷ روزه سخت‌افزاری و ارسال سریع پیشتاز به سراسر ایران.</p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--card-border)] text-center text-xs text-[var(--text-secondary)] font-bold">
          تمامی حقوق محفوظ است © {new Date().getFullYear()} {siteName}
        </div>
      </div>
    </footer>
  );
}

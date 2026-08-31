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

  const siteName = info?.site_name || info?.siteName || "آکسون | Axon";
  const footerLogo = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url;

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] transition-colors mt-auto shadow-2xl select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="w-full max-w-[180px] h-20 rounded-2xl border border-[var(--card-border)] bg-white/5 p-2 shadow-inner flex items-center justify-center overflow-hidden">
              {footerLogo ? (
                <img src={footerLogo} alt={siteName} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full rounded-xl bg-[var(--accent-blue)] flex items-center justify-center text-white font-black text-xl">
                  ⚓
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {info?.description || info?.tagline || "مرجع تخصصی مانیتور و تجهیزات تصویر"}
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">دسترسی سریع</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ محصولات</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">پیگیری سفارش</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله سئو</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">اطلاعات رسمی</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li>تلفن: <span className="font-mono font-bold text-[var(--accent-blue)]">{info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸"}</span></li>
              <li>ایمیل: <span className="font-mono">{info?.email || "info@axoncore.ir"}</span></li>
              <li>ساعات کاری: {info?.working_hours || "۹:۰۰ الی ۱۸:۰۰"}</li>
              <li>نشانی: {info?.address || "تهران، خیابان ولیعصر"}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">ضمانت و استانداردها</h5>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 text-xs">
              <div className="font-black text-emerald-500">✓ ضمانت ۱۰۰٪ اصالت فیزیکی کالا</div>
              <p className="text-[11px] text-[var(--text-secondary)]">ارسال پیشتاز با بسته‌بندی ضدضربه استودیویی و بیمه کامل.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--card-border)] text-center text-xs text-[var(--text-secondary)] font-bold">
          تمامی حقوق مادی و معنوی برای مجموعه <span className="text-[var(--accent-blue)]">{siteName}</span> محفوظ است © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}

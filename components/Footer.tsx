// File Path: components/Footer.tsx
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

  return (
    <footer className="w-full border-t border-white/10 bg-[#101416] text-white mt-auto select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <div className="text-2xl font-black text-white tracking-tighter">{siteName}</div>
            <p className="text-xs opacity-60 leading-relaxed font-medium">مرجع تخصصی خرید جدیدترین گجت‌های نوین، سخت‌افزار و ابزارهای تکنولوژی با گارانتی اصالت طلایی.</p>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-[#1b90ff]">دسترسی سریع</h5>
            <ul className="space-y-2 text-xs opacity-70">
              <li><Link href="/#products" className="hover:text-[#1b90ff]">کاتالوگ محصولات</Link></li>
              <li><Link href="/track-order" className="hover:text-[#1b90ff]">پیگیری سفارش</Link></li>
              <li><Link href="/news" className="hover:text-[#1b90ff]">اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[#1b90ff]">مجله سئو</Link></li>
            </ul>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-[#1b90ff]">اطلاعات تماس</h5>
            <ul className="space-y-2 text-xs opacity-70">
              <li>تلفن: {info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸"}</li>
              <li>ایمیل: {info?.email || "info@axoncore.ir"}</li>
              <li>ساعات کاری: {info?.working_hours || "۹:۰۰ الی ۱۸:۰۰"}</li>
            </ul>
          </div>
          <div className="glass-morphism p-6 rounded-3xl space-y-3">
            <h5 className="font-bold text-sm text-emerald-400">ضمانت رسمی</h5>
            <p className="text-xs opacity-70 leading-relaxed">۱۰۰٪ اصالت فیزیکی کالا، مهلت تست ۷ روزه سخت‌افزاری و ارسال سریع پیشتاز به سراسر ایران.</p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs opacity-50">
          تمامی حقوق محفوظ است © {new Date().getFullYear()} {siteName}
        </div>
      </div>
    </footer>
  );
}

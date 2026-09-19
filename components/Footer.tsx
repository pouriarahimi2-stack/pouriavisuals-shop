"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService } from "@/services/siteInfoService";
import EnamadBadge from "@/components/EnamadBadge";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function Footer() {
  const [siteInfo, setSiteInfo] = useState<any>(null);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((info) => {
      if (info) setSiteInfo(info);
    });
  }, []);

  const storeName = siteInfo?.storeName || siteInfo?.site_name || "آکسون کور | Axon Core";
  let footerDesc = siteInfo?.description || siteInfo?.footer_text || "";
  
  if (footerDesc.includes("استودیو") || footerDesc.includes("کالیبراسیون") || footerDesc.includes("۵K") || !footerDesc) {
    footerDesc = "فروشگاه تخصصی عرضه جدیدترین کالاهای فناوری، گجت‌های هوشمند و لوازم دیجیتال با تضمین اصالت کالا، مشاوره خرید و ارسال سریع به سراسر ایران.";
  }

  const phone = siteInfo?.phone || "09376110200";
  const email = siteInfo?.email || "info@axoncore.ir";
  const address = siteInfo?.address || "شیراز، خیابان ستارخان";
  const workHours = siteInfo?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";

  return (
    <footer className="mt-20 border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] font-sans select-none pb-36 sm:pb-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-base font-black">
              {siteInfo?.logo_url ? (
                <img src={siteInfo.logo_url} alt={storeName} className="h-8 w-auto object-contain rounded-lg" />
              ) : (
                <AnimatedLogo />
              )}
              <span>{storeName}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-loose text-justify font-medium">
              {footerDesc}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-emerald-500">
              <span>✓</span>
              <span>دارای درگاه پرداخت امن الکترونیک شاپرک</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">
              دسترسی سریع
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/products" className="hover:text-[var(--text-primary)] transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/news" className="hover:text-[var(--text-primary)] transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--text-primary)] transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/about" className="hover:text-[var(--text-primary)] transition">درباره ما</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--text-primary)] transition">تماس با کارشناسان</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">
              خدمات مشتریان
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-[var(--text-primary)] transition">ثبت تیکت مشاوره خرید</Link></li>
              <li><Link href="/about" className="hover:text-[var(--text-primary)] transition">شرایط گارانتی اصالت طلایی</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--text-primary)] transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/my-orders" className="hover:text-[var(--text-primary)] transition">پیگیری فاکتورهای من</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">
              نشانی و نماد اعتماد
            </h4>
            <div className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <div className="flex justify-between"><span className="font-bold">تلفن:</span> <span className="font-mono text-left">{phone}</span></div>
              <div className="flex justify-between"><span className="font-bold">ایمیل:</span> <span className="font-mono text-left">{email}</span></div>
              <div className="flex justify-between"><span className="font-bold">نشانی:</span> <span className="text-left">{address}</span></div>
              <div className="flex justify-between"><span className="font-bold">ساعات:</span> <span>{workHours}</span></div>
            </div>

            <div className="pt-2">
              <EnamadBadge />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 تمامی حقوق مادی و معنوی برای {storeName} محفوظ است.</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:underline">قوانین و مقررات</Link>
            <Link href="/track-order" className="hover:underline">پیگیری مرسوله</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

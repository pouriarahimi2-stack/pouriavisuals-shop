"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService } from "@/services/siteInfoService";
import EnamadBadge from "@/components/EnamadBadge";
import AnimatedLogo from "@/components/AnimatedLogo";

// لینک‌های پیش‌فرض (فقط اگر DB خالی بود استفاده می‌شود)
const DEFAULT_QUICK_LINKS = [
  { id: "l1", title: "کاتالوگ کالاها",          url: "/products" },
  { id: "l2", title: "سامانه رهگیری مرسولات",   url: "/track-order" },
  { id: "l3", title: "جدیدترین اخبار تکنولوژی", url: "/news" },
  { id: "l4", title: "درباره ما",                url: "/about" },
  { id: "l5", title: "تماس با ما",               url: "/contact" },
];

const DEFAULT_SERVICE_LINKS = [
  { id: "s1", title: "ثبت تیکت مشاوره خرید",   url: "/contact" },
  { id: "s2", title: "شرایط گارانتی اصالت",      url: "/about" },
  { id: "s3", title: "ضمانت بازگشت وجه ۷ روزه", url: "/about" },
  { id: "s4", title: "پیگیری فاکتورهای من",      url: "/my-orders" },
];

export default function Footer() {
  const [siteInfo, setSiteInfo] = useState<any>(null);

  const syncFooter = () => {
    siteInfoService.getSiteInfo().then((info) => {
      if (info) setSiteInfo(info);
    });
  };

  useEffect(() => {
    syncFooter();
    window.addEventListener("site_info_updated", syncFooter);
    return () => window.removeEventListener("site_info_updated", syncFooter);
  }, []);

  const footerCfg  = siteInfo?.homepage_layout_config?.footer;
  const storeName  = footerCfg?.brandTitle  || siteInfo?.storeName || siteInfo?.site_name || "آکسون کور | Axon Core";
  const footerDesc = footerCfg?.description || "فروشگاه تخصصی عرضه جدیدترین کالاهای فناوری، گجت‌های هوشمند، لوازم دیجیتال و لوازم جانبی با تضمین اصالت کالا، بهترین قیمت و ارسال سریع پیشتاز به سراسر ایران.";
  const phone      = siteInfo?.phone       || "09376110200";
  const email      = siteInfo?.email       || "info@axoncore.ir";
  const address    = siteInfo?.address     || "شیراز، ستارخان";
  const workHours  = siteInfo?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";

  // ── لینک‌های داینامیک از config (با fallback به پیش‌فرض) ──────
  const quickLinks   = footerCfg?.quickLinks?.links?.length
    ? footerCfg.quickLinks.links
    : DEFAULT_QUICK_LINKS;

  const serviceLinks = footerCfg?.customerServices?.links?.length
    ? footerCfg.customerServices.links
    : DEFAULT_SERVICE_LINKS;

  // ── عنوان ستون‌ها از config ───────────────────────────────────
  const quickLinksTitle    = footerCfg?.quickLinks?.title       || "دسترسی سریع";
  const serviceLinksTitle  = footerCfg?.customerServices?.title || "خدمات مشتریان";
  const contactTitle       = footerCfg?.contactInfo?.title      || "نشانی و ارتباط";
  const certTitle          = footerCfg?.certificates?.title     || "نمادهای اعتماد و درگاه";

  return (
    <footer className="mt-20 border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] font-sans select-none pb-28 md:pb-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* گرید ۵ ستونه مدرن فوتر */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 items-start">

          {/* ستون ۱: برند و معرفی */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5 text-base font-black">
              {siteInfo?.logo_url ? (
                <img src={siteInfo.logo_url} alt={storeName} className="h-8 w-auto object-contain rounded-lg" />
              ) : (
                <AnimatedLogo size={34} />
              )}
              <span>{storeName}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-loose text-justify font-medium">
              {footerDesc}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-emerald-500">
              <span>✓</span>
              <span>مجهز به درگاه پرداخت رسمی شاپرک (زرین‌پال)</span>
            </div>
          </div>

          {/* ستون ۲: دسترسی سریع — داینامیک از ادمین */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">
              {quickLinksTitle}
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              {quickLinks.map((link: any) => (
                <li key={link.id || link.url}>
                  <Link href={link.url || "/"} className="hover:text-[var(--text-primary)] transition">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ستون ۳: خدمات مشتریان — داینامیک از ادمین */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">
              {serviceLinksTitle}
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              {serviceLinks.map((link: any) => (
                <li key={link.id || link.url}>
                  <Link href={link.url || "/"} className="hover:text-[var(--text-primary)] transition">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ستون ۴: نشانی و ارتباط — داینامیک از site_info */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2">
              {contactTitle}
            </h4>
            <div className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <div className="flex justify-between gap-2">
                <span className="font-bold shrink-0">تلفن:</span>
                <a href={`tel:${phone}`} className="font-mono hover:text-[var(--text-primary)]">{phone}</a>
              </div>
              <div className="flex justify-between gap-2">
                <span className="font-bold shrink-0">ایمیل:</span>
                <a href={`mailto:${email}`} className="font-mono text-[11px] hover:text-[var(--text-primary)] truncate">{email}</a>
              </div>
              <div className="flex justify-between gap-2">
                <span className="font-bold shrink-0">نشانی:</span>
                <span className="text-left">{address}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="font-bold shrink-0">ساعات:</span>
                <span>{workHours}</span>
              </div>
            </div>
          </div>

          {/* ستون ۵: نمادهای اعتماد */}
          <div className="space-y-3 flex flex-col items-center sm:items-start">
            <h4 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2 w-full text-center sm:text-right">
              {certTitle}
            </h4>
            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <EnamadBadge />
              <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--card-border)] shadow-sm flex flex-col items-center justify-center w-20 h-20 text-center">
                <span className="text-2xl">💳</span>
                <span className="text-[9px] font-bold text-slate-500 mt-1">زرین‌پال</span>
              </div>
            </div>
          </div>

        </div>

        {/* خط کپی‌رایت */}
        <div className="pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 تمامی حقوق مادی و معنوی برای {storeName} محفوظ است.</p>
          <div className="flex gap-4">
            <Link href="/about"       className="hover:underline">قوانین و مقررات</Link>
            <Link href="/track-order" className="hover:underline">پیگیری مرسوله</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

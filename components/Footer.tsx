// File Path: components/Footer.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSiteInfo } from "@/context/SiteInfoContext";
import EnamadBadge from "@/components/EnamadBadge";
import AnimatedLogo from "@/components/AnimatedLogo";

export interface FooterExternalLink {
  id: string;
  title: string;
  url: string;
}

export function Footer() {
  const { siteInfo } = useSiteInfo();
  const [logoError, setLogoError] = useState(false);

  const layoutFooter = siteInfo?.homepage_layout_config?.footer || {};
  const themeFooter = siteInfo?.homepage_layout_config?.theme_builder_config?.globalFooter || {};

  const footerLogoUrl =
    themeFooter.footerLogoUrl ||
    layoutFooter.logoUrl ||
    siteInfo?.footer_logo_url ||
    siteInfo?.logo_url ||
    "";

  useEffect(() => {
    setLogoError(false);
  }, [footerLogoUrl]);

  const brandTitle =
    themeFooter.brandTitle ||
    layoutFooter.brandTitle ||
    siteInfo?.site_name ||
    "آکسون کور | Axon Core";

  const brandSubtitle =
    themeFooter.brandSubtitle ||
    layoutFooter.brandSubtitle ||
    siteInfo?.tagline ||
    "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال";

  const supportPhone =
    themeFooter.supportPhone || siteInfo?.phone || "09376110200";
  const supportEmail =
    themeFooter.supportEmail || siteInfo?.email || "Pouriarahimi@yahoo.com";
  const warehouseAddress =
    themeFooter.warehouseAddress || siteInfo?.address || "شیراز - ستارخان";
  const workingHours =
    themeFooter.workingHours ||
    siteInfo?.working_hours ||
    "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";

  const enamadCode = themeFooter.enamadCode || "7434404";
  const enamadLink =
    themeFooter.enamadLink ||
    "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD";
  const enamadEnabled = themeFooter.enamadEnabled !== false;

  const copyrightText =
    themeFooter.copyright ||
    layoutFooter?.bottomBar?.copyrightText ||
    siteInfo?.footer_text ||
    "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026";

  const externalLinks: FooterExternalLink[] =
    Array.isArray(themeFooter.externalLinks) && themeFooter.externalLinks.length > 0
      ? themeFooter.externalLinks
      : [
          { id: "ext_torob", title: "فید رسمی محصولات در ترب (Torob)", url: "/api/torob" },
          { id: "ext_sitemap", title: "نقشه سایت گوگل (Sitemap)", url: "/sitemap.xml" },
        ];

  return (
    <footer
      className="mt-16 border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] font-sans select-none"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 text-xs">
          <div className="lg:col-span-4 space-y-3.5">
            <div className="flex items-center gap-3">
              {footerLogoUrl && !logoError ? (
                <img
                  src={footerLogoUrl}
                  alt={brandTitle}
                  onError={() => setLogoError(true)}
                  className="w-11 h-11 rounded-xl object-contain border border-[var(--card-border)]"
                />
              ) : (
                <AnimatedLogo size={40} />
              )}
              <h3 className="text-base sm:text-lg font-black text-[var(--accent-blue)]">
                {brandTitle}
              </h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              {brandSubtitle}
            </p>
            <div className="pt-1 space-y-1.5 text-[11px] text-[var(--text-secondary)]">
              <div>📍 نشانی: {warehouseAddress}</div>
              <div>🕒 ساعات کاری: {workingHours}</div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-black text-sm text-[var(--text-primary)]">دسترسی سریع</h4>
            <ul className="space-y-2 text-[var(--text-secondary)] font-bold">
              <li>
                <Link href="/products" className="hover:text-[var(--accent-blue)] transition">
                  🛍️ کاتالوگ محصولات دیجیتال
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-[var(--accent-blue)] transition">
                  📡 رادار اخبار تکنولوژی
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[var(--accent-blue)] transition">
                  📚 مجله تخصصی و راهنمای خرید
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">
                  📦 پیگیری لحظه‌ای سفارشات
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-black text-sm text-[var(--text-primary)]">
              پشتیبانی و سامانه‌های رسمی
            </h4>
            <div className="space-y-2 font-mono text-[11px]">
              <div>
                📞 تلفن:{" "}
                <a
                  href={"tel:" + supportPhone}
                  className="text-[var(--accent-blue)] font-bold"
                >
                  {supportPhone}
                </a>
              </div>
              <div>
                ✉️ ایمیل:{" "}
                <a href={"mailto:" + supportEmail} className="text-slate-300">
                  {supportEmail}
                </a>
              </div>
            </div>

            {externalLinks.length > 0 && (
              <div className="pt-2 space-y-1.5 border-t border-[var(--card-border)]">
                {externalLinks.map((lnk) => (
                  <a
                    key={lnk.id}
                    href={lnk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[11px] font-bold text-[var(--accent-blue)] hover:underline"
                  >
                    🔗 {lnk.title}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col items-center lg:items-end justify-center">
            {enamadEnabled && <EnamadBadge code={enamadCode} link={enamadLink} />}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--card-border)] text-center sm:text-right text-[11px] text-[var(--text-secondary)] font-bold">
          <span>{copyrightText}</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

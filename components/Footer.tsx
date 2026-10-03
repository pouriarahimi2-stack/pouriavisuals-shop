"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSiteInfo } from "@/context/SiteInfoContext";
import AnimatedLogo from "@/components/AnimatedLogo";
import EnamadBadge from "@/components/EnamadBadge";
import { supabase } from "@/lib/supabase";

export default function Footer() {
  const { siteInfo: ctxSiteInfo } = useSiteInfo();
  const [liveInfo, setLiveInfo] = useState<any>(null);

  const fetchLatestFooterConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.data || json?.siteInfo) {
        setLiveInfo(json.data || json.siteInfo);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchLatestFooterConfig();

    const ch = supabase
      .channel("realtime-footer-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          fetchLatestFooterConfig();
        }
      )
      .subscribe();

    const onCustomUpdate = () => fetchLatestFooterConfig();
    window.addEventListener("site_info_updated", onCustomUpdate);

    return () => {
      window.removeEventListener("site_info_updated", onCustomUpdate);
      supabase.removeChannel(ch);
    };
  }, [fetchLatestFooterConfig]);

  const info = liveInfo || ctxSiteInfo || {};
  const layoutCfg = info?.homepage_layout_config || {};
  const tbFooter =
    info?.theme_builder_config?.globalFooter ||
    layoutCfg?.theme_builder_config?.globalFooter ||
    {};
  const footerCfg = layoutCfg?.footer || {};

  // اولویت ۱۰۰٪ اول با لوگوی اختصاصی فوتر (footerLogoUrl) و در صورت خالی بودن، لوگوی هدر
  const footerLogoUrl =
    tbFooter.footerLogoUrl ||
    footerCfg.footerLogoUrl ||
    footerCfg.logoUrl ||
    info.footer_logo_url ||
    info.footerLogoUrl ||
    info.logo_url ||
    info.logoUrl ||
    "";

  const brandTitle =
    tbFooter.brandTitle ||
    footerCfg.brandTitle ||
    info.site_name ||
    info.storeName ||
    "آکسون کور | Axon Core";

  const brandSubtitle =
    tbFooter.brandSubtitle ||
    footerCfg.brandSubtitle ||
    info.tagline ||
    "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال";

  const supportPhone =
    tbFooter.supportPhone ||
    footerCfg.supportPhone ||
    info.phone ||
    "09376110200";

  const supportEmail =
    tbFooter.supportEmail ||
    footerCfg.supportEmail ||
    info.email ||
    "Pouriarahimi@yahoo.com";

  const warehouseAddress =
    tbFooter.warehouseAddress ||
    footerCfg.warehouseAddress ||
    info.address ||
    "شیراز - ستارخان";

  const workingHours =
    tbFooter.workingHours ||
    footerCfg.workingHours ||
    info.working_hours ||
    "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";

  const copyrightText =
    tbFooter.copyright ||
    footerCfg?.bottomBar?.copyrightText ||
    "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026";

  const enamadEnabled =
    tbFooter.enamadEnabled !== undefined
      ? Boolean(tbFooter.enamadEnabled)
      : footerCfg.enamadEnabled !== undefined
      ? Boolean(footerCfg.enamadEnabled)
      : true;

  const externalLinks: Array<{ id?: string; title: string; url: string }> =
    Array.isArray(tbFooter.externalLinks) && tbFooter.externalLinks.length > 0
      ? tbFooter.externalLinks
      : Array.isArray(footerCfg.externalLinks) && footerCfg.externalLinks.length > 0
      ? footerCfg.externalLinks
      : [
          { id: "ext_torob", title: "فید رسمی محصولات در ترب (Torob)", url: "/api/torob" },
          { id: "ext_sitemap", title: "نقشه سایت گوگل (Sitemap)", url: "/sitemap.xml" },
        ];

  return (
    <footer
      className="mt-16 border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] font-sans select-text pb-24 lg:pb-10"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          {/* ستون ۱: هویت برند و لوگوی اختصاصی فوتر */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                {footerLogoUrl ? (
                  <img
                    src={footerLogoUrl}
                    alt={brandTitle}
                    className="w-11 h-11 object-contain rounded-xl"
                  />
                ) : (
                  <AnimatedLogo size={38} />
                )}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                  {brandTitle}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5 leading-relaxed">
                  {brandSubtitle}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2 text-[11px] font-bold">
              <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-2">
                <span>🛡️</span>
                <span>ضمانت اصالت کالا</span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-2">
                <span>🚀</span>
                <span>ارسال سریع سراسری</span>
              </div>
            </div>
          </div>

          {/* ستون ۲: دسترسی سریع و لینک‌های خارجی */}
          <div className="lg:col-span-3 space-y-3 text-xs">
            <h4 className="font-black text-sm text-[var(--accent-blue)]">دسترسی سریع</h4>
            <ul className="space-y-2 font-bold text-[var(--text-secondary)]">
              <li>
                <Link href="/products" className="hover:text-[var(--accent-blue)] transition">
                  🛍️ کاتالوگ محصولات
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">
                  📦 پیگیری آنلاین سفارش
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[var(--accent-blue)] transition">
                  📚 مجله تخصصی دیجیتال
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-[var(--accent-blue)] transition">
                  📡 رادار اخبار تکنولوژی
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[var(--accent-blue)] transition">
                  ℹ️ درباره ما
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--accent-blue)] transition">
                  📞 تماس و پشتیبانی
                </Link>
              </li>
              {externalLinks.map((ext, i) => (
                <li key={ext.id || i}>
                  <a
                    href={ext.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--accent-blue)] transition"
                  >
                    🔗 {ext.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ستون ۳: اطلاعات تماس و نشانی */}
          <div className="lg:col-span-3 space-y-3 text-xs">
            <h4 className="font-black text-sm text-[var(--accent-blue)]">مرکز ارتباط و پشتیبانی</h4>
            <div className="space-y-2.5 text-[var(--text-secondary)] font-bold">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <span>تلفن پشتیبانی:</span>
                <a
                  href={"tel:" + supportPhone}
                  dir="ltr"
                  className="font-mono font-black text-[var(--accent-blue)] hover:underline"
                >
                  {supportPhone}
                </a>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <span>ایمیل رسمی:</span>
                <a
                  href={"mailto:" + supportEmail}
                  dir="ltr"
                  className="font-mono text-[11px] text-[var(--text-primary)] hover:underline truncate max-w-[160px]"
                >
                  {supportEmail}
                </a>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
                <div className="text-[var(--text-primary)]">📍 نشانی: {warehouseAddress}</div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  🕒 ساعات کاری: {workingHours}
                </div>
              </div>
            </div>
          </div>

          {/* ستون ۴: نماد اعتماد الکترونیکی (اینماد) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center space-y-2">
            {enamadEnabled && (
              <div className="p-3 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col items-center justify-center shadow-inner">
                <EnamadBadge />
                <span className="text-[10px] font-bold text-[var(--text-secondary)] mt-1">
                  نماد اعتماد الکترونیکی
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)] font-bold">
          <p>{copyrightText}</p>
          <span className="font-mono text-[11px] text-[var(--accent-blue)]">
            AXON CORE SECURE E-COMMERCE
          </span>
        </div>
      </div>
    </footer>
  );
}

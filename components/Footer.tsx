"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSiteInfo } from "@/context/SiteInfoContext";
import AnimatedLogo from "@/components/AnimatedLogo";
import EnamadBadge from "@/components/EnamadBadge";

export default function Footer() {
  const { siteInfo, refresh } = useSiteInfo();
  const [logoImgFailed, setLogoImgFailed] = useState(false);

  const info = siteInfo || {};
  const layoutCfg = info?.homepage_layout_config || {};
  const tbFooter =
    info?.theme_builder_config?.globalFooter ||
    layoutCfg?.theme_builder_config?.globalFooter ||
    {};
  const footerCfg = layoutCfg?.footer || {};

  const footerLogoUrl = String(
    tbFooter.footerLogoUrl ??
      footerCfg.footerLogoUrl ??
      footerCfg.logoUrl ??
      info.footer_logo_url ??
      info.footerLogoUrl ??
      info.logo_url ??
      info.logoUrl ??
      ""
  ).trim();

  useEffect(() => {
    setLogoImgFailed(false);
  }, [footerLogoUrl]);

  useEffect(() => {
    const onStudioSave = () => {
      if (typeof refresh === "function") refresh();
    };
    window.addEventListener("theme_builder_updated", onStudioSave);
    return () => window.removeEventListener("theme_builder_updated", onStudioSave);
  }, [refresh]);

  if (footerCfg.show === false) return null;

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

  const brandDescription =
    tbFooter.brandDescription ??
    footerCfg.description ??
    info.description ??
    "";

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
    info.footer_text ||
    "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026";

  const enamadEnabled =
    tbFooter.enamadEnabled !== undefined
      ? Boolean(tbFooter.enamadEnabled)
      : footerCfg.enamadEnabled !== undefined
      ? Boolean(footerCfg.enamadEnabled)
      : true;

  const enamadCode = tbFooter.enamadCode || footerCfg.enamadCode || "7434404";
  const enamadLink = tbFooter.enamadLink || footerCfg.enamadLink || undefined;

  const scaleMode = tbFooter.scaleMode || footerCfg.scaleMode || "normal";
  const paddingMode = tbFooter.paddingMode || footerCfg.paddingMode || "normal";

  // اگر رنگ پس‌زمینه خالی باشد یا همان کد سیاه پیش‌فرض (#07090e) باشد، از متغیر تم (روشن در روز / تیره در شب) استفاده شود
  const rawCustomBg = String(tbFooter.bgColor || "").trim().toLowerCase();
  const useCustomBg =
    rawCustomBg !== "" &&
    rawCustomBg !== "#07090e" &&
    rawCustomBg !== "#0a0c10" &&
    rawCustomBg !== "#000000" &&
    rawCustomBg !== "transparent";

  const quickLinks: Array<{ id?: string; title: string; url: string; show?: boolean }> =
    Array.isArray(tbFooter.quickLinks) && tbFooter.quickLinks.length > 0
      ? tbFooter.quickLinks.filter((l: any) => l.show !== false)
      : Array.isArray(footerCfg?.quickLinks?.links) && footerCfg.quickLinks.links.length > 0
      ? footerCfg.quickLinks.links
      : [
          { id: "q1", title: "🛍️ کاتالوگ محصولات", url: "/products" },
          { id: "q2", title: "📦 پیگیری آنلاین سفارش", url: "/track-order" },
          { id: "q3", title: "📚 مجله تخصصی دیجیتال", url: "/blog" },
          { id: "q4", title: "📡 رادار اخبار تکنولوژی", url: "/news" },
          { id: "q5", title: "ℹ️ درباره ما", url: "/about" },
          { id: "q6", title: "📞 تماس و پشتیبانی", url: "/contact" },
        ];

  const externalLinks: Array<{ id?: string; title: string; url: string; show?: boolean }> =
    Array.isArray(tbFooter.externalLinks) && tbFooter.externalLinks.length > 0
      ? tbFooter.externalLinks.filter((l: any) => l.show !== false)
      : Array.isArray(footerCfg.externalLinks) && footerCfg.externalLinks.length > 0
      ? footerCfg.externalLinks
      : [
          { id: "ext_torob", title: "فید رسمی محصولات در ترب (Torob)", url: "/api/torob" },
          { id: "ext_sitemap", title: "نقشه سایت گوگل (Sitemap)", url: "/sitemap.xml" },
        ];

  const columnOrder: string[] =
    Array.isArray(tbFooter.columnOrder) && tbFooter.columnOrder.length === 4
      ? tbFooter.columnOrder
      : ["brand", "quick_links", "support", "enamad"];

  const pyClass =
    paddingMode === "compact"
      ? "py-6 sm:py-8"
      : paddingMode === "relaxed"
      ? "py-14 sm:py-16"
      : "py-10 sm:py-12";

  const textScaleClass =
    scaleMode === "compact"
      ? "text-[11px]"
      : scaleMode === "large"
      ? "text-sm"
      : "text-xs";

  const renderColumn = (colKey: string) => {
    if (colKey === "brand") {
      return (
        <div key="col_brand" className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              {footerLogoUrl && !logoImgFailed ? (
                <img
                  src={footerLogoUrl}
                  alt={brandTitle}
                  onError={() => setLogoImgFailed(true)}
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

          {brandDescription && (
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed text-justify font-medium">
              {brandDescription}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1 text-[11px] font-bold">
            <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-2 text-[var(--text-primary)]">
              <span>🛡️</span>
              <span>ضمانت اصالت کالا</span>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-2 text-[var(--text-primary)]">
              <span>🚀</span>
              <span>ارسال سریع سراسری</span>
            </div>
          </div>
        </div>
      );
    }

    if (colKey === "quick_links") {
      return (
        <div key="col_quick" className={"lg:col-span-3 space-y-3 " + textScaleClass}>
          <h4 className="font-black text-sm text-[var(--accent-blue)]">دسترسی سریع</h4>
          <ul className="space-y-2 font-bold text-[var(--text-secondary)]">
            {quickLinks.map((q, idx) => (
              <li key={q.id || idx}>
                <Link href={q.url || "/"} className="hover:text-[var(--accent-blue)] transition">
                  {q.title}
                </Link>
              </li>
            ))}
            {externalLinks.map((ext, i) => (
              <li key={ext.id || "ext_" + i}>
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
      );
    }

    if (colKey === "support") {
      return (
        <div key="col_support" className={"lg:col-span-3 space-y-3 " + textScaleClass}>
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
      );
    }

    if (colKey === "enamad") {
      return (
        <div
          key="col_enamad"
          className="lg:col-span-2 flex flex-col items-center justify-center space-y-2"
        >
          {enamadEnabled && (
            <div className="p-3 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col items-center justify-center shadow-inner">
              <EnamadBadge code={enamadCode} link={enamadLink} />
              <span className="text-[10px] font-bold text-[var(--text-secondary)] mt-1">
                نماد اعتماد الکترونیکی
              </span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <footer
      style={useCustomBg ? { backgroundColor: rawCustomBg } : undefined}
      className="mt-16 border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] font-sans select-text pb-24 lg:pb-10 transition-colors duration-300"
      dir="rtl"
    >
      <div className={"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 " + pyClass}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          {columnOrder.map((colKey) => renderColumn(colKey))}
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

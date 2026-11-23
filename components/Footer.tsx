// File Path: components/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useSiteInfo } from "@/context/SiteInfoContext";
import EnamadBadge from "@/components/EnamadBadge";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function Footer() {
  const { siteInfo } = useSiteInfo();

  const info = siteInfo || {};
  const layoutCfg = info?.homepage_layout_config || {};
  const persisted = layoutCfg?._persisted_identity || {};
  const sysSettings =
    info?.settings ||
    info?.system_settings ||
    layoutCfg?.system_settings ||
    {};
  const tbFooter =
    info?.theme_builder_config?.globalFooter ||
    layoutCfg?.theme_builder_config?.globalFooter ||
    {};
  const footerCfg = layoutCfg?.footer || {};

  const rawFooterLogo =
    sysSettings.footer_logo_url !== undefined &&
    String(sysSettings.footer_logo_url).trim() !== ""
      ? String(sysSettings.footer_logo_url)
      : tbFooter.footerLogoUrl !== undefined
      ? String(tbFooter.footerLogoUrl)
      : persisted.footer_logo_url !== undefined
      ? String(persisted.footer_logo_url)
      : String(info.footer_logo_url || info.footerLogoUrl || "");

  if (footerCfg.show === false) return null;

  const brandTitle =
    tbFooter.brandTitle !== undefined && String(tbFooter.brandTitle).trim() !== ""
      ? String(tbFooter.brandTitle).trim()
      : String(
          footerCfg.brandTitle ??
            sysSettings.site_name ??
            info.site_name ??
            ""
        ).trim();
  const brandSubtitle =
    tbFooter.brandSubtitle !== undefined &&
    String(tbFooter.brandSubtitle).trim() !== ""
      ? String(tbFooter.brandSubtitle).trim()
      : String(
          footerCfg.brandSubtitle ??
            sysSettings.tagline ??
            info.tagline ??
            ""
        ).trim();
  const brandDescription =
    tbFooter.brandDescription !== undefined &&
    String(tbFooter.brandDescription).trim() !== ""
      ? String(tbFooter.brandDescription).trim()
      : String(
          footerCfg.description ??
            sysSettings.description ??
            info.description ??
            ""
        ).trim();

  const footerLogoWidth = Number(
    tbFooter.footerLogoWidth || footerCfg.footerLogoWidth || 140
  );
  const footerLogoHeight = Number(
    tbFooter.footerLogoHeight || footerCfg.footerLogoHeight || 56
  );
  const footerLogoRadius = tbFooter.footerLogoRadius || "12px";
  const showFooterLogoBox = Boolean(tbFooter.showFooterLogoBox);

  const showTrustBadges =
    tbFooter.showTrustBadges !== undefined
      ? Boolean(tbFooter.showTrustBadges)
      : true;
  const badge1Text =
    tbFooter.badge1Text !== undefined
      ? String(tbFooter.badge1Text).trim()
      : "ضمانت اصالت کالا";
  const badge2Text =
    tbFooter.badge2Text !== undefined
      ? String(tbFooter.badge2Text).trim()
      : "ارسال سریع سراسری";

  const quickLinksTitle =
    tbFooter.quickLinksTitle !== undefined
      ? String(tbFooter.quickLinksTitle).trim()
      : "دسترسی سریع";
  const supportTitle =
    tbFooter.supportTitle !== undefined
      ? String(tbFooter.supportTitle).trim()
      : "مرکز ارتباط و پشتیبانی";

  const supportPhone = String(
    sysSettings.phone || tbFooter.supportPhone || footerCfg.supportPhone || info.phone || ""
  ).trim();
  const mobileSupport = String(
    sysSettings.mobile_support || persisted.mobile_support || info.mobile_support || ""
  ).trim();
  const supportEmail = String(
    sysSettings.email || tbFooter.supportEmail || footerCfg.supportEmail || info.email || ""
  ).trim();
  const warehouseAddress = String(
    sysSettings.address ||
      tbFooter.warehouseAddress ||
      footerCfg.warehouseAddress ||
      info.address ||
      ""
  ).trim();
  const postalCode = String(
    sysSettings.postal_code || persisted.postal_code || info.postal_code || ""
  ).trim();
  const workingHours = String(
    sysSettings.working_hours ||
      tbFooter.workingHours ||
      footerCfg.workingHours ||
      info.working_hours ||
      ""
  ).trim();

  const copyrightText = String(
    sysSettings.footer_text ||
      tbFooter.copyright ||
      footerCfg?.bottomBar?.copyrightText ||
      info.footer_text ||
      ""
  ).trim();

  const enamadEnabled =
    tbFooter.enamadEnabled !== undefined
      ? Boolean(tbFooter.enamadEnabled)
      : footerCfg.enamadEnabled !== undefined
      ? Boolean(footerCfg.enamadEnabled)
      : true;
  const enamadCode =
    sysSettings.enamadCode ||
    tbFooter.enamadCode ||
    footerCfg.enamadCode ||
    "7434404";
  const enamadLink = tbFooter.enamadLink || footerCfg.enamadLink || undefined;

  const socials = [
    {
      label: "اینستاگرام",
      url: sysSettings.instagram_url || persisted.instagram_url || info.instagram_url,
      icon: "📸",
    },
    {
      label: "تلگرام",
      url: sysSettings.telegram_url || persisted.telegram_url || info.telegram_url,
      icon: "✈️",
    },
    {
      label: "واتساپ",
      url: sysSettings.whatsapp_url || persisted.whatsapp_url || info.whatsapp_url,
      icon: "💬",
    },
    {
      label: "یوتیوب",
      url: sysSettings.youtube_url || persisted.youtube_url || info.youtube_url,
      icon: "▶️",
    },
    {
      label: "آپارات",
      url: sysSettings.aparat_url || persisted.aparat_url || info.aparat_url,
      icon: "🎬",
    },
  ].filter((s) => typeof s.url === "string" && s.url.trim().length > 0);

  const scaleMode = tbFooter.scaleMode || footerCfg.scaleMode || "normal";
  const paddingMode = tbFooter.paddingMode || footerCfg.paddingMode || "normal";

  const quickLinks: Array<{
    id?: string;
    title: string;
    url: string;
    show?: boolean;
  }> = Array.isArray(tbFooter.quickLinks)
    ? tbFooter.quickLinks.filter(
        (l: any) => l.show !== false && String(l.title || "").trim() !== ""
      )
    : [];
  const externalLinks: Array<{
    id?: string;
    title: string;
    url: string;
    show?: boolean;
  }> = Array.isArray(tbFooter.externalLinks)
    ? tbFooter.externalLinks.filter(
        (l: any) =>
          l.show !== false &&
          l.url !== "/api/torob" &&
          l.url !== "/sitemap.xml" &&
          String(l.title || "").trim() !== ""
      )
    : [];

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
          <div className="flex flex-wrap items-center gap-4">
            {rawFooterLogo.trim() !== "" && (
              <div
                className={
                  showFooterLogoBox
                    ? "p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-md"
                    : "flex items-center justify-center shrink-0"
                }
              >
                <AnimatedLogo
                  variant="footer"
                  srcOverride={rawFooterLogo}
                  width={footerLogoWidth}
                  height={footerLogoHeight}
                  borderRadius={String(footerLogoRadius)}
                  objectFit="contain"
                  className="transition-all duration-300"
                />
              </div>
            )}
            {(brandTitle || brandSubtitle) && (
              <div className="min-w-[180px] flex-1">
                {brandTitle && (
                  <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                    {brandTitle}
                  </h3>
                )}
                {brandSubtitle && (
                  <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5 leading-relaxed">
                    {brandSubtitle}
                  </p>
                )}
              </div>
            )}
          </div>
          {brandDescription && (
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed text-justify font-medium">
              {brandDescription}
            </p>
          )}
          {showTrustBadges && (badge1Text || badge2Text) && (
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-[11px] font-bold">
              {badge1Text && (
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--card-border)] flex items-center gap-2 text-[var(--text-primary)]">
                  <span>🛡️</span>
                  <span>{badge1Text}</span>
                </div>
              )}
              {badge2Text && (
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--card-border)] flex items-center gap-2 text-[var(--text-primary)]">
                  <span>🚀</span>
                  <span>{badge2Text}</span>
                </div>
              )}
            </div>
          )}

          {socials.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {socials.map((soc) => (
                <a
                  key={soc.label}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-bold flex items-center gap-1.5 transition"
                >
                  <span>{soc.icon}</span>
                  <span>{soc.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (colKey === "quick_links") {
      return (
        <div key="col_quick" className={"lg:col-span-3 space-y-3 " + textScaleClass}>
          {quickLinksTitle && (
            <h4 className="font-black text-sm text-[var(--accent-blue)]">
              {quickLinksTitle}
            </h4>
          )}
          <ul className="space-y-2 font-bold text-[var(--text-secondary)]">
            {quickLinks.map((q, idx) => (
              <li key={q.id || idx}>
                <Link
                  href={q.url || "/"}
                  className="hover:text-[var(--accent-blue)] transition"
                >
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
        <div
          key="col_support"
          className={"lg:col-span-3 space-y-3 " + textScaleClass}
        >
          {supportTitle && (
            <h4 className="font-black text-sm text-[var(--accent-blue)]">
              {supportTitle}
            </h4>
          )}
          <div className="space-y-2.5 text-[var(--text-secondary)] font-bold">
            {supportPhone && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[var(--card-border)]">
                <span>تلفن پشتیبانی:</span>
                <a
                  href={"tel:" + supportPhone}
                  dir="ltr"
                  className="font-mono font-black text-[var(--accent-blue)] hover:underline"
                >
                  {supportPhone}
                </a>
              </div>
            )}
            {mobileSupport && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[var(--card-border)]">
                <span>موبایل / واتساپ:</span>
                <a
                  href={"tel:" + mobileSupport}
                  dir="ltr"
                  className="font-mono font-black text-emerald-500 hover:underline"
                >
                  {mobileSupport}
                </a>
              </div>
            )}
            {supportEmail && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[var(--card-border)]">
                <span>ایمیل رسمی:</span>
                <a
                  href={"mailto:" + supportEmail}
                  dir="ltr"
                  className="font-mono text-[11px] text-[var(--text-primary)] hover:underline truncate max-w-[160px]"
                >
                  {supportEmail}
                </a>
              </div>
            )}
            {(warehouseAddress || workingHours) && (
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[var(--card-border)] space-y-1">
                {warehouseAddress && (
                  <div className="text-[var(--text-primary)]">
                    📍 نشانی: {warehouseAddress}
                    {postalCode ? ` (کد پستی: ${postalCode})` : ""}
                  </div>
                )}
                {workingHours && (
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    🕒 ساعات کاری: {workingHours}
                  </div>
                )}
              </div>
            )}
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
            <div className="p-3 rounded-3xl bg-white dark:bg-slate-900 border border-[var(--card-border)] flex flex-col items-center justify-center shadow-sm">
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
      className="mt-16 border-t border-[var(--card-border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-sans select-text pb-24 lg:pb-10 transition-colors duration-300"
      dir="rtl"
    >
      <div className={"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 " + pyClass}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          {columnOrder.map((colKey) => renderColumn(colKey))}
        </div>
        {copyrightText && (
          <div className="pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)] font-bold">
            <p>{copyrightText}</p>
            <span className="font-mono text-[11px] text-[var(--accent-blue)]">
              AXON CORE SECURE E-COMMERCE
            </span>
          </div>
        )}
      </div>
    </footer>
  );
}
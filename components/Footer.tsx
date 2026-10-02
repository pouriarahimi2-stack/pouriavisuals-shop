// File Path: components/Footer.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSiteInfo } from "@/context/SiteInfoContext";
import EnamadBadge from "@/components/EnamadBadge";
import AnimatedLogo from "@/components/AnimatedLogo";

export interface FooterLinkItem {
  id: string;
  title: string;
  url: string;
  show?: boolean;
}

export function Footer() {
  const { siteInfo, refresh } = useSiteInfo();
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      if (typeof refresh === "function") refresh();
    };
    window.addEventListener("theme_builder_updated", handleSync);
    window.addEventListener("site_info_updated", handleSync);
    return () => {
      window.removeEventListener("theme_builder_updated", handleSync);
      window.removeEventListener("site_info_updated", handleSync);
    };
  }, [refresh]);

  const layoutFooter = siteInfo?.homepage_layout_config?.footer || {};
  const themeFooter = siteInfo?.homepage_layout_config?.theme_builder_config?.globalFooter || {};

  if (layoutFooter.show === false || themeFooter.show === false) {
    return null;
  }

  const footerLogoUrl =
    themeFooter.footerLogoUrl ??
    layoutFooter.logoUrl ??
    siteInfo?.footer_logo_url ??
    siteInfo?.logo_url ??
    "";

  useEffect(() => {
    setLogoError(false);
  }, [footerLogoUrl]);

  const logoWidth = Number(themeFooter.logoWidth || layoutFooter.logoWidth || 44);
  const logoHeight = Number(themeFooter.logoHeight || layoutFooter.logoHeight || 44);
  const logoRadius = themeFooter.logoRadius || "12px";

  const brandTitle =
    themeFooter.brandTitle ??
    layoutFooter.brandTitle ??
    siteInfo?.site_name ??
    "آکسون کور | Axon Core";

  const brandSubtitle =
    themeFooter.brandSubtitle ??
    layoutFooter.brandSubtitle ??
    siteInfo?.tagline ??
    "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال";

  const brandDescription =
    themeFooter.brandDescription ??
    layoutFooter.description ??
    "";

  const supportPhone =
    themeFooter.supportPhone ?? siteInfo?.phone ?? "09376110200";
  const supportEmail =
    themeFooter.supportEmail ?? siteInfo?.email ?? "Pouriarahimi@yahoo.com";
  const warehouseAddress =
    themeFooter.warehouseAddress ?? siteInfo?.address ?? "شیراز - ستارخان";
  const workingHours =
    themeFooter.workingHours ??
    siteInfo?.working_hours ??
    "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";

  const enamadCode = themeFooter.enamadCode ?? "7434404";
  const enamadLink =
    themeFooter.enamadLink ||
    "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD";
  const enamadEnabled = themeFooter.enamadEnabled !== false;

  const copyrightText =
    themeFooter.copyright ??
    layoutFooter?.bottomBar?.copyrightText ??
    siteInfo?.footer_text ??
    "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026";

  // مقیاس اندازه نوشته‌ها و فاصله عمودی فوتر
  const scaleMode: "compact" | "normal" | "large" =
    themeFooter.scaleMode || layoutFooter.scaleMode || "normal";
  const paddingMode: "compact" | "normal" | "relaxed" =
    themeFooter.paddingMode || layoutFooter.paddingMode || "normal";

  const footerBgColor = themeFooter.bgColor || "";
  const footerTextColor = themeFooter.textColor || "";

  const quickLinksTitle =
    themeFooter.quickLinksTitle || layoutFooter?.quickLinks?.title || "دسترسی سریع";
  const supportColumnTitle =
    themeFooter.supportColumnTitle || "پشتیبانی و سامانه‌های رسمی";

  const quickLinks: FooterLinkItem[] = Array.isArray(themeFooter.quickLinks)
    ? themeFooter.quickLinks
    : Array.isArray(layoutFooter?.quickLinks?.links)
    ? layoutFooter.quickLinks.links
    : [
        { id: "q1", title: "🛍️ کاتالوگ محصولات دیجیتال", url: "/products", show: true },
        { id: "q2", title: "📡 رادار اخبار تکنولوژی", url: "/news", show: true },
        { id: "q3", title: "📚 مجله تخصصی و راهنمای خرید", url: "/blog", show: true },
        { id: "q4", title: "📦 پیگیری لحظه‌ای سفارشات", url: "/track-order", show: true },
      ];

  const externalLinks: FooterLinkItem[] = Array.isArray(themeFooter.externalLinks)
    ? themeFooter.externalLinks
    : [
        { id: "ext_torob", title: "فید رسمی محصولات در ترب (Torob)", url: "/api/torob", show: true },
        { id: "ext_sitemap", title: "نقشه سایت گوگل (Sitemap)", url: "/sitemap.xml", show: true },
      ];

  // ترتیب قابل جابجایی ستون‌های فوتر
  const columnOrder: string[] = Array.isArray(themeFooter.columnOrder) && themeFooter.columnOrder.length === 4
    ? themeFooter.columnOrder
    : ["brand", "quick_links", "support", "enamad"];

  const textSizeClass =
    scaleMode === "compact"
      ? "text-[11px]"
      : scaleMode === "large"
      ? "text-sm"
      : "text-xs";

  const headingSizeClass =
    scaleMode === "compact"
      ? "text-xs"
      : scaleMode === "large"
      ? "text-base"
      : "text-sm";

  const pyClass =
    paddingMode === "compact"
      ? "py-6 sm:py-8"
      : paddingMode === "relaxed"
      ? "py-14 sm:py-20"
      : "py-10 sm:py-14";

  const renderColumn = (colKey: string) => {
    if (colKey === "brand") {
      return (
        <div key="brand" className="lg:col-span-4 space-y-3.5">
          <div className="flex items-center gap-3">
            {footerLogoUrl && !logoError ? (
              <img
                src={footerLogoUrl}
                alt={brandTitle}
                onError={() => setLogoError(true)}
                style={{
                  width: logoWidth + "px",
                  height: logoHeight + "px",
                  borderRadius: logoRadius,
                }}
                className="object-contain border border-[var(--card-border)] shrink-0"
              />
            ) : (
              <AnimatedLogo size={logoWidth} />
            )}
            {brandTitle && (
              <h3 className={"font-black text-[var(--accent-blue)] " + (scaleMode === "large" ? "text-xl" : "text-base sm:text-lg")}>
                {brandTitle}
              </h3>
            )}
          </div>
          {brandSubtitle && (
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              {brandSubtitle}
            </p>
          )}
          {brandDescription && (
            <p className="text-[var(--text-secondary)]/80 leading-relaxed text-[11px]">
              {brandDescription}
            </p>
          )}
          <div className="pt-1 space-y-1.5 text-[11px] text-[var(--text-secondary)]">
            {warehouseAddress && <div>📍 نشانی: {warehouseAddress}</div>}
            {workingHours && <div>🕒 ساعات کاری: {workingHours}</div>}
          </div>
        </div>
      );
    }

    if (colKey === "quick_links") {
      const activeQuick = quickLinks.filter((l) => l.show !== false && l.title);
      if (activeQuick.length === 0) return <div key="quick_links" className="lg:col-span-3" />;
      return (
        <div key="quick_links" className="lg:col-span-3 space-y-3">
          <h4 className={"font-black text-[var(--text-primary)] " + headingSizeClass}>
            {quickLinksTitle}
          </h4>
          <ul className="space-y-2 text-[var(--text-secondary)] font-bold">
            {activeQuick.map((lnk) => (
              <li key={lnk.id}>
                <Link href={lnk.url || "/"} className="hover:text-[var(--accent-blue)] transition">
                  {lnk.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (colKey === "support") {
      const activeExt = externalLinks.filter((l) => l.show !== false && l.title);
      return (
        <div key="support" className="lg:col-span-3 space-y-3">
          <h4 className={"font-black text-[var(--text-primary)] " + headingSizeClass}>
            {supportColumnTitle}
          </h4>
          <div className="space-y-2 font-mono text-[11px]">
            {supportPhone && (
              <div>
                📞 تلفن:{" "}
                <a href={"tel:" + supportPhone} className="text-[var(--accent-blue)] font-bold">
                  {supportPhone}
                </a>
              </div>
            )}
            {supportEmail && (
              <div>
                ✉️ ایمیل:{" "}
                <a href={"mailto:" + supportEmail} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  {supportEmail}
                </a>
              </div>
            )}
          </div>

          {activeExt.length > 0 && (
            <div className="pt-2 space-y-1.5 border-t border-[var(--card-border)]">
              {activeExt.map((lnk) => (
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
      );
    }

    if (colKey === "enamad") {
      return (
        <div key="enamad" className="lg:col-span-2 flex flex-col items-center lg:items-end justify-center">
          {enamadEnabled && <EnamadBadge code={enamadCode} link={enamadLink} />}
        </div>
      );
    }

    return null;
  };

  return (
    <footer
      style={{
        ...(footerBgColor ? { backgroundColor: footerBgColor } : {}),
        ...(footerTextColor ? { color: footerTextColor } : {}),
      }}
      className="mt-16 border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] font-sans select-text transition-all duration-300"
      dir="rtl"
    >
      <div className={"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 " + pyClass}>
        <div className={"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 " + textSizeClass}>
          {columnOrder.map((colKey) => renderColumn(colKey))}
        </div>

        {copyrightText && (
          <div className="pt-6 border-t border-[var(--card-border)] text-center sm:text-right text-[11px] text-[var(--text-secondary)] font-bold">
            <span>{copyrightText}</span>
          </div>
        )}
      </div>
    </footer>
  );
}

export default Footer;

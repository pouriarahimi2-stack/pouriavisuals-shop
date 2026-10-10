"use client";
// File Path: components/Footer.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSiteInfo } from "@/context/SiteInfoContext";
import EnamadBadge from "@/components/EnamadBadge";

function resolveSafeUrl(val: any): string {
  if (typeof val !== "string") return "";
  const clean = val.trim();
  if (!clean) return "";
  if (clean.includes(".supabase.co/storage/")) {
    return "/api/media-proxy?url=" + encodeURIComponent(clean);
  }
  return clean;
}

export default function Footer() {

  const [footerLinks, setFooterLinks] = useState<{title: string, url: string}[]>([
    { title: "قوانین و مقررات سایت", url: "/terms" },
    { title: "تماس با ما", url: "/contact" }
  ]);

  useEffect(() => {
    let isMounted = true;
    const load = () => {
      fetch("/api/admin/footer-links").then(r => r.json()).then(d => {
        if (isMounted && d.success && Array.isArray(d.links)) {
          // فقط متغیرهایی که تعریف شده‌اند مقدار می‌گیرند تا تایپ‌اسکریپت ارور ندهد
          try { if (typeof setFooterLinks === "function") setFooterLinks(d.links); } catch(e) {}
        }
      }).catch(() => {});
    };
    
    load();
    const interval = setInterval(load, 15000); // آپدیت مداوم در صورت فیلتر بودن سوکت
    
    let channel: any;
    try {
      const { supabase } = require("@/lib/supabase");
      channel = supabase.channel("footer-sync")
        .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, load)
        .subscribe();
    } catch (e) {}

    return () => { 
      isMounted = false; 
      clearInterval(interval); 
      if (channel) {
        const { supabase } = require("@/lib/supabase");
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const { siteInfo } = useSiteInfo();
  const [logoImgFailed, setLogoImgFailed] = useState(false);

  const info = siteInfo || {};
  const layoutCfg = info?.homepage_layout_config || {};
  const persisted = layoutCfg?._persisted_identity || {};
  const tbFooter =
    info?.theme_builder_config?.globalFooter ||
    layoutCfg?.theme_builder_config?.globalFooter ||
    {};
  const footerCfg = layoutCfg?.footer || {};

  // خواندن منحصراً لوگوی فوتر از دیتابیس (بدون جایگزینی با لوگوی هدر یا لوگوی مثلثی هاردکد)
  const rawFooterLogo =
    tbFooter.footerLogoUrl !== undefined
      ? String(tbFooter.footerLogoUrl)
      : persisted.footer_logo_url !== undefined
      ? String(persisted.footer_logo_url)
      : String(info.footer_logo_url || info.footerLogoUrl || "");

  const footerLogoUrl = resolveSafeUrl(rawFooterLogo);

  useEffect(() => {
    setLogoImgFailed(false);
  }, [footerLogoUrl]);

  if (footerCfg.show === false) return null;

  const brandTitle =
    tbFooter.brandTitle !== undefined
      ? String(tbFooter.brandTitle).trim()
      : String(footerCfg.brandTitle ?? "").trim();

  const brandSubtitle =
    tbFooter.brandSubtitle !== undefined
      ? String(tbFooter.brandSubtitle).trim()
      : String(footerCfg.brandSubtitle ?? info.tagline ?? "").trim();

  const brandDescription =
    tbFooter.brandDescription !== undefined
      ? String(tbFooter.brandDescription).trim()
      : String(footerCfg.description ?? info.description ?? "").trim();

  const footerLogoWidth = Number(tbFooter.footerLogoWidth || footerCfg.footerLogoWidth || 140);
  const footerLogoHeight = Number(tbFooter.footerLogoHeight || footerCfg.footerLogoHeight || 56);
  const footerLogoRadius = tbFooter.footerLogoRadius || "12px";
  const showFooterLogoBox = Boolean(tbFooter.showFooterLogoBox);

  const showTrustBadges =
    tbFooter.showTrustBadges !== undefined ? Boolean(tbFooter.showTrustBadges) : true;
  const badge1Text =
    tbFooter.badge1Text !== undefined ? String(tbFooter.badge1Text).trim() : "ضمانت اصالت کالا";
  const badge2Text =
    tbFooter.badge2Text !== undefined ? String(tbFooter.badge2Text).trim() : "ارسال سریع سراسری";

  const quickLinksTitle =
    tbFooter.quickLinksTitle !== undefined ? String(tbFooter.quickLinksTitle).trim() : "دسترسی سریع";
  const supportTitle =
    tbFooter.supportTitle !== undefined
      ? String(tbFooter.supportTitle).trim()
      : "مرکز ارتباط و پشتیبانی";

  const supportPhone =
    tbFooter.supportPhone !== undefined
      ? String(tbFooter.supportPhone).trim()
      : String(footerCfg.supportPhone ?? info.phone ?? "").trim();
  const supportEmail =
    tbFooter.supportEmail !== undefined
      ? String(tbFooter.supportEmail).trim()
      : String(footerCfg.supportEmail ?? info.email ?? "").trim();
  const warehouseAddress =
    tbFooter.warehouseAddress !== undefined
      ? String(tbFooter.warehouseAddress).trim()
      : String(footerCfg.warehouseAddress ?? info.address ?? "").trim();
  const workingHours =
    tbFooter.workingHours !== undefined
      ? String(tbFooter.workingHours).trim()
      : String(footerCfg.workingHours ?? info.working_hours ?? "").trim();

  const copyrightText =
    tbFooter.copyright !== undefined
      ? String(tbFooter.copyright).trim()
      : String(footerCfg?.bottomBar?.copyrightText ?? info.footer_text ?? "").trim();

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

  const quickLinks: Array<{ id?: string; title: string; url: string; show?: boolean }> =
    Array.isArray(tbFooter.quickLinks)
      ? tbFooter.quickLinks.filter((l: any) => l.show !== false && String(l.title || "").trim() !== "")
      : [];

  const externalLinks: Array<{ id?: string; title: string; url: string; show?: boolean }> =
    Array.isArray(tbFooter.externalLinks)
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
    scaleMode === "compact" ? "text-[11px]" : scaleMode === "large" ? "text-sm" : "text-xs";

  const footerImgKey = footerLogoUrl
    ? footerLogoUrl.slice(-32) + "_" + footerLogoUrl.length
    : "no_footer_logo";

  const renderColumn = (colKey: string) => {
    if (colKey === "brand") {
      return (
        <div key="col_brand" className="lg:col-span-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {footerLogoUrl && !logoImgFailed ? (
              <div
                className={
                  showFooterLogoBox
                    ? "p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-md"
                    : "flex items-center justify-center shrink-0"
                }
              >
                <img
                  key={footerImgKey}
                  src={footerLogoUrl}
                  alt={brandTitle || ""}
                  onError={() => setLogoImgFailed(true)}
                  style={{
                    width: footerLogoWidth + "px",
                    height: footerLogoHeight + "px",
                    borderRadius: String(footerLogoRadius),
                    objectFit: "contain",
                  }}
                  className="transition-all duration-300"
                />
              </div>
            ) : null}

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
        </div>
      );
    }

    if (colKey === "quick_links") {
      return (
        <div key="col_quick" className={"lg:col-span-3 space-y-3 " + textScaleClass}>
          {quickLinksTitle && (
            <h4 className="font-black text-sm text-[var(--accent-blue)]">{quickLinksTitle}</h4>
          )}
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
          {supportTitle && (
            <h4 className="font-black text-sm text-[var(--accent-blue)]">{supportTitle}</h4>
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
                  <div className="text-[var(--text-primary)]">📍 نشانی: {warehouseAddress}</div>
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

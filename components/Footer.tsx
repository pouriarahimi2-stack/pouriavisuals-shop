"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo, DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import ContactDock from "@/components/ContactDock";
import AnimatedLogo from "@/components/AnimatedLogo";
import { soundEngine } from "@/lib/soundEngine";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => {
      if (e.detail) setInfo(e.detail);
    };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const layoutCfg = info?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  const footerCfg = layoutCfg.footer;
  const contactDockCfg = layoutCfg.contactDock;

  if (footerCfg.show === false) return null;

  const siteName = footerCfg.brandTitle || info?.site_name || info?.siteName || "آکسون | Axon";
  const brandSubtitle = footerCfg.brandSubtitle || "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو";
  const brandDesc = footerCfg.description || info?.footer_text || info?.description || "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.";
  const logoUrl = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url || info?.logoUrl;

  const paddingClasses =
    footerCfg.paddingMode === "relaxed"
      ? "py-10 sm:py-14 space-y-8"
      : footerCfg.paddingMode === "normal"
      ? "py-8 sm:py-10 space-y-7"
      : "py-6 sm:py-8 space-y-6";

  const scaleTextClass =
    footerCfg.scaleMode === "compact"
      ? "text-xs"
      : footerCfg.scaleMode === "large"
      ? "text-sm"
      : "text-xs";

  return (
    <footer
      id="storefront-footer"
      className={`w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-10 select-none transition-colors duration-300 font-sans relative z-10 ${scaleTextClass}`}
      dir="rtl"
    >
      <div className={`max-w-[1440px] mx-auto px-4 sm:px-8 ${paddingClasses}`}>
        
        {/* ردیف اصلی: گرید ۱۲ ستونی استودیویی با تراز عالی */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-[var(--card-border)] items-start">
          
          {/* ستون ۱ (راست): مشخصات برند، توضیحات، نشان‌ها و داک کلیدها (۵ ستون) */}
          <div className="lg:col-span-5 space-y-4 text-right">
            
            <div className="flex items-center gap-3">
              <AnimatedLogo customLogoUrl={logoUrl} size={38} />
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                  {siteName}
                </h3>
                <span className="text-[11px] text-[var(--accent-blue)] font-bold block">
                  {brandSubtitle}
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-lg text-justify">
              {brandDesc}
            </p>

            {footerCfg.showBadges && (
              <div className="flex flex-wrap items-center gap-2 pt-1 animate-fadeIn">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20 shadow-sm flex items-center gap-1.5">
                  <span className="text-emerald-500 text-xs">✓</span>
                  <span>{footerCfg.badge1Text || "گارانتی اصالت ۱۰۰٪ فیزیکی"}</span>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-500/20 shadow-sm flex items-center gap-1.5">
                  <span className="text-xs">🚀</span>
                  <span>{footerCfg.badge2Text || "ارسال پیشتاز سراسری"}</span>
                </span>
              </div>
            )}

            {/* داک کلیدهای کیبورد CONTACT با تراز راست کامل */}
            {contactDockCfg.show && (
              <div className="pt-2 border-t border-[var(--card-border)]/60">
                <ContactDock
                  customKeys={contactDockCfg.keys}
                  title={contactDockCfg.title}
                  scale={contactDockCfg.scale}
                />
              </div>
            )}
          </div>

          {/* ستون ۲: پیوندهای دسترسی سریع (۲ ستون) */}
          {footerCfg.quickLinks.show && (
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                  {footerCfg.quickLinks.title || "دسترسی سریع"}
                </h4>
              </div>

              <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-bold">
                {footerCfg.quickLinks.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url}
                      onClick={() => soundEngine.playClick()}
                      className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                    >
                      <span className="text-[10px] opacity-60">›</span>
                      <span>{link.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ستون ۳: خدمات مشتریان و پشتیبانی (۲ ستون) */}
          {footerCfg.customerServices.show && (
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                  {footerCfg.customerServices.title || "خدمات مشتریان"}
                </h4>
              </div>

              <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-bold">
                {footerCfg.customerServices.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url}
                      onClick={() => soundEngine.playClick()}
                      className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                    >
                      <span className="text-[10px] opacity-60">›</span>
                      <span>{link.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ستون ۴ (چپ): میکروکارت‌های اطلاعات تماس و گواهی‌ها (۳ ستون) */}
          {footerCfg.contactInfo.show && (
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                  {footerCfg.contactInfo.title || "اطلاعات تماس و دفتر"}
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                {footerCfg.contactInfo.items
                  .filter((it) => it.show !== false)
                  .map((it) => {
                    const isLink = Boolean(it.link);
                    const CardComponent = isLink ? "a" : "div";
                    const linkProps = isLink ? { href: it.link, onClick: () => soundEngine.playClick() } : {};

                    return (
                      <CardComponent
                        key={it.id}
                        {...linkProps}
                        className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all flex items-center justify-between group shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="w-8 h-8 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center text-sm font-bold shadow-inner shrink-0">
                            {it.type === "phone" ? "📞" : it.type === "email" ? "✉️" : it.type === "address" ? "📍" : "⏰"}
                          </span>
                          <div className="overflow-hidden text-right">
                            <span className="text-[10px] text-[var(--text-secondary)] block font-bold">
                              {it.title}
                            </span>
                            <span className="font-bold text-xs text-[var(--text-primary)] truncate block group-hover:text-[var(--accent-blue)] transition-colors" dir={it.type === "phone" || it.type === "email" ? "ltr" : "rtl"}>
                              {it.value}
                            </span>
                          </div>
                        </div>
                        {isLink && (
                          <span className="text-[10px] text-[var(--accent-blue)] opacity-0 group-hover:opacity-100 transition-opacity font-bold shrink-0 mr-2">
                            ↗
                          </span>
                        )}
                      </CardComponent>
                    );
                  })}
              </div>

              {/* بخش پویا برای اینماد و سایر مجوزهای رسمی */}
              {footerCfg.certificates.show && footerCfg.certificates.items.length > 0 && (
                <div className="pt-3 border-t border-[var(--card-border)]/60 space-y-2">
                  <span className="text-[11px] font-black text-[var(--text-secondary)] block">
                    {footerCfg.certificates.title || "مجوزها و تاییدیه رسمی:"}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {footerCfg.certificates.items
                      .filter((c) => c.show !== false)
                      .map((cert) => (
                        <div key={cert.id} className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition shadow-sm">
                          {cert.link ? (
                            <a href={cert.link} target="_blank" rel="noopener noreferrer" className="block" title={cert.title}>
                              {cert.imageUrl ? (
                                <img src={cert.imageUrl} alt={cert.title} className="w-12 h-12 object-contain" />
                              ) : (
                                <span className="text-xs font-bold text-[var(--accent-blue)]">{cert.title}</span>
                              )}
                            </a>
                          ) : cert.codeOrHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: cert.codeOrHtml }} />
                          ) : (
                            <span className="text-xs font-bold">{cert.title}</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* نوار پایین فوتر با قابلیت سفارشی‌سازی کامل متون */}
        {footerCfg.bottomBar.show && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)] font-medium pt-2">
            <p className="text-center sm:text-right">
              {footerCfg.bottomBar.copyrightText} © {new Date().getFullYear()}
            </p>

            <div className="flex items-center gap-4 text-[11px] font-bold">
              <span className="text-[var(--text-secondary)]">{footerCfg.bottomBar.designerText}</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{footerCfg.bottomBar.enamadBadgeText}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}

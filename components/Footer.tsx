"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, HomepageLayoutConfig, DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";

export default function Footer() {
  const [layout, setLayout] = useState<HomepageLayoutConfig>(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  const [enamadImgError, setEnamadImgError] = useState(false);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((info) => {
      if (info?.homepage_layout_config) {
        setLayout({
          ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
          ...info.homepage_layout_config,
          footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(info.homepage_layout_config.footer || {}) },
        });
      }
    });

    const onSiteUpdate = (e: any) => {
      if (e.detail?.homepage_layout_config?.footer) {
        setLayout((prev) => ({
          ...prev,
          footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...e.detail.homepage_layout_config.footer },
        }));
      }
    };
    window.addEventListener("site_info_updated", onSiteUpdate);
    return () => window.removeEventListener("site_info_updated", onSiteUpdate);
  }, []);

  const f = layout.footer;
  if (!f.show) return null;

  return (
    <footer className="w-full bg-[var(--modal-bg)] border-t border-[var(--card-border)] text-[var(--text-primary)] font-sans select-none transition-colors duration-300 mt-16" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* ستون اول: برند و اطلاعات تماس */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              {f.logoUrl ? (
                <img
                  src={f.logoUrl}
                  alt={f.brandTitle}
                  style={{
                    width: f.logoWidth ? `${f.logoWidth}px` : "auto",
                    height: f.logoHeight ? `${f.logoHeight}px` : "48px",
                  }}
                  className="object-contain max-w-[220px]"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-md">
                  ⚡
                </div>
              )}
              <div>
                <h3 className="text-lg font-black tracking-tight">{f.brandTitle}</h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium">{f.brandSubtitle}</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium text-justify">
              {f.description}
            </p>

            {f.showBadges && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  ✓ {f.badge1Text}
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-[10px] font-bold">
                  🚀 {f.badge2Text}
                </span>
              </div>
            )}
          </div>

          {/* ستون دوم: دسترسی سریع */}
          {f.quickLinks.show && (
            <div className="md:col-span-2 space-y-3 text-xs">
              <h4 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2 w-fit">
                {f.quickLinks.title}
              </h4>
              <ul className="space-y-2.5 text-[var(--text-secondary)] font-medium">
                {f.quickLinks.links.map((link) => (
                  <li key={link.id}>
                    <Link href={link.url} className="hover:text-[var(--accent-blue)] transition">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ستون سوم: خدمات مشتریان */}
          {f.customerServices.show && (
            <div className="md:col-span-2 space-y-3 text-xs">
              <h4 className="font-black text-sm text-[var(--text-primary)] border-b border-[var(--card-border)] pb-2 w-fit">
                {f.customerServices.title}
              </h4>
              <ul className="space-y-2.5 text-[var(--text-secondary)] font-medium">
                {f.customerServices.links.map((link) => (
                  <li key={link.id}>
                    <Link href={link.url} className="hover:text-[var(--accent-blue)] transition">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ستون چهارم: تماس و اینماد */}
          <div className="md:col-span-4 space-y-4">
            {f.contactInfo.show && (
              <div className="space-y-2 text-xs bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--card-border)]">
                {f.contactInfo.items.filter((i) => i.show).map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-secondary)] font-bold">{it.title}</span>
                    {it.link ? (
                      <a href={it.link} className="font-mono font-bold text-[var(--accent-blue)] hover:underline" dir="ltr">
                        {it.value}
                      </a>
                    ) : (
                      <span className="font-bold text-[var(--text-primary)]">{it.value}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {f.certificates.show && (
              <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                {f.certificates.items.filter((c) => c.show).map((cert) => (
                  <div key={cert.id} className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--card-border)] shadow-md flex items-center justify-center min-w-[100px] min-h-[100px]">
                    <a
                      referrerPolicy="origin"
                      target="_blank"
                      rel="noreferrer"
                      href={cert.link || "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"}
                      className="flex flex-col items-center justify-center gap-1"
                    >
                      {!enamadImgError ? (
                        <img
                          referrerPolicy="origin"
                          src={cert.imageUrl || "https://trustseal.enamad.ir/logo.aspx?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"}
                          alt={cert.title}
                          className="w-20 h-20 object-contain cursor-pointer"
                          onError={() => setEnamadImgError(true)}
                        />
                      ) : (
                        <div className="w-20 h-20 flex flex-col items-center justify-center text-center p-1">
                          <span className="text-2xl">🛡️</span>
                          <span className="text-[9px] font-bold text-slate-500">اینماد تایید شده</span>
                        </div>
                      )}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {f.bottomBar.show && (
          <div className="mt-12 pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
            <p>{f.bottomBar.copyrightText}</p>
            <div className="flex items-center gap-4 text-[11px]">
              <Link href="/about" className="hover:underline">درباره ما</Link>
              <Link href="/contact" className="hover:underline">تماس با ما</Link>
              <Link href="/track-order" className="hover:underline">رهگیری سفارش</Link>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}

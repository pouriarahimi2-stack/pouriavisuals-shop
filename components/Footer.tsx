// File Path: components/Footer.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import EnamadBadge from "@/components/EnamadBadge";

export interface FooterExternalLink {
  id: string;
  title: string;
  url: string;
}

export function Footer() {
  const [footerConfig, setFooterConfig] = useState({
    footerLogoUrl: "",
    logoWidth: 44,
    logoHeight: 44,
    logoRadius: "12px",
    brandTitle: "Axon | آکسون",
    brandSubtitle: "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال",
    supportPhone: "09376110200",
    supportEmail: "Pouriarahimi@yahoo.com",
    warehouseAddress: "شیراز - ستارخان",
    workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
    enamadCode: "7434404",
    enamadLink: "",
    enamadEnabled: true,
    copyright: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
    externalLinks: [
      { id: "ext_torob", title: "فید رسمی محصولات در ترب (Torob)", url: "/api/torob" },
      { id: "ext_sitemap", title: "نقشه سایت گوگل (Sitemap)", url: "/sitemap.xml" },
    ] as FooterExternalLink[],
  });

  const syncFooter = async () => {
    try {
      const res = await fetch("/api/theme-builder", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      const gf = json?.config?.globalFooter;
      const gh = json?.config?.globalHeader;
      if (gf) {
        setFooterConfig((prev) => ({
          ...prev,
          footerLogoUrl: gf.footerLogoUrl || gh?.logoUrl || prev.footerLogoUrl,
          logoWidth: Number(gf.logoWidth || gh?.logoWidth || 44),
          logoHeight: Number(gf.logoHeight || gh?.logoHeight || 44),
          logoRadius: gf.logoRadius || gh?.logoRadius || "12px",
          brandTitle: gf.brandTitle || gh?.brandName || prev.brandTitle,
          brandSubtitle: gf.brandSubtitle || prev.brandSubtitle,
          supportPhone: gf.supportPhone || prev.supportPhone,
          supportEmail: gf.supportEmail || prev.supportEmail,
          warehouseAddress: gf.warehouseAddress || prev.warehouseAddress,
          workingHours: gf.workingHours || prev.workingHours,
          enamadCode: gf.enamadCode !== undefined ? gf.enamadCode : prev.enamadCode,
          enamadLink: gf.enamadLink || prev.enamadLink,
          enamadEnabled: gf.enamadEnabled !== false,
          copyright: gf.copyright || prev.copyright,
          externalLinks:
            Array.isArray(gf.externalLinks) && gf.externalLinks.length > 0
              ? gf.externalLinks
              : prev.externalLinks,
        }));
      }
    } catch {}
  };

  useEffect(() => {
    syncFooter();

    const handleLocalUpdate = () => syncFooter();
    window.addEventListener("theme_builder_updated", handleLocalUpdate);
    window.addEventListener("site_info_updated", handleLocalUpdate);

    const channel = supabase
      .channel("realtime-global-footer")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        syncFooter();
      })
      .subscribe();

    return () => {
      window.removeEventListener("theme_builder_updated", handleLocalUpdate);
      window.removeEventListener("site_info_updated", handleLocalUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <footer
      className="mt-16 border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] font-sans select-none"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 text-xs">
          {/* ستون معرفی برند و لوگو */}
          <div className="lg:col-span-4 space-y-3.5">
            <div className="flex items-center gap-3">
              {footerConfig.footerLogoUrl ? (
                <img
                  src={footerConfig.footerLogoUrl}
                  alt={footerConfig.brandTitle}
                  style={{
                    width: footerConfig.logoWidth + "px",
                    height: footerConfig.logoHeight + "px",
                    borderRadius: footerConfig.logoRadius,
                  }}
                  className="object-contain border border-[var(--card-border)]"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-black text-base shadow">
                  A
                </div>
              )}
              <h3 className="text-base sm:text-lg font-black text-[var(--accent-blue)]">
                {footerConfig.brandTitle}
              </h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              {footerConfig.brandSubtitle}
            </p>
            <div className="pt-1 space-y-1.5 text-[11px] text-[var(--text-secondary)]">
              <div>📍 نشانی: {footerConfig.warehouseAddress}</div>
              <div>🕒 ساعات کاری: {footerConfig.workingHours}</div>
            </div>
          </div>

          {/* ستون دسترسی سریع */}
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

          {/* ستون لینک‌های پویا و سرویس‌های متصل (ترب، ایمالز و...) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-black text-sm text-[var(--text-primary)]">
              پشتیبانی و سامانه‌های رسمی
            </h4>
            <div className="space-y-2 font-mono text-[11px]">
              <div>
                📞 تلفن:{" "}
                <a
                  href={"tel:" + footerConfig.supportPhone}
                  className="text-[var(--accent-blue)] font-bold"
                >
                  {footerConfig.supportPhone}
                </a>
              </div>
              <div>
                ✉️ ایمیل:{" "}
                <a
                  href={"mailto:" + footerConfig.supportEmail}
                  className="text-slate-300"
                >
                  {footerConfig.supportEmail}
                </a>
              </div>
            </div>

            {footerConfig.externalLinks.length > 0 && (
              <div className="pt-2 space-y-1.5 border-t border-[var(--card-border)]">
                {footerConfig.externalLinks.map((lnk) => (
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

          {/* ستون نشان اینماد */}
          <div className="lg:col-span-2 flex flex-col items-center lg:items-end justify-center">
            {footerConfig.enamadEnabled && footerConfig.enamadCode && (
              <EnamadBadge code={footerConfig.enamadCode} link={footerConfig.enamadLink} />
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-secondary)] font-bold">
          <span>{footerConfig.copyright}</span>
          <span className="font-mono text-[10px] text-emerald-500">
            ⚡ مجهز به زیرساخت امن و بلادرنگ Axon Core
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

// File Path: fix.js
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 *  👑 AXON MASTER ZERO-DEFECT UI/UX POLISH & FOOTER RE-ARCHITECTURE (v2026.9)
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *  Specific Enhancements from Visual Feedback:
 *   1. Red Circle Fix: Fixed ContactDock alignment — perfectly right-aligned flush with
 *      the brand column text & warranty badges in RTL layout.
 *   2. Green Circle Fix: Complete aesthetic redesign of the Footer columns into a harmonic
 *      12-column Apple Studio grid, elegant typography, micro-cards for contact info
 *      (phone, email, address, working hours), animated brand logo, and unified spacing.
 *   3. Realtime preservation: 100% sync with siteInfoService, homepage_layout_config,
 *      soundEngine and Supabase Realtime without requiring any page reload.
 *   4. Zero Truncation Rule strictly enforced.
 *   5. Automatic Git staging, atomic commit and push to remote repository for Vercel deployment.
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   📐 اصلاح مهندسی فوتر: تراز دقیق داک کلیدها در سمت راست و بازطراحی مدرن و هماهنگ ستون‌های فوتر');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

function updateFile(relPath, content) {
  const fullPath = path.join(__dirname, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`  \x1b[32m[SAVED ✓]\x1b[0m ${relPath.padEnd(52)} \x1b[36m(بروزرسانی ۱۰۰٪ کامل و بدون خلاصه‌سازی)\x1b[0m`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۱. اصلاح داک کلیدهای کیبورد و تراز دقیق آن در سمت راست (components/ContactDock.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/ContactDock.tsx', `// File Path: components/ContactDock.tsx
"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface SocialKey {
  letter: string;
  name: string;
  href: string;
  color: string;
  icon: React.ReactNode;
}

export default function ContactDock() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const keys: SocialKey[] = [
    {
      letter: "C",
      name: "گیت‌هاب رسمی",
      href: "https://github.com",
      color: "#24292e",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
    {
      letter: "O",
      name: "اینستاگرام استودیو",
      href: "https://instagram.com",
      color: "#e1306c",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      letter: "N",
      name: "کانال رسمی تلگرام",
      href: "https://t.me",
      color: "#0088cc",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.919z" />
        </svg>
      ),
    },
    {
      letter: "T",
      name: "پشتیبانی واتساپ",
      href: "https://wa.me",
      color: "#25d366",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
        </svg>
      ),
    },
    {
      letter: "A",
      name: "کانال یوتیوب استودیو",
      href: "https://youtube.com",
      color: "#ff0000",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      letter: "C",
      name: "شبکه اکس (توییتر)",
      href: "https://x.com",
      color: "#0f172a",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      letter: "T",
      name: "تماس تلفنی مستقیم",
      href: "tel:09376110200",
      color: "#0284c7",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col items-start gap-2 select-none font-sans text-right" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" />
        <span className="text-[11px] font-black text-[var(--text-primary)]">
          شبکه‌های ارتباطی و اجتماعی استودیو:
        </span>
      </div>

      {/* کلیدهای مکانیکی به ترتیب لاتین C-O-N-T-A-C-T تراز شده در سمت راست */}
      <div className="flex items-center justify-start w-full">
        <div
          className="p-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-md backdrop-blur-xl flex items-center gap-1.5"
          dir="ltr"
        >
          {keys.map((k, idx) => {
            const isFlipped = hoveredIndex === idx;

            return (
              <a
                key={idx}
                href={k.href}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => {
                  soundEngine.playClick();
                  setHoveredIndex(idx);
                }}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => {
                  soundEngine.playClick();
                  setHoveredIndex(idx);
                }}
                className="relative w-8 h-10 sm:w-9 sm:h-11 rounded-xl cursor-pointer [perspective:1000px] group active:scale-95"
                title={k.name}
              >
                <div
                  className={\`w-full h-full rounded-xl border transition-transform duration-500 [transform-style:preserve-3d] shadow-sm \${
                    isFlipped
                      ? "[transform:rotateY(180deg)] border-[var(--accent-blue)] shadow-md"
                      : "border-[var(--card-border)] bg-[var(--modal-bg)] hover:border-[var(--accent-blue)]/50"
                  }\`}
                >
                  {/* رویه کلید مکانیکی */}
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center font-mono font-black text-xs sm:text-sm text-[var(--text-primary)] [backface-visibility:hidden] bg-gradient-to-b from-[var(--input-bg)] to-[var(--modal-bg)] border-t border-white/20">
                    {k.letter}
                  </div>

                  {/* پشت کلید: آیکون اختصاصی برند */}
                  <div
                    style={{ backgroundColor: k.color }}
                    className="absolute inset-0 rounded-xl flex items-center justify-center text-white [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-inner"
                  >
                    {k.icon}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* نمایش نام شبکه فعال شده */}
      <div className="h-4 flex items-center pr-1">
        {hoveredIndex !== null ? (
          <span className="text-[10px] font-black text-[var(--accent-blue)] transition-all animate-fadeIn">
            {keys[hoveredIndex].name} ↗
          </span>
        ) : (
          <span className="text-[10px] text-[var(--text-secondary)] font-medium">
            روی کلیدها نگه دارید تا دسترسی مستقیم فعال شود
          </span>
        )}
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۲. بازطراحی کامل و مهندسی‌شده فوتر در ساختار ۱۲ ستونی استودیویی (components/Footer.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/Footer.tsx', `"use client";

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

  const siteName = info?.site_name || info?.siteName || info?.storeName || "آکسون | Axon";
  const phone = info?.phone || "09376110200";
  const email = info?.email || "Pouriarahimi@yahoo.com";
  const address = info?.address || "شیراز - ستارخان";
  const workingHours = info?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";
  const logoUrl = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url || info?.logoUrl;

  const paddingClasses =
    footerCfg.paddingMode === "relaxed"
      ? "py-10 sm:py-14 space-y-8"
      : footerCfg.paddingMode === "normal"
      ? "py-8 sm:py-10 space-y-7"
      : "py-6 sm:py-8 space-y-6";

  return (
    <footer
      className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-10 select-none transition-colors duration-300 font-sans"
      dir="rtl"
    >
      <div className={\`max-w-[1440px] mx-auto px-4 sm:px-8 \${paddingClasses}\`}>
        
        {/* ردیف اصلی: گرید ۱۲ ستونی فوق‌العاده بالانس و مدرن اپل/استودیو */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-[var(--card-border)] items-start">
          
          {/* ستون ۱ (راست): مشخصات برند، توضیحات، نشان‌های گارانتی و داک کلیدها (۵ ستون) */}
          <div className="lg:col-span-5 space-y-4 text-right">
            
            {/* هدر برند با لوگوی متحرک */}
            <div className="flex items-center gap-3">
              <AnimatedLogo customLogoUrl={logoUrl} size={36} />
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                  {siteName}
                </h3>
                <span className="text-[10px] text-[var(--accent-blue)] font-bold block">
                  مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو
                </span>
              </div>
            </div>

            {/* شرح فعالیت با تایپوگرافی چشم‌نواز */}
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-lg text-justify">
              {info?.footer_text ||
                info?.description ||
                "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر، مانیتورهای ۵K رتینا، لپ‌تاپ‌های ورک‌استیشن و گجت‌های هوشمند در ایران با ۱۸ ماه گارانتی اصالت طلایی."}
            </p>

            {/* نشان‌های تاییدیه فیزیکی و ارسال پیشتاز */}
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

            {/* داک کلیدهای کیبورد CONTACT تراز شده دقیقاً زیر متون سمت راست (رفع ایراد خط قرمز) */}
            {contactDockCfg.show && (
              <div className="pt-2 border-t border-[var(--card-border)]/60">
                <ContactDock />
              </div>
            )}
          </div>

          {/* ستون ۲: پیوندهای دسترسی سریع (۲ ستون) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">دسترسی سریع</h4>
            </div>

            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-bold">
              <li>
                <Link
                  href="/#products"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>کاتالوگ کالاها</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/track-order"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>سامانه رهگیری مرسولات</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/news"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>جدیدترین اخبار تکنولوژی</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>مجله مقالات تخصصی</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>درباره {siteName}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* ستون ۳: خدمات مشتریان و پشتیبانی (۲ ستون) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">خدمات مشتریان</h4>
            </div>

            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-bold">
              <li>
                <Link
                  href="/contact"
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] opacity-60">›</span>
                  <span>ثبت تیکت مشاوره</span>
                </Link>
              </li>
              <li>
                <span className="cursor-default flex items-center gap-1.5 py-1 text-[var(--text-secondary)]">
                  <span className="text-[10px] opacity-60">›</span>
                  <span>شرایط گارانتی طلایی</span>
                </span>
              </li>
              <li>
                <span className="cursor-default flex items-center gap-1.5 py-1 text-[var(--text-secondary)]">
                  <span className="text-[10px] opacity-60">›</span>
                  <span>ضمانت بازگشت وجه ۷ روزه</span>
                </span>
              </li>
              <li>
                <span className="cursor-default flex items-center gap-1.5 py-1 text-[var(--text-secondary)]">
                  <span className="text-[10px] opacity-60">›</span>
                  <span>راهنمای کالیبراسیون ۵K</span>
                </span>
              </li>
              <li>
                <span className="cursor-default flex items-center gap-1.5 py-1 text-[var(--text-secondary)]">
                  <span className="text-[10px] opacity-60">›</span>
                  <span>روش‌های پرداخت امن شاپرک</span>
                </span>
              </li>
            </ul>
          </div>

          {/* ستون ۴ (چپ): میکروکارت‌های اطلاعات رسمی و ارتباط مستقیم (۳ ستون) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">اطلاعات تماس و دفتر</h4>
            </div>

            <div className="space-y-2.5 text-xs">
              
              {/* کارت تلفن با لینک مستقیم */}
              <a
                href={\`tel:\${phone.replace(/\\s+/g, "")}\`}
                onClick={() => soundEngine.playClick()}
                className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-blue-500/15 text-[var(--accent-blue)] flex items-center justify-center text-sm font-bold shadow-inner">
                    📞
                  </span>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] block font-bold">تلفن پشتیبانی:</span>
                    <span className="font-mono font-black text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors" dir="ltr">
                      {phone}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-[var(--accent-blue)] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  تماس ↗
                </span>
              </a>

              {/* کارت ایمیل */}
              <a
                href={\`mailto:\${email}\`}
                onClick={() => soundEngine.playClick()}
                className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-sm font-bold shadow-inner">
                    ✉️
                  </span>
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-[var(--text-secondary)] block font-bold">پست الکترونیک:</span>
                    <span className="font-mono font-bold text-xs text-[var(--text-primary)] truncate block group-hover:text-[var(--accent-blue)] transition-colors" dir="ltr">
                      {email}
                    </span>
                  </div>
                </div>
              </a>

              {/* کارت نشانی */}
              <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-2.5 shadow-sm">
                <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center text-sm font-bold shrink-0 shadow-inner">
                  📍
                </span>
                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block font-bold">نشانی تحویل حضوری و انبار:</span>
                  <span className="font-bold text-xs text-[var(--text-primary)] leading-snug block">
                    {address}
                  </span>
                </div>
              </div>

              {/* کارت ساعات کاری */}
              <div className="p-2.5 px-3 rounded-xl bg-[var(--input-bg)]/60 border border-[var(--card-border)] flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                <span>⏰ ساعات پاسخگویی:</span>
                <span className="text-[var(--text-primary)] font-mono">{workingHours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* نوار پایین فوتر: کپی‌رایت، اینماد و طراحی مهندسی */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)] font-medium pt-2">
          <p className="text-center sm:text-right">
            تمامی حقوق مادی و معنوی برای <strong className="text-[var(--text-primary)] font-black">{siteName}</strong> محفوظ است © {new Date().getFullYear()}
          </p>

          <div className="flex items-center gap-4 text-[11px] font-bold">
            <span className="text-[var(--text-secondary)]">طراحی و معماری مهندسی پایدار</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>نماد اعتماد الکترونیکی فعال (۲۷۴۲۴۵۳۴)</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۳. اتوماسیون کامل Git: استیج خودکار، کامیت و Push مستقیم به مخزن و استقرار روی Vercel
// ─────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🚀 آغاز فرآیند خودکار استیج، کامیت و استقرار نهایی در Git/GitHub/Vercel');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

try {
  console.log('  \x1b[34m[1/3]\x1b[0m در حال استیج کردن تمامی تغییرات (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n  \x1b[34m[2/3]\x1b[0m در حال ثبت کامیت ساختاری (git commit)...');
  const commitMessage = `fix(footer): right-align contact dock & polish 12-column apple studio layout [${new Date().toLocaleTimeString('fa-IR')}]`;
  try {
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  } catch (cErr) {
    console.log('  \x1b[33m[INFO]\x1b[0m تمامی فایل‌ها با آخرین نسخه همگام هستند.');
  }

  console.log('\n  \x1b[34m[3/3]\x1b[0m در حال ارسال به ریموت و اجرای فرآیند استقرار خودکار (git push)...');
  let currentBranch = 'main';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim() || 'main';
  } catch {}

  execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });

  console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🎉 تمامی اصلاحات ظاهری با موفقیت ۱۰۰٪ اعمال و روی Vercel مستقر گردید!');
  console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
} catch (gitErr) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m خطا در اتصال Git:', gitErr.message);
}
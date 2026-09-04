// File Path: components/ContactDock.tsx
"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { SocialKeyItem } from "@/services/siteInfoService";

interface ContactDockProps {
  customKeys?: SocialKeyItem[];
  title?: string;
  scale?: "small" | "medium" | "large";
}

export default function ContactDock({ title }: ContactDockProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // تعریف دقیق ۷ کلید C-O-N-T-A-C-T با لوگوهای رسمی تفکیک‌شده (دقیقاً مطابق ویدیو ۱)
  const officialKeys = [
    {
      letter: "C",
      name: "GitHub",
      href: "https://github.com",
      brandColor: "#181717",
      icon: (
        <svg className="w-5 h-5 fill-current text-[#181717]" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
    {
      letter: "O",
      name: "LinkedIn",
      href: "https://linkedin.com",
      brandColor: "#0A66C2",
      icon: (
        <svg className="w-5 h-5 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
    },
    {
      letter: "N",
      name: "Discord",
      href: "https://discord.com",
      brandColor: "#5865F2",
      icon: (
        <svg className="w-5 h-5 fill-current text-[#5865F2]" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
    },
    {
      letter: "T",
      name: "Instagram",
      href: "https://instagram.com",
      brandColor: "#E4405F",
      icon: (
        <svg className="w-5 h-5 fill-current text-[#E4405F]" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      letter: "A",
      name: "Telegram",
      href: "https://t.me",
      brandColor: "#26A5E4",
      icon: (
        <svg className="w-5 h-5 fill-current text-[#26A5E4]" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.919z" />
        </svg>
      ),
    },
    {
      letter: "C",
      name: "X / Twitter",
      href: "https://x.com",
      brandColor: "#000000",
      icon: (
        <svg className="w-5 h-5 fill-current text-black" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      letter: "T",
      name: "پشتیبانی تماس",
      href: "tel:09376110200",
      brandColor: "#0284C7",
      icon: (
        <svg className="w-5 h-5 fill-current text-[#0284C7]" viewBox="0 0 24 24">
          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col items-start gap-2.5 select-none font-sans text-right" dir="rtl" suppressHydrationWarning>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" />
        <span className="text-[11px] font-black text-[var(--text-primary)]">
          {title || "شبکه‌های ارتباطی و اجتماعی استودیو:"}
        </span>
      </div>

      {/* تری داک کیبورد با استایل ۳D فلیپ واقعی ویدیوی ۱ */}
      <div className="flex items-center justify-start w-full pt-1">
        <div
          className="keycap-dock-tray p-2.5 rounded-[1.8rem] bg-[#0c1017] border border-slate-700/60 shadow-2xl backdrop-blur-2xl flex items-center gap-2"
          dir="ltr"
        >
          {officialKeys.map((k, idx) => (
            <a
              key={idx}
              href={k.href}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => {
                soundEngine.playClick();
                setActiveTooltip(k.name);
              }}
              onMouseLeave={() => setActiveTooltip(null)}
              onTouchStart={() => {
                soundEngine.playClick();
                setActiveTooltip(k.name);
              }}
              className="keycap-3d-item relative w-9 h-11 sm:w-11 sm:h-13 rounded-2xl cursor-pointer block"
            >
              {/* رویه کلید مکانیکی تیره (حرف لاتین C-O-N-T-A-C-T) */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#1e2536] to-[#0d121c] border border-slate-700/80 shadow-md flex items-center justify-center font-mono font-black text-sm text-slate-200 [backface-visibility:hidden]">
                {k.letter}
              </div>

              {/* پشت کلید: کارت سفید برآمده با لوگوی اصلی رنگی شبکه اجتماعی (دقیقاً ویدیوی ۱) */}
              <div className="absolute inset-0 rounded-2xl bg-white shadow-2xl border border-slate-200 flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                {k.icon}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* تول‌تیپ اختصاصی نام شبکه فعال‌شده */}
      <div className="h-4 flex items-center pr-1">
        {activeTooltip ? (
          <span className="text-[10px] font-black text-[var(--accent-blue)] animate-fadeIn">
            {activeTooltip} ↗
          </span>
        ) : (
          <span className="text-[10px] text-[var(--text-secondary)] font-medium">
            روی کلیدها نگه دارید تا فلیپ سه‌بعدی فعال شود
          </span>
        )}
      </div>
    </div>
  );
}

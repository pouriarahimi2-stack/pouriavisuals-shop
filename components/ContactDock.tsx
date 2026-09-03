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

const DEFAULT_KEYS: SocialKeyItem[] = [
  { letter: "C", name: "گیت‌هاب رسمی", href: "https://github.com", color: "#24292e" },
  { letter: "O", name: "اینستاگرام استودیو", href: "https://instagram.com", color: "#e1306c" },
  { letter: "N", name: "کانال تلگرام", href: "https://t.me", color: "#0088cc" },
  { letter: "T", name: "پشتیبانی واتساپ", href: "https://wa.me", color: "#25d366" },
  { letter: "A", name: "کانال یوتیوب", href: "https://youtube.com", color: "#ff0000" },
  { letter: "C", name: "شبکه اکس", href: "https://x.com", color: "#0f172a" },
  { letter: "T", name: "تماس تلفنی مستقیم", href: "tel:09376110200", color: "#0284c7" },
];

export default function ContactDock({ customKeys, title, scale = "medium" }: ContactDockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const keys = customKeys && customKeys.length > 0 ? customKeys : DEFAULT_KEYS;

  const keySizeClass =
    scale === "small"
      ? "w-7 h-9 sm:w-8 sm:h-10 text-xs"
      : scale === "large"
      ? "w-9 h-11 sm:w-11 sm:h-13 text-sm font-black"
      : "w-8 h-10 sm:w-9 sm:h-11 text-xs sm:text-sm";

  return (
    <div className="w-full flex flex-col items-start gap-2 select-none font-sans text-right" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" />
        <span className="text-[11px] font-black text-[var(--text-primary)]">
          {title || "شبکه‌های ارتباطی و اجتماعی استودیو:"}
        </span>
      </div>

      {/* کلیدهای مکانیکی به ترتیب لاتین تراز شده در سمت راست */}
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
                className={`relative rounded-xl cursor-pointer [perspective:1000px] group active:scale-95 transition-all ${keySizeClass}`}
                title={k.name}
              >
                <div
                  className={`w-full h-full rounded-xl border transition-transform duration-500 [transform-style:preserve-3d] shadow-sm ${
                    isFlipped
                      ? "[transform:rotateY(180deg)] border-[var(--accent-blue)] shadow-md"
                      : "border-[var(--card-border)] bg-[var(--modal-bg)] hover:border-[var(--accent-blue)]/50"
                  }`}
                >
                  {/* رویه کلید مکانیکی */}
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center font-mono font-black text-[var(--text-primary)] [backface-visibility:hidden] bg-gradient-to-b from-[var(--input-bg)] to-[var(--modal-bg)] border-t border-white/20">
                    {k.letter}
                  </div>

                  {/* پشت کلید: برچسب نئونی رنگ سازمانی */}
                  <div
                    style={{ backgroundColor: k.color }}
                    className="absolute inset-0 rounded-xl flex items-center justify-center text-white [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-inner font-mono font-black text-[10px]"
                  >
                    ★
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

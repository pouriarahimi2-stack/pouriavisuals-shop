// File Path: components/ContactDock.tsx
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
                  className={`w-full h-full rounded-xl border transition-transform duration-500 [transform-style:preserve-3d] shadow-sm ${
                    isFlipped
                      ? "[transform:rotateY(180deg)] border-[var(--accent-blue)] shadow-md"
                      : "border-[var(--card-border)] bg-[var(--modal-bg)] hover:border-[var(--accent-blue)]/50"
                  }`}
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

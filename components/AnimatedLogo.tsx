"use client";

import React from "react";

interface AnimatedLogoProps {
  customLogoUrl?: string;
  size?: number;
  className?: string;
}

export default function AnimatedLogo({ customLogoUrl, size = 42, className = "" }: AnimatedLogoProps) {
  // در صورتی که کاربر لوگوی متحرک خود (GIF/SVG/APNG/WebP) را از ادمین آپلود کرده باشد:
  if (customLogoUrl && customLogoUrl.trim().length > 5) {
    return (
      <div
        className={"relative flex items-center justify-center shrink-0 overflow-hidden select-none " + className}
        style={{ width: size, height: size }}
      >
        <img
          src={customLogoUrl}
          alt="Axon Logo"
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(2,132,199,0.5)] transition-transform duration-300 group-hover:scale-105"
          style={{ willChange: "transform" }}
        />
      </div>
    );
  }

  // لوگوی اختصاصی آکسون با گوی آبی نئونی تپنده (دقیقاً مطابق طرح ارسالی کاربر)
  return (
    <div
      className={"relative flex items-center justify-center shrink-0 select-none " + className}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="axonBladeDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="axonBladeRight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="axonOrbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="40%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* بازوی چپ حرف A مشکی متالیک */}
        <polygon
          points="50,12 18,78 36,80 50,42"
          fill="url(#axonBladeDark)"
          stroke="#334155"
          strokeWidth="0.75"
        />

        {/* بازوی راست حرف A مشکی متالیک */}
        <polygon
          points="50,12 82,78 64,80 50,42"
          fill="url(#axonBladeRight)"
          stroke="#475569"
          strokeWidth="0.75"
        />

        {/* گوی نوری آبی درخشان و تپنده در مرکز A */}
        <circle cx="50" cy="54" r="9" fill="url(#axonOrbGlow)">
          <animate
            attributeName="r"
            values="7;11;7"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.85;1;0.85"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="50" cy="54" r="4.5" fill="#38bdf8" />
      </svg>
    </div>
  );
}

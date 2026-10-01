// File Path: components/EnamadBadge.tsx
"use client";

import React from "react";

interface EnamadBadgeProps {
  code?: string;
  link?: string;
  className?: string;
}

export default function EnamadBadge({
  code = "7434404",
  link,
  className = "",
}: EnamadBadgeProps) {
  const verifyUrl =
    link && link.trim().startsWith("http")
      ? link.trim()
      : "https://trustseal.enamad.ir/?id=" + encodeURIComponent(code) + "&Code=" + encodeURIComponent(code);

  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      rel="noopener noreferrer"
      href={verifyUrl}
      title="نماد اعتماد الکترونیکی (اینماد) - استعلام رسمی اصالت فروشگاه آکسون"
      className={
        "group inline-flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all shadow-md hover:shadow-lg select-none cursor-pointer " +
        className
      }
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="enamadShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="enamadGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <path
            d="M60 8L18 26V58C18 85.5 35.8 106.8 60 114C84.2 106.8 102 85.5 102 58V26L60 8Z"
            fill="url(#enamadShieldGrad)"
            stroke="url(#enamadGoldGrad)"
            strokeWidth="3.5"
          />
          <path
            d="M60 18L28 32V57C28 78.5 41.6 95.8 60 102C78.4 95.8 92 78.5 92 57V32L60 18Z"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            fill="none"
          />
          <text
            x="60"
            y="62"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="26"
            fontWeight="900"
            fontFamily="monospace, sans-serif"
          >
            eNamad
          </text>
          <circle cx="44" cy="80" r="3.5" fill="#fbbf24" />
          <circle cx="60" cy="80" r="3.5" fill="#fbbf24" />
          <circle cx="76" cy="80" r="3.5" fill="#fbbf24" />
        </svg>
      </div>
      <span className="text-[10px] font-black text-[var(--text-primary)] mt-1 group-hover:text-[var(--accent-blue)] transition">
        نماد اعتماد الکترونیکی
      </span>
      <span className="text-[9px] font-mono text-emerald-500 font-bold">
        کد رهگیری: {code} ✓
      </span>
    </a>
  );
}

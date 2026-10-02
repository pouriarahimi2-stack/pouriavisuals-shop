// File Path: components/EnamadBadge.tsx
"use client";

import React, { useState, useEffect } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // بارگذاری تصویر رسمی اینماد پس از رندر اولیه صفحه تا هرگز باعث چرخیدن طولانی لودینگ تب مرورگر نشود
    const timer = setTimeout(() => {
      setMounted(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const cleanCode = String(code || "7434404").trim();
  const officialVerifyUrl =
    link && link.trim().startsWith("http")
      ? link.trim()
      : "https://trustseal.enamad.ir/?id=" +
        encodeURIComponent(cleanCode) +
        "&Code=" +
        encodeURIComponent(cleanCode);

  const officialLogoUrl =
    "https://trustseal.enamad.ir/logo.aspx?id=" +
    encodeURIComponent(cleanCode) +
    "&Code=" +
    encodeURIComponent(cleanCode);

  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      rel="noopener noreferrer"
      href={officialVerifyUrl}
      title="نماد اعتماد الکترونیکی (اینماد)"
      className={
        "group inline-flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/95 dark:bg-white/90 border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all shadow-md hover:shadow-xl select-none cursor-pointer w-[110px] h-[125px] sm:w-[120px] sm:h-[135px] shrink-0 " +
        className
      }
    >
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        {mounted ? (
          <img
            referrerPolicy="origin"
            id={cleanCode}
            src={officialLogoUrl}
            alt="نماد اعتماد الکترونیکی"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-slate-200 animate-pulse" />
        )}
      </div>
    </a>
  );
}

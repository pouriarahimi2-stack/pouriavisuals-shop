// File Path: components/EnamadBadge.tsx
"use client";

import React, { useState } from "react";

interface EnamadBadgeProps {
  code?: string;
  link?: string;
  className?: string;
}

const OFFICIAL_ENAMAD_LINK =
  "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD";
const OFFICIAL_ENAMAD_LOGO =
  "https://trustseal.enamad.ir/logo.aspx?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD";

export default function EnamadBadge({
  code = "7434404",
  link,
  className = "",
}: EnamadBadgeProps) {
  const [imgError, setImgError] = useState(false);

  const cleanCode = String(code || "7434404").trim();
  const verifyHref =
    link && link.trim().startsWith("http") ? link.trim() : OFFICIAL_ENAMAD_LINK;
  const logoSrc =
    cleanCode === "7434404"
      ? OFFICIAL_ENAMAD_LOGO
      : "https://trustseal.enamad.ir/logo.aspx?id=" +
        encodeURIComponent(cleanCode) +
        "&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD";

  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      rel="noopener noreferrer"
      href={verifyHref}
      title="نماد اعتماد الکترونیکی (اینماد)"
      className={
        "group inline-flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all shadow-md hover:shadow-xl select-none cursor-pointer w-[112px] h-[126px] shrink-0 " +
        className
      }
    >
      {!imgError ? (
        <img
          referrerPolicy="origin"
          id="RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
          src={logoSrc}
          alt="نماد اعتماد الکترونیکی"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center space-y-1 p-1">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-xl shadow">
            ★
          </div>
          <span className="text-[11px] font-black text-slate-900 leading-tight">
            نماد اعتماد الکترونیکی
          </span>
          <span className="text-[9px] font-mono font-bold text-emerald-600">
            کد: {cleanCode} ✓
          </span>
        </div>
      )}
    </a>
  );
}

// File Path: components/EnamadBadge.tsx
"use client";
import React, { useState } from "react";

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
  const [imgFailed, setImgFailed] = useState(false);
  const cleanCode = String(code || "7434404").trim();
  const officialHref =
    link && link.trim().startsWith("http")
      ? link.trim()
      : "https://trustseal.enamad.ir/?id=" +
        encodeURIComponent(cleanCode) +
        "&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD";
  const officialLogoSrc =
    "https://trustseal.enamad.ir/logo.aspx?id=" +
    encodeURIComponent(cleanCode) +
    "&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD";

  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      rel="noopener noreferrer"
      href={officialHref}
      title={"نماد اعتماد الکترونیکی رسمی - کد: " + cleanCode}
      className={
        "inline-flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition shadow-sm w-[115px] h-[128px] shrink-0 select-text group " +
        className
      }
    >
      {!imgFailed ? (
        <img
          referrerPolicy="origin"
          id="RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
          src={officialLogoSrc}
          alt="نماد اعتماد الکترونیکی"
          onError={() => setImgFailed(true)}
          style={{ cursor: "pointer" }}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center space-y-1.5 p-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition">
            🛡️
          </div>
          <span className="text-[11px] font-black text-blue-600 dark:text-sky-400 leading-tight">
            ای‌نماد رسمی
          </span>
          <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            ID: {cleanCode}
          </span>
        </div>
      )}
    </a>
  );
}

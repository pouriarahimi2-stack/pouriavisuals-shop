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
      className={
        "inline-flex items-center justify-center p-2 rounded-2xl bg-white border border-[var(--card-border)] shadow-sm w-[110px] h-[125px] shrink-0 select-none " +
        className
      }
    >
      <img
        referrerPolicy="origin"
        id="RqxtofLwJnKsvqQACWz1mvYVVKykOrtD"
        src={officialLogoSrc}
        alt=""
        style={{ cursor: "pointer" }}
        className="w-full h-full object-contain"
      />
    </a>
  );
}

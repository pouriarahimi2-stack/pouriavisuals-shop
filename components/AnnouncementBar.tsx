"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AnnouncementBar() {
  const pathname = usePathname() || "/";
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [bgColor, setBgColor] = useState("#0284c7");
  const [textColor, setTextColor] = useState("#ffffff");
  const [dismissed, setDismissed] = useState(false);

  const applyFromPayload = (raw: any) => {
    if (!raw || typeof raw !== "object") return;
    const info = raw.data || raw.siteInfo || raw;
    const layoutCfg = info?.homepage_layout_config || {};
    const tbHeader =
      info?.theme_builder_config?.globalHeader ||
      layoutCfg?.theme_builder_config?.globalHeader ||
      {};
    const annCfg = layoutCfg?.header?.announcement || {};

    const isShown =
      tbHeader.announcementEnabled !== undefined
        ? Boolean(tbHeader.announcementEnabled)
        : annCfg.show !== undefined
        ? Boolean(annCfg.show)
        : false;

    const msg = String(
      tbHeader.announcementText ??
        annCfg.text ??
        info?.header_announcement ??
        ""
    ).trim();

    setEnabled(isShown && msg.length > 0);
    setText(msg);
    if (annCfg.backgroundColor) setBgColor(annCfg.backgroundColor);
    if (annCfg.textColor) setTextColor(annCfg.textColor);
  };

  useEffect(() => {
    const onSiteInfoUpdated = (e: any) => {
      if (e?.detail) applyFromPayload(e.detail);
    };
    window.addEventListener("site_info_updated", onSiteInfoUpdated);
    return () => window.removeEventListener("site_info_updated", onSiteInfoUpdated);
  }, []);

  if (pathname.startsWith("/admin") || dismissed || !enabled || !text) {
    return null;
  }

  return (
    <div
      style={{ backgroundColor: bgColor, color: textColor }}
      className="w-full px-4 py-2 text-xs font-black text-center flex items-center justify-center gap-3 relative z-50 shadow-sm select-text font-sans"
      dir="rtl"
    >
      <span className="truncate max-w-4xl">{text}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="w-5 h-5 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-[10px] cursor-pointer shrink-0 transition"
        aria-label="بستن اعلان"
      >
        ✕
      </button>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSiteInfo } from "@/context/SiteInfoContext";

export default function AnnouncementBar() {
  const pathname = usePathname() || "/";
  const { siteInfo } = useSiteInfo();
  const [dismissed, setDismissed] = useState(false);

  const info = siteInfo?.data || siteInfo?.siteInfo || siteInfo || {};
  const layoutCfg = info?.homepage_layout_config || {};
  const tbHeader =
    info?.globalHeader ||
    info?.theme_builder_config?.globalHeader ||
    layoutCfg?.theme_builder_config?.globalHeader ||
    {};
  const annCfg = layoutCfg?.header?.announcement || {};

  const enabled =
    tbHeader.announcementEnabled !== undefined
      ? Boolean(tbHeader.announcementEnabled)
      : annCfg.show !== undefined
      ? Boolean(annCfg.show)
      : false;

  const text = String(
    tbHeader.announcementText ?? annCfg.text ?? info?.header_announcement ?? ""
  ).trim();

  const bgColor = annCfg.backgroundColor || "#0284c7";
  const textColor = annCfg.textColor || "#ffffff";

  useEffect(() => {
    setDismissed(false);
  }, [text, enabled]);

  if (pathname.startsWith("/admin") || dismissed || !enabled || !text) {
    return null;
  }

  return (
    <div
      id="axon-top-announcement-bar"
      style={{ backgroundColor: bgColor, color: textColor }}
      className="sticky top-0 z-50 w-full px-4 py-2 text-xs font-black text-center flex items-center justify-center gap-3 shadow-md select-text font-sans"
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

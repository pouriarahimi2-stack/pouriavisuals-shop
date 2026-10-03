"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSiteInfo } from "@/context/SiteInfoContext";

export default function AnnouncementBar() {
  const pathname = usePathname() || "/";
  const { siteInfo } = useSiteInfo();

  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [bgColor, setBgColor] = useState("#0284c7");
  const [textColor, setTextColor] = useState("#ffffff");
  const [dismissed, setDismissed] = useState(false);

  const extractAndApply = useCallback((raw: any) => {
    if (!raw || typeof raw !== "object") return;
    const info = raw.data || raw.siteInfo || raw.config || raw;
    const layoutCfg = info?.homepage_layout_config || {};
    const tbHeader =
      info?.globalHeader ||
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
  }, []);

  useEffect(() => {
    if (siteInfo && Object.keys(siteInfo).length > 0) {
      extractAndApply(siteInfo);
    }
  }, [siteInfo, extractAndApply]);

  useEffect(() => {
    const onUpdate = (e: any) => {
      setDismissed(false);
      if (e?.detail) {
        extractAndApply(e.detail);
      } else {
        fetch("/api/site-info", { cache: "no-store" })
          .then((r) => r.json())
          .then((j) => extractAndApply(j))
          .catch(() => {});
      }
    };

    window.addEventListener("site_info_updated", onUpdate);
    window.addEventListener("theme_builder_updated", onUpdate);
    return () => {
      window.removeEventListener("site_info_updated", onUpdate);
      window.removeEventListener("theme_builder_updated", onUpdate);
    };
  }, [extractAndApply]);

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

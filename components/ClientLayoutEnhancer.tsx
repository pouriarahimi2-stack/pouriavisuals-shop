// File Path: components/ClientLayoutEnhancer.tsx
"use client";

import { useEffect } from "react";
import { siteInfoService } from "@/services/siteInfoService";

export default function ClientLayoutEnhancer() {
  useEffect(() => {
    // در زمان تایید اینماد عنوان دست‌نخورده باقی می‌ماند
    if (document.title === "27424534") return;

    const applyTitle = (info: any) => {
      if (!info) return;
      if (document.title === "27424534") return;
      const sName = info.storeName || info.site_name || info.siteName || "";
      const sTitle = info.siteTitle || info.site_title || info.tagline || info.description || "";
      if (sName && typeof document !== "undefined") {
        document.title = sTitle ? `${sName} | ${sTitle}` : sName;
      }
    };

    async function init() {
      try {
        const data = await siteInfoService.getSiteInfo();
        applyTitle(data);
      } catch (e) {
        console.warn("Title enhancer fallback:", e);
      }
    }
    init();

    const handleUpdate = (e: any) => {
      if (e.detail) applyTitle(e.detail);
    };
    window.addEventListener("site_info_updated", handleUpdate);

    return () => {
      window.removeEventListener("site_info_updated", handleUpdate);
    };
  }, []);

  return null;
}
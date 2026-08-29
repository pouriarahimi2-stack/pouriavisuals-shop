// File Path: components/ClientLayoutEnhancer.tsx
"use client";

import { useEffect } from "react";
import { siteInfoService } from "@/services/siteInfoService";

export default function ClientLayoutEnhancer() {
  useEffect(() => {
    const applyTitle = (info: any) => {
      if (!info) return;
      const sName = info.storeName || info.site_name || info.siteName || "آکسون";
      const sTitle = info.siteTitle || info.site_title || info.tagline || "مرجع تخصصی مانیتور و استودیو";
      if (typeof document !== "undefined") {
        document.title = `${sName} | ${sTitle}`;
      }
    };

    siteInfoService.getSiteInfo().then(applyTitle);

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
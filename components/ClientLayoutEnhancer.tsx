// components/ClientLayoutEnhancer.tsx
"use client";

import { useEffect } from "react";
import { siteInfoService } from "@/services/siteInfoService";

export default function ClientLayoutEnhancer() {
  useEffect(() => {
    const applyTitle = (info: any) => {
      if (!info) return;
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

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("site_info_sync_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "SYNC_SITE_INFO") {
          applyTitle(event.data.data);
        }
      };
    }

    return () => {
      window.removeEventListener("site_info_updated", handleUpdate);
      if (channel) channel.close();
    };
  }, []);

  return null;
}
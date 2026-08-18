"use client";

import { useEffect } from "react";
import { siteInfoService } from "@/services/siteInfoService";

export default function ClientLayoutEnhancer() {
  useEffect(() => {
    const applyTitle = (info: any) => {
      if (!info) return;
      const sName = info.storeName || info.site_name || "";
      const sTitle = info.siteTitle || info.site_title || info.description || "";
      if (sName) {
        document.title = sTitle ? `${sName} | ${sTitle}` : sName;
      }
    };

    async function init() {
      const data = await siteInfoService.getAll();
      applyTitle(data);
    }
    init();

    // دریافت رویداد درون صفحه
    const handleUpdate = (e: any) => {
      if (e.detail) applyTitle(e.detail);
    };
    window.addEventListener("site_info_updated", handleUpdate);

    // دریافت پیام زنده از تب‌های دیگر (بدون رفرش)
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
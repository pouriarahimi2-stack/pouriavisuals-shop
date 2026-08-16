"use client";

import { useEffect } from "react";
import { siteInfoService } from "@/services/siteInfoService";

export default function ClientLayoutEnhancer() {
  useEffect(() => {
    let currentStoreTitle = "";

    const applyTitle = (title: string) => {
      if (!title || typeof document === "undefined") return;
      currentStoreTitle = title;
      if (document.title !== title) {
        document.title = title;
      }
    };

    // ۱. خواندن سریع از کش لوکال
    try {
      const cached = localStorage.getItem("site_info_db");
      if (cached) {
        const parsed = JSON.parse(cached);
        const t = parsed.storeName || parsed.siteTitle;
        if (t) applyTitle(t);
      }
    } catch {}

    // ۲. همگام‌سازی از سرویس دیتابیس
    siteInfoService.getAll().then((info) => {
      const t = info?.storeName || info?.siteTitle;
      if (t) applyTitle(t);
    });

    // ۳. ناظر هوشمند (MutationObserver) برای جلوگیری از بازنویسی تایتل توسط Next.js
    const titleElement = document.querySelector("title");
    const observer = new MutationObserver(() => {
      if (currentStoreTitle && document.title !== currentStoreTitle) {
        document.title = currentStoreTitle;
      }
    });

    if (titleElement) {
      observer.observe(titleElement, { childList: true, characterData: true, subtree: true });
    }

    // ۴. شنود تغییرات زنده از پنل ادمین
    const handleUpdate = (event: any) => {
      const updated = event.detail;
      const t = updated?.storeName || updated?.siteTitle;
      if (t) applyTitle(t);
    };

    window.addEventListener("site_info_updated", handleUpdate);
    window.addEventListener("storage", () => {
      const cached = localStorage.getItem("site_info_db");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const t = parsed.storeName || parsed.siteTitle;
          if (t) applyTitle(t);
        } catch {}
      }
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("site_info_updated", handleUpdate);
    };
  }, []);

  return null;
}
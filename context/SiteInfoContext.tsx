"use client";
/**
 * SiteInfoContext — یک context واحد برای تمام سایت
 * فقط یک بار fetch می‌شود و به تمام کامپوننت‌ها تزریق می‌شود
 * حل مشکل: لودینگ سنگین در موبایل و sidebar مرورگر
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  siteInfoService,
  SiteInfo,
  DEFAULT_SITE_INFO,
} from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

interface SiteInfoContextValue {
  siteInfo: SiteInfo;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteInfoContext = createContext<SiteInfoContextValue>({
  siteInfo: DEFAULT_SITE_INFO,
  loading: true,
  refresh: async () => {},
});

export function SiteInfoProvider({ children }: { children: React.ReactNode }) {
  // مقدار اولیه از کش localStorage — بدون هیچ loading
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(
    () => siteInfoService.getSiteInfoSync() || DEFAULT_SITE_INFO
  );
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const fresh = await siteInfoService.getSiteInfo();
      if (fresh) setSiteInfo(fresh);
    } catch {}
  }, []);

  useEffect(() => {
    // اولین fetch فقط یک بار
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    setLoading(true);
    siteInfoService.getSiteInfo().then((info) => {
      if (info) setSiteInfo(info);
    }).finally(() => setLoading(false));

    // گوش دادن به رویداد به‌روزرسانی
    const handleUpdate = () => { refresh(); };
    window.addEventListener("site_info_updated", handleUpdate);

    // WebSocket realtime — فقط یک کانال برای کل سایت
    let debounce: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel("global-site-info-watcher")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(refresh, 2000);
      })
      .subscribe();

    return () => {
      clearTimeout(debounce);
      supabase.removeChannel(channel);
      window.removeEventListener("site_info_updated", handleUpdate);
    };
  }, [refresh]);

  return (
    <SiteInfoContext.Provider value={{ siteInfo, loading, refresh }}>
      {children}
    </SiteInfoContext.Provider>
  );
}

export function useSiteInfo() {
  return useContext(SiteInfoContext);
}

export default SiteInfoContext;

"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface SiteInfoContextValue {
  siteInfo: any;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SiteInfoContextValue>({
  siteInfo: {}, loading: true, refresh: async () => {},
});

export function SiteInfoProvider({ children }: { children: React.ReactNode }) {
  const [siteInfo, setSiteInfo] = useState<any>({});
  const [loading,  setLoading]  = useState(true);
  const fetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/site-info", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) setSiteInfo(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    refresh().finally(() => setLoading(false));

    // گوش دادن به تغییرات realtime
    let debounce: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel("site-info-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(refresh, 1000);
      })
      .subscribe();

    // گوش دادن به event دستی
    const handleUpdate = () => refresh();
    window.addEventListener("site_info_updated", handleUpdate);
    window.addEventListener("site_styles_updated", handleUpdate);

    return () => {
      clearTimeout(debounce);
      supabase.removeChannel(channel);
      window.removeEventListener("site_info_updated", handleUpdate);
      window.removeEventListener("site_styles_updated", handleUpdate);
    };
  }, [refresh]);

  return <Ctx.Provider value={{ siteInfo, loading, refresh }}>{children}</Ctx.Provider>;
}

export function useSiteInfo() { return useContext(Ctx); }
export default Ctx;

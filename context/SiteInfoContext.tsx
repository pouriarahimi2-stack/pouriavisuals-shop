"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface SiteInfoContextValue {
  siteInfo: any;
  loading:  boolean;
  refresh:  () => Promise<void>;
}

const Ctx = createContext<SiteInfoContextValue>({
  siteInfo: {}, loading: true, refresh: async () => {},
});

// شمارنده برای channel name یکتا
let channelCounter = 0;

export function SiteInfoProvider({ children }: { children: React.ReactNode }) {
  const [siteInfo, setSiteInfo] = useState<any>({});
  const [loading,  setLoading]  = useState(true);
  const mountedRef  = useRef(false);
  const channelRef  = useRef<any>(null);

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/site-info", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) setSiteInfo(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    // جلوگیری از double-mount در React StrictMode
    if (mountedRef.current) return;
    mountedRef.current = true;

    setLoading(true);
    refresh().finally(() => setLoading(false));

    // channel با نام یکتا برای جلوگیری از تداخل
    channelCounter++;
    const chName = "site-info-ch-" + channelCounter + "-" + Date.now();

    let debounce: ReturnType<typeof setTimeout>;

    const channel = supabase
      .channel(chName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          clearTimeout(debounce);
          debounce = setTimeout(refresh, 1500);
        }
      )
      .subscribe((status: string) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[SiteInfo] channel error, retrying...");
        }
      });

    channelRef.current = channel;

    const handleUpdate = () => refresh();
    window.addEventListener("site_info_updated",   handleUpdate);
    window.addEventListener("site_styles_updated", handleUpdate);

    return () => {
      clearTimeout(debounce);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      window.removeEventListener("site_info_updated",   handleUpdate);
      window.removeEventListener("site_styles_updated", handleUpdate);
    };
  }, [refresh]);

  return <Ctx.Provider value={{ siteInfo, loading, refresh }}>{children}</Ctx.Provider>;
}

export function useSiteInfo() { return useContext(Ctx); }
export default Ctx;

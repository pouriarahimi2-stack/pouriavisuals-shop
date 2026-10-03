"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { applyFaviconToDOM } from "@/lib/realtimeSync";

interface SiteInfoContextValue {
  siteInfo: any;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SiteInfoContextValue>({
  siteInfo: {},
  loading: true,
  refresh: async () => {},
});

let channelCounter = 0;

export function SiteInfoProvider({ children }: { children: React.ReactNode }) {
  const [siteInfo, setSiteInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);
  const channelRef = useRef<any>(null);
  const isFetchingRef = useRef(false);

  const applyIncomingData = useCallback((payload: any) => {
    if (!payload || typeof payload !== "object") return;
    setSiteInfo(payload);
    const fav =
      payload?.theme_builder_config?.globalHeader?.faviconUrl ||
      payload?.homepage_layout_config?.theme_builder_config?.globalHeader?.faviconUrl ||
      payload?.favicon_url;
    if (fav) applyFaviconToDOM(String(fav));
  }, []);

  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch("/api/site-info?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      const payload = json.data || json.siteInfo || json;
      applyIncomingData(payload);
    } catch {
    } finally {
      isFetchingRef.current = false;
    }
  }, [applyIncomingData]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    setLoading(true);
    refresh().finally(() => setLoading(false));

    channelCounter++;
    const chName = "site-info-ch-" + channelCounter + "-" + Date.now();
    let debounce: ReturnType<typeof setTimeout>;

    const channel = supabase
      .channel(chName)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(refresh, 500);
      })
      .subscribe();

    channelRef.current = channel;

    const onStudioSaved = (e: any) => {
      if (e?.detail && typeof e.detail === "object" && e.detail.homepage_layout_config) {
        applyIncomingData(e.detail);
      }
      refresh();
    };

    window.addEventListener("theme_builder_updated", onStudioSaved);
    window.addEventListener("menus_updated", refresh);

    return () => {
      clearTimeout(debounce);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      window.removeEventListener("theme_builder_updated", onStudioSaved);
      window.removeEventListener("menus_updated", refresh);
    };
  }, [refresh, applyIncomingData]);

  return <Ctx.Provider value={{ siteInfo, loading, refresh }}>{children}</Ctx.Provider>;
}

export function useSiteInfo() {
  return useContext(Ctx);
}
export default Ctx;

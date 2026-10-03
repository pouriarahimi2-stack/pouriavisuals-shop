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

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/site-info?t=" + Date.now(), { cache: "no-store" });
      const json = await res.json();
      const payload = json.data || json.siteInfo || json;
      if (payload && typeof payload === "object") {
        setSiteInfo(payload);
        const fav =
          payload?.theme_builder_config?.globalHeader?.faviconUrl ||
          payload?.homepage_layout_config?.theme_builder_config?.globalHeader?.faviconUrl ||
          payload?.favicon_url;
        if (fav) applyFaviconToDOM(String(fav));
      }
    } catch {}
  }, []);

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
        debounce = setTimeout(refresh, 300);
      })
      .subscribe();

    channelRef.current = channel;

    const handleUpdate = () => refresh();
    window.addEventListener("site_info_updated", handleUpdate);
    window.addEventListener("theme_builder_updated", handleUpdate);
    window.addEventListener("site_styles_updated", handleUpdate);

    return () => {
      clearTimeout(debounce);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      window.removeEventListener("site_info_updated", handleUpdate);
      window.removeEventListener("theme_builder_updated", handleUpdate);
      window.removeEventListener("site_styles_updated", handleUpdate);
    };
  }, [refresh]);

  return <Ctx.Provider value={{ siteInfo, loading, refresh }}>{children}</Ctx.Provider>;
}

export function useSiteInfo() {
  return useContext(Ctx);
}
export default Ctx;

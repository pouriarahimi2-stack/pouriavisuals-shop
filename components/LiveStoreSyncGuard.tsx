"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LiveStoreSyncGuard() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const applyLiveStyles = useCallback((styleRow: any) => {
    if (!styleRow || typeof styleRow !== "object" || typeof document === "undefined") return;
    const root = document.documentElement;
    if (styleRow.primary_color) {
      root.style.setProperty("--accent-blue", String(styleRow.primary_color));
    }
    if (styleRow.secondary_color) {
      root.style.setProperty("--accent-purple", String(styleRow.secondary_color));
    }
    if (styleRow.border_radius) {
      root.style.setProperty("--border-radius-card", String(styleRow.border_radius));
    }
    if (styleRow.font_family) {
      root.style.setProperty(
        "--font-primary",
        JSON.stringify(styleRow.font_family) + ", Vazirmatn, sans-serif"
      );
    }
  }, []);

  const applyLiveSiteConfig = useCallback(
    (payload: any) => {
      if (!payload || typeof payload !== "object") return;

      const layoutCfg =
        payload.homepage_layout_config ||
        payload.siteInfo?.homepage_layout_config ||
        payload.data?.homepage_layout_config ||
        {};

      const sys =
        payload.settings ||
        payload.system_settings ||
        layoutCfg.system_settings ||
        payload.siteInfo?.settings ||
        {};

      const isMaintenance =
        Boolean(sys.maintenanceMode) ||
        (payload.maintenance_mode &&
          payload.maintenance_mode !== "none" &&
          payload.maintenance_mode !== "false");

      const isNoIndex =
        Boolean(sys.noIndex ?? sys.disallowRobots) ||
        payload.allow_google_index === false;

      if (typeof document !== "undefined") {
        let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
        if (isNoIndex) {
          if (!robotsMeta) {
            robotsMeta = document.createElement("meta");
            robotsMeta.name = "robots";
            document.head.appendChild(robotsMeta);
          }
          robotsMeta.content = "noindex, nofollow";
        } else if (robotsMeta && robotsMeta.content === "noindex, nofollow") {
          robotsMeta.content = "index, follow";
        }

        const customVars =
          layoutCfg.cssVariables ||
          layoutCfg.theme_variables ||
          layoutCfg.styles?.variables;

        if (customVars && typeof customVars === "object") {
          const root = document.documentElement;
          Object.entries(customVars).forEach(([k, v]) => {
            if (typeof v === "string" && k.startsWith("--")) {
              root.style.setProperty(k, v);
            }
          });
        }

        window.dispatchEvent(new CustomEvent("site_info_updated", { detail: payload }));
      }

      const isAdminRoute =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/login");
      const isMaintenancePage = pathname.startsWith("/maintenance");

      if (isMaintenance && !isAdminRoute && !isMaintenancePage) {
        router.replace("/maintenance");
      } else if (!isMaintenance && isMaintenancePage) {
        router.replace("/");
      }
    },
    [pathname, router]
  );

  const fetchAndSyncAll = useCallback(async () => {
    try {
      const [infoRes, styleRes] = await Promise.allSettled([
        fetch("/api/site-info", { cache: "no-store" }),
        fetch("/api/styles", { cache: "no-store" }),
      ]);

      if (infoRes.status === "fulfilled" && infoRes.value.ok) {
        const infoJson = await infoRes.value.json();
        applyLiveSiteConfig(infoJson);
      }
      if (styleRes.status === "fulfilled" && styleRes.value.ok) {
        const styleJson = await styleRes.value.json();
        if (styleJson?.data) applyLiveStyles(styleJson.data);
      }
    } catch {}
  }, [applyLiveSiteConfig, applyLiveStyles]);

  useEffect(() => {
    fetchAndSyncAll();

    const chInfo = supabase
      .channel("global-store-live-sync-info")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        (payload) => {
          if (payload?.new) applyLiveSiteConfig(payload.new);
          fetchAndSyncAll();
        }
      )
      .subscribe();

    const chStyles = supabase
      .channel("global-store-live-sync-styles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_styles" },
        (payload) => {
          if (payload?.new) applyLiveStyles(payload.new);
          fetchAndSyncAll();
        }
      )
      .subscribe();

    const onFocus = () => fetchAndSyncAll();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(chInfo);
      supabase.removeChannel(chStyles);
    };
  }, [fetchAndSyncAll, applyLiveSiteConfig, applyLiveStyles]);

  return null;
}

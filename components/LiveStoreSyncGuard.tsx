"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSiteInfo } from "@/context/SiteInfoContext";
import { applyFaviconToDOM } from "@/lib/realtimeSync";

export default function LiveStoreSyncGuard() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { siteInfo } = useSiteInfo();

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
    if (styleRow.custom_css !== undefined) {
      let styleTag = document.getElementById("axon-live-custom-css") as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "axon-live-custom-css";
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = String(styleRow.custom_css || "");
    }
  }, []);

  useEffect(() => {
    if (!siteInfo || typeof siteInfo !== "object" || Object.keys(siteInfo).length === 0) return;

    const layoutCfg =
      siteInfo.homepage_layout_config ||
      siteInfo.siteInfo?.homepage_layout_config ||
      siteInfo.data?.homepage_layout_config ||
      {};

    const sys =
      siteInfo.settings ||
      siteInfo.system_settings ||
      layoutCfg.system_settings ||
      siteInfo.siteInfo?.settings ||
      {};

    const isMaintenance =
      Boolean(sys.maintenanceMode) ||
      (siteInfo.maintenance_mode &&
        siteInfo.maintenance_mode !== "none" &&
        siteInfo.maintenance_mode !== "false");

    const isNoIndex =
      Boolean(sys.noIndex ?? sys.disallowRobots) ||
      siteInfo.allow_google_index === false;

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

      const fav =
        layoutCfg?.theme_builder_config?.globalHeader?.faviconUrl ||
        siteInfo.favicon_url;
      if (fav) applyFaviconToDOM(String(fav));
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
  }, [siteInfo, pathname, router]);

  useEffect(() => {
    const chStyles = supabase
      .channel("global-store-live-styles-single")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_styles" },
        (payload) => {
          if (payload?.new) {
            applyLiveStyles(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chStyles);
    };
  }, [applyLiveStyles]);

  return null;
}

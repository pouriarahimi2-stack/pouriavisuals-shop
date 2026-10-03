"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LiveStoreSyncGuard() {
  const pathname = usePathname() || "/";
  const router = useRouter();

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

      const isMaintenance = Boolean(sys.maintenanceMode);
      const isNoIndex = Boolean(sys.noIndex ?? sys.disallowRobots);

      if (typeof document !== "undefined") {
        // ۱. اعمال زنده تگ NoIndex / Index گوگل
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

        // ۲. اعمال زنده متغیرهای استایل و رنگ‌بندی استودیوی ظاهر در موبایل، تبلت و دسکتاپ
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

        window.dispatchEvent(
          new CustomEvent("axon-site-info-updated", { detail: payload })
        );
      }

      // ۳. هدایت زنده بازدیدکنندگان در صورت فعال شدن حالت تعمیرات (پنل ادمین همیشه باز می‌ماند)
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

  const fetchAndSync = useCallback(async () => {
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      applyLiveSiteConfig(json);
    } catch {}
  }, [applyLiveSiteConfig]);

  useEffect(() => {
    fetchAndSync();

    const channel = supabase
      .channel("global-store-live-sync-v2")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        (payload) => {
          if (payload?.new) {
            applyLiveSiteConfig(payload.new);
          }
          fetchAndSync();
        }
      )
      .subscribe();

    const onFocus = () => fetchAndSync();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, [fetchAndSync, applyLiveSiteConfig]);

  return null;
}

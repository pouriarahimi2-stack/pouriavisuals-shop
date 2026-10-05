"use client";
// File Path: components/GlobalSiteBackground.tsx
import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface GlobalBackgroundConfig {
  enabled: boolean;
  mediaUrl: string;
  mediaType: "auto" | "image" | "gif" | "svg" | "video" | "preset_svg";
  presetId?: string;
  opacity: number;
  blurPx: number;
  overlayOpacity: number;
  sizeMode: "cover" | "contain" | "repeat";
  applyToAdmin: boolean;
  footerScale?: number; // 60 to 100 (%)
  footerBgPaddingY?: number; // 4 to 64 (px)
  footerInnerGap?: number; // 4 to 48 (px)
  footerPadding?: "ultra_compact" | "compact" | "normal";
}

const DEFAULT_BG_CONFIG: GlobalBackgroundConfig = {
  enabled: false,
  mediaUrl: "",
  mediaType: "auto",
  presetId: "cyber_grid",
  opacity: 35,
  blurPx: 0,
  overlayOpacity: 40,
  sizeMode: "cover",
  applyToAdmin: false,
  footerScale: 80,
  footerBgPaddingY: 16,
  footerInnerGap: 12,
  footerPadding: "compact",
};

export const PRESET_ANIMATED_SVGS: Record<string, { label: string; dataUri: string }> = {
  cyber_grid: {
    label: "🌐 شبکه نئونی سایبرپانک (Cyber Grid SVG)",
    dataUri:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.08"/>
          </linearGradient>
        </defs>
        <path d="M 120 0 L 0 0 0 120" fill="none" stroke="url(#g)" stroke-width="1"/>
        <circle cx="60" cy="60" r="2" fill="#38bdf8" opacity="0.45">
          <animate attributeName="opacity" values="0.15;0.75;0.15" dur="4s" repeatCount="indefinite"/>
        </circle>
      </svg>`),
  },
  aurora_waves: {
    label: "🌌 امواج شفق قطبی متحرک (Aurora Waves SVG)",
    dataUri:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="none">
        <defs>
          <radialGradient id="a1" cx="20%" cy="20%" r="60%">
            <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="a2" cx="80%" cy="70%" r="60%">
            <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.32"/>
            <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="200" cy="150" r="350" fill="url(#a1)">
          <animate attributeName="cx" values="180;620;180" dur="18s" repeatCount="indefinite"/>
        </circle>
        <circle cx="650" cy="420" r="380" fill="url(#a2)">
          <animate attributeName="cy" values="420;160;420" dur="22s" repeatCount="indefinite"/>
        </circle>
      </svg>`),
  },
  tech_circuit: {
    label: "⚡ مدارهای نوری پردازنده (Tech Circuit SVG)",
    dataUri:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <g fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.22">
          <path d="M10 80 H60 L80 60 H150"/>
          <path d="M0 30 H40 L60 50 V120 L80 140 H160"/>
        </g>
        <circle cx="80" cy="60" r="2.5" fill="#34d399">
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="60" cy="120" r="2.5" fill="#38bdf8">
          <animate attributeName="opacity" values="0.8;0.1;0.8" dur="3.5s" repeatCount="indefinite"/>
        </circle>
      </svg>`),
  },
  starfield_dots: {
    label: "✨ کهکشان ستاره‌ای متحرک (Starfield SVG)",
    dataUri:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <circle cx="30" cy="40" r="1.5" fill="#38bdf8">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="150" cy="80" r="2" fill="#818cf8">
          <animate attributeName="opacity" values="0.9;0.2;0.9" dur="4.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="90" cy="160" r="1.5" fill="#34d399">
          <animate attributeName="opacity" values="0.3;0.95;0.3" dur="5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="170" cy="175" r="1.2" fill="#f472b6">
          <animate attributeName="opacity" values="0.1;0.8;0.1" dur="3.8s" repeatCount="indefinite"/>
        </circle>
      </svg>`),
  },
};

export default function GlobalSiteBackground() {
  const pathname = usePathname() || "";
  const [config, setConfig] = useState<GlobalBackgroundConfig>(DEFAULT_BG_CONFIG);
  const [hydrated, setHydrated] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  const fetchBgConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/theme-builder?t=" + Date.now(), {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      const gb = json?.config?.globalBackground;
      if (gb && typeof gb === "object") {
        setConfig({
          ...DEFAULT_BG_CONFIG,
          ...gb,
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setHydrated(true);
      fetchBgConfig();
    });

    const onVisibility = () => {
      setTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onUpdate = () => fetchBgConfig();
    window.addEventListener("theme_builder_updated", onUpdate);
    window.addEventListener("site_info_updated", onUpdate);

    // پیش‌نمایش زنده هنگام حرکت اسلایدرها در پنل ادمین
    const onLivePreview = (e: any) => {
      if (e?.detail && typeof e.detail === "object") {
        setConfig((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener("axon_footer_live_preview", onLivePreview);

    const ch = supabase
      .channel("axon-global-bg-sync-" + Math.random().toString(36).slice(2, 7))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          fetchBgConfig();
        }
      )
      .subscribe();

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("theme_builder_updated", onUpdate);
      window.removeEventListener("site_info_updated", onUpdate);
      window.removeEventListener("axon_footer_live_preview", onLivePreview);
      supabase.removeChannel(ch);
    };
  }, [fetchBgConfig]);

  const isAdminRoute = pathname.startsWith("/admin");
  const isActiveHere =
    hydrated && config.enabled && (!isAdminRoute || config.applyToAdmin);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isActiveHere) {
      root.setAttribute("data-has-custom-bg", "true");
    } else {
      root.removeAttribute("data-has-custom-bg");
    }
  }, [isActiveHere]);

  // محاسبه دقیق مقیاس درجا (بدون جمع شدن عرض فوتر به وسط) و ارتفاع پس‌زمینه فوتر
  const fScale = Math.max(60, Math.min(100, Number(config.footerScale ?? 80))) / 100;
  const bgPadY = Math.max(4, Math.min(80, Number(config.footerBgPaddingY ?? 16)));
  const innerGap = Math.max(4, Math.min(60, Number(config.footerInnerGap ?? 12)));
  const compensatedMaxWidthRem = (80 / fScale).toFixed(3);

  const resolvedUrl =
    config.mediaType === "preset_svg"
      ? PRESET_ANIMATED_SVGS[config.presetId || "cyber_grid"]?.dataUri ||
        PRESET_ANIMATED_SVGS.cyber_grid.dataUri
      : config.mediaUrl;

  const lowerUrl = String(resolvedUrl || "").toLowerCase();
  const isVideo =
    config.mediaType === "video" ||
    lowerUrl.endsWith(".mp4") ||
    lowerUrl.endsWith(".webm") ||
    lowerUrl.startsWith("data:video/");

  const isPatternRepeat =
    config.sizeMode === "repeat" ||
    (config.mediaType === "preset_svg" && config.presetId !== "aurora_waves");

  const safeOpacity = Math.max(0.05, Math.min(1, Number(config.opacity ?? 35) / 100));
  const safeOverlay = Math.max(0, Math.min(0.92, Number(config.overlayOpacity ?? 40) / 100));
  const safeBlur = Math.max(0, Math.min(24, Number(config.blurPx ?? 0)));

  return (
    <>
      {/* کنترل مهندسی ارتفاع پس‌زمینه فوتر و کوچک‌سازی درجا (In-Place Scaling) بدون به هم خوردن چیدمان افقی */}
      {hydrated && !isAdminRoute && (
        <style>{`
          footer {
            padding-top: ${bgPadY}px !important;
            padding-bottom: ${bgPadY}px !important;
            min-height: 0 !important;
            height: auto !important;
          }
          footer > div {
            zoom: ${fScale};
            width: 100% !important;
            max-width: ${compensatedMaxWidthRem}rem !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          footer > div > div:first-child {
            margin-bottom: ${innerGap}px !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            align-items: center !important;
          }
          footer > div > div:last-child,
          footer .border-t {
            margin-top: ${innerGap}px !important;
            padding-top: ${Math.max(6, Math.round(innerGap * 0.75))}px !important;
            padding-bottom: 0 !important;
          }
        `}</style>
      )}

      {isActiveHere && resolvedUrl && (
        <>
          <style>{`
            html[data-has-custom-bg="true"] body,
            html[data-has-custom-bg="true"] main,
            html[data-has-custom-bg="true"] .min-h-screen {
              background-color: transparent !important;
            }
          `}</style>

          <div
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none overflow-hidden select-none"
            style={{
              zIndex: 0,
              contain: "strict",
              willChange: "transform",
              transform: "translateZ(0)",
            }}
          >
            {isVideo ? (
              tabVisible && (
                <video
                  src={resolvedUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                  style={{
                    opacity: safeOpacity,
                    filter: safeBlur > 0 ? `blur(${safeBlur}px)` : undefined,
                  }}
                />
              )
            ) : isPatternRepeat ? (
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url("${resolvedUrl}")`,
                  backgroundRepeat: "repeat",
                  backgroundPosition: "center center",
                  opacity: safeOpacity,
                  filter: safeBlur > 0 ? `blur(${safeBlur}px)` : undefined,
                }}
              />
            ) : (
              <img
                src={resolvedUrl}
                alt=""
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className={
                  "w-full h-full " +
                  (config.sizeMode === "contain" ? "object-contain" : "object-cover")
                }
                style={{
                  opacity: safeOpacity,
                  filter: safeBlur > 0 ? `blur(${safeBlur}px)` : undefined,
                }}
              />
            )}

            {safeOverlay > 0 && (
              <div
                className="absolute inset-0 bg-[var(--bg-primary)] transition-opacity duration-300"
                style={{ opacity: safeOverlay }}
              />
            )}
          </div>
        </>
      )}
    </>
  );
}

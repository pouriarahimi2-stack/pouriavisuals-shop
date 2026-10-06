"use client";
// File Path: components/GlobalSiteBackground.tsx
import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import LivePageSectionsRenderer from "@/components/LivePageSectionsRenderer";

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

  footerScale?: number;
  footerBgPaddingY?: number;
  footerInnerGap?: number;
  footerPadding?: "ultra_compact" | "compact" | "normal";

  liquidGlassEnabled?: boolean;
  forceDarkGlassMode?: boolean;
  glassBlurPx?: number;
  glassSurfaceOpacity?: number;
  glassBorderGlow?: number;

  chatButtonIconOnly?: boolean;
  chatButtonSide?: "left" | "right";
  chatButtonBottomPx?: number;
  fixMobileHeaderBrand?: boolean;
  mobileHeaderFontSizePx?: number;
  showMobileBottomNav?: boolean;

  showShowcaseHeader?: boolean;
  showCatalogHeader?: boolean;
  showCardBrand?: boolean;
  showCardCategory?: boolean;
  showCardSubtitle?: boolean;
  showCardStockText?: boolean;
  showCardCartCountText?: boolean;
}

export const DEFAULT_BG_CONFIG: GlobalBackgroundConfig = {
  enabled: false,
  mediaUrl: "",
  mediaType: "auto",
  presetId: "cyber_grid",
  opacity: 55,
  blurPx: 0,
  overlayOpacity: 20,
  sizeMode: "cover",
  applyToAdmin: false,

  footerScale: 80,
  footerBgPaddingY: 16,
  footerInnerGap: 12,
  footerPadding: "compact",

  liquidGlassEnabled: true,
  forceDarkGlassMode: false,
  glassBlurPx: 24,
  glassSurfaceOpacity: 64,
  glassBorderGlow: 42,

  chatButtonIconOnly: true,
  chatButtonSide: "left",
  chatButtonBottomPx: 80,
  fixMobileHeaderBrand: true,
  mobileHeaderFontSizePx: 14,
  showMobileBottomNav: true,

  showShowcaseHeader: false,
  showCatalogHeader: false,
  showCardBrand: false,
  showCardCategory: false,
  showCardSubtitle: false,
  showCardStockText: false,
  showCardCartCountText: false,
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

function toIranSafeUrl(rawUrl: string): string {
  const u = String(rawUrl || "").trim();
  if (!u) return "";
  if (u.startsWith("data:") || u.startsWith("/")) return u;
  if (u.includes(".supabase.co/")) {
    return "/api/media-proxy?url=" + encodeURIComponent(u);
  }
  return u;
}

export default function GlobalSiteBackground() {
  const pathname = usePathname() || "";
  const [config, setConfig] = useState<GlobalBackgroundConfig>(DEFAULT_BG_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  const fetchBgConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/theme-builder", { cache: "no-store" });
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
    setHydrated(true);
    fetchBgConfig();

    const onUpdate = () => fetchBgConfig();
    window.addEventListener("theme_builder_updated", onUpdate);
    window.addEventListener("site_info_updated", onUpdate);

    const onLivePreview = (e: any) => {
      if (e?.detail && typeof e.detail === "object") {
        setConfig((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener("axon_footer_live_preview", onLivePreview);

    return () => {
      window.removeEventListener("theme_builder_updated", onUpdate);
      window.removeEventListener("site_info_updated", onUpdate);
      window.removeEventListener("axon_footer_live_preview", onLivePreview);
    };
  }, [fetchBgConfig]);

  const isAdminRoute = pathname.startsWith("/admin");
  const isActiveHere =
    hydrated && config.enabled && (!isAdminRoute || config.applyToAdmin);

  useEffect(() => {
    if (typeof document === "undefined" || isAdminRoute) return;
    const root = document.documentElement;
    if (isActiveHere) {
      root.setAttribute("data-has-custom-bg", "true");
    } else {
      root.removeAttribute("data-has-custom-bg");
    }

    const markLeafNodesSafely = () => {
      if (window.location.pathname.startsWith("/admin")) return;

      const isMobile = window.innerWidth < 768;
      document.querySelectorAll("header span, header a, header h1").forEach((node) => {
        const el = node as HTMLElement;
        if (el.children.length > 0) return;
        const orig = el.getAttribute("data-axon-orig-brand") || el.textContent || "";
        if (orig.includes("|") && (orig.includes("آکسون") || orig.toLowerCase().includes("axon"))) {
          if (!el.getAttribute("data-axon-orig-brand")) {
            el.setAttribute("data-axon-orig-brand", orig);
          }
          el.textContent =
            config.fixMobileHeaderBrand !== false && isMobile
              ? orig.split("|")[0].trim()
              : orig;
        }
      });

      document.querySelectorAll("button").forEach((btn) => {
        const txt = (btn.textContent || "").trim();
        if (txt.includes("گفتگوی زنده با پشتیبانی") || txt.includes("LIVE SUPPORT")) {
          btn.setAttribute("data-axon-livechat-fab", "true");
        }
      });

      document.querySelectorAll("span, p, h2").forEach((node) => {
        const el = node as HTMLElement;
        if (el.children.length > 0) return;
        const txt = (el.textContent || "").trim();
        if (!txt || txt.length > 110) return;

        if (
          txt === "نمایشگاه سه‌بعدی تجهیزات پرچمدار" ||
          txt === "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی" ||
          txt.startsWith("پیمایش با سوایپ لمسی")
        ) {
          el.setAttribute("data-axon-leaf-role", "showcase_header");
        } else if (
          txt === "کاتالوگ تجهیزات تخصصی و کالای دیجیتال" ||
          txt === "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند"
        ) {
          el.setAttribute("data-axon-leaf-role", "catalog_header");
        } else if (txt.toUpperCase() === "APPLE" || txt === "اپل") {
          el.setAttribute("data-axon-leaf-role", "card_brand");
        } else if (txt === "موجود ✓" || txt === "✓ موجود") {
          el.setAttribute("data-axon-leaf-role", "card_stock");
        } else if (txt.endsWith("عدد در سبد شما") && txt.length < 28) {
          el.setAttribute("data-axon-leaf-role", "card_cartcount");
        }
      });
    };

    markLeafNodesSafely();
    const t1 = setTimeout(markLeafNodesSafely, 400);
    const t2 = setTimeout(markLeafNodesSafely, 1500);
    window.addEventListener("resize", markLeafNodesSafely);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", markLeafNodesSafely);
    };
  }, [pathname, isActiveHere, isAdminRoute, config.fixMobileHeaderBrand]);

  const fScale = Math.max(60, Math.min(100, Number(config.footerScale ?? 80))) / 100;
  const bgPadY = Math.max(4, Math.min(80, Number(config.footerBgPaddingY ?? 16)));
  const innerGap = Math.max(4, Math.min(60, Number(config.footerInnerGap ?? 12)));
  const compensatedMaxWidthRem = (80 / fScale).toFixed(3);

  const glassEnabled = config.liquidGlassEnabled !== false;
  const gBlur = Math.max(8, Math.min(40, Number(config.glassBlurPx ?? 24)));
  const gAlphaDark = Math.max(0.35, Math.min(0.92, Number(config.glassSurfaceOpacity ?? 64) / 100));
  const gAlphaLight = Math.max(0.55, Math.min(0.94, Number(config.glassSurfaceOpacity ?? 64) / 100));
  const gBorderAlpha = Math.max(0.18, Math.min(0.85, Number(config.glassBorderGlow ?? 42) / 100));

  const chatSide = config.chatButtonSide === "right" ? "right" : "left";

  const rawResolved =
    config.mediaType === "preset_svg"
      ? PRESET_ANIMATED_SVGS[config.presetId || "cyber_grid"]?.dataUri ||
        PRESET_ANIMATED_SVGS.cyber_grid.dataUri
      : config.mediaUrl;

  const resolvedUrl = toIranSafeUrl(rawResolved);
  const isPatternRepeat =
    config.sizeMode === "repeat" ||
    (config.mediaType === "preset_svg" && config.presetId !== "aurora_waves");

  const safeOpacity = Math.max(0.05, Math.min(1, Number(config.opacity ?? 55) / 100));
  const safeOverlay = Math.max(0, Math.min(0.92, Number(config.overlayOpacity ?? 20) / 100));
  const safeBlur = Math.max(0, Math.min(24, Number(config.blurPx ?? 0)));

  return (
    <>
      {hydrated && !isAdminRoute && (
        <style>{`
          ${
            glassEnabled
              ? `
          html.dark article,
          html.dark .axon-liquid-glass-surface,
          html.dark header > div,
          html.dark footer {
            background-color: rgba(15, 23, 42, ${gAlphaDark}) !important;
            backdrop-filter: blur(${gBlur}px) saturate(190%) !important;
            -webkit-backdrop-filter: blur(${gBlur}px) saturate(190%) !important;
            border-color: rgba(56, 189, 248, ${gBorderAlpha}) !important;
            box-shadow: 0 18px 42px -12px rgba(2, 6, 23, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.16) !important;
          }

          html.light article,
          html:not(.dark) article,
          html.light .axon-liquid-glass-surface,
          html:not(.dark) .axon-liquid-glass-surface,
          html.light header > div,
          html:not(.dark) header > div,
          html.light footer,
          html:not(.dark) footer {
            background: linear-gradient(135deg, rgba(240, 249, 255, ${gAlphaLight}), rgba(224, 242, 254, ${Math.max(0.42, gAlphaLight - 0.12)})) !important;
            backdrop-filter: blur(${gBlur}px) saturate(190%) !important;
            -webkit-backdrop-filter: blur(${gBlur}px) saturate(190%) !important;
            border-color: rgba(14, 165, 233, ${Math.min(0.65, gBorderAlpha)}) !important;
            box-shadow: 0 16px 36px -10px rgba(14, 165, 233, 0.14), inset 0 1px 2px rgba(255, 255, 255, 0.92) !important;
          }
          `
              : ""
          }

          button[data-axon-livechat-fab="true"] {
            ${chatSide === "right" ? "right: 1rem !important; left: auto !important;" : "left: 1rem !important; right: auto !important;"}
          }

          ${
            config.chatButtonIconOnly !== false
              ? `
          button[data-axon-livechat-fab="true"] {
            width: 54px !important;
            height: 54px !important;
            min-width: 54px !important;
            padding: 0 !important;
            border-radius: 9999px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 0 !important;
            line-height: 0 !important;
            overflow: visible !important;
            background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
            box-shadow: 0 10px 28px rgba(37, 99, 235, 0.48), inset 0 1px 1px rgba(255, 255, 255, 0.35) !important;
          }
          button[data-axon-livechat-fab="true"] * {
            font-size: 0 !important;
          }
          button[data-axon-livechat-fab="true"]::before {
            content: "💬";
            font-size: 22px !important;
            line-height: 1 !important;
          }
          button[data-axon-livechat-fab="true"]::after {
            content: "";
            position: absolute;
            top: 3px;
            right: 3px;
            width: 11px;
            height: 11px;
            border-radius: 9999px;
            background-color: #34d399;
            border: 2px solid #1e1b4b;
          }
          `
              : ""
          }

          @media (max-width: 767px) {
            header > div {
              padding-left: 0.65rem !important;
              padding-right: 0.65rem !important;
              gap: 0.35rem !important;
            }
          }

          ${
            config.showMobileBottomNav === false
              ? `
          nav.fixed.bottom-0,
          div.fixed.bottom-0.left-0.right-0 {
            display: none !important;
          }
          `
              : ""
          }

          ${!config.showShowcaseHeader ? `[data-axon-leaf-role="showcase_header"] { display: none !important; }` : ""}
          ${!config.showCatalogHeader ? `[data-axon-leaf-role="catalog_header"] { display: none !important; }` : ""}
          ${!config.showCardBrand ? `[data-axon-leaf-role="card_brand"] { display: none !important; }` : ""}
          ${
            !config.showCardCategory
              ? `article > div:first-child > span.rounded-full { display: none !important; }`
              : ""
          }
          ${
            !config.showCardSubtitle
              ? `article p.line-clamp-2 { display: none !important; }`
              : ""
          }
          ${!config.showCardStockText ? `[data-axon-leaf-role="card_stock"] { display: none !important; }` : ""}
          ${!config.showCardCartCountText ? `[data-axon-leaf-role="card_cartcount"] { display: none !important; }` : ""}

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
            {isPatternRepeat ? (
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

      <div className="relative z-10">
        <LivePageSectionsRenderer position="top" />
      </div>
    </>
  );
}

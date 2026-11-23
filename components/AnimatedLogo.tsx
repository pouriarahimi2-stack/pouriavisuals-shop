// File Path: components/AnimatedLogo.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSiteInfo } from "@/context/SiteInfoContext";

export interface AnimatedLogoProps {
  variant?: "header" | "footer";
  size?: number;
  width?: number;
  height?: number;
  borderRadius?: string;
  objectFit?: "contain" | "cover";
  className?: string;
  srcOverride?: string;
  fallback?: React.ReactNode;
}

export function resolveBrandAssetUrl(val: any): string {
  if (typeof val !== "string") return "";
  const clean = val.trim();
  if (!clean) return "";
  if (clean.startsWith("data:")) return clean;
  if (
    clean.includes(".supabase.co/storage/") ||
    (clean.startsWith("http") && clean.toLowerCase().includes(".svg"))
  ) {
    return "/api/media-proxy?url=" + encodeURIComponent(clean);
  }
  return clean;
}

export function isSvgAsset(src: string): boolean {
  const clean = src.trim().toLowerCase();
  if (!clean) return false;
  if (clean.startsWith("data:image/svg+xml")) return true;
  if (clean.includes(".svg")) return true;
  return false;
}

export default function AnimatedLogo({
  variant = "header",
  size,
  width,
  height,
  borderRadius = "12px",
  objectFit = "contain",
  className = "",
  srcOverride,
  fallback = null,
}: AnimatedLogoProps) {
  const { siteInfo } = useSiteInfo();
  const [failed, setFailed] = useState(false);

  const info = siteInfo || {};
  const layoutCfg = info?.homepage_layout_config || {};
  const persisted = layoutCfg?._persisted_identity || {};
  const sysSettings =
    info?.settings ||
    info?.system_settings ||
    layoutCfg?.system_settings ||
    {};
  const tbCfg =
    info?.theme_builder_config || layoutCfg?.theme_builder_config || {};
  const tbHeader = tbCfg?.globalHeader || {};
  const tbFooter = tbCfg?.globalFooter || {};

  let rawUrl = "";
  if (srcOverride !== undefined) {
    rawUrl = String(srcOverride);
  } else if (variant === "footer") {
    rawUrl =
      sysSettings.footer_logo_url !== undefined &&
      String(sysSettings.footer_logo_url).trim() !== ""
        ? String(sysSettings.footer_logo_url)
        : tbFooter.footerLogoUrl !== undefined &&
          String(tbFooter.footerLogoUrl).trim() !== ""
        ? String(tbFooter.footerLogoUrl)
        : persisted.footer_logo_url !== undefined &&
          String(persisted.footer_logo_url).trim() !== ""
        ? String(persisted.footer_logo_url)
        : String(
            info.footer_logo_url ||
              info.footerLogoUrl ||
              sysSettings.logo_url ||
              tbHeader.logoUrl ||
              info.logo_url ||
              ""
          );
  } else {
    rawUrl =
      sysSettings.logo_url !== undefined &&
      String(sysSettings.logo_url).trim() !== ""
        ? String(sysSettings.logo_url)
        : tbHeader.logoUrl !== undefined
        ? String(tbHeader.logoUrl)
        : persisted.logo_url !== undefined
        ? String(persisted.logo_url)
        : String(info.logo_url || info.logoUrl || "");
  }

  const resolvedSrc = resolveBrandAssetUrl(rawUrl);

  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || failed) {
    return <>{fallback}</>;
  }

  const finalWidth =
    width ??
    size ??
    (variant === "footer"
      ? Number(tbFooter.footerLogoWidth || 140)
      : Number(tbHeader.logoWidth || 42));

  const finalHeight =
    height ??
    size ??
    (variant === "footer"
      ? Number(tbFooter.footerLogoHeight || 56)
      : Number(tbHeader.logoHeight || 42));

  const altText = String(
    sysSettings.site_name || info.site_name || "لوگوی فروشگاه"
  ).trim();

  const renderKey =
    resolvedSrc.slice(-28) + "_" + resolvedSrc.length + "_" + variant;

  const sharedStyle: React.CSSProperties = {
    width: finalWidth + "px",
    height: finalHeight + "px",
    borderRadius,
    objectFit,
    display: "block",
  };

  if (isSvgAsset(resolvedSrc)) {
    return (
      <span
        className={"inline-flex items-center justify-center shrink-0 select-none overflow-hidden " + className}
        style={{
          width: finalWidth + "px",
          height: finalHeight + "px",
          borderRadius,
        }}
      >
        <object
          key={renderKey}
          type="image/svg+xml"
          data={resolvedSrc}
          aria-label={altText}
          onError={() => setFailed(true)}
          style={{
            ...sharedStyle,
            pointerEvents: "none",
          }}
        >
          <img
            src={resolvedSrc}
            alt={altText}
            style={sharedStyle}
            onError={() => setFailed(true)}
          />
        </object>
      </span>
    );
  }

  return (
    <img
      key={renderKey}
      src={resolvedSrc}
      alt={altText}
      onError={() => setFailed(true)}
      style={sharedStyle}
      className={"shrink-0 select-none " + className}
    />
  );
}
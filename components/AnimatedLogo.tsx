"use client";
// File Path: components/AnimatedLogo.tsx
import React from "react";
import { useSiteInfo } from "@/context/SiteInfoContext";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
}

export default function AnimatedLogo({ size = 38, className = "" }: AnimatedLogoProps) {
  const { siteInfo } = useSiteInfo();
  const tbHeader =
    siteInfo?.theme_builder_config?.globalHeader ||
    siteInfo?.homepage_layout_config?.theme_builder_config?.globalHeader ||
    {};

  const dynamicLogoUrl =
    tbHeader.logoUrl !== undefined
      ? String(tbHeader.logoUrl).trim()
      : String(siteInfo?.logo_url || siteInfo?.logoUrl || "").trim();

  if (!dynamicLogoUrl) {
    return null;
  }

  return (
    <img
      src={dynamicLogoUrl}
      alt={siteInfo?.site_name || ""}
      style={{ width: size + "px", height: size + "px", objectFit: "contain" }}
      className={" select-none " + className}
    />
  );
}

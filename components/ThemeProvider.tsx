"use client";
// File Path: components/ThemeProvider.tsx
import React, { useEffect } from "react";
import { themeEngine } from "@/lib/themeEngine";
import GlobalSiteBackground from "@/components/GlobalSiteBackground";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      themeEngine.applyTheme();
      themeEngine.initThemeListener();
    } catch {}
  }, []);

  return (
    <>
      <GlobalSiteBackground />
      <div className="relative z-10">{children}</div>
    </>
  );
}

export default ThemeProvider;

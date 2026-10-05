// File Path: ThemeProvider.tsx
"use client";
import GlobalSiteBackground from "@/components/GlobalSiteBackground";

import React, { useEffect, useState } from "react";
import { themeEngine } from "@/lib/themeEngine";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    themeEngine.applyTheme();

    const interval = setInterval(() => {
      const isManual = localStorage.getItem("axon_theme_manual_override") === "true";
      if (!isManual) {
        themeEngine.applyTheme();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <GlobalSiteBackground />
      <div className="relative z-10">{children}</div>
    </>
  );
}

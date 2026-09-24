"use client";

import React, { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // خواندن تم از localStorage
    const applyTheme = () => {
      try {
        const manual = localStorage.getItem("axon_theme_manual_override") === "true";
        const stored = localStorage.getItem("theme");

        if (manual && stored) {
          if (stored === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.setAttribute("data-theme", "dark");
          } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.setAttribute("data-theme", "light");
          }
        } else {
          // auto: سیستم
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          if (prefersDark) {
            document.documentElement.classList.add("dark");
            document.documentElement.setAttribute("data-theme", "dark");
          } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.setAttribute("data-theme", "light");
          }
        }
      } catch {}
    };

    applyTheme();

    // گوش دادن به تغییر تم سیستم (مهم برای موبایل)
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const manual = localStorage.getItem("axon_theme_manual_override") === "true";
      if (!manual) applyTheme();
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return <>{children}</>;
}

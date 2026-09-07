// File Path: lib/themeEngine.ts
/**
 * موتور هوشمند تشخیص خودکار تم تاریک و روشن بر اساس تنظیمات سیستم و ساعت شبانه‌روز
 */

export const themeEngine = {
  isNightTime(): boolean {
    const hours = new Date().getHours();
    const minutes = new Date().getMinutes();
    const current = hours + minutes / 60;
    return current >= 18.5 || current < 6.0;
  },

  getRecommendedTheme(): "dark" | "light" {
    if (typeof window === "undefined") return "light";

    try {
      const savedTheme = localStorage.getItem("theme");
      const isManual = localStorage.getItem("axon_theme_manual_override") === "true";

      if (isManual && (savedTheme === "dark" || savedTheme === "light")) {
        return savedTheme;
      }

      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }

      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
      }

      return this.isNightTime() ? "dark" : "light";
    } catch {
      return "light";
    }
  },

  applyTheme(theme?: "dark" | "light", isManualUserAction: boolean = false) {
    if (typeof window === "undefined") return;

    const targetTheme = theme || this.getRecommendedTheme();

    if (isManualUserAction) {
      localStorage.setItem("axon_theme_manual_override", "true");
      localStorage.setItem("theme", targetTheme);
    } else {
      localStorage.setItem("theme", targetTheme);
    }

    if (targetTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    window.dispatchEvent(new CustomEvent("theme_changed", { detail: targetTheme }));
  },

  initThemeListener() {
    if (typeof window === "undefined") return;
    this.applyTheme();

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const isManual = localStorage.getItem("axon_theme_manual_override") === "true";
        if (!isManual) {
          this.applyTheme();
        }
      };

      try {
        mediaQuery.addEventListener("change", handleChange);
      } catch {
        mediaQuery.addListener(handleChange);
      }
    }
  },
};

export default themeEngine;